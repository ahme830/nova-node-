import { ShieldCheck, Scale, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export function Terms() {
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
              <Scale className="w-8 h-8 text-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">{t('terms.title')}</h1>
            <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">{t('terms.subtitle')}</p>
          </div>

          <section className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">{t('terms.acceptance')}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {t('terms.acceptanceDesc')}
              
              {t('terms.acceptanceWarning')}
            </p>
          </section>

          <section className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">{t('terms.security')}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.securityDesc')}
            </p>
          </section>

          <section className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Scale className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">{t('terms.rights')}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.rightsDesc')}
            </p>
          </section>

          <div className="text-center pt-10 text-xs text-muted-foreground font-mono opacity-50 uppercase tracking-widest">
            {t('terms.lastUpdate')} : 2026.04.09 // NEXUS-LEGAL-DEPT
          </div>
        </motion.div>
      </div>
    </div>
  );
}
