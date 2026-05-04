import { useState, useEffect } from 'react';
import { Brain, Sparkles, TrendingUp, AlertTriangle, Store, Loader2, ArrowLeft, BarChart3, Package, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { predictionService, AdminPredictionsResponse } from '../../services/prediction.service';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface StoreAggregation {
  storeName: string;
  storeId: string;
  totalRevenuePredicted: number;
  alertCount: number;
  forecasts: Array<{ date: string; revenu_predit: number }>;
  alerts: Array<{
    nom_produit: string;
    unite_7j: number;
    alerte_restock: boolean;
    jours_stock_restant: number;
  }>;
}

export function AdminPredictions() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<AdminPredictionsResponse | null>(null);
  const [stores, setStores] = useState<StoreAggregation[]>([]);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      const res = await predictionService.getAllPredictions();
      setData(res);
      aggregateByStore(res);
    } catch (err: any) {
      console.error('Admin predictions error:', err);
      toast.error('Erreur lors du chargement des prédictions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPredictions();
      toast.success('Données actualisées');
    } catch {
      toast.error('Erreur');
    } finally {
      setRefreshing(false);
    }
  };

  const aggregateByStore = (res: AdminPredictionsResponse) => {
    const storeMap: Record<string, StoreAggregation> = {};

    // Aggregate revenue predictions by store
    for (const r of res.predictions_revenu) {
      const id = r.id_magasin;
      const name = r.magasin?.nom_magasin || 'Magasin inconnu';
      if (!storeMap[id]) {
        storeMap[id] = { storeName: name, storeId: id, totalRevenuePredicted: 0, alertCount: 0, forecasts: [], alerts: [] };
      }
      storeMap[id].totalRevenuePredicted += r.revenu_predit;
      storeMap[id].forecasts.push({ date: r.date_cible, revenu_predit: Math.round(r.revenu_predit) });
    }

    // Aggregate restock alerts by store
    for (const a of res.predictions_restock) {
      const id = a.id_magasin;
      const name = a.magasin?.nom_magasin || 'Magasin inconnu';
      if (!storeMap[id]) {
        storeMap[id] = { storeName: name, storeId: id, totalRevenuePredicted: 0, alertCount: 0, forecasts: [], alerts: [] };
      }
      storeMap[id].alerts.push({
        nom_produit: a.nom_produit,
        unite_7j: a.unite_7j,
        alerte_restock: a.alerte_restock,
        jours_stock_restant: a.jours_stock_restant,
      });
      if (a.alerte_restock) storeMap[id].alertCount++;
    }

    setStores(Object.values(storeMap).sort((a, b) => b.totalRevenuePredicted - a.totalRevenuePredicted));
  };

  // Global KPIs
  const totalRevenue = stores.reduce((s, st) => s + st.totalRevenuePredicted, 0);
  const totalAlerts = stores.reduce((s, st) => s + st.alertCount, 0);
  const totalProducts = data ? data.predictions_restock.length : 0;

  // Chart data: revenue per store
  const storeRevenueChart = stores.map(st => ({
    name: st.storeName.length > 18 ? st.storeName.substring(0, 18) + '…' : st.storeName,
    revenu: Math.round(st.totalRevenuePredicted),
    alertes: st.alertCount,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Chargement des prédictions globales...</p>
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
            <button onClick={() => navigate('/admin/dashboard')} className="text-muted-foreground hover:text-primary text-xs font-bold flex items-center gap-1 mb-3 transition-colors">
              <ArrowLeft size={14} /> Retour au dashboard
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center shadow-md">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Prédictions IA — Vue Globale</h1>
            </div>
            <p className="text-muted-foreground text-sm">Synthèse des prévisions de revenus et alertes stock de tous les magasins</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2 self-start">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Actualiser
          </Button>
        </div>

        {/* Global KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-card dark:bg-card/40 border border-border rounded-2xl p-6 shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-muted-foreground uppercase font-bold">Revenu Global Prédit (7j)</p>
            <p className="text-2xl sm:text-3xl font-black mt-1 tabular-nums">
              {totalRevenue.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">{stores.length} magasin{stores.length > 1 ? 's' : ''} analysé{stores.length > 1 ? 's' : ''}</p>
          </div>
          <div className="bg-card dark:bg-card/40 border border-border rounded-2xl p-6 shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-xs text-muted-foreground uppercase font-bold">Alertes de Stock</p>
            <p className="text-2xl sm:text-3xl font-black mt-1">{totalAlerts}</p>
            <p className="text-[10px] text-red-500 font-bold mt-1">{totalAlerts > 0 ? 'Produits à réapprovisionner' : 'Aucune alerte'}</p>
          </div>
          <div className="bg-card dark:bg-card/40 border border-border rounded-2xl p-6 shadow-soft">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-muted-foreground uppercase font-bold">Produits Monitorés</p>
            <p className="text-2xl sm:text-3xl font-black mt-1">{totalProducts}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Prédictions de demande actives</p>
          </div>
        </div>

        {/* Revenue Per Store Chart */}
        {storeRevenueChart.length > 0 && (
          <div className="bg-card dark:bg-card/40 border border-border rounded-2xl p-5 sm:p-8 shadow-soft mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              Revenu Prédit par Magasin (7 jours)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={storeRevenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#88888815" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis stroke="#888888" axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    color: 'var(--foreground)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'revenu'
                      ? value.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 })
                      : value,
                    name === 'revenu' ? 'Revenu Prédit' : 'Alertes'
                  ]}
                />
                <Bar dataKey="revenu" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Store Details */}
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Détails par Magasin</h2>

          {stores.length > 0 ? (
            stores.map(store => (
              <div key={store.storeId} className="bg-card dark:bg-card/40 border border-border rounded-2xl overflow-hidden shadow-soft">
                <div className="p-5 sm:p-6 border-b border-border bg-muted/40 dark:bg-muted/30">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base">{store.storeName}</h3>
                        <p className="text-xs text-muted-foreground">
                          Revenu prédit: <span className="font-bold text-foreground">{store.totalRevenuePredicted.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 })}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {store.alertCount > 0 && (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-none text-[10px]">
                          <AlertTriangle size={10} className="mr-1" />
                          {store.alertCount} alerte{store.alertCount > 1 ? 's' : ''}
                        </Badge>
                      )}
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-none text-[10px]">
                        {store.alerts.length} produit{store.alerts.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Critical alerts for this store */}
                {store.alerts.filter(a => a.alerte_restock).length > 0 && (
                  <div className="p-4 sm:p-6">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3">Produits en alerte</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {store.alerts.filter(a => a.alerte_restock).map((alert, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-xl">
                          <AlertTriangle size={14} className="text-red-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{alert.nom_produit}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Demande 7j: <span className="font-bold">{Math.round(alert.unite_7j)}</span> — 
                              {alert.jours_stock_restant < 999 ? ` ${alert.jours_stock_restant}j restants` : ' Stock ∞'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {store.alerts.filter(a => a.alerte_restock).length === 0 && (
                  <div className="p-4 sm:p-6 text-center">
                    <p className="text-xs text-green-600 dark:text-green-400 font-bold">✓ Aucune alerte — stock suffisant pour tous les produits</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-card dark:bg-card/40 border border-border rounded-2xl p-12 text-center shadow-soft">
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-bold mb-2">Aucune prédiction disponible</h3>
              <p className="text-sm text-muted-foreground">Les prédictions seront générées lorsque les vendeurs accéderont à leur module IA.</p>
            </div>
          )}
        </div>



      </div>
    </div>
  );
}
