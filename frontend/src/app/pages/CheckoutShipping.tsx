import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Zap, Calendar, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useCart } from '../contexts/CartContext';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function CheckoutShipping() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { items, isLoading: cartLoading } = useCart();
  const [selectedMethod, setSelectedMethod] = useState('standard');

  const shippingMethods = [
    {
      id: 'standard',
      name: t('checkout.standardLogistics'),
      desc: t('checkout.standardLogisticsDesc'),
      price: 0,
      icon: Calendar,
    },
    {
      id: 'express',
      name: t('checkout.warpTransfer'),
      desc: t('checkout.warpTransferDesc'),
      price: 1500,
      icon: Truck,
    },
    {
      id: 'nova_node_prime',
      name: t('checkout.nexusPrimeInstant'),
      desc: t('checkout.nexusPrimeInstantDesc'),
      price: 3500,
      icon: Zap,
    },
  ];

  useEffect(() => {
    if (!cartLoading && items.length === 0) {
      toast.error(t('cart.emptyRedirect'));
      navigate('/catalog');
    }
  }, [items, cartLoading, navigate]);

  const handleContinue = () => {
    localStorage.setItem('checkout_shipping_method', selectedMethod);
    const method = shippingMethods.find(m => m.id === selectedMethod);
    localStorage.setItem('checkout_shipping_price', (method?.price || 0).toString());
    navigate('/checkout/payment');
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
             { step: 3, label: t('checkout.shipping.title'), active: true, done: false },
             { step: 4, label: t('checkout.payment.title'), active: false, done: false },
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
            <h1 className="text-3xl font-black tracking-tight">{t('checkout.shippingSpeed')}</h1>

            <div className="space-y-4">
              {shippingMethods.map((method) => (
                <div 
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
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
                    <div className="text-right">
                      <p className="text-xl font-black">{method.price === 0 ? t('cart.free') : method.price.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</p>
                      {selectedMethod === method.id && <Check className="text-primary w-6 h-6 ml-auto mt-2" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-3xl p-8 sticky top-28">
              <h2 className="text-xl font-bold mb-6">{t('checkout.shippingSummary')}</h2>
              <div className="space-y-4 mb-8">
                <p className="text-sm text-muted-foreground">{t('checkout.shippingProtocolInfo')}</p>
                <div className="h-px bg-muted dark:bg-white/5"></div>
                <div className="flex justify-between font-mono text-xs uppercase tracking-widest text-primary">
                  <span>{t('checkout.logisticFees')}</span>
                  <span>{(selectedMethod === 'standard' ? 0 : shippingMethods.find(m => m.id === selectedMethod)?.price || 0).toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</span>
                </div>
              </div>
              <Button 
                variant="glow" 
                className="w-full h-14 font-bold text-lg"
                onClick={handleContinue}
              >
                {t('checkout.shipping.continue')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="ghost" 
                className="w-full h-12 mt-4 hover:bg-muted dark:bg-white/5"
                onClick={() => navigate('/checkout/address')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('checkout.addressDetails')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
