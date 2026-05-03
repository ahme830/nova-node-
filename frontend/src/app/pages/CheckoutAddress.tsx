import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Trash2, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { adresseService, Adresse } from '../../services/adresse.service';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useTranslation } from 'react-i18next';

export function CheckoutAddress() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { items, isLoading: cartLoading } = useCart();
  const [adresses, setAdresses] = useState<Adresse[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Guard: Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && items.length === 0) {
      toast.error(t('cart.emptyRedirect'));
      navigate('/catalog');
    }
  }, [items, cartLoading, navigate]);

  // Form state
  const [newAddress, setNewAddress] = useState({
    numero_rue: '',
    nom_rue: '',
    complement_adresse: '',
    code_postal: '',
    ville: '',
    pays: 'France',
  });

  useEffect(() => {
    loadAdresses();
  }, []);

  const loadAdresses = async () => {
    try {
      const data = await adresseService.getAdresses();
      setAdresses(data.adresses);
      if (data.adresses.length > 0) {
        setSelectedId(data.adresses[0].id);
      }
    } catch (err: any) {
      toast.error(t('checkout.address.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adresseService.addAdresse(newAddress);
      toast.success(t('checkout.addressDetail.saveSuccess'));
      setAdresses([...adresses, res.adresse]);
      setSelectedId(res.adresse.id);
      setShowAddForm(false);
      setNewAddress({
        numero_rue: '',
        nom_rue: '',
        complement_adresse: '',
        code_postal: '',
        ville: '',
        pays: 'France',
      });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteAddress = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm(t('common.confirmDelete') || 'Supprimer cette adresse ?')) return;
    try {
      await adresseService.deleteAdresse(id);
      setAdresses(adresses.filter(a => a.id !== id));
      if (selectedId === id) setSelectedId(null);
      toast.success(t('checkout.addressDetail.deleteSuccess') || 'Adresse supprimée');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleContinue = () => {
    if (!selectedId) {
      toast.error(t('checkout.address.selectError'));
      return;
    }
    // Store selected address ID in session or pass via state
    localStorage.setItem('checkout_address_id', selectedId);
    navigate('/checkout/shipping');
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 relative px-4">
           <div className="absolute top-1/2 left-0 w-full h-px bg-muted dark:bg-white/5 -translate-y-1/2 z-0"></div>
            {[
              { step: 1, label: t('cart.title'), active: true, done: true },
              { step: 2, label: t('checkout.address.title'), active: true, done: false },
              { step: 3, label: t('checkout.shipping.title'), active: false, done: false },
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
            <h1 className="text-3xl font-black tracking-tight">{t('checkout.addressTitle')}</h1>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-24 bg-muted dark:bg-white/5 rounded-2xl animate-pulse"></div>)}
              </div>
            ) : (
              <div className="space-y-4">
                {adresses.map((addr) => (
                  <div 
                    key={addr.id}
                    onClick={() => setSelectedId(addr.id)}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer group relative ${
                      selectedId === addr.id ? 'bg-primary/10 border-primary' : 'bg-card dark:bg-card/20 border-border hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <MapPin className={`w-5 h-5 mt-1 ${selectedId === addr.id ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="font-bold text-lg">{addr.numero_rue} {addr.nom_rue}</p>
                          <p className="text-muted-foreground text-sm">{addr.code_postal} {addr.ville}, {addr.pays}</p>
                          {addr.complement_adresse && <p className="text-xs text-muted-foreground mt-1 italic opacity-70">{addr.complement_adresse}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => handleDeleteAddress(e, addr.id)}
                          className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {selectedId === addr.id && <Check className="text-primary w-6 h-6" />}
                      </div>
                    </div>
                  </div>
                ))}

                {!showAddForm && (
                  <Button 
                    variant="glass" 
                    className="w-full h-16 border-dashed"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="w-5 h-5 mr-3" />
                    {t('checkout.addAddress')}
                  </Button>
                )}

                {showAddForm && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-card/30 backdrop-blur-xl border border-primary/20 rounded-3xl p-8"
                  >
                    <h3 className="text-xl font-bold mb-6">{t('checkout.newDestination')}</h3>
                    <form onSubmit={handleAddAddress} className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <input 
                          type="text" 
                          placeholder={t('checkout.address.streetNumber')} 
                          className="bg-muted dark:bg-white/5 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                          value={newAddress.numero_rue}
                          onChange={e => setNewAddress({...newAddress, numero_rue: e.target.value})}
                        />
                        <input 
                          type="text" 
                          placeholder={t('checkout.address.street')} 
                          className="col-span-2 bg-muted dark:bg-white/5 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                          value={newAddress.nom_rue}
                          onChange={e => setNewAddress({...newAddress, nom_rue: e.target.value})}
                          required
                        />
                      </div>
                      <input 
                        type="text" 
                        placeholder={t('checkout.address.complement')} 
                        className="w-full bg-muted dark:bg-white/5 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                        value={newAddress.complement_adresse}
                        onChange={e => setNewAddress({...newAddress, complement_adresse: e.target.value})}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          type="text" 
                          placeholder={t('checkout.address.postalCode')} 
                          className="bg-muted dark:bg-white/5 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                          value={newAddress.code_postal}
                          onChange={e => setNewAddress({...newAddress, code_postal: e.target.value})}
                          required
                        />
                        <input 
                          type="text" 
                          placeholder={t('checkout.address.city')} 
                          className="bg-muted dark:bg-white/5 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                          value={newAddress.ville}
                          onChange={e => setNewAddress({...newAddress, ville: e.target.value})}
                          required
                        />
                      </div>
                      <input 
                        type="text" 
                        placeholder={t('checkout.address.country')} 
                        className="w-full bg-muted dark:bg-white/5 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                        value={newAddress.pays}
                        onChange={e => setNewAddress({...newAddress, pays: e.target.value})}
                        required
                      />
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" variant="glow" className="flex-1">{t('checkout.saveAddress')}</Button>
                        <Button type="button" variant="glass" onClick={() => setShowAddForm(false)}>{t('checkout.address.back')}</Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-card dark:bg-card/20 backdrop-blur-xl border border-border rounded-3xl p-8 sticky top-28">
              <h2 className="text-xl font-bold mb-6">{t('checkout.transferSummary')}</h2>
              <div className="space-y-4 mb-8">
                <p className="text-sm text-muted-foreground flex justify-between">
                  <span>{t('checkout.nexusArticles')}</span>
                  <span className="font-mono">{t('checkout.address.syncOk')}</span>
                </p>
                <p className="text-sm text-muted-foreground">{t('checkout.shippingCalcInfo')}</p>
              </div>
              <Button 
                variant="glow" 
                className="w-full h-14 font-bold text-lg"
                onClick={handleContinue}
              >
                {t('checkout.address.continue')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="ghost" 
                className="w-full h-12 mt-4 hover:bg-muted dark:bg-white/5"
                onClick={() => navigate('/customer/cart')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('checkout.backToCart')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
