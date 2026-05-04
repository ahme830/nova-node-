import { motion } from 'framer-motion';
import { CheckCircle2, Package, ArrowRight, Download, Share2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';

export function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { orderId, total } = location.state || { orderId: 'NOVA-NODE-XXXXX', total: 0 };

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#d946ef', '#ffffff']
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 mb-8 relative">
            <CheckCircle2 className="w-12 h-12 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
            <div className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl animate-pulse"></div>
          </div>

          <h1 className="text-4xl font-black tracking-tight mb-4">{t('checkoutSuccess.title')}</h1>
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
            {t('checkoutSuccess.desc')}
          </p>

          <div className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-3xl p-8 mb-10 text-left space-y-4">
            <div className="flex justify-between items-center text-sm font-mono uppercase tracking-widest text-muted-foreground">
              <span>{t('checkoutSuccess.orderId')}</span>
              <span className="text-foreground font-bold">{orderId}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-mono uppercase tracking-widest text-muted-foreground">
              <span>{t('checkoutSuccess.amountCredited')}</span>
              <span className="text-foreground font-bold">{total.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</span>
            </div>
            <div className="h-px bg-muted dark:bg-white/5"></div>
            <p className="text-[10px] text-muted-foreground leading-relaxed italic opacity-70">
              {t('checkoutSuccess.reportSent')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              variant="glow" 
              size="lg" 
              className="w-full h-14 font-bold"
              onClick={() => navigate('/customer/orders')}
            >
              <Package className="w-5 h-5 mr-2" />
              {t('checkoutSuccess.trackSignal')}
            </Button>
            <Button 
              variant="glass" 
              size="lg" 
              className="w-full h-14 font-bold"
              onClick={() => navigate('/catalog')}
            >
              {t('checkoutSuccess.newModules')}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-6 opacity-40">
            <button className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest hover:text-primary transition-colors">
              <Download className="w-4 h-4" /> {t('checkoutSuccess.invoicePdf')}
            </button>
            <button className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest hover:text-primary transition-colors">
              <Share2 className="w-4 h-4" /> {t('checkoutSuccess.shareUnit')}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
