import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Store, CheckCircle, XCircle, Info, ExternalLink } from 'lucide-react';
import { adminService } from '../../services/admin.service';
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

export const AdminStores = () => {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const { t, i18n } = useTranslation();
  
  // Dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  } | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await adminService.getPendingStores();
      setStores(response.stores || []);
    } catch (error) {
      console.error('Error fetching pending stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = (storeId: string, status: 'actif' | 'suspendu') => {
    setConfirmData({
      title: status === 'actif' ? t('adminStores.approveUnit') : t('adminStores.reject'),
      description: status === 'actif' ? t('adminStores.validateOpen') : t('adminStores.rejectSuspend'),
      variant: status === 'actif' ? 'default' : 'destructive',
      onConfirm: async () => {
        try {
          await adminService.validateStore(storeId, status);
          setStores(prev => prev.filter(s => s.id !== storeId));
          toast.success(status === 'actif' ? t('adminStores.approveSuccess') : t('adminStores.suspendSuccess'));
        } catch (error) {
          toast.error(t('adminStores.validationError'));
        }
      }
    });
    setConfirmOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-12 px-3 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl text-foreground flex items-center gap-3 sm:gap-4 font-bold">
              <span className="w-1.5 sm:w-2 h-8 sm:h-10 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"></span>
              {t('adminStores.title')}
            </h1>
            <p className="mt-1 text-primary/40 text-[10px] font-bold">
              {t('adminStores.subtitle')}
            </p>
          </div>
          <div className="text-left sm:text-right">
             <span className="text-primary/60 text-xs font-bold">{stores.length} {t('adminStores.unitsPending')}</span>
          </div>
        </div>

        {/* Pending Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {stores.map((store, index) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card dark:bg-card/40 border border-border dark:border-primary/20 p-4 sm:p-6 rounded-2xl relative overflow-hidden group backdrop-blur-md shadow-soft hover:border-primary/30 dark:hover:border-primary/40 transition-all"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Store size={80} className="text-primary" />
              </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-background border border-border rounded-full flex items-center justify-center overflow-hidden shadow-sm">
                    {store.photo_url ? (
                        <img src={store.photo_url} alt="Store logo" className="w-full h-full object-cover" />
                    ) : (
                        <Store size={24} className="text-primary/40" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-foreground font-bold mb-1">{store.nom_magasin}</h3>
                    <p className="text-[10px] text-cyan-600/60 flex items-center gap-1">
                        <Info size={10} /> {t('adminStores.createdOn')} {new Date(store.date_creation).toLocaleDateString(i18n.language)}
                    </p>
                  </div>
                </div>

                <div className="mb-8 h-20 overflow-y-auto pr-2 custom-scrollbar">
                    <p className="text-xs text-gray-400 leading-relaxed opacity-70">
                        {store.description || t('adminStores.noDescription')}
                    </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-border dark:border-cyan-500/10">
                     <button 
                      onClick={() => handleValidation(store.id, 'actif')}
                      className="flex-1 py-2 bg-cyan-600/10 border border-cyan-500/50 text-cyan-600 hover:bg-cyan-600/20 transition-all text-[11px] font-bold flex items-center justify-center gap-2 rounded-lg shadow-sm"
                    >
                        <CheckCircle size={14} /> {t('adminStores.approveUnit')}
                    </button>
                    <button 
                      onClick={() => handleValidation(store.id, 'suspendu')}
                      className="p-2 border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors rounded-lg"
                      title={t('adminStores.reject')}
                    >
                        <XCircle size={18} />
                    </button>
                    <Link 
                      to={`/store/${store.id_vendeur}`}
                      className="p-2 border border-border text-foreground/40 hover:text-foreground transition-colors rounded-lg flex items-center justify-center"
                      title={t('adminStores.viewProfile')}
                    >
                        <ExternalLink size={18} />
                    </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {stores.length === 0 && (
          <div className="text-center py-32 bg-card dark:bg-card/10 border border-dashed border-border dark:border-cyan-500/20 rounded-2xl shadow-sm">
            <CheckCircle size={48} className="mx-auto text-cyan-600/30 mb-4" />
            <h3 className="text-cyan-600/40 text-sm font-bold">{t('adminStores.protocolUpToDate')}</h3>
            <p className="text-cyan-600/20 text-[10px] mt-2">{t('adminStores.noRequests')}</p>
          </div>
        )}
        
        {/* Global Confirmation Dialog */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmData?.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmData?.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel') || 'Annuler'}</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmData?.onConfirm}
                className={confirmData?.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {t('common.confirm') || 'Confirmer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
