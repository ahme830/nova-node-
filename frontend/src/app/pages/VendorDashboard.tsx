import { useState, useEffect } from 'react';
import { DollarSign, Package, ShoppingCart, TrendingUp, Plus, Loader2, Brain } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { commandeService } from '../../services/commande.service';
import { magasinService } from '../../services/magasin.service';
import { produitService, Product } from '../../services/produit.service';

const statusColors: Record<string, string> = {
  en_cours: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
  completer: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30',
  annulee: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
};

export function VendorDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [storeName, setStoreName] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadVendorData();
    }
  }, [user]);

  const loadVendorData = async () => {
    try {
      const [ordersRes, storeRes] = await Promise.all([
        commandeService.getByVendeur(user!.id),
        magasinService.getByVendeur(user!.id),
      ]);

      setOrders(ordersRes.commandes || []);

      if (storeRes.magasin) {
        setStoreName(storeRes.magasin.nom_magasin || '');
        const prodRes = await produitService.getByMagasin(storeRes.magasin.id);
        setProducts(prodRes.produits || []);
      }
    } catch (err) {
      console.error('Vendor dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculated stats from real data
  const revenue = orders
    .filter(o => o.statut_commande === 'completer')
    .reduce((sum, o) => sum + (parseFloat(o.montant_total) || 0), 0);

  const pendingOrders = orders.filter(o => o.statut_commande === 'en_cours').length;
  const activeProducts = products.length;
  const recentOrders = orders.slice(0, 5);

  // Build chart data from orders grouped by month
  const salesData = (() => {
    const months: Record<string, { sales: number; orders: number }> = {};
    orders.forEach(o => {
      const date = new Date(o.date_commande);
      const key = date.toLocaleDateString(i18n.language, { month: 'short' });
      if (!months[key]) months[key] = { sales: 0, orders: 0 };
      months[key].sales += parseFloat(o.montant_total) || 0;
      months[key].orders += 1;
    });
    return Object.entries(months).map(([month, data]) => ({ month, ...data }));
  })();

  // Build top products data from order line items
  const topProductsData = (() => {
    const productSales: Record<string, number> = {};
    orders.forEach(o => {
      (o.ligne_commande || o.items || []).forEach((l: any) => {
        const name = l.produit?.nom_produit || 'Unknown';
        productSales[name] = (productSales[name] || 0) + (l.qte || 1);
      });
    });
    return Object.entries(productSales)
      .map(([name, sales]) => ({ name: name.length > 15 ? name.substring(0, 15) + '…' : name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  })();

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      en_cours: t('vendorDashboard.status.pending', 'En cours'),
      completer: t('vendorDashboard.status.delivered', 'Complétée'),
      annulee: t('vendorDashboard.status.cancelled', 'Annulée'),
    };
    return labels[status] || status;
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-8 mb-8 sm:mb-12">
          <div>
            <div className="flex items-center gap-3 text-primary mb-2 sm:mb-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(139,92,246,1)]"></div>
              <span className="text-xs sm:text-sm font-bold tracking-[0.2em] sm:tracking-[0.3em] uppercase opacity-70">{t('vendorDashboard.merchantSector')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-1 sm:mb-2 text-foreground">{t('vendorDashboard.distributionCenter')}</h1>
            <p className="text-muted-foreground text-sm sm:text-lg italic">{t('vendorDashboard.manageModules')} — <span className="text-primary font-bold">{storeName || user?.name}</span></p>
          </div>
          <Button variant="glow" className="h-11 sm:h-14 px-5 sm:px-8 text-sm sm:text-lg font-bold self-start sm:self-auto" 
            onClick={() => {
              console.log('Navigating to vendor products');
              navigate('/vendor/products');
            }}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
            <span className="hidden sm:inline">{t('vendorDashboard.injectModule')}</span>
            <span className="sm:hidden">{t('vendorDashboard.injectModuleShort')}</span>
          </Button>
          <Button variant="outline" className="h-11 sm:h-14 px-5 sm:px-8 text-sm sm:text-lg font-bold self-start sm:self-auto gap-2 border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10" 
            onClick={() => navigate('/vendor/predictions')}
          >
            <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Prédictions IA</span>
            <span className="sm:hidden">IA</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title={t('vendorDashboard.revenueStream')}
            value={revenue.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}
            icon={DollarSign}
            trend={{ value: 0, isPositive: true }}
            className="bg-card dark:bg-card/40 backdrop-blur-xl border-border shadow-soft hover:shadow-md transition-all"
          />
          <StatCard
            title={t('vendorDashboard.nexusInventory')}
            value={activeProducts}
            icon={Package}
            trend={{ value: 0, isPositive: true }}
            className="bg-card dark:bg-card/40 backdrop-blur-xl border-border shadow-soft hover:shadow-md transition-all"
          />
          <StatCard
            title={t('vendorDashboard.salesSignals')}
            value={pendingOrders}
            icon={ShoppingCart}
            description={t('vendorDashboard.transfersRequired')}
            className="bg-card dark:bg-card/40 backdrop-blur-xl border-border shadow-soft hover:shadow-md transition-all"
          />
          <StatCard
            title={t('vendorDashboard.expansionCurve')}
            value={orders.length}
            icon={TrendingUp}
            trend={{ value: 0, isPositive: true }}
            className="bg-card dark:bg-card/40 backdrop-blur-xl border-border shadow-soft hover:shadow-md transition-all"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-10 mb-8 sm:mb-12">
          {/* Sales Chart */}
          <div className="bg-card dark:bg-card/40 backdrop-blur-xl rounded-2xl border border-border p-4 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight mb-4 sm:mb-8">{t('vendorDashboard.salesFluctuations')}</h2>
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                  <XAxis dataKey="month" stroke="#888888" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis stroke="#888888" axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '16px',
                      backdropFilter: 'blur(20px)',
                      color: 'var(--foreground)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#3b82f6"
                    strokeWidth={4}
                    dot={{ fill: '#3b82f6', r: 6, strokeWidth: 0 }}
                    activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2, fill: 'var(--card)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                {t('vendorDashboard.noDataYet', 'Aucune donnée disponible')}
              </div>
            )}
          </div>

          {/* Top Products Chart */}
          <div className="bg-card dark:bg-card/40 backdrop-blur-xl rounded-2xl border border-border p-4 sm:p-8 shadow-soft">
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight mb-4 sm:mb-8">{t('vendorDashboard.moduleEfficiency')}</h2>
            {topProductsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProductsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis stroke="#888888" axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '16px',
                      backdropFilter: 'blur(20px)',
                      color: 'var(--foreground)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                {t('vendorDashboard.noDataYet', 'Aucune donnée disponible')}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-card dark:bg-card/40 backdrop-blur-xl rounded-2xl border border-border overflow-hidden shadow-soft">
          <div className="p-4 sm:p-8 border-b border-border bg-muted/40 dark:bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold tracking-tight">{t('vendorDashboard.transactionSignal')}</h2>
                <p className="text-xs text-muted-foreground font-bold mt-1 uppercase tracking-widest">{t('vendorDashboard.syncedDb')}</p>
              </div>
              <Button variant="ghost" className="hover:bg-muted text-sm" onClick={() => navigate('/vendor/orders')}>
                {t('customerDashboard.viewAll', 'Voir tout')}
              </Button>
            </div>
          </div>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto -mx-0">
              <table className="w-full min-w-[600px]">
                <thead className="bg-muted/50 dark:bg-muted/20 border-b border-border">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t('customerOrders.orderId') || 'ID'}</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t('auth.name') || 'Client'}</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t('customerOrders.date') || 'Date'}</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t('customerOrders.total') || 'Total'}</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t('customerOrders.statusLabel') || 'Statut'}</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="hover:bg-muted/40 dark:hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => {
                        console.log('Navigating to order:', order.id);
                        navigate(`/customer/orders/${order.id}`);
                      }}
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-5 whitespace-nowrap">
                        <div className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">#{order.id.substring(0, 8).toUpperCase()}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-5 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{order.client_nom || 'Client'}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-5 whitespace-nowrap">
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.date_commande).toLocaleDateString(i18n.language)}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-5 whitespace-nowrap">
                        <div className="font-black text-foreground tabular-nums">{parseFloat(order.montant_total).toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-5 whitespace-nowrap">
                        <Badge className={`${statusColors[order.statut_commande] || 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'} border font-bold uppercase tracking-widest text-[10px] px-2 py-0.5 rounded-full`}>
                          {getStatusLabel(order.statut_commande)}
                        </Badge>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-5 whitespace-nowrap">
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary rounded-xl" onClick={() => navigate(`/customer/orders/${order.id}`)}>
                          {t('vendorDashboard.table.details', 'Détails')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground text-sm">{t('vendorDashboard.noOrdersAwaiting', 'Aucune commande')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
