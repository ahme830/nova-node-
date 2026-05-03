import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { panierService, PanierItem } from '../../services/panier.service';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { Product } from '../../services/produit.service';
import { useTranslation } from 'react-i18next';

interface CartContextType {
    items: PanierItem[];
    total: number;
    count: number;
    isLoading: boolean;
    addItem: (product: Product, quantite?: number) => Promise<void>;
    removeItem: (produit_id: string) => Promise<void>;
    updateQuantity: (produit_id: string, quantite: number) => Promise<void>;
    refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_CART_KEY = 'nexus_local_cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [items, setItems] = useState<PanierItem[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const calculateTotal = (cartItems: PanierItem[]) => {
        const t = cartItems.reduce((sum, item) => sum + (item.prix_at_time * item.qte), 0);
        setTotal(t);
    };

    const refresh = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            const data = await panierService.get();
            setItems(data.panier?.item ?? []);
            setTotal(data.total || 0);
        } catch {
            // Silently fail if not authorized
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load from localStorage for guests
    useEffect(() => {
        if (!user) {
            const saved = localStorage.getItem(LOCAL_CART_KEY);
            if (saved) {
                try {
                    const localItems = JSON.parse(saved);
                    setItems(localItems);
                    calculateTotal(localItems);
                } catch (e) {
                    localStorage.removeItem(LOCAL_CART_KEY);
                }
            }
        }
    }, [user]);

    // Sync local cart to DB when user logs in
    useEffect(() => {
        const syncCart = async () => {
            if (user) {
                const saved = localStorage.getItem(LOCAL_CART_KEY);
                if (saved) {
                    try {
                        const localItems: PanierItem[] = JSON.parse(saved);
                        if (localItems.length > 0) {
                            setIsLoading(true);
                            for (const item of localItems) {
                                try {
                                    await panierService.add(item.produit.id, item.qte);
                                } catch (e) {
                                    console.error('Failed to sync item:', item.produit.nom_produit);
                                }
                            }
                            localStorage.removeItem(LOCAL_CART_KEY);
                            toast.success(t('cart.syncSuccess'));
                        }
                        await refresh();
                    } catch (e) {
                        console.error('Cart sync error:', e);
                    } finally {
                        setIsLoading(false);
                    }
                } else {
                    refresh();
                }
            }
        };

        syncCart();
    }, [user]);

    const addItem = async (product: Product, quantite: number = 1) => {
        if (user) {
            try {
                await panierService.add(product.id, quantite);
                await refresh();
                toast.success(t('cart.addSuccess'));
            } catch (err: any) {
                toast.error(err.message || t('cart.addError'));
                throw err;
            }
        } else {
            // Guest mode
            const newItem: PanierItem = {
                qte: quantite,
                prix_at_time: product.prix,
                produit: {
                    id: product.id,
                    nom_produit: product.nom_produit,
                    prix: product.prix,
                    image_url: product.image_url || '',
                    qte_dispo: product.qte_dispo,
                    magasin: product.magasin,
                    type: product.type
                }
            };

            const existingIndex = items.findIndex(i => i.produit.id === product.id);
            let updatedItems: PanierItem[];

            if (existingIndex > -1) {
                updatedItems = [...items];
                updatedItems[existingIndex].qte += quantite;
            } else {
                updatedItems = [...items, newItem];
            }

            setItems(updatedItems);
            calculateTotal(updatedItems);
            localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(updatedItems));
            toast.success(t('cart.addGuestSuccess'));
        }
    };

    const removeItem = async (produit_id: string) => {
        if (user) {
            try {
                await panierService.remove(produit_id);
                await refresh();
                toast.success(t('cart.removeSuccess'));
            } catch (err: any) {
                toast.error(err.message || t('cart.removeError'));
                throw err;
            }
        } else {
            const updatedItems = items.filter(i => i.produit.id !== produit_id);
            setItems(updatedItems);
            calculateTotal(updatedItems);
            localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(updatedItems));
            toast.success(t('cart.removeGuestSuccess'));
        }
    };

    const updateQuantity = async (produit_id: string, quantite: number) => {
        if (user) {
            try {
                await panierService.updateQuantity(produit_id, quantite);
                await refresh();
            } catch (err: any) {
                toast.error(err.message || t('cart.updateError'));
                throw err;
            }
        } else {
            const updatedItems = items.map(i =>
                i.produit.id === produit_id ? { ...i, qte: quantite } : i
            );
            setItems(updatedItems);
            calculateTotal(updatedItems);
            localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(updatedItems));
        }
    };

    const count = items.reduce((sum, item) => sum + item.qte, 0);

    return (
        <CartContext.Provider value={{ items, total, count, isLoading, addItem, removeItem, updateQuantity, refresh }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
