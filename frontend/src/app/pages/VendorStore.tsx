import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Save, Image as ImageIcon, Layout, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { magasinService, Magasin } from '../../services/magasin.service';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const VendorStore = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState<Magasin | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchStore();
    }
  }, [user]);

  const fetchStore = async () => {
    try {
      const response = await magasinService.getByVendeur(user!.id);
      setStore(response.magasin);
    } catch (error) {
      console.error('Error fetching store:', error);
      // If store doesn't exist, we might want to show a "Create Store" UI
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    setSaving(true);
    try {
      await magasinService.update(store.id, {
        nom_magasin: store.nom_magasin,
        description: store.description,
        photo_url: store.photo_url
      });
      toast.success(t('vendorDashboard.storeUpdateSuccess'));
    } catch (error) {
      toast.error(t('vendorDashboard.updateError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-vh-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!store && !loading) {
    return (
      <div className="p-8 text-center bg-card dark:bg-card/20 rounded-2xl border border-border min-h-screen pt-24 text-foreground">
        <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-mono mb-2 tracking-widest">{t('vendorDashboard.storeNotFound')}</h2>
        <p className="text-muted-foreground font-mono mb-8 opacity-70 italic small uppercase">
            {t('vendorDashboard.noStoreAssociated')}
        </p>
        <button className="px-6 py-2 bg-primary/20 border border-primary/50 text-primary rounded-sm hover:bg-primary/30 transition-all font-mono">
            {t('vendorDashboard.initStoreModule')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-12 px-3 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card dark:bg-card/40 p-5 sm:p-8 shadow-soft">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Store size={80} className="text-primary sm:hidden" />
            <Store size={120} className="text-primary hidden sm:block" />
          </div>
          <div className="relative z-10">
            <h1 className="text-xl sm:text-3xl font-mono text-foreground tracking-widest flex items-center gap-3 italic">
              <span className="w-2 h-6 sm:h-8 bg-primary"></span>
              {t('vendorDashboard.storeConfig')}
            </h1>
            <p className="mt-2 text-primary/60 font-mono text-xs tracking-tight uppercase">
              {t('vendorDashboard.storeSettings')} - ID: {store?.id.substring(0, 8)}
            </p>
          </div>
        </div>

        {/* Main Configuration Form */}
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Store Information Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-2 space-y-6"
            >
              <div className="bg-card dark:bg-card/40 border border-border p-6 rounded-2xl backdrop-blur-md shadow-soft">
                <h3 className="text-foreground font-mono mb-6 flex items-center gap-2 text-sm tracking-wider opacity-80 uppercase">
                  <Layout size={16} className="text-primary" /> {t('vendorDashboard.generalInfo')}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground uppercase mb-1">{t('vendorDashboard.storeName')}</label>
                    <input 
                      type="text"
                      value={store?.nom_magasin || ''}
                      onChange={(e) => setStore(s => s ? {...s, nom_magasin: e.target.value} : null)}
                      className="w-full bg-input border border-border rounded-xl px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground uppercase mb-1">{t('vendorDashboard.descriptionBio')}</label>
                    <textarea 
                      rows={4}
                      value={store?.description || ''}
                      onChange={(e) => setStore(s => s ? {...s, description: e.target.value} : null)}
                      className="w-full bg-input border border-border rounded-xl px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Visuals Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div className="bg-card dark:bg-card/40 border border-border p-6 rounded-2xl backdrop-blur-md shadow-soft">
                <h3 className="text-foreground font-mono mb-6 flex items-center gap-2 text-sm tracking-wider opacity-80 uppercase">
                  <ImageIcon size={16} className="text-primary" /> {t('vendorDashboard.visualIdentity')}
                </h3>
                
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto bg-muted rounded-full mb-3 flex items-center justify-center overflow-hidden border border-border shadow-inner">
                      {store?.photo_url ? (
                        <img src={store.photo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Store size={32} className="text-muted-foreground/30" />
                      )}
                    </div>
                    <button type="button" className="text-[10px] font-mono text-primary hover:text-primary transition-colors uppercase tracking-tighter">
                      {t('vendorDashboard.changeLogo')}
                    </button>
                  </div>

                  <div className="p-3 border border-dashed border-border rounded-xl bg-muted/40">
                    <label className="block text-[10px] font-mono text-muted-foreground/60 uppercase mb-2">{t('vendorDashboard.storeBanner')}</label>
                    <div className="h-20 bg-muted rounded-xl flex items-center justify-center border border-border/50">
                      <ImageIcon size={20} className="text-muted-foreground/30" />
                    </div>
                    <button type="button" className="w-full mt-2 text-[10px] font-mono text-primary hover:text-primary transition-colors uppercase tracking-tighter">
                      {t('vendorDashboard.importBanner')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end pt-4 border-t border-border">
            <button
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-primary/10 border border-primary/50 text-primary rounded-xl hover:bg-primary/20 transition-all font-mono uppercase tracking-widest text-sm disabled:opacity-50 shadow-soft"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-primary"></div>
              ) : (
                <Save size={18} />
              )}
              {t('vendorDashboard.updateSystem')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
