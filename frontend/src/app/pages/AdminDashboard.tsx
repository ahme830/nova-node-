import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Store, Package, ShoppingCart, DollarSign, Activity, ChevronRight, ShieldCheck, Brain } from 'lucide-react';
import { adminService, AdminStats } from '../../services/admin.service';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminService.getStats();
      setStats(response);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: t('adminDashboard.users'), value: stats?.totalUsers, icon: Users, color: 'text-blue-600 dark:text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', iconBg: 'bg-blue-100 dark:bg-blue-500/20' },
    { label: t('adminDashboard.activeVendors'), value: stats?.totalVendors, icon: ShieldCheck, color: 'text-cyan-600 dark:text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10', iconBg: 'bg-cyan-100 dark:bg-cyan-500/20' },
    { label: t('adminDashboard.indexedProducts'), value: stats?.totalProducts, icon: Package, color: 'text-purple-600 dark:text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', iconBg: 'bg-purple-100 dark:bg-purple-500/20' },
    { label: t('adminDashboard.salesVolume'), value: stats?.totalOrders, icon: Activity, color: 'text-green-600 dark:text-green-500', bg: 'bg-green-50 dark:bg-green-500/10', iconBg: 'bg-green-100 dark:bg-green-500/20' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Admin Header */}
        <div className="relative p-6 sm:p-10 border border-border bg-card dark:bg-card/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10">
                <Activity size={120} className="text-primary sm:hidden" />
                <Activity size={180} className="text-primary hidden sm:block" />
            </div>
            <div className="relative z-10">
                <h1 className="text-2xl sm:text-4xl text-foreground font-bold tracking-tight">{t('adminDashboard.title')}</h1>
                <div className="mt-4 sm:mt-6 flex flex-wrap gap-3">
                    <Link to="/admin/users" className="px-4 py-2 border border-border dark:border-primary/40 bg-muted/50 dark:bg-transparent text-primary text-[10px] hover:bg-primary/10 transition-all rounded-lg font-bold">{t('adminDashboard.manageAccess')}</Link>
                    <Link to="/admin/stores" className="px-4 py-2 border border-border dark:border-primary/40 bg-muted/50 dark:bg-transparent text-primary text-[10px] hover:bg-primary/10 transition-all rounded-lg font-bold">{t('adminDashboard.storeVerification')}</Link>
                    <Link to="/admin/products" className="px-4 py-2 border border-border dark:border-primary/40 bg-muted/50 dark:bg-transparent text-primary text-[10px] hover:bg-primary/10 transition-all rounded-lg font-bold">Produits</Link>
                    <Link to="/admin/orders" className="px-4 py-2 border border-border dark:border-primary/40 bg-muted/50 dark:bg-transparent text-primary text-[10px] hover:bg-primary/10 transition-all rounded-lg font-bold">Commandes</Link>
                    <Link to="/admin/reviews" className="px-4 py-2 border border-border dark:border-primary/40 bg-muted/50 dark:bg-transparent text-primary text-[10px] hover:bg-primary/10 transition-all rounded-lg font-bold">Avis</Link>
                    <Link to="/admin/reports" className="px-4 py-2 border border-border dark:border-primary/40 bg-muted/50 dark:bg-transparent text-primary text-[10px] hover:bg-primary/10 transition-all rounded-lg font-bold">Signalements</Link>
                    <Link to="/admin/messages" className="px-4 py-2 border border-border dark:border-primary/40 bg-muted/50 dark:bg-transparent text-primary text-[10px] hover:bg-primary/10 transition-all rounded-lg font-bold">Messages</Link>
                    <Link to="/admin/categories" className="px-4 py-2 border border-border dark:border-primary/40 bg-muted/50 dark:bg-transparent text-primary text-[10px] hover:bg-primary/10 transition-all rounded-lg font-bold">Catalogue</Link>
                    <Link to="/admin/predictions" className="px-4 py-2 border border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-transparent text-purple-700 dark:text-purple-400 text-[10px] hover:bg-purple-100 dark:hover:bg-purple-500/10 transition-all rounded-lg font-bold flex items-center gap-1"><Brain size={12} /> Prédictions IA</Link>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 border border-border rounded-2xl bg-card dark:bg-card/40 backdrop-blur-sm relative group cursor-default shadow-soft hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon size={20} className={stat.color} />
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/20 group-hover:bg-primary transition-colors shadow-[0_0_8px_rgba(var(--primary),0.5)]"></div>
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-3xl text-foreground font-bold mt-1">{stat.value?.toLocaleString(i18n.language) || '---'}</h3>
            </motion.div>
          ))}
        </div>

        {/* Financial Snapshot */}
        <div className="bg-card dark:bg-card/40 backdrop-blur-xl border border-border p-5 sm:p-8 rounded-2xl shadow-soft">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5 sm:mb-8">
                <h2 className="text-base sm:text-lg text-foreground font-bold flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                      <DollarSign className="text-green-600 dark:text-green-500" size={20} />
                    </div>
                    {t('adminDashboard.globalRevenue')}
                </h2>
            </div>
            
            <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-4xl sm:text-6xl font-bold text-foreground">{stats?.revenue?.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' }) || '0 DZD'}</span>
                <span className="text-green-600 dark:text-green-500 font-bold flex items-center gap-1">
                  <Activity size={14} /> +12.5%
                </span>
            </div>
            
            <div className="mt-8 grid grid-cols-12 gap-1 h-3 rounded-full overflow-hidden border border-border bg-muted/50">
                {[...Array(48)].map((_, i) => (
                    <div key={i} className={`h-full ${i < 30 ? 'bg-primary/60 dark:bg-primary/50' : 'bg-muted dark:bg-muted/30'}`}></div>
                ))}
            </div>
        </div>

        {/* Shortcuts / Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-foreground text-[11px] font-bold">
            <Link to="/admin/users" className="p-5 bg-card dark:bg-card/20 border border-border rounded-xl flex items-center justify-between hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30 transition-all group shadow-sm">
                <span className="group-hover:text-primary transition-colors">{t('adminDashboard.regularizeUsers')}</span>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
            </Link>
            <Link to="/admin/stores" className="p-5 bg-card dark:bg-card/20 border border-border rounded-xl flex items-center justify-between hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30 transition-all group shadow-sm">
                <span className="group-hover:text-primary transition-colors">{t('adminDashboard.verifyStores')}</span>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
            </Link>
            <Link to="/admin/products" className="p-5 bg-card dark:bg-card/20 border border-border rounded-xl flex items-center justify-between hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30 transition-all group shadow-sm">
                <span className="group-hover:text-primary transition-colors">Gérer les Produits</span>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
            </Link>
            <Link to="/admin/orders" className="p-5 bg-card dark:bg-card/20 border border-border rounded-xl flex items-center justify-between hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30 transition-all group shadow-sm">
                <span className="group-hover:text-primary transition-colors">Gérer les Commandes</span>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
            </Link>
            <Link to="/admin/categories" className="p-5 bg-card dark:bg-card/20 border border-border rounded-xl flex items-center justify-between hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30 transition-all group shadow-sm">
                <span className="group-hover:text-primary transition-colors">Gérer le Catalogue</span>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
            </Link>
            <Link to="/admin/reviews" className="p-5 bg-card dark:bg-card/20 border border-border rounded-xl flex items-center justify-between hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30 transition-all group shadow-sm">
                <span className="group-hover:text-primary transition-colors">Modération des Avis</span>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
            </Link>
            <Link to="/admin/reports" className="p-5 bg-card dark:bg-card/20 border border-border rounded-xl flex items-center justify-between hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30 transition-all group shadow-sm">
                <span className="group-hover:text-primary transition-colors">Signalements Clients</span>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
            </Link>
            <Link to="/admin/messages" className="p-5 bg-card dark:bg-card/20 border border-border rounded-xl flex items-center justify-between hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30 transition-all group shadow-sm">
                <span className="group-hover:text-primary transition-colors">Messages Contact</span>
                <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
            </Link>
            <button className="p-5 bg-card dark:bg-card/20 border border-border rounded-xl flex items-center justify-between hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30 transition-all group shadow-sm text-left">
                <span className="group-hover:text-primary transition-colors">{t('adminDashboard.maintenance')}</span>
                <ShieldCheck size={14} className="text-muted-foreground group-hover:text-primary transition-all" />
            </button>
            <Link to="/admin/predictions" className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 border border-purple-200 dark:border-purple-500/30 rounded-xl flex items-center justify-between hover:border-purple-400 dark:hover:border-purple-500/50 transition-all group shadow-sm">
                <span className="text-purple-700 dark:text-purple-400 group-hover:text-purple-800 dark:group-hover:text-purple-300 transition-colors flex items-center gap-2"><Brain size={14} /> Prédictions IA</span>
                <ChevronRight size={14} className="text-purple-400 group-hover:text-purple-600 transition-all group-hover:translate-x-1" />
            </Link>
        </div>

      </div>
    </div>
  );
};
