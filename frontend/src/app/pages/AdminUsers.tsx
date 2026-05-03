import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Mail, ShieldAlert, CheckCircle, Trash2 } from 'lucide-react';
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

export const AdminUsers = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const { t } = useTranslation();

  // Dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminService.getAllUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = (userId: string, currentRole: string) => {
    const newRole = currentRole === 'client' ? 'vendeur' : 'client';
    const roleLabel = newRole === 'vendeur' ? t('adminUsers.vendeur') : t('adminUsers.client');
    
    setConfirmData({
      title: t('adminUsers.modifyPrivileges'),
      description: `${t('adminUsers.confirmRoleChange')} ${roleLabel} ?`,
      onConfirm: async () => {
        try {
          await adminService.updateUserRole(userId, newRole);
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
          toast.success(t('adminUsers.privilegesUpdated'));
        } catch (error) {
          toast.error(t('adminUsers.updateFailed'));
        }
      }
    });
    setConfirmOpen(true);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setConfirmData({
      title: t('common.delete') || 'Supprimer',
      description: `${t('adminUsers.confirmDeleteUser') || 'Êtes-vous sûr de vouloir supprimer définitivement'} ${userName} ?`,
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await adminService.deleteUser(userId);
          setUsers(prev => prev.filter(u => u.id !== userId));
          toast.success(t('adminUsers.deleteSuccess') || 'Utilisateur supprimé avec succès');
        } catch (error) {
          toast.error(t('adminUsers.deleteFailed') || 'Erreur lors de la suppression');
        }
      }
    });
    setConfirmOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-vh-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-12 px-3 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-8">
        
        <div>
          <h1 className="text-xl sm:text-3xl text-foreground tracking-tight flex items-center gap-4 font-bold">
            <span className="w-2 h-10 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"></span>
            {t('adminUsers.title')}
          </h1>
          <p className="mt-1 text-primary/50 text-[10px]">
            {t('adminUsers.subtitle')}
          </p>
        </div>

        {/* Users List */}
        <div className="bg-card dark:bg-card/20 border border-border dark:border-primary/20 rounded-2xl overflow-x-auto backdrop-blur-md shadow-soft">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-border dark:border-primary/30 bg-muted/60 dark:bg-primary/10">
                <th className="p-4 text-muted-foreground dark:text-primary text-[11px] font-bold uppercase tracking-wider">{t('adminUsers.identity')}</th>
                <th className="p-4 text-muted-foreground dark:text-primary text-[11px] font-bold uppercase tracking-wider">{t('adminUsers.contact')}</th>
                <th className="p-4 text-muted-foreground dark:text-primary text-[11px] font-bold uppercase tracking-wider">{t('adminUsers.currentRole')}</th>
                <th className="p-4 text-muted-foreground dark:text-primary text-[11px] font-bold uppercase tracking-wider">Statut</th>
                <th className="p-4 text-muted-foreground dark:text-primary text-[11px] font-bold uppercase tracking-wider text-right">{t('adminUsers.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <motion.tr 
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-border dark:border-primary/10 hover:bg-muted/50 dark:hover:bg-primary/5 transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                        <Users size={14} />
                      </div>
                      <span className="text-foreground text-sm font-semibold">{user.nom_utilisateur || t('adminUsers.anonymous')}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground dark:text-primary/50 text-xs">
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="opacity-30" />
                      {user.email}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-1 rounded-full border ${
                      user.role === 'admin' ? 'bg-primary/20 border-primary/50 text-primary' :
                      user.role === 'vendeur' ? 'bg-blue-600/20 border-blue-500 text-blue-400' :
                      'bg-muted border-border text-foreground/50'
                    } font-bold shadow-sm`}>
                      {t(`adminUsers.${user.role}`)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-500 font-bold uppercase tracking-widest">
                      {user.client?.statut || 'Actif'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleRoleUpdate(user.id, user.role)}
                          disabled={user.role === 'admin'}
                          className="text-[10px] text-primary disabled:opacity-20 hover:text-primary/80 transition-all gap-2 flex items-center outline-none focus:ring-1 focus:ring-primary/30 rounded-md p-1"
                          title={t('adminUsers.modifyPrivileges')}
                        >
                          <Shield size={12} /> {t('adminUsers.modifyPrivileges')}
                        </button>

                        <button 
                          onClick={() => handleDeleteUser(user.id, user.nom_utilisateur)}
                          disabled={user.role === 'admin'}
                          className="text-red-500 hover:text-red-400 disabled:opacity-20 transition-all p-1.5 hover:bg-red-500/10 rounded-lg"
                          title={t('common.delete') || 'Supprimer'}
                        >
                          <Trash2 size={14} />
                        </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="p-20 text-center opacity-30 text-sm text-primary font-bold">
              {t('adminUsers.noUsers')}
            </div>
          )}
        </div>

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
