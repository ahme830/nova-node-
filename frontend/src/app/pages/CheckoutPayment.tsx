import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, ShieldCheck, ArrowRight, ArrowLeft, Check, Lock, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCart } from '../contexts/CartContext';
import { commandeService, MethodePaiement } from '../../services/commande.service';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function CheckoutPayment() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { total: cartTotal, items, isLoading: cartLoading, refresh: refreshCart } = useCart();
  const [selectedMethod, setSelectedMethod] = useState<MethodePaiement>('carteVisa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentStep, setPaymentStep] = useState(0);
  const isPaid = useRef(false);

   const paymentMethods = [
    { id: 'carteVisa', name: t('checkout.payment.methods.visa'), icon: CreditCard, desc: t('checkout.payment.methods.visaDesc') },
    { id: 'carteDahabia', name: t('checkout.payment.methods.dahabia'), icon: ShieldCheck, desc: t('checkout.payment.methods.dahabiaDesc') },
    { id: 'paypal', name: t('checkout.payment.methods.paypal'), icon: Wallet, desc: t('checkout.payment.methods.paypalDesc') },
  ];

  useEffect(() => {
    if (!cartLoading && items.length === 0 && !isPaid.current) {
      toast.error(t('cart.emptyRedirect'));
      navigate('/catalog');
    }
  }, [items, cartLoading, navigate, t]);

  const shippingPrice = parseFloat(localStorage.getItem('checkout_shipping_price') || '0');
  const addressId = localStorage.getItem('checkout_address_id');
  const finalTotal = cartTotal + shippingPrice;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
    setErrorMsg('');
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setExpiry(value);
    setErrorMsg('');
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setCvc(value);
    setErrorMsg('');
  };

  const handleProcessPayment = async () => {
    if (!addressId) {
      toast.error(t('checkout.address.errorLoading'));
      navigate('/checkout/address');
      return;
    }

    // Validation
    if (selectedMethod === 'carteVisa' || selectedMethod === 'carteDahabia') {
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        setErrorMsg('Le numéro de carte doit contenir 16 chiffres.');
        return;
      }
      if (expiry.length !== 5) {
        setErrorMsg('La date d\'expiration est invalide (MM/AA).');
        return;
      }
      if (cvc.length !== 3) {
        setErrorMsg('Le CVC doit contenir 3 chiffres.');
        return;
      }
    } else if (selectedMethod === 'paypal') {
      if (!paypalEmail.includes('@')) {
        setErrorMsg('Veuillez entrer une adresse email valide.');
        return;
      }
    }

    setIsProcessing(true);
    setErrorMsg('');
    setPaymentStep(1); // Connexion passerelle bancaire

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setPaymentStep(2); // Vérification 3D-Secure
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Easter egg démo : Échec bancaire volontaire si CVC == 000 ou 666
      if ((selectedMethod === 'carteVisa' || selectedMethod === 'carteDahabia') && (cvc === '000' || cvc === '666')) {
        throw new Error('Transaction refusée : Fonds insuffisants ou carte bloquée (Simulation de Démo)');
      }

      setPaymentStep(3); // Transfert des fonds
      await new Promise(resolve => setTimeout(resolve, 800));

      const res = await commandeService.passer(addressId, selectedMethod);
      setPaymentStep(4); // Succès
      toast.success(t('checkout.payment.bankAuthSuccess'));
      
      localStorage.removeItem('checkout_address_id');
      localStorage.removeItem('checkout_shipping_method');
      localStorage.removeItem('checkout_shipping_price');
      
      isPaid.current = true;
      navigate('/checkout/success', { state: { orderId: res.commande_id, total: finalTotal } });
      await refreshCart();
    } catch (err: any) {
      toast.error(err.message || t('checkout.payment.bankAuthFailure'));
      navigate('/checkout/failure', { state: { reason: err.message } });
    } finally {
      setIsProcessing(false);
      setPaymentStep(0);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 relative px-4">
           <div className="absolute top-1/2 left-0 w-full h-px bg-muted dark:bg-white/5 -translate-y-1/2 z-0"></div>
           {[
             { step: 1, label: t('cart.title'), active: true, done: true },
             { step: 2, label: t('checkout.address.title'), active: true, done: true },
             { step: 3, label: t('checkout.shipping.title'), active: true, done: true },
             { step: 4, label: t('checkout.payment.title'), active: true, done: false },
           ].map((s) => (
             <div key={s.step} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs border transition-all ${
                  s.active ? 'bg-primary border-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'bg-background border-white/20 text-muted-foreground'
                }`}>
                  {s.done ? <Check className="w-4 h-4" /> : s.step}
                </div>
                <span className={`text-[10px] uppercase tracking-widest font-bold ${s.active ? 'text-primary' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-8">
            <h1 className="text-3xl font-black tracking-tight">{t('checkout.payment.paymentTitle')}</h1>

            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div 
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id as MethodePaiement)}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer relative group ${
                    selectedMethod === method.id ? 'bg-primary/10 border-primary' : 'bg-card dark:bg-card/20 border-border hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 items-center">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                        selectedMethod === method.id ? 'bg-primary/20 border-primary/30' : 'bg-muted dark:bg-white/5 border-border'
                      }`}>
                        <method.icon className={`w-6 h-6 ${selectedMethod === method.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{method.name}</p>
                        <p className="text-muted-foreground text-sm">{method.desc}</p>
                      </div>
                    </div>
                    {selectedMethod === method.id && <div className="p-1 bg-primary rounded-full"><Check className="text-white w-4 h-4" /></div>}
                  </div>
                </div>
              ))}
            </div>

            {(selectedMethod === 'carteVisa' || selectedMethod === 'carteDahabia') && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/30 backdrop-blur-xl border border-border rounded-3xl p-8 space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">{t('checkout.payment.cardNum')}</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="XXXX XXXX XXXX XXXX" 
                      className="w-full bg-muted dark:bg-white/5 border border-border rounded-xl px-4 py-3 text-lg font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground transition-all"
                      disabled={isProcessing}
                    />
                    <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">{t('checkout.payment.expiry')}</label>
                    <input 
                      type="text" 
                      value={expiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY" 
                      className="w-full bg-muted dark:bg-white/5 border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground transition-all"
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">{t('checkout.payment.cvc')}</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        value={cvc}
                        onChange={handleCvcChange}
                        placeholder="***" 
                        className="w-full bg-muted dark:bg-white/5 border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground transition-all"
                        disabled={isProcessing}
                      />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {selectedMethod === 'paypal' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/30 backdrop-blur-xl border border-border rounded-3xl p-8 space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest ml-1">Adresse Email PayPal</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={paypalEmail}
                      onChange={(e) => { setPaypalEmail(e.target.value); setErrorMsg(''); }}
                      placeholder="votre.email@exemple.com" 
                      className="w-full bg-muted dark:bg-white/5 border border-border rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground transition-all"
                      disabled={isProcessing}
                    />
                    <Wallet className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-3xl p-8 sticky top-28">
              <h2 className="text-xl font-bold mb-6 italic">{t('checkout.payment.orderSummary')}</h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>{t('cart.subtotal')}</span>
                  <span>{cartTotal.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>{t('cart.shipping')}</span>
                  <span>{shippingPrice.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</span>
                </div>
                <div className="h-px bg-muted dark:bg-white/5"></div>
                <div className="flex justify-between text-2xl font-black text-primary">
                  <span>{t('cart.total')}</span>
                  <span className="tabular-nums">{finalTotal.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</span>
                </div>
              </div>

              <div className="mb-8 p-4 bg-green-500/5 border border-green-500/20 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-[10px] text-green-500/80 leading-relaxed font-mono uppercase">
                  {t('checkout.payment.secureInfo')}
                </p>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold rounded-xl text-center">
                  {errorMsg}
                </div>
              )}

              <Button 
                variant="glow" 
                className="w-full h-16 font-black text-xl overflow-hidden relative"
                onClick={handleProcessPayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      <span className="text-sm uppercase tracking-widest">
                        {paymentStep === 1 && "Connexion banque..."}
                        {paymentStep === 2 && "Vérification 3D-Secure..."}
                        {paymentStep === 3 && "Transfert des fonds..."}
                        {paymentStep === 4 && "Paiement validé !"}
                      </span>
                    </div>
                    {/* Progress bar animation */}
                    <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
                      <motion.div 
                        className="h-full bg-white" 
                        initial={{ width: '0%' }}
                        animate={{ width: `${(paymentStep / 4) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {t('checkout.payment.payNow')}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full h-12 mt-4 hover:bg-muted dark:bg-white/5 opacity-50"
                onClick={() => navigate('/checkout/shipping')}
                disabled={isProcessing}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('checkout.shipping.back')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
