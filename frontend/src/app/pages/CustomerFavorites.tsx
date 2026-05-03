import { Heart, Search, ArrowLeft, ShoppingCart, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ProductCard } from '../components/ProductCard';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useFavoris } from '../contexts/FavorisContext';
import { useCart } from '../contexts/CartContext';

export function CustomerFavorites() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { favorites, isLoading, clearAll, refresh } = useFavoris();
  const { addItem } = useCart();

  const handleAddToCartAll = async () => {
    for (const product of favorites) {
      await addItem(product);
    }
    toast.success(t('favorites.addAllSuccess'));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <Button variant="ghost" className="mb-4 sm:mb-6 -ml-3 hover:bg-muted opacity-70" onClick={() => navigate('/customer/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.dashboard')}
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 text-primary mb-2">
                <span className="text-xs sm:text-sm font-bold uppercase">{t('favorites.subtitle')}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{t('favorites.title')}</h1>
              <p className="text-muted-foreground mt-1 sm:mt-2 text-sm">{t('favorites.personalizedSelection')}</p>
            </div>

            {favorites.length > 0 && (
              <div className="flex items-center gap-3">
                <Button variant="glass" onClick={clearAll}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('favorites.clearList')}
                </Button>
                <Button variant="glow" onClick={handleAddToCartAll}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {t('favorites.addAllToCart')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
             <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
        {/* Search & Stats Bar */}
        <div className="bg-card dark:bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-soft">
          <div className="flex items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{t('favorites.capacity')}</p>
              <p className="text-xl font-bold">{favorites.length} / 50</p>
            </div>
            <div className="w-px h-10 bg-border hidden md:block"></div>
            <div className="text-center md:text-left">
              <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{t('favorites.lastUpdate')}</p>
              <p className="text-xl font-bold">{t('favorites.synced')}</p>
            </div>
          </div>
          
          <div className="relative group/search w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder={t('favorites.filterPlaceholder')}
              className="bg-muted/40 border border-border rounded-xl pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-sans text-sm text-foreground"
            />
          </div>
        </div>

        {/* Favorites Grid */}
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative group"
              >
                <ProductCard 
                  product={product} 
                  onAddToCart={(p) => addItem(p)} 
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-muted/20 rounded-2xl border border-dashed border-border shadow-inner">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-6 border border-border">
              <Heart className="w-10 h-10 text-muted-foreground opacity-20" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">{t('favorites.emptyMemory')}</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-10">
              {t('favorites.emptyMemoryDesc')}
            </p>
            <Button variant="glow" size="lg" onClick={() => navigate('/catalog')}>
              {t('favorites.exploreCatalog')}
            </Button>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
