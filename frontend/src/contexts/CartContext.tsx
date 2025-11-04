import React, { createContext, useContext, useReducer, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CartItem {
    id: string;
    name: string;
    price: number;
    image_url: string;
    quantity: number;
    restaurant_name?: string;
    note?: string;
}

interface CartState {
    items: CartItem[];
    total: number;
    itemCount: number;
    isLoading: boolean;
}

type CartAction =
    | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> & { quantity?: number } }
    | { type: "REMOVE_ITEM"; payload: string }
    | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
    | { type: "CLEAR_CART" }
    | { type: "SET_ITEMS"; payload: CartItem[] }
    | { type: "SET_LOADING"; payload: boolean };

const initialState: CartState = {
    items: [],
    total: 0,
    itemCount: 0,
    isLoading: false,
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
    switch (action.type) {
        case "ADD_ITEM": {
            const existingItemIndex = state.items.findIndex((item) => item.id === action.payload.id);
            let newItems: CartItem[];

            if (existingItemIndex >= 0) {
                // Update existing item quantity
                newItems = state.items.map((item, index) =>
                    index === existingItemIndex
                        ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
                        : item,
                );
            } else {
                // Add new item
                newItems = [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }];
            }

            const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

            return { ...state, items: newItems, total, itemCount };
        }

        case "REMOVE_ITEM": {
            const newItems = state.items.filter((item) => item.id !== action.payload);
            const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

            return { ...state, items: newItems, total, itemCount };
        }

        case "UPDATE_QUANTITY": {
            const newItems = state.items
                .map((item) =>
                    item.id === action.payload.id ? { ...item, quantity: Math.max(0, action.payload.quantity) } : item,
                )
                .filter((item) => item.quantity > 0);

            const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

            return { ...state, items: newItems, total, itemCount };
        }

        case "CLEAR_CART":
            return { ...state, items: [], total: 0, itemCount: 0 };

        case "SET_ITEMS": {
            const total = action.payload.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const itemCount = action.payload.reduce((sum, item) => sum + item.quantity, 0);
            return { ...state, items: action.payload, total, itemCount };
        }

        case "SET_LOADING":
            return { ...state, isLoading: action.payload };

        default:
            return state;
    }
};

interface CartContextType {
    state: CartState;
    addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    loadCart: () => Promise<void>;
    saveCart: () => Promise<void>;
    formatPrice: (price: number) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};

interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(cartReducer, initialState);

    const formatPrice = useCallback((price: number) => {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    }, []);

    const loadCart = useCallback(async () => {
        try {
            dispatch({ type: "SET_LOADING", payload: true });
            const cartData = await AsyncStorage.getItem("cart");
            console.log("CartContext - Loading cart data:", cartData);
            if (cartData) {
                const items = JSON.parse(cartData);
                console.log("CartContext - Parsed cart items:", items);
                dispatch({ type: "SET_ITEMS", payload: items });
            }
        } catch (error) {
            console.error("Load cart error:", error);
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    }, []);

    const saveCart = useCallback(async () => {
        try {
            console.log("CartContext - Saving cart items:", state.items);
            await AsyncStorage.setItem("cart", JSON.stringify(state.items));
        } catch (error) {
            console.error("Save cart error:", error);
        }
    }, [state.items]);

    const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
        console.log("CartContext - Adding item:", item);
        dispatch({ type: "ADD_ITEM", payload: item });
    }, []);

    const removeItem = useCallback((id: string) => {
        dispatch({ type: "REMOVE_ITEM", payload: id });
    }, []);

    const updateQuantity = useCallback((id: string, quantity: number) => {
        dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
    }, []);

    const clearCart = useCallback(() => {
        dispatch({ type: "CLEAR_CART" });
    }, []);

    // Save cart whenever items change
    React.useEffect(() => {
        if (state.items.length > 0) {
            saveCart();
        }
    }, [state.items, saveCart]);

    // Load cart on mount
    React.useEffect(() => {
        loadCart();
    }, [loadCart]);

    const value: CartContextType = {
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        loadCart,
        saveCart,
        formatPrice,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
