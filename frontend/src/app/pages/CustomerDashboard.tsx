import { useState, useEffect } from 'react';
import { ShoppingBag, Heart, Package, TrendingUp, Loader2, DollarSign } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { commandeService } from '../../services/commande.service';
import { produitService, Product } from '../../services/produit.service';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const statusColors: Record<string, string> = {
  en_cours: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
  acceptee: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/30',
  completer: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30',
  annulee: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
};

const getStatusLabel = (status: string, t: any) => {
  return t(`customerDashboard.status.${status}`);
};

export function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [histRes, enCoursRes, productsRes] = await Promise.all([
          commandeService.getHistorique(),
          commandeService.getEnCours(),
          produitService.search({ limit: 4 }),
        ]);
        // Combine and deduplicate
        const all = [
          ...(enCoursRes.commandes_en_cours || []),
          ...(histRes.historique || []),
        ];
        const seen = new Set<string>();
        const unique = all.filter(o => {
          if (seen.has(o.id)) return false;
          seen.add(o.id);
          return true;
        });
        unique.sort((a, b) => new Date(b.date_commande).getTime() - new Date(a.date_commande).getTime());
        setOrders(unique);
        setProducts(productsRes.produits || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalSpent = orders.reduce((sum, o) => sum + (parseFloat(o.montant_total) || 0), 0);
  const recentOrders = orders.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-1 sm:mb-2 text-foreground">{t('customerDashboard.title')}</h1>
          <p className="text-muted-foreground text-sm sm:text-lg">{t('customerDashboard.welcome')} <span className="text-primary font-bold">{user?.name}</span></p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          <div className="bg-card dark:bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-soft hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-muted-foreground uppercase font-bold">{t('customerDashboard.totalOrders')}</p>
            <p className="text-3xl font-black mt-1">{orders.length}</p>
          </div>
          <div className="bg-card dark:bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-soft hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-yellow-500/20 flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-amber-600 dark:text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground uppercase font-bold">{t('customerDashboard.totalCredits')}</p>
            <p className="text-3xl font-black mt-1">{totalSpent.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-card dark:bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-soft hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-xs text-muted-foreground uppercase font-bold">{t('customerDashboard.delivered')}</p>
            <p className="text-3xl font-black mt-1">{orders.filter(o => o.statut_commande === 'completer').length}</p>
          </div>
          <div className="bg-card dark:bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-soft hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-3">
              <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-xs text-muted-foreground uppercase font-bold">{t('customerDashboard.inProgress')}</p>
            <p className="text-3xl font-black mt-1">{orders.filter(o => o.statut_commande === 'en_cours' || o.statut_commande === 'acceptee').length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="bg-card dark:bg-card/40 backdrop-blur-xl rounded-2xl border border-border overflow-hidden shadow-soft">
              <div className="p-4 sm:p-8 border-b border-border bg-muted/40 dark:bg-muted/30">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold tracking-tight">{t('customerDashboard.recentOrders')}</h2>
                    <p className="text-xs text-muted-foreground font-bold mt-1 uppercase">{t('customerDashboard.orderHistory')}</p>
                  </div>
                  <Button variant="ghost" className="hover:bg-muted text-sm" onClick={() => navigate('/customer/orders')}>
                    {t('customerDashboard.viewAll')}
                  </Button>
                </div>
              </div>

              {recentOrders.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <p className="text-muted-foreground">{t('customerDashboard.noOrders')}</p>
                  <Button variant="glow" className="mt-4" onClick={() => navigate('/catalog')}>{t('customerDashboard.exploreCatalog')}</Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="p-4 sm:p-6 hover:bg-muted/40 dark:hover:bg-muted/30 transition-all group cursor-pointer"
                      onClick={() => navigate(`/customer/orders/${order.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                            #{order.id.substring(0, 8).toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.date_commande).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <Badge className={`${statusColors[order.statut_commande] || 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'} border font-bold uppercase tracking-widest text-[10px] px-2 py-0.5 rounded-full`}>
                          {getStatusLabel(order.statut_commande, t) || order.statut_commande}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {order.ligne_commande?.length || 0} {t('customerDashboard.articles')} • {order.adresse?.ville}
                        </p>
                        <p className="text-xl font-black text-foreground tabular-nums">{(parseFloat(order.montant_total) || 0).toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-card dark:bg-card/40 backdrop-blur-2xl rounded-2xl border border-border p-5 sm:p-8 shadow-soft">
              <h2 className="text-base sm:text-xl font-bold mb-4 sm:mb-6 tracking-tight">{t('customerDashboard.quickActions')}</h2>
              <div className="grid grid-cols-1 gap-3">
                <Button onClick={() => navigate('/catalog')} variant="glow" className="w-full h-11 justify-start pl-5">
                  <ShoppingBag className="w-4 h-4 mr-3" />
                  {t('customerDashboard.exploreBtn')}
                </Button>
                <Button onClick={() => navigate('/customer/orders')} variant="glass" className="w-full h-11 justify-start pl-5">
                  <Package className="w-4 h-4 mr-3" />
                  {t('customerDashboard.ordersBtn')}
                </Button>
                <Button onClick={() => navigate('/customer/favorites')} variant="glass" className="w-full h-11 justify-start pl-5">
                  <Heart className="w-4 h-4 mr-3" />
                  {t('customerDashboard.favoritesBtn')}
                </Button>
              </div>
            </div>

            {/* Promo banner */}
            <div className="bg-gradient-to-br from-primary to-primary/60 rounded-2xl p-5 sm:p-6 relative overflow-hidden group shadow-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
              <h3 className="text-xl font-black mb-2 text-white">{t('customerDashboard.promoTitle')}</h3>
              <p className="text-white/80 text-xs sm:text-sm mb-4 leading-relaxed">
                {t('customerDashboard.promoDesc')}
              </p>
              <Button className="w-full bg-white text-primary border-none hover:bg-white/90 font-bold h-11 rounded-xl text-sm" onClick={() => navigate('/catalog')}>
                {t('customerDashboard.promoBtn')}
              </Button>
            </div>
          </div>
        </div>

        {/* Suggested Products */}
        {products.length > 0 && (
          <div className="mt-10 sm:mt-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-3xl font-black tracking-tight">{t('customerDashboard.popularProducts')}</h2>
                <p className="text-xs text-muted-foreground uppercase font-bold mt-1">{t('customerDashboard.catalogSelection')}</p>
              </div>
              <Button variant="ghost" className="hover:bg-muted text-sm" onClick={() => navigate('/catalog')}>{t('customerDashboard.viewAll')}</Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-card dark:bg-card/40 backdrop-blur-xl border border-border rounded-2xl overflow-hidden cursor-pointer group hover:border-primary/40 hover:shadow-md transition-all"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="aspect-square overflow-hidden">
                    <img src={product.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'} alt={product.nom_produit} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-sm truncate">{product.nom_produit}</p>
                    <p className="text-primary font-black text-lg mt-1">{product.prix.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</p>
                    <Button
                      variant="glow"
                      className="w-full mt-3 h-9 text-xs"
                      onClick={(e) => { e.stopPropagation(); addItem(product, 1); }}
                    >
                      {t('common.add') || 'Ajouter'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
