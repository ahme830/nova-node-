import { useState, useEffect } from 'react';
import { ArrowRight, Monitor, Cpu, Mouse, Gamepad2, HardDrive, Headphones, Truck, Gift, Settings, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProductCard } from '../components/ProductCard';
import { categories } from '../lib/mock-data';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SplineScene } from '../components/ui/splite';
import { Spotlight } from '../components/ui/spotlight';
import { produitService, Product } from '../../services/produit.service';
import { catalogService, Category } from '../../services/catalog.service';
import { useCart } from '../contexts/CartContext';
import { useTranslation } from 'react-i18next';
import { RecommendationBlock } from '../components/RecommendationBlock';
import { useHistory } from '../hooks/useHistory';

const categoryIcons = {
  Monitor,
  Cpu,
  Mouse,
  Gamepad2,
  HardDrive,
  Headphones,
};

const categoryImages: Record<string, string> = {
  '1': '/images/categories/pc_new.jpg',
  '2': '/images/categories/components_new.jpg',
  '3': '/images/categories/peripherals_new.jpg',
  '4': '/images/categories/gaming_new.jpg',
  '5': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=2070&auto=format&fit=crop',
  '6': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=2070&auto=format&fit=crop',
};

export function Home() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { history } = useHistory();
  const hasHistory = history.viewedProducts.length > 0 || history.recentSearches.length > 0 || history.viewedCategories.length > 0;

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        produitService.search({ limit: 8 }),
        catalogService.getCategories()
      ]);
      setFeaturedProducts(prodRes.produits);
      setDbCategories(catRes.categories || []);
    } catch (err) {
      console.error('Failed to fetch home data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addItem(product, 1);
    } catch (err) { }
  };
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans">
      {/* Hero Section - FORCED DARK */}
      <div className="dark">
        <section className="relative overflow-hidden bg-[#0f0518] border-b border-border min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] flex items-center">
          <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 z-10 w-full">
            <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
              {/* Left content */}
              <div className="flex-1 max-w-2xl text-center lg:text-left animate-in fade-in slide-in-from-left-8 duration-1000">
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 sm:mb-6 leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-foreground to-primary/80">
                  <span className="block">{t('home.heroWelcome')}</span>
                  <span className="block">{t('home.heroShop')}</span>
                </h1>
                <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-7 sm:mb-10 max-w-xl mx-auto lg:mx-0 font-light">
                  {t('home.heroDesc')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center lg:justify-start">
                  <Button size="lg" variant="glow" onClick={() => navigate('/catalog')} className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold">
                    {t('home.exploreProducts')}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button size="lg" variant="glass" onClick={() => navigate('/register?role=vendor')} className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold">
                    {t('home.becomeVendor')}
                  </Button>
                </div>
              </div>

              {/* Right content - Spline Scene */}
              <div className="flex-1 w-full h-[250px] sm:h-[400px] lg:h-[600px] relative animate-in fade-in slide-in-from-right-8 duration-1000">
                <SplineScene
                  scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0518] via-transparent to-transparent pointer-events-none"></div>
        </section>
      </div>

      {/* Features Section */}
      <section className="bg-background border-y border-border/50 relative z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8">
            <div className="flex flex-row sm:flex-col items-center sm:text-center gap-4 p-5 sm:p-8 rounded-2xl bg-card dark:bg-card/50 border border-border/50 shadow-soft hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-primary group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base sm:text-xl mb-1 sm:mb-2">{t('home.freeShipping')}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{t('home.freeShippingDesc')}</p>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col items-center sm:text-center gap-4 p-5 sm:p-8 rounded-2xl bg-card dark:bg-card/50 border border-border/50 shadow-soft hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-primary group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base sm:text-xl mb-1 sm:mb-2">{t('home.exclusiveOffer')}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{t('home.exclusiveOfferDesc')}</p>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col items-center sm:text-center gap-4 p-5 sm:p-8 rounded-2xl bg-card dark:bg-card/50 border border-border/50 shadow-soft hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm">
                <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-primary group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base sm:text-xl mb-1 sm:mb-2">{t('home.adaptedNeeds')}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{t('home.adaptedNeedsDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - FORCED DARK */}
      <div className="dark">
        <section className="bg-[#0f0518] relative py-12 sm:py-20 border-b border-border">
          <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-8 sm:mb-16">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight">{t('home.categoriesTitle')}</h2>
              <p className="text-sm sm:text-lg text-gray-400">{t('home.categoriesSubtitle')}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {dbCategories.slice(0, 6).map((category, index) => {
                const Icon = Monitor; // Simple default fallback
                return (
                  <button
                    key={category.id}
                    onClick={() => navigate(`/catalog?categorie=${encodeURIComponent(category.nom)}`)}
                    className={`relative group overflow-hidden rounded-2xl border border-border hover:border-primary/50 transition-all duration-500 text-left bg-card dark:bg-card/20 backdrop-blur-md ${index === 0 ? 'col-span-2 lg:col-span-2 row-span-2' : ''}`}
                    style={{ minHeight: index === 0 ? '200px' : '150px' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0518] to-transparent opacity-80 z-10 transition-opacity group-hover:opacity-90"></div>
                    <div
                      className="absolute inset-0 scale-100 group-hover:scale-110 transition-transform duration-700 bg-cover bg-center opacity-40"
                      style={{ backgroundImage: `url('${categoryImages[(index + 1).toString()] || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop'}')` }}
                    ></div>

                    <div className="absolute inset-0 z-20 p-4 sm:p-8 flex flex-col justify-end">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-background/50 backdrop-blur-md rounded-xl flex items-center justify-center mb-2 sm:mb-4 border border-border group-hover:bg-primary/20 group-hover:border-primary/50 transition-colors">
                        <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                      </div>
                      <h3 className="text-base sm:text-2xl font-bold text-white mb-1 sm:mb-2 tracking-tight group-hover:text-primary transition-colors">{category.nom}</h3>
                      <div className="hidden sm:flex items-center text-sm text-gray-300 font-medium">
                        <span>{category.type?.length || 0} {t('home.protocolsAvailable')}</span>
                        <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* AI Recommendations Block OR Popular Products */}
      {hasHistory ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-12 sm:pt-24">
          <RecommendationBlock title={t('home.recommendationsBlockTitle') || 'Sélectionnés pour vous'} />
        </section>
      ) : (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24 relative overflow-hidden">
          <div className="absolute top-1/2 left-0 w-full h-[500px] bg-primary/5 -translate-y-1/2 blur-[100px] pointer-events-none z-0"></div>

          <div className="flex items-end justify-between mb-7 sm:mb-12 relative z-10 gap-4 flex-wrap">
            <div>
              <h2 className="text-xl sm:text-4xl font-extrabold text-foreground mb-1 sm:mb-3 tracking-tight">{t('home.recommendations')}</h2>
              <p className="text-sm sm:text-lg text-muted-foreground">{t('home.recommendationsDesc')}</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/catalog')} className="shrink-0 hidden sm:flex border-border hover:border-primary/50 text-foreground hover:bg-primary/5">
              {t('home.exploreCatalog')}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card dark:bg-card/20 backdrop-blur-md rounded-3xl border border-border">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground font-mono animate-pulse uppercase tracking-widest text-sm">{t('home.initFlux')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 relative z-10">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          )}
          <Button variant="outline" onClick={() => navigate('/catalog')} className="w-full mt-6 sm:hidden border-border hover:border-primary/50 text-foreground hover:bg-primary/5">
            {t('home.viewCatalog')}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </section>
      )}

      {/* Vendor CTA Section */}
      <div className="dark">
        <section className="relative overflow-hidden py-12 sm:py-24 border-y border-border bg-[#0f0518]">
          <div className="absolute inset-0 bg-primary/5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-full bg-primary/10 blur-[100px] pointer-events-none"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
            <div className="text-center max-w-2xl mx-auto bg-card/60 backdrop-blur-xl p-6 sm:p-12 rounded-2xl sm:rounded-3xl border border-border shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-6 text-white">{t('home.sellWithUs')}</h2>
              <p className="text-sm sm:text-lg text-gray-400 mb-6 sm:mb-10">
                {t('home.sellWithUsDesc')}
              </p>
              <Button size="lg" variant="glow" onClick={() => navigate('/register?role=vendor')} className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg w-full sm:w-auto hover:-translate-y-1 transition-transform">
                {t('home.joinNetwork')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
