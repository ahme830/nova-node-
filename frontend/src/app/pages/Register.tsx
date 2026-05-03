import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Package } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Role and Store State
  const searchParams = new URLSearchParams(window.location.search);
  const initialRole = (searchParams.get('role') as UserRole) || 'customer';
  const [role, setRole] = useState<UserRole>(initialRole);
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register(name, email, password, role, storeName, storeDescription);
      toast.success(t('register.success') || 'Compte créé avec succès !');
      
      if (role === 'vendor') {
        toast.info(t('register.vendorPending') || 'Votre magasin est en attente de validation par un administrateur.');
        navigate('/customer/dashboard'); // Redirect to customer dashboard first as store is not active
      } else {
        navigate('/customer/dashboard');
      }
    } catch (error: any) {
      if (error.message.includes("Veuillez vous connecter manuellement")) {
        toast.info(error.message);
        navigate('/login');
      } else {
        toast.error(error.message || 'Erreur lors de la création du compte');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-7 sm:mb-10">
          <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-primary opacity-50 blur-md rounded-full group-hover:opacity-100 transition-opacity"></div>
              <Package className="w-10 h-10 sm:w-12 sm:h-12 text-white relative z-10" />
            </div>
            <span className="text-2xl sm:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">NEXUS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2 tracking-tight">{t('register.title')}</h1>
          <p className="text-sm text-muted-foreground font-medium">{t('register.subtitle')}</p>
        </div>

        <div className="bg-card dark:bg-card/20 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-border/30 p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('register.name')}</Label>
              <Input
                id="name"
                type="text"
                placeholder="Alias Operationnel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 bg-muted dark:bg-white/5 border-border h-12 rounded-xl focus-visible:ring-primary/50 text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('register.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="unit@nexus-prime.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 bg-muted dark:bg-white/5 border-border h-12 rounded-xl focus-visible:ring-primary/50 text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('register.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 bg-muted dark:bg-white/5 border-border h-12 rounded-xl focus-visible:ring-primary/50 text-foreground"
              />
              <p className="text-[10px] text-muted-foreground mt-2 font-mono uppercase tracking-tighter opacity-50">Sécurité minimale: 8 fragments</p>
            </div>



            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('register.role')}</Label>
              <RadioGroup 
                value={role} 
                onValueChange={(v) => setRole(v as UserRole)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="customer" id="customer" className="peer sr-only" />
                  <Label
                    htmlFor="customer"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-muted dark:bg-white/5 p-4 hover:bg-white/10 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                  >
                    <span className="text-sm font-bold uppercase tracking-wider">{t('register.customer')}</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="vendor" id="vendor" className="peer sr-only" />
                  <Label
                    htmlFor="vendor"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-muted dark:bg-white/5 p-4 hover:bg-white/10 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                  >
                    <span className="text-sm font-bold uppercase tracking-wider">{t('register.vendor')}</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {role === 'vendor' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="h-px bg-white/10 my-2"></div>
                <div>
                  <Label htmlFor="storeName" className="text-xs font-bold uppercase tracking-widest text-primary ml-1">{t('vendorDashboard.storeName')}</Label>
                  <Input
                    id="storeName"
                    type="text"
                    placeholder="Nexus Armory"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required={role === 'vendor'}
                    className="mt-2 bg-primary/5 border-primary/20 h-12 rounded-xl focus-visible:ring-primary/50 text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="storeDesc" className="text-xs font-bold uppercase tracking-widest text-primary ml-1">{t('vendorDashboard.descriptionBio')}</Label>
                  <textarea
                    id="storeDesc"
                    placeholder={t('vendorDashboard.secureEntryInterface') || "Décrivez votre activité..."}
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    className="mt-2 w-full bg-primary/5 border-primary/20 rounded-xl p-3 text-sm focus-visible:ring-primary/50 text-foreground outline-none border focus:border-primary/50 transition-all min-h-[100px]"
                  />
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-1">
              <input type="checkbox" required className="mt-1 rounded border-white/20 bg-muted dark:bg-white/5 checked:bg-primary" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Je valide les{' '}
                <a href="#" className="text-primary hover:text-white transition-colors underline decoration-primary/30 underline-offset-4">
                  Protocoles de Service
                </a>{' '}
                et la{' '}
                <a href="#" className="text-primary hover:text-white transition-colors underline decoration-primary/30 underline-offset-4">
                  Gestion des Données
                </a>
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              variant="glow"
              className="w-full h-14 text-lg font-bold"
            >
              {isLoading ? t('register.loading') : t('register.submit')}
            </Button>
          </form>

          <p className="mt-10 text-center text-sm text-muted-foreground font-medium">
            {t('register.hasAccount')}{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary hover:text-primary-foreground font-bold transition-all"
            >
              {t('register.login')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
