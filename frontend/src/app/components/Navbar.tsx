import { Search, ShoppingCart, User, Menu, Heart, Package, Languages, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { useTranslation } from 'react-i18next';
import { useFavoris } from '../contexts/FavorisContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface NavbarProps {
  cartItemsCount?: number;
  onMenuClick?: () => void;
}

const languages = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇩🇿' },
];

export function Navbar({ cartItemsCount = 0, onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const { favorites } = useFavoris();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { t, i18n } = useTranslation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const switchLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const getDashboardRoute = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'vendor':
        return '/vendor/dashboard';
      case 'customer':
        return '/customer/dashboard';
      default:
        return '/';
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button onClick={onMenuClick} className="lg:hidden text-foreground hover:text-primary transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary opacity-30 blur-md rounded-full group-hover:opacity-50 transition-opacity"></div>
                <Package className="w-8 h-8 text-primary relative z-10" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">NOVA NODE</span>
            </button>
          </div>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder={t('nav.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 focus-visible:bg-secondary transition-all rounded-xl"
              />
            </div>
          </form>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/customer/favorites')}
              className="relative"
            >
              <Heart className="w-5 h-5" />
              {favorites.length > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-primary text-white text-xs">
                  {favorites.length}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/customer/cart')}
              className="relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-blue-600 text-white text-xs">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>

            <ThemeToggle />

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-accent ring-offset-background transition-colors">
                  <Languages className="w-5 h-5 text-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-xl border-border min-w-[160px]">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => switchLanguage(lang.code)}
                    className="focus:bg-primary/20 cursor-pointer flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                    {i18n.language === lang.code && <Check className="w-4 h-4 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 hover:bg-accent rounded-full pr-4 pl-1 transition-all">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-colors">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="hidden md:inline font-medium text-foreground">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t('nav.myAccount')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(getDashboardRoute())}>
                    {t('nav.dashboard')}
                  </DropdownMenuItem>
                  {user.role === 'customer' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/customer/orders')}>
                        {t('nav.myOrders')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/customer/favorites')}>
                        {t('nav.myFavorites')}
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.role === 'vendor' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/vendor/store')}>
                        {t('nav.storeConfig')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/vendor/products')}>
                        {t('nav.productCatalog')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/vendor/orders')}>
                        {t('nav.receivedOrders')}
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                        {t('nav.userManagement')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin/stores')}>
                        {t('nav.storeValidation')}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    {t('nav.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigate('/login')} className="hover:bg-accent">
                  {t('nav.login')}
                </Button>
                <Button variant="glow" onClick={() => navigate('/register')}>
                  {t('nav.register')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={t('nav.searchMobile')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
        </form>
      </div>
    </nav>
  );
}
