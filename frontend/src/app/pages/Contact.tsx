import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { contactService } from '../../services/contact.service';

export function Contact() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    sujet: 'Support Technique',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await contactService.sendMessage(formData);
      toast.success(t('contact.successMessage'));
      setFormData({
        nom: '',
        email: '',
        sujet: 'Support Technique',
        message: ''
      });
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
            <MessageSquare className="w-8 h-8 text-primary shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">{t('contact.title')}</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">{t('contact.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-3xl p-8 lg:p-12 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-8">{t('contact.formTitle')}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">{t('contact.idLabel')}</label>
                  <input 
                    type="text" 
                    placeholder={t('contact.namePlaceholder')}
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full bg-muted dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-mono text-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">{t('contact.emailLabel')}</label>
                  <input 
                    type="email" 
                    placeholder="votre@nova-node.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-muted dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-mono text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">{t('contact.subjectLabel')}</label>
                <select 
                    value={formData.sujet}
                    onChange={(e) => setFormData({ ...formData, sujet: e.target.value })}
                    className="w-full bg-muted dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-mono text-sm appearance-none"
                >
                  <option className="bg-background" value="Support Technique">{t('contact.supportTech')}</option>
                  <option className="bg-background" value="Réseau Vendeur">{t('contact.vendorNetwork')}</option>
                  <option className="bg-background" value="Signalement Erreur">{t('contact.errorReport')}</option>
                  <option className="bg-background" value="Autre">{t('contact.otherProtocols')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">{t('contact.messageLabel')}</label>
                <textarea 
                  rows={5}
                  placeholder={t('contact.messagePlaceholder')}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-muted dark:bg-white/5 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-mono text-sm"
                  required
                ></textarea>
              </div>

              <Button variant="glow" size="lg" className="w-full h-14 text-lg font-bold" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 mr-3" />}
                {loading ? t('common.sending') || 'Envoi...' : t('contact.submitBtn')}
              </Button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-center space-y-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: Mail, label: t('contact.emailLabelInfo'), value: 'core@nova-node-prime.net' },
                { icon: Phone, label: t('contact.phoneLabel'), value: '+213 555 123 456' },
                { icon: MapPin, label: t('contact.addressLabel'), value: 'Secteur 04, Alger' },
                { icon: MessageSquare, label: t('contact.chatLabel'), value: t('contact.available') },
              ].map((item, i) => (
                <div key={i} className="bg-muted dark:bg-white/5 border border-border rounded-2xl p-6 hover:bg-white/10 transition-colors">
                  <item.icon className="w-6 h-6 text-primary mb-4" />
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="font-bold">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-4">{t('contact.responseTimeTitle')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('contact.responseTimeDesc')}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
