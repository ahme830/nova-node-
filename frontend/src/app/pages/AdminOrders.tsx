import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Trash2, Search, Eye, Filter, Loader2, Calendar } from 'lucide-react';
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
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';

const statusColors: Record<string, string> = {
  en_cours: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/20',
  acceptee: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-500 dark:border-cyan-500/20',
  completer: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:border-green-500/20',
  annulee: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-500 dark:border-red-500/20',
};

export const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await adminService.getAllOrders();
      setOrders(response.commandes || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' });

  const confirmDelete = async () => {
    const { id } = deleteModal;
    if (!id) return;
    
    try {
      await adminService.deleteOrder(id);
      setOrders(prev => prev.filter(o => o.id !== id));
      toast.success("Commande supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
        setDeleteModal({ open: false, id: '' });
    }
  };

  const handleDelete = (id: string) => {
    setDeleteModal({ open: true, id });
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.client?.utilisateur?.nom_utilisateur?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShoppingCart className="text-primary" /> Gestion des Commandes
            </h1>
            <p className="text-muted-foreground mt-1">Surveillance des transactions Nova Node Marketplace</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Rechercher par ID ou Client..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-card dark:bg-card/40 border border-border rounded-2xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/60 dark:bg-muted/50 border-b border-border">
                  <th className="p-4 text-[10px] font-bold opacity-60">Commande</th>
                  <th className="p-4 text-[10px] font-bold opacity-60">Client</th>
                  <th className="p-4 text-[10px] font-bold opacity-60">Date</th>
                  <th className="p-4 text-[10px] font-bold opacity-60">Montant</th>
                  <th className="p-4 text-[10px] font-bold opacity-60">Statut</th>
                  <th className="p-4 text-[10px] font-bold opacity-60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 dark:hover:bg-primary/5 transition-colors group">
                    <td className="p-4">
                      <span className="text-xs font-bold">#{order.id.substring(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{order.client?.utilisateur?.nom_utilisateur || 'Client'}</span>
                        <span className="text-[10px] text-muted-foreground">{order.client?.utilisateur?.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar size={12} />
                        {new Date(order.date_commande).toLocaleDateString(i18n.language)}
                      </div>
                    </td>
                    <td className="p-4 font-black text-sm">
                      {parseFloat(order.montant_total).toLocaleString(i18n.language)} DZD
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full border tracking-wider ${statusColors[order.statut_commande] || 'bg-gray-500/10'}`}>
                        {order.statut_commande}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="hover:text-primary" onClick={() => navigate(`/customer/orders/${order.id}`)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:text-red-500" onClick={() => handleDelete(order.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground italic">
                      Aucune commande détectée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <AlertDialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ ...deleteModal, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette commande ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action supprimera la commande de l'historique global. Elle ne pourra pas être récupérée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
