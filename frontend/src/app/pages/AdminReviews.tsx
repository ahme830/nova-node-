import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Trash2, Search, Star, Loader2, User, Package } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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

export const AdminReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { t, i18n } = useTranslation();

  useEffect(() => {
    fetchReviews();
  }, []);

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' });

  const fetchReviews = async () => {
    try {
      const response = await adminService.getAllReviews();
      setReviews(response.avis || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des avis");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    const { id } = deleteModal;
    if (!id) return;
    
    try {
      await adminService.deleteReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success("Avis supprimé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteModal({ open: false, id: '' });
    }
  };

  const handleDelete = (id: string) => {
    setDeleteModal({ open: true, id });
  };

  const filteredReviews = reviews.filter(r => 
    r.contenu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.auteur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.produit?.nom_produit?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <MessageSquare className="text-primary" /> Modération des Avis
            </h1>
            <p className="text-muted-foreground mt-1">Gérez les retours clients et maintenez la qualité</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Rechercher par auteur, contenu ou produit..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card dark:bg-card/40 border border-border p-6 rounded-2xl flex flex-col md:flex-row gap-6 shadow-soft hover:border-primary/20 transition-all"
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{review.auteur}</p>
                      <p className="text-[10px] text-muted-foreground">{review.email_auteur}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        size={12} 
                        className={s <= review.note ? "fill-yellow-400 text-yellow-400" : "text-muted"} 
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 dark:bg-background/40 p-4 rounded-xl border border-border">
                    <p className="text-sm leading-relaxed italic">"{review.contenu || "Aucun commentaire"}"</p>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Package size={12} /> {review.produit?.nom_produit}</span>
                    <span className="opacity-30">|</span>
                    <span>{new Date(review.date).toLocaleDateString(i18n.language)}</span>
                </div>
              </div>

              <div className="flex md:flex-col justify-end gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-500 hover:bg-red-500/10 border-red-500/20"
                  onClick={() => handleDelete(review.id)}
                >
                  <Trash2 size={14} className="mr-2" /> Supprimer
                </Button>
              </div>
            </motion.div>
          ))}

          {filteredReviews.length === 0 && (
            <div className="py-20 text-center bg-card dark:bg-card/20 border border-dashed border-border rounded-3xl opacity-50">
              <MessageSquare size={48} className="mx-auto mb-4" />
              <p>Aucun avis trouvé.</p>
            </div>
          )}
        </div>

        <AlertDialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ ...deleteModal, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cet avis ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. L'avis sera définitivement retiré du catalogue produit.
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
