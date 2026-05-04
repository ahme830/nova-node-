import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Package } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Role is determined by the backend API response
      await login(email, password);
      toast.success('Connexion réussie ! Séquence d\'accès validée.');

      // Check current user state from AuthContext (which was updated by login)
      // Redirect based on role returned from API
      const stored = localStorage.getItem('auth_user');
      const authUser = stored ? JSON.parse(stored) : null;
      
      if (authUser?.role === 'admin') navigate('/admin/dashboard');
      else if (authUser?.role === 'vendor') navigate('/vendor/dashboard');
      else navigate('/customer/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la connexion. Vérifiez vos identifiants.');
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
            <span className="text-2xl sm:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">NOVA NODE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2 tracking-tight">{t('login.title')}</h1>
          <p className="text-sm text-muted-foreground font-medium">{t('login.subtitle')}</p>
        </div>

        <div className="bg-card dark:bg-card/20 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-border/30 p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="unit@nova-node-prime.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 bg-muted dark:bg-white/5 border-border h-12 rounded-xl focus-visible:ring-primary/50 text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="password" title="Accès crypté" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('login.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 bg-muted dark:bg-white/5 border-border h-12 rounded-xl focus-visible:ring-primary/50 text-foreground"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="rounded border-border bg-muted dark:bg-white/5 checked:bg-primary" />
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">Rester connecté</span>
              </label>
              <a href="#" className="text-primary hover:text-primary-foreground transition-all">
                Clé perdue ?
              </a>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              variant="glow"
              className="w-full h-14 text-lg font-bold"
            >
              {isLoading ? t('login.loading') : t('login.submit')}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-[0.2em] font-black">
                <span className="px-4 bg-background text-muted-foreground">Ou canal tiers</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <Button variant="glass" type="button" className="h-12">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
              <Button variant="glass" type="button" className="h-12">
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </Button>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground font-medium">
          {t('login.noAccount')}{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-primary hover:text-primary-foreground font-bold transition-all"
          >
            {t('login.register')}
          </button>
        </p>


      </div>
    </div>
  );
}
