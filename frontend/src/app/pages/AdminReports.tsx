import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Trash2, CheckCircle, Package, User, Clock, AlertTriangle, Loader2, MessageSquare } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
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

export const AdminReports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    fetchReports();
  }, []);

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: 'dismiss' | 'delete'; report: any }>({ open: false, type: 'dismiss', report: null });

  const fetchReports = async () => {
    try {
      const response = await adminService.getAllReports();
      setReports(response.signalements || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des signalements");
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async () => {
    const { type, report } = confirmModal;
    if (!report) return;

    try {
        if (type === 'dismiss') {
            await adminService.deleteReport(report.id);
            setReports(prev => prev.filter(r => r.id !== report.id));
            toast.success("Signalement ignoré");
        } else {
            if (report.produit) {
                await adminService.deleteProduct(report.produit.id);
            } else if (report.avis) {
                await adminService.deleteReview(report.avis.id);
            }
            await adminService.deleteReport(report.id);
            setReports(prev => prev.filter(r => r.id !== report.id));
            toast.success("Élément supprimé et signalement classé");
        }
    } catch (error) {
        toast.error("Erreur lors de l'action");
    } finally {
        setConfirmModal({ ...confirmModal, open: false });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldAlert className="text-red-500" /> Signalements Clients
          </h1>
          <p className="text-muted-foreground mt-1">Traitez les alertes de contenu inapproprié ou frauduleux</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card dark:bg-card/40 border border-red-200 dark:border-red-500/20 p-6 rounded-2xl flex flex-col md:flex-row gap-6 shadow-soft relative overflow-hidden group hover:border-red-300 dark:hover:border-red-500/40 transition-all"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500 opacity-50"></div>
                
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 text-red-500">
                    <AlertTriangle size={18} />
                    <span className="text-sm font-bold uppercase tracking-wider">Motif: {report.motif}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Client Signalant</p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                <User size={14} />
                            </div>
                            <div>
                                <p className="text-sm font-bold">{report.client?.utilisateur?.nom_utilisateur}</p>
                                <p className="text-[10px] text-muted-foreground">{report.client?.utilisateur?.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Élément Signalé</p>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                {report.produit ? <Package size={14} /> : <MessageSquare size={14} />}
                            </div>
                            <div>
                                <p className="text-sm font-bold">
                                    {report.produit ? report.produit.nom_produit : `Avis de ${report.avis?.client?.utilisateur?.nom_utilisateur || 'Client'}`}
                                </p>
                                {report.avis && (
                                    <p className="text-[10px] text-muted-foreground italic line-clamp-1">
                                        "{report.avis.contenu}"
                                    </p>
                                )}
                                <p className="text-[10px] text-muted-foreground">ID: {report.produit?.id || report.avis?.id || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock size={12} />
                    <span>Signalé le {new Date(report.date).toLocaleDateString(i18n.language)}</span>
                  </div>
                </div>

                <div className="flex md:flex-col justify-end gap-2 shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-green-500/20 text-green-500 hover:bg-green-500/10"
                    onClick={() => setConfirmModal({ open: true, type: 'dismiss', report })}
                  >
                    <CheckCircle size={14} className="mr-2" /> Ignorer
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                    onClick={() => setConfirmModal({ open: true, type: 'delete', report })}
                  >
                    <Trash2 size={14} className="mr-2" /> Supprimer l'élément
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {reports.length === 0 && (
            <div className="py-20 text-center bg-card dark:bg-card/20 border border-dashed border-border rounded-3xl opacity-50">
              <ShieldAlert size={48} className="mx-auto mb-4" />
              <p>Aucun signalement en attente. Tout est en ordre !</p>
            </div>
          )}
        </div>

        {/* Global Confirmation Dialog */}
        <AlertDialog open={confirmModal.open} onOpenChange={(open) => setConfirmModal({ ...confirmModal, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmModal.type === 'dismiss' ? 'Ignorer ce signalement ?' : 'Supprimer cet élément ?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmModal.type === 'dismiss' 
                    ? "Le signalement sera archivé et aucune action ne sera prise sur l'élément." 
                    : "L'élément signalé (produit ou avis) sera définitivement supprimé de la plateforme."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={executeAction}
                className={confirmModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-primary text-primary-foreground'}
              >
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
