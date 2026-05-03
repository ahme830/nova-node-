import { useState, useEffect } from 'react';
import { Package, Search, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { commandeService } from '../../services/commande.service';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

const statusColors: Record<string, string> = {
  en_cours: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  acceptee: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  completer: 'bg-green-500/20 text-green-400 border-green-500/30',
  annulee: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const getStatusLabel = (status: string, t: any) => {
  return t(`customerOrders.status.${status}`);
};

export function CustomerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const [histRes, enCoursRes] = await Promise.all([
          commandeService.getHistorique(),
          commandeService.getEnCours(),
        ]);
        const all = [
          ...(enCoursRes.commandes_en_cours || []),
          ...(histRes.historique || []),
        ];
        // Deduplicate by id
        const seen = new Set();
        const unique = all.filter(o => {
          if (seen.has(o.id)) return false;
          seen.add(o.id);
          return true;
        });
        // Sort by date desc
        unique.sort((a, b) => new Date(b.date_commande).getTime() - new Date(a.date_commande).getTime());
        setOrders(unique);
        setFiltered(unique);
      } catch (err: any) {
        toast.error(t('customerOrders.loadError'));
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(orders);
    } else {
      const q = search.toLowerCase();
      setFiltered(orders.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.adresse?.ville?.toLowerCase().includes(q) ||
        o.statut_commande?.toLowerCase().includes(q)
      ));
    }
  }, [search, orders]);

  const handleAnnuler = (orderId: string) => {
    setOrderToCancel(orderId);
    setConfirmOpen(true);
  };

  const confirmCancel = async () => {
    if (!orderToCancel) return;
    try {
      await commandeService.annuler(orderToCancel);
      setOrders(prev => prev.map(o => o.id === orderToCancel ? { ...o, statut_commande: 'annulee' } : o));
      toast.success(t('customerOrders.cancelSuccess'));
    } catch (err: any) {
      toast.error(err.message || t('customerOrders.cancelError'));
    } finally {
      setConfirmOpen(false);
      setOrderToCancel(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground uppercase font-bold text-sm">{t('customerOrders.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Header */}
        <div className="mb-10">
          <Button
            variant="ghost"
            className="mb-6 -ml-4 hover:bg-muted opacity-70"
            onClick={() => navigate('/customer/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('customerOrders.backToDashboard')}
          </Button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 text-primary mb-3">
                <span className="text-sm font-bold uppercase">{t('customerOrders.subtitle')}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{t('customerOrders.title')}</h1>
              <p className="text-muted-foreground mt-1 sm:mt-2 text-sm">
                {orders.length} {t('customerOrders.totalOrders')}
              </p>
            </div>

            <div className="relative group/search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
              <input
                type="text"
                placeholder={t('customerOrders.searchPlaceholder')}
                className="bg-card dark:bg-card/40 border border-border rounded-xl pl-10 pr-4 py-2 w-full md:w-72 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-sans text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filtered.length > 0 ? (
            filtered.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-card dark:bg-card/40 backdrop-blur-xl border border-border rounded-2xl overflow-hidden hover:border-primary/20 transition-all group shadow-soft"
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center border border-border">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
                          #{order.id.substring(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.date_commande).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <Badge className={`${statusColors[order.statut_commande] || 'bg-gray-500/20 text-gray-400'} border font-bold uppercase text-[10px] px-4 py-1.5 rounded-full`}>
                        {getStatusLabel(order.statut_commande, t) || order.statut_commande}
                      </Badge>
                      <div className="text-right border-l border-border/50 pl-4">
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-1">{t('customerOrders.totalAmount')}</p>
                        <p className="text-2xl font-black tabular-nums text-foreground">{(parseFloat(order.montant_total) || 0).toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  {order.ligne_commande && order.ligne_commande.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-6">
                      {order.ligne_commande.slice(0, 4).map((ligne: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 bg-muted/30 rounded-xl p-3 border border-border hover:border-primary/20 transition-colors">
                          {ligne.produit?.image_url && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-border/50 shrink-0">
                              <img src={ligne.produit.image_url} alt={ligne.produit.nom_produit} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="hidden sm:block">
                            <p className="font-bold text-sm leading-tight text-foreground">{ligne.produit?.nom_produit}</p>
                            <p className="text-xs text-muted-foreground mt-1">{t('customerOrders.qty')}: {ligne.qte} • {parseFloat(ligne.prix_at_time).toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</p>
                          </div>
                        </div>
                      ))}
                      {order.ligne_commande.length > 4 && (
                        <div className="w-12 h-12 rounded-xl border border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                          +{order.ligne_commande.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground uppercase font-bold">
                      {t('customerOrders.delivery')}: {order.adresse?.ville || t('customerOrders.unspecified')}, {order.adresse?.pays || ''}
                    </p>
                    <div className="flex items-center gap-3">
                      {(order.statut_commande === 'en_cours' || order.statut_commande === 'acceptee') && (
                        <Button
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs rounded-xl"
                          onClick={() => handleAnnuler(order.id)}
                        >
                          {t('customerOrders.cancelBtn')}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className="hover:bg-primary/10 hover:text-primary rounded-xl text-sm"
                        onClick={() => navigate(`/customer/orders/${order.id}`)}
                      >
                        {t('customerOrders.detailsBtn')}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border shadow-inner">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-xl font-bold text-muted-foreground">
                {search ? t('customerOrders.noResults') : t('customerOrders.noOrders')}
              </p>
              {!search && (
                <Button variant="glow" size="lg" className="mt-6" onClick={() => navigate('/catalog')}>
                  {t('customerOrders.exploreCatalog')}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Cancel Order Dialog */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('customerOrders.cancelBtn')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('customerOrders.cancelConfirm')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel') || 'Annuler'}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmCancel}
                className="bg-red-600 hover:bg-red-700"
              >
                {t('common.confirm') || 'Confirmer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
