import { useState, useEffect } from 'react';
import { Brain, Sparkles, TrendingUp, Package, AlertTriangle, RefreshCw, Loader2, ArrowLeft, BarChart3, Info } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { magasinService } from '../../services/magasin.service';
import { predictionService, RevenueForecast, RestockAlert } from '../../services/prediction.service';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function VendorPredictions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');

  // Revenue state
  const [revenueForecast, setRevenueForecast] = useState<RevenueForecast[]>([]);
  const [revenueSource, setRevenueSource] = useState<string>('');

  // Restock state
  const [restockAlerts, setRestockAlerts] = useState<RestockAlert[]>([]);
  const [restockSource, setRestockSource] = useState<string>('');

  useEffect(() => {
    if (user?.id) loadStore();
  }, [user]);

  const loadStore = async () => {
    try {
      const res = await magasinService.getByVendeur(user!.id);
      if (res.magasin) {
        setStoreId(res.magasin.id);
        setStoreName(res.magasin.nom_magasin);
        await loadPredictions(res.magasin.id);
      }
    } catch (err) {
      console.error('Error loading store:', err);
      toast.error('Erreur lors du chargement du magasin');
    } finally {
      setLoading(false);
    }
  };

  const loadPredictions = async (id: string) => {
    try {
      const [revenueRes, restockRes] = await Promise.all([
        predictionService.getRevenueForecast(id),
        predictionService.getRestockAlerts(id),
      ]);

      // Normalize revenue data
      const forecasts = revenueRes.forecasts.map(f => ({
        ...f,
        date: f.date_cible || f.date,
        revenu_predit: Math.round(f.revenu_predit),
      }));
      setRevenueForecast(forecasts);
      setRevenueSource(revenueRes.source);

      setRestockAlerts(restockRes.alerts || []);
      setRestockSource(restockRes.source);
    } catch (err: any) {
      console.error('Prediction load error:', err);
      toast.error('Erreur lors du chargement des prédictions');
    }
  };

  const handleRefresh = async () => {
    if (!storeId || refreshing) return;
    setRefreshing(true);
    try {
      await loadPredictions(storeId);
      toast.success('Prédictions actualisées');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setRefreshing(false);
    }
  };

  // KPIs
  const totalRevenuePredicted = revenueForecast.reduce((s, f) => s + f.revenu_predit, 0);
  const avgDailyRevenue = revenueForecast.length > 0 ? totalRevenuePredicted / revenueForecast.length : 0;
  const criticalAlerts = restockAlerts.filter(a => a.alerte_restock);
  const safeProducts = restockAlerts.filter(a => !a.alerte_restock);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Chargement des prédictions IA...</p>
        </div>
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center bg-card border border-border rounded-2xl p-12 shadow-soft max-w-md">
          <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-bold mb-2">Aucun magasin trouvé</h2>
          <p className="text-muted-foreground text-sm mb-6">Vous devez d'abord créer votre magasin pour accéder aux prédictions IA.</p>
          <Button variant="glow" onClick={() => navigate('/vendor/store')}>Créer mon magasin</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <button onClick={() => navigate('/vendor/dashboard')} className="text-muted-foreground hover:text-primary text-xs font-bold flex items-center gap-1 mb-3 transition-colors">
              <ArrowLeft size={14} /> Retour au dashboard
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center shadow-md">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Prédictions IA</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Analyse prédictive pour <span className="text-primary font-bold">{storeName}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${revenueSource === 'model' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'} border-none text-xs px-3 py-1`}>
              <Sparkles size={12} className="mr-1" />
              {revenueSource === 'model' ? 'Modèle ML actif' : revenueSource === 'cache' ? 'Cache' : 'Mode Démo'}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-card dark:bg-card/40 border border-border rounded-2xl p-6 shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-muted-foreground uppercase font-bold">Revenu Prédit (7j)</p>
            <p className="text-2xl sm:text-3xl font-black mt-1 tabular-nums">
              {totalRevenuePredicted.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-card dark:bg-card/40 border border-border rounded-2xl p-6 shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-3">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-muted-foreground uppercase font-bold">Moyenne / Jour</p>
            <p className="text-2xl sm:text-3xl font-black mt-1 tabular-nums">
              {avgDailyRevenue.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-card dark:bg-card/40 border border-border rounded-2xl p-6 shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-xs text-muted-foreground uppercase font-bold">Alertes Stock</p>
            <p className="text-2xl sm:text-3xl font-black mt-1">{criticalAlerts.length}</p>
            <p className="text-[10px] text-red-500 font-bold mt-0.5">{criticalAlerts.length > 0 ? 'Réapprovisionnement requis' : 'Stock OK'}</p>
          </div>
          <div className="bg-card dark:bg-card/40 border border-border rounded-2xl p-6 shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-xs text-muted-foreground uppercase font-bold">Total Produits</p>
            <p className="text-2xl sm:text-3xl font-black mt-1">{restockAlerts.length}</p>
          </div>
        </div>

        {/* Revenue Forecast Chart */}
        <div className="bg-card dark:bg-card/40 border border-border rounded-2xl p-5 sm:p-8 shadow-soft mb-8 sm:mb-12">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6 sm:mb-8">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                Prévision du Chiffre d'Affaires
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Projection des revenus sur les 7 prochains jours — basée sur {revenueSource === 'model' ? '4 ans d\'historique' : 'données récentes'}</p>
            </div>
          </div>

          {revenueForecast.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={revenueForecast}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#88888815" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  tickFormatter={(d) => new Date(d).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric' })}
                />
                <YAxis
                  stroke="#888888"
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    color: 'var(--foreground)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                  formatter={(value: number) => [
                    value.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }),
                    'Revenu Prédit'
                  ]}
                  labelFormatter={(d) => new Date(d).toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}
                />
                <Area
                  type="monotone"
                  dataKey="revenu_predit"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                  dot={{ fill: '#3b82f6', r: 5, strokeWidth: 0 }}
                  activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2, fill: 'var(--card)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Aucune donnée de prévision disponible</p>
                <p className="text-xs mt-1 opacity-60">Les prédictions nécessitent un historique de ventes</p>
              </div>
            </div>
          )}
        </div>

        {/* Restock Alerts Table */}
        <div className="bg-card dark:bg-card/40 border border-border rounded-2xl overflow-hidden shadow-soft">
          <div className="p-5 sm:p-8 border-b border-border bg-muted/40 dark:bg-muted/30">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  Gestion de la Demande (Stock)
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Prédiction de demande par produit sur 7 jours — alertes de réapprovisionnement automatiques</p>
              </div>
              {criticalAlerts.length > 0 && (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-none text-xs px-3 py-1">
                  <AlertTriangle size={12} className="mr-1" />
                  {criticalAlerts.length} alerte{criticalAlerts.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          {restockAlerts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-muted/50 dark:bg-muted/20 border-b border-border">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Produit</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Stock Actuel</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Demande 7j</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Jours Restants</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {restockAlerts.map((alert, idx) => (
                    <tr key={idx} className={`transition-colors ${alert.alerte_restock ? 'bg-red-50/50 dark:bg-red-500/5 hover:bg-red-50 dark:hover:bg-red-500/10' : 'hover:bg-muted/40 dark:hover:bg-muted/30'}`}>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${alert.alerte_restock ? 'bg-red-100 dark:bg-red-500/20' : 'bg-green-100 dark:bg-green-500/20'} flex items-center justify-center`}>
                            <Package size={14} className={alert.alerte_restock ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} />
                          </div>
                          <span className="font-bold text-sm">{alert.nom_produit}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`font-black text-sm tabular-nums ${alert.qte_dispo <= 5 ? 'text-red-600 dark:text-red-400' : ''}`}>
                          {alert.qte_dispo}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="font-bold text-sm tabular-nums">
                          {alert.unite_7j !== null ? Math.round(alert.unite_7j) : '—'}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">unités</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        {alert.jours_stock_restant !== null ? (
                          <span className={`font-black text-sm tabular-nums ${
                            alert.jours_stock_restant <= 3 ? 'text-red-600 dark:text-red-400' :
                            alert.jours_stock_restant <= 7 ? 'text-amber-600 dark:text-amber-400' :
                            'text-green-600 dark:text-green-400'
                          }`}>
                            {alert.jours_stock_restant >= 999 ? '∞' : `${alert.jours_stock_restant}j`}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        {alert.message ? (
                          <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400 border-none text-[10px]">
                            <Info size={10} className="mr-1" /> {alert.message}
                          </Badge>
                        ) : alert.alerte_restock ? (
                          <button
                            onClick={() => navigate('/vendor/products')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
                          >
                            <AlertTriangle size={10} /> Réapprovisionner
                          </button>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-none text-[10px] font-bold uppercase tracking-wider">
                            Stock OK
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground text-sm">Aucun produit à analyser</p>
              <p className="text-xs text-muted-foreground mt-1">Ajoutez des produits à votre magasin pour obtenir des prédictions de demande</p>
              <Button variant="glow" className="mt-4" onClick={() => navigate('/vendor/products')}>Ajouter des produits</Button>
            </div>
          )}
        </div>



      </div>
    </div>
  );
}
