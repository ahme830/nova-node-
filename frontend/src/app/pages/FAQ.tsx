import { HelpCircle, ChevronDown, ChevronUp, Zap, Radio, Database, Shield } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { t } = useTranslation();

  const faqs = [
    {
      icon: Zap,
      question: t('faq.q1'),
      answer: t('faq.a1')
    },
    {
      icon: Radio,
      question: t('faq.q2'),
      answer: t('faq.a2')
    },
    {
      icon: Database,
      question: t('faq.q3'),
      answer: t('faq.a3')
    },
    {
      icon: Shield,
      question: t('faq.q4'),
      answer: t('faq.a4')
    }
  ];

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/20 mb-6">
            <HelpCircle className="w-8 h-8 text-secondary shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">{t('faq.title')}</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">{t('faq.subtitle')}</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-2xl overflow-hidden"
            >
              <button 
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left p-6 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted dark:bg-white/5 flex items-center justify-center border border-border group-hover:border-primary/50 transition-colors">
                    <faq.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-bold text-lg group-hover:text-primary transition-colors">{faq.question}</span>
                </div>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-6 pt-0">
                  <div className="h-px bg-muted dark:bg-white/5 mb-6"></div>
                  <p className="text-muted-foreground leading-relaxed pl-14">
                    {faq.answer}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-16 bg-primary/10 border border-primary/20 rounded-3xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">{t('faq.stillQuestions')}</h3>
          <p className="text-muted-foreground mb-6">{t('faq.contactDesc')}</p>
          <a href="/contact" className="inline-flex items-center text-primary font-bold hover:gap-3 transition-all">
            {t('faq.contactBtn')} <Radio className="w-4 h-4 ml-2" />
          </a>
        </div>
      </div>
    </div>
  );
}
