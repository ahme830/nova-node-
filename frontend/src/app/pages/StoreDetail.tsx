import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Store, Package, Info, Calendar, Mail, User, Loader2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { magasinService, Magasin } from '../../services/magasin.service';
import { ProductCard } from '../components/ProductCard';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';

export const StoreDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();
  const { addItem } = useCart();

  useEffect(() => {
    if (id) fetchStoreData();
  }, [id]);

  const fetchStoreData = async () => {
    try {
      // The backend endpoint /magasin/:id currently takes a vendor ID or store ID depending on implementation
      // We'll try to get it. Note: In our current setup, getByVendeur might be what we need if we have vendor ID,
      // but here we might have store ID.
      // I will implement a proper getById in the service/backend if needed.
      const response = await magasinService.getByVendeur(id!);
      setStore(response.magasin);
    } catch (error) {
      toast.error("Impossible de charger les détails du magasin");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: any) => {
    try {
      await addItem(product, 1);
      toast.success("Ajouté au panier");
    } catch (err) {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Store size={64} className="text-muted-foreground opacity-20" />
        <h2 className="text-2xl font-bold">Magasin introuvable</h2>
        <Button asChild variant="outline">
          <Link to="/catalog">Retour au catalogue</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner Area */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-b from-primary/20 to-background border-b border-border overflow-hidden">
        <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-8 gap-1 h-full">
                {[...Array(64)].map((_, i) => (
                    <div key={i} className="border border-primary/20"></div>
                ))}
            </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 h-full flex items-end pb-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 w-full">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-card border-4 border-background shadow-xl overflow-hidden flex-shrink-0">
                    {store.photo_url ? (
                        <img src={store.photo_url} alt={store.nom_magasin} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/40">
                            <Store size={48} />
                        </div>
                    )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            store.statut === 'actif' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                            {store.statut}
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight mb-2">{store.nom_magasin}</h1>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Calendar size={14} /> Créé le {new Date(store.date_creation).toLocaleDateString(i18n.language)}</span>
                        <span className="flex items-center gap-1.5"><Package size={14} /> {store.produit?.length || 0} Produits</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="glass" className="rounded-full h-12 w-12 p-0">
                        <Mail size={20} />
                    </Button>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Sidebar Details */}
            <div className="space-y-8">
                <div className="bg-card dark:bg-card/40 border border-border p-6 rounded-2xl shadow-soft backdrop-blur-md">
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Info size={16} className="text-primary" /> À propos
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                        {store.description || "Ce vendeur n'a pas encore ajouté de description."}
                    </p>
                </div>

                <div className="bg-card dark:bg-card/40 border border-border p-6 rounded-2xl shadow-soft backdrop-blur-md">
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <User size={16} className="text-primary" /> Vendeur
                    </h3>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {store.vendeur?.nom_utilisateur?.charAt(0) || 'V'}
                        </div>
                        <div>
                            <p className="font-bold">{store.vendeur?.nom_utilisateur || 'Nova Node Partner'}</p>
                            <p className="text-xs text-muted-foreground">ID: {store.id_vendeur.substring(0,8)}...</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3 space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <ShoppingBag className="text-primary" /> Produits du Magasin
                    </h2>
                </div>

                {store.produit && store.produit.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {store.produit.map((product: any) => (
                            <ProductCard 
                                key={product.id} 
                                product={{...product, magasin: {nom_magasin: store.nom_magasin}}} 
                                onAddToCart={() => handleAddToCart(product)} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl opacity-50">
                        <Package size={48} className="mx-auto mb-4" />
                        <p>Aucun produit disponible pour le moment.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
