import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../../services/user.service';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { User, Mail, Shield, ArrowLeft, Loader2, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.name || '',
    email: user?.email || '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    try {
      await userService.updateProfile(user.id, {
        nom_utilisateur: formData.username,
        email: formData.email,
      });

      // Update local state and context
      updateUser({
        name: formData.username,
        email: formData.email,
      });

      toast.success(t('profileSettings.syncSuccess'));
    } catch (err: any) {
      toast.error(err.message || t('profileSettings.syncError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button 
          variant="ghost" 
          className="mb-8 -ml-4 hover:bg-muted opacity-70"
          onClick={() => navigate('/customer/dashboard')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('customerOrders.backToDashboard') || 'Dashboard'}
        </Button>

        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 text-secondary mb-2 sm:mb-3">
            <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(34,211,238,1)]"></div>
            <span className="text-xs sm:text-sm font-mono tracking-[0.2em] sm:tracking-[0.3em] uppercase opacity-70">{t('profileSettings.subtitle')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{t('profileSettings.title')}</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm">{t('profileSettings.description')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-12">
          {/* Main Form */}
          <div className="md:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card dark:bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-soft"
            >
              <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                {t('profileSettings.identityInfo')}
              </h2>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">{t('profileSettings.username')}</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full bg-muted/30 border border-border rounded-xl px-10 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-mono text-foreground"
                      required
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">{t('profileSettings.emailChannel')}</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-muted/30 border border-border rounded-xl px-10 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-mono text-foreground"
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <Button variant="glow" size="lg" className="w-full h-14 font-bold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('profileSettings.updateSignal')}
                </Button>
              </form>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card dark:bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-soft"
            >
              <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-red-400">
                <Key className="w-5 h-5" />
                {t('profileSettings.securityEncryption')}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {t('profileSettings.resetPasswordDesc')}
              </p>
              <Button variant="glass" className="w-full border-red-500/20 hover:bg-red-500/10 text-red-400">
                {t('profileSettings.resetPassword')}
              </Button>
            </motion.div>
          </div>

          {/* Sidebar Status */}
          <div className="space-y-6">
            <div className="bg-card dark:bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-8 text-center shadow-soft">
              <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 relative">
                 <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse"></div>
                 <span className="text-3xl font-black text-primary relative z-10">{user?.name?.[0].toUpperCase()}</span>
              </div>
              <h3 className="text-xl font-bold mb-1">{user?.name}</h3>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">{user?.role}</p>
              
              <div className="mt-8 space-y-4 pt-8 border-t border-border">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <span>{t('profileSettings.accountStatus')}</span>
                    <span className="text-green-500 font-bold">{t('profileSettings.active')}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <span>{t('profileSettings.securityLevel')}</span>
                    <span className="text-secondary font-bold">Clas 4</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20">
              <div className="flex gap-4 items-start">
                <Shield className="w-5 h-5 text-primary shrink-0 mt-1" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('profileSettings.sessionInfo')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
