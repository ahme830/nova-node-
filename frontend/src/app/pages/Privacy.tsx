import { Shield, Eye, Lock, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export function Privacy() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
              <Shield className="w-8 h-8 text-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">{t('privacy.title')}</h1>
            <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">{t('privacy.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Eye, title: t('privacy.transparency'), desc: t('privacy.transparencyDesc') },
              { icon: Lock, title: t('privacy.security'), desc: t('privacy.securityDesc') },
              { icon: Globe, title: t('privacy.sovereignty'), desc: t('privacy.sovereigntyDesc') },
            ].map((item, i) => (
              <div key={i} className="bg-muted dark:bg-white/5 border border-border rounded-2xl p-6 text-center">
                <item.icon className="w-8 h-8 text-secondary mx-auto mb-4" />
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <section className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              {t('privacy.collection')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.collectionDesc')}
            </p>
          </section>

          <section className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Lock className="w-5 h-5 text-primary" />
              {t('privacy.retention')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.retentionDesc')}
            </p>
          </section>

          <div className="text-center pt-10 text-xs text-muted-foreground font-mono opacity-50 uppercase tracking-widest">
            {t('privacy.lastUpdate')} : 2026.04.09 // NOVA-NODE-SECURITY-DEPT
          </div>
        </motion.div>
      </div>
    </div>
  );
}
