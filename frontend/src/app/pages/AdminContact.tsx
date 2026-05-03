import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Trash2, Clock, User, MessageSquare, Loader2, Filter, Inbox } from 'lucide-react';
import { contactService, ContactMessage } from '../../services/contact.service';
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

export const AdminContact = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; message: ContactMessage | null }>({ open: false, message: null });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await contactService.getMessages();
      setMessages(response.messages || []);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des messages");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.message) return;
    try {
      await contactService.deleteMessage(deleteModal.message.id);
      setMessages(prev => prev.filter(m => m.id !== deleteModal.message?.id));
      toast.success("Message supprimé");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    } finally {
      setDeleteModal({ open: false, message: null });
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
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Mail className="text-primary" /> Messages Contact
            </h1>
            <p className="text-muted-foreground mt-1">Gérez les demandes de support et de renseignements</p>
          </div>
          <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-full flex items-center gap-2">
            <Inbox size={16} className="text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">{messages.length} Messages</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card dark:bg-card/40 border border-border p-6 rounded-2xl shadow-soft group hover:border-primary/30 transition-all relative"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                        {msg.sujet}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Clock size={12} />
                        <span>{new Date(msg.date).toLocaleString(i18n.language)}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-foreground">{msg.nom}</h2>
                      <p className="text-sm text-primary font-medium flex items-center gap-2">
                        <Mail size={14} /> {msg.email}
                      </p>
                    </div>

                    <div className="bg-muted/30 dark:bg-black/20 p-4 rounded-xl border border-border/50">
                       <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap italic">
                         "{msg.message}"
                       </p>
                    </div>
                  </div>

                  <div className="flex md:flex-col justify-end items-end shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                      onClick={() => setDeleteModal({ open: true, message: msg })}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {messages.length === 0 && (
            <div className="py-20 text-center bg-card dark:bg-card/20 border border-dashed border-border rounded-3xl opacity-50">
              <MessageSquare size={48} className="mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-xl font-bold">Aucun message</h3>
              <p className="text-sm">La boîte de réception est vide.</p>
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ ...deleteModal, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce message ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est définitive. Le message sera retiré de la base de données.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirmer la suppression
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
