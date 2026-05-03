import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Eye, Clock, CheckCircle, Truck, XCircle, ChevronRight, Check, X, Loader2 } from 'lucide-react';
import { commandeService } from '../../services/commande.service';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

export const VendorOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await commandeService.getByVendeur(user!.id);
      setOrders(response.commandes || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await commandeService.updateStatut(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, statut_commande: newStatus, statut: newStatus } : o));
      toast.success(`${t('vendorDashboard.statusUpdated')} : ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message || t('vendorDashboard.statusUpdateError'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_cours': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'acceptee': return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
      case 'completer': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'annulee': return 'text-red-400 border-red-500/30 bg-red-500/10';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-vh-100">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-12 px-3 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-8">
        
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground tracking-widest flex items-center gap-2 sm:gap-3 italic uppercase">
            <span className="w-1.5 h-8 sm:h-10 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"></span>
            {t('vendorDashboard.incomingOrders')}
          </h1>
          <p className="mt-1 text-primary/50 font-bold text-xs uppercase tracking-tighter">
            {t('vendorDashboard.logisticsProcessing')}
          </p>
        </div>

        {/* Order List */}
        <div className="space-y-4">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card dark:bg-card/40 backdrop-blur-md border border-border hover:border-primary/30 transition-all rounded-2xl overflow-hidden shadow-soft cursor-pointer group/row"
              onClick={() => {
                console.log('Navigating to order from list:', order.id);
                navigate(`/customer/orders/${order.id}`);
              }}
            >
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <ShoppingBag size={22} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-foreground font-bold tracking-widest text-sm uppercase italic">
                      {t('vendorDashboard.orderRef')} #{order?.id?.substring(0, 8).toUpperCase() || '---'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-primary/60 uppercase">
                      <span>{order?.date_commande ? new Date(order.date_commande).toLocaleDateString(i18n.language) : '---'}</span>
                      <span className="w-1 h-1 bg-primary/20 rounded-full"></span>
                      <span>{ (order?.ligne_commande?.length || 0) + (order?.items?.length || 0) } {t('vendorDashboard.items')}</span>
                      <span className="w-1 h-1 bg-primary/20 rounded-full"></span>
                      <span className="text-foreground/40 italic">{order?.client_nom || 'Client'}</span>
                    </div>
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-6">
                  {/* Status Badge */}
                  <div className={`px-4 py-1.5 border rounded-full text-[10px] uppercase tracking-[0.2em] font-bold shadow-sm ${getStatusColor(order?.statut_commande || order?.statut || 'en_cours')}`}>
                    {t('common.status.' + (order?.statut_commande || order?.statut || 'en_cours'), { defaultValue: 'En cours' })}
                  </div>
                  
                  {/* Price */}
                  <div className="text-right px-6 border-l border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase mb-1 tracking-widest opacity-60">
                      {t('vendorDashboard.totalAmount')}
                    </p>
                    <p className="text-xl text-foreground font-black tracking-tighter">
                      {(Number(order?.montant_total) || 0).toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.statut_commande === 'en_cours' ? (
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="border-cyan-500/20 text-cyan-500 hover:bg-cyan-500/10 h-8 text-[10px] font-bold"
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'acceptee'); }}
                        >
                            <Check size={14} className="mr-1" /> Accepter
                        </Button>
                    ) : order.statut_commande === 'acceptee' ? (
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="border-green-500/20 text-green-500 hover:bg-green-500/10 h-8 text-[10px] font-bold"
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'completer'); }}
                        >
                            <CheckCircle size={14} className="mr-1" /> Terminer
                        </Button>
                    ) : null}
                    
                    {(order.statut_commande !== 'completer' && order.statut_commande !== 'annulee') && (
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="border-red-500/20 text-red-500 hover:bg-red-500/10 h-8 text-[10px] font-bold"
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'annulee'); }}
                        >
                            <X size={14} className="mr-1" /> Annuler
                        </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="hover:bg-primary/10 hover:text-primary rounded-xl px-2 h-8"
                      onClick={(e) => { e.stopPropagation(); navigate(`/customer/orders/${order.id}`); }}
                    >
                      <Eye size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-24 bg-card/10 border border-dashed border-primary/20 rounded-2xl shadow-inner">
              <Clock size={48} className="mx-auto text-primary/20 mb-4 animate-pulse" />
              <h3 className="text-primary/40 text-sm tracking-widest uppercase italic">{t('vendorDashboard.noOrdersAwaiting')}</h3>
              <p className="text-primary/20 text-[10px] mt-2 uppercase">{t('vendorDashboard.networkVigilance')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
