import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export interface Address {
    id: string;
    user_id: string;
    title: string;
    address: string;
    latitude?: number;
    longitude?: number;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

interface AddressContextType {
    addresses: Address[];
    selectedAddress: Address | null;
    isLoading: boolean;
    error: string | null;
    loadAddresses: () => Promise<void>;
    selectAddress: (address: Address) => void;
    addAddress: (address: Omit<Address, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
    updateAddress: (id: string, address: Partial<Address>) => Promise<void>;
    deleteAddress: (id: string) => Promise<void>;
    setDefaultAddress: (id: string) => Promise<void>;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const useAddress = () => {
    const context = useContext(AddressContext);
    if (!context) {
        throw new Error("useAddress must be used within an AddressProvider");
    }
    return context;
};

interface AddressProviderProps {
    children: ReactNode;
}

export const AddressProvider: React.FC<AddressProviderProps> = ({ children }) => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const loadAddresses = async () => {
        if (!user) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/addresses/user/${user.user_id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to load addresses");
            }

            const data = await response.json();
            setAddresses(data.addresses || []);
            // Không tự động chọn địa chỉ mặc định khi load
        } catch (err) {
            console.error("Error loading addresses:", err);
            setError(err instanceof Error ? err.message : "Failed to load addresses");
        } finally {
            setIsLoading(false);
        }
    };

    const selectAddress = (address: Address) => {
        setSelectedAddress(address);
    };

    const addAddress = async (addressData: Omit<Address, "id" | "user_id" | "created_at" | "updated_at">) => {
        if (!user) {
            setError("Bạn chưa đăng nhập");
            throw new Error("Bạn chưa đăng nhập");
        }

        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/addresses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...addressData,
                    user_id: user.user_id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const msg = errorData?.message || "Không thể thêm địa chỉ";
                setError(msg);
                throw new Error(msg);
            }

            await loadAddresses();
        } catch (err) {
            console.error("Error adding address:", err);
            setError(err instanceof Error ? err.message : "Không thể thêm địa chỉ");
            throw err;
        }
    };

    const updateAddress = async (id: string, addressData: Partial<Address>) => {
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/addresses/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(addressData),
            });

            if (!response.ok) {
                throw new Error("Failed to update address");
            }

            await loadAddresses();
        } catch (err) {
            console.error("Error updating address:", err);
            setError(err instanceof Error ? err.message : "Failed to update address");
        }
    };

    const deleteAddress = async (id: string) => {
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/addresses/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete address");
            }

            await loadAddresses();
        } catch (err) {
            console.error("Error deleting address:", err);
            setError(err instanceof Error ? err.message : "Failed to delete address");
        }
    };

    const setDefaultAddress = async (id: string) => {
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/addresses/${id}/default`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to set default address");
            }

            await loadAddresses();
        } catch (err) {
            console.error("Error setting default address:", err);
            setError(err instanceof Error ? err.message : "Failed to set default address");
        }
    };

    useEffect(() => {
        if (user) {
            loadAddresses();
        }
    }, [user]);

    const value: AddressContextType = {
        addresses,
        selectedAddress,
        isLoading,
        error,
        loadAddresses,
        selectAddress,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
    };

    return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
};
