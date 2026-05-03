import { Info, MapPin, Globe, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export function Legal() {
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
              <Info className="w-8 h-8 text-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">{t('legal.title')}</h1>
            <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">{t('legal.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">{t('legal.publisher')}</h2>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><strong className="text-foreground">{t('legal.companyName')}:</strong> Nexus-Prime Technologies</li>
                <li><strong className="text-foreground">{t('legal.director')}:</strong> Cyber-Core 01</li>
                <li><strong className="text-foreground">{t('legal.capital')}:</strong> 1.000.000.000 {t('legal.nexusCredits')}</li>
                <li><strong className="text-foreground">{t('legal.rcs')}:</strong> Alger B 123 456 789</li>
              </ul>
            </section>

            <section className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">{t('legal.headquarters')}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('legal.address1')}<br />
                {t('legal.address2')}<br />
                {t('legal.address3')}<br />
                <span className="font-mono text-xs opacity-50 uppercase tracking-widest mt-4 block italic">{t('legal.liaison')} : contact@nexus-prime.net</span>
              </p>
            </section>

            <section className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">{t('legal.hosting')}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('legal.hostingDesc')} <br />
                <strong className="text-foreground">Supabase Cloud Systems</strong>.<br />
                {t('legal.dataCenter')}
              </p>
            </section>

            <section className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-xl border-dashed border-primary/20">
              <div className="flex items-center gap-3 mb-6">
                <Info className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">{t('legal.property')}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('legal.propertyDesc')}
              </p>
            </section>
          </div>

          <div className="text-center pt-10 text-xs text-muted-foreground font-mono opacity-50 uppercase tracking-widest">
            {t('legal.updatedAt')} : 2026.04.09
          </div>
        </motion.div>
      </div>
    </div>
  );
}
