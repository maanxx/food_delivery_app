// ...existing imports...
import { AddressProvider } from "./src/contexts/AddressContext";

export default function App() {
    return (
        <AuthProvider>
            <AddressProvider>
                <FoodProvider>
                    <CartProvider>{/* ...existing app content... */}</CartProvider>
                </FoodProvider>
            </AddressProvider>
        </AuthProvider>
    );
}
