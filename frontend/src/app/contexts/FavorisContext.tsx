import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { favorisService } from '../../services/favoris.service';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { Product } from '../../services/produit.service';
import { useTranslation } from 'react-i18next';

interface FavorisContextType {
    favorites: Product[];
    isLoading: boolean;
    isFavorite: (productId: string) => boolean;
    toggleFavorite: (product: Product) => Promise<void>;
    clearAll: () => Promise<void>;
    refresh: () => Promise<void>;
}

const FavorisContext = createContext<FavorisContextType | undefined>(undefined);

const LOCAL_FAVORIS_KEY = 'nova_node_local_favoris';

export const FavorisProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const refresh = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            const data = await favorisService.getAll();
            setFavorites(data.favoris || []);
        } catch (err) {
            console.error('Failed to fetch favorites');
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load from localStorage for guests
    useEffect(() => {
        if (!user) {
            const saved = localStorage.getItem(LOCAL_FAVORIS_KEY);
            if (saved) {
                try {
                    setFavorites(JSON.parse(saved));
                } catch (e) {
                    localStorage.removeItem(LOCAL_FAVORIS_KEY);
                }
            }
        }
    }, [user]);

    // Sync local favorites to DB when user logs in
    useEffect(() => {
        const syncFavoris = async () => {
            if (user) {
                const saved = localStorage.getItem(LOCAL_FAVORIS_KEY);
                if (saved) {
                    try {
                        const localItems: Product[] = JSON.parse(saved);
                        if (localItems.length > 0) {
                            setIsLoading(true);
                            for (const item of localItems) {
                                try {
                                    await favorisService.add(item.id);
                                } catch (e) {
                                    // Item might already exist in DB
                                }
                            }
                            localStorage.removeItem(LOCAL_FAVORIS_KEY);
                        }
                        await refresh();
                    } catch (e) {
                        console.error('Favoris sync error:', e);
                    } finally {
                        setIsLoading(false);
                    }
                } else {
                    refresh();
                }
            }
        };

        syncFavoris();
    }, [user]);

    const isFavorite = (productId: string) => {
        return favorites.some(f => f.id === productId);
    };

    const toggleFavorite = async (product: Product) => {
        const currentlyFavorite = isFavorite(product.id);
        
        if (user) {
            try {
                if (currentlyFavorite) {
                    await favorisService.remove(product.id);
                    setFavorites(prev => prev.filter(f => f.id !== product.id));
                    toast.success(t('favorites.removeSuccess'));
                } else {
                    await favorisService.add(product.id);
                    setFavorites(prev => [...prev, product]);
                    toast.success(t('favorites.addSuccess'));
                }
            } catch (err: any) {
                toast.error(err.message || t('favorites.error'));
            }
        } else {
            // Guest mode
            let updated: Product[];
            if (currentlyFavorite) {
                updated = favorites.filter(f => f.id !== product.id);
                toast.success(t('favorites.removeGuestSuccess'));
            } else {
                updated = [...favorites, product];
                toast.success(t('favorites.addGuestSuccess'));
            }
            setFavorites(updated);
            localStorage.setItem(LOCAL_FAVORIS_KEY, JSON.stringify(updated));
        }
    };

    const clearAll = async () => {
        if (user) {
            try {
                await favorisService.clearAll();
                setFavorites([]);
                toast.success(t('favorites.clearSuccess'));
            } catch (err: any) {
                toast.error(err.message || t('favorites.error'));
            }
        } else {
            setFavorites([]);
            localStorage.removeItem(LOCAL_FAVORIS_KEY);
            toast.success(t('favorites.clearGuestSuccess'));
        }
    };

    return (
        <FavorisContext.Provider value={{ favorites, isLoading, isFavorite, toggleFavorite, clearAll, refresh }}>
            {children}
        </FavorisContext.Provider>
    );
};

export const useFavoris = () => {
    const context = useContext(FavorisContext);
    if (!context) throw new Error('useFavoris must be used within a FavorisProvider');
    return context;
};
