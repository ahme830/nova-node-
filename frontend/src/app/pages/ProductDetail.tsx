import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Heart, Minus, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ProductCard } from '../components/ProductCard';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { produitService, Product } from '../../services/produit.service';
import { useCart } from '../contexts/CartContext';
import { signalementService } from '../../services/signalement.service';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useFavoris } from '../contexts/FavorisContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from '../components/ui/textarea';
import { avisService, Avis } from '../../services/avis.service';
import { useHistory } from '../hooks/useHistory';
import { RecommendationBlock } from '../components/RecommendationBlock';

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavoris();
  const { addViewedProduct, addViewedCategory } = useHistory();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Avis[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({ note: 5, contenu: '' });

  const favorite = product ? isFavorite(product.id) : false;

  useEffect(() => {
    if (id) {
        fetchProduct(id);
        fetchReviews(id);
    }
  }, [id]);

  const fetchReviews = async (productId: string) => {
    try {
        const res = await avisService.getByProduit(productId);
        setReviews(res.avis || []);
    } catch (err) {
        console.error('Error fetching reviews:', err);
    }
  };

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      const res = await produitService.getById(productId);
      setProduct(res.produit);
      
      // Update history
      addViewedProduct(productId);
      if (res.produit.type?.categorie?.nom) {
        addViewedCategory(res.produit.type.categorie.nom);
      }
      
      // Fetch related products (same category)
      const relatedRes = await produitService.search({ 
        categorie: res.produit.type?.categorie?.nom,
        limit: 5 
      });
      setRelatedProducts(relatedRes.produits.filter(p => p.id !== productId).slice(0, 4));
      
    } catch (err) {
      toast.error(t('product.notFoundDb'));
    } finally {
      setLoading(false);
    }
  };

  const [reportModal, setReportModal] = useState<{ open: boolean; type: 'produit' | 'avis'; targetId: string }>({ open: false, type: 'produit', targetId: '' });
  const [reportMotif, setReportMotif] = useState('');

  const handleReport = (type: 'produit' | 'avis', targetId: string) => {
    setReportModal({ open: true, type, targetId });
    setReportMotif('');
  };

  const submitReport = async () => {
    if (!reportMotif.trim()) {
        toast.error("Veuillez saisir un motif");
        return;
    }

    try {
      if (reportModal.type === 'produit') {
        await signalementService.signalerProduit(reportModal.targetId, reportMotif);
      } else {
        await signalementService.signalerAvis(reportModal.targetId, reportMotif);
      }
      toast.success("Signalement envoyé avec succès");
      setReportModal({ ...reportModal, open: false });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi du signalement");
    }
  };

  const handleAddToCart = async () => {
    try {
      if (!product) return;
      await addItem(product as Product, quantity);
    } catch (err) {
      // Error handled in context
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast.error(t('product.mustBeLoggedIn'));
        return;
    }
    try {
        setSubmittingReview(true);
        await avisService.submit({
            id_produit: id!,
            note: newReview.note,
            contenu: newReview.contenu
        });
        toast.success(t('product.reviewSuccess'));
        setNewReview({ note: 5, contenu: '' });
        fetchReviews(id!);
        fetchProduct(id!);
    } catch (err) {
        toast.error(t('product.reviewError'));
    } finally {
        setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-mono animate-pulse uppercase tracking-[0.3em]">{t('product.decrypting')}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center bg-card dark:bg-card/20 backdrop-blur-xl p-12 rounded-3xl border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-4">{t('product.notFound')}</h2>
          <Button variant="glow" onClick={() => navigate('/catalog')}>{t('product.backToCatalog')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 mb-10 sm:mb-16">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-3xl overflow-hidden bg-card dark:bg-card/20 border border-border mb-6 group">
              <img
                src={product.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop'}
                alt={product.nom_produit}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-card dark:bg-card/20 border border-border hover:border-primary/50 cursor-pointer transition-all">
                  <img src={product.image_url} alt="" className="w-full h-full object-cover opacity-50 hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="mb-4 sm:mb-6">
              {product.type?.categorie?.nom && (
                <Badge variant="neon" className="mb-3 sm:mb-4">{product.type.categorie.nom}</Badge>
              )}
              <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground mb-2 sm:mb-3 tracking-tight">{product.nom_produit}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <span className="text-sm uppercase tracking-widest font-mono">{t('product.supplier')}:</span>
                <span className="text-primary font-bold">{product.magasin?.nom_magasin || 'Nexus Partner'}</span>
              </p>
              <button 
                onClick={() => handleReport('produit', product.id)}
                className="mt-4 px-3 py-1.5 border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-all font-bold text-[10px] rounded-lg w-fit"
              >
                <AlertTriangle size={12} /> Signaler ce produit
              </button>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${star <= (product.note_moyenne || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                      }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{product.note_moyenne || '0'}</span>
              <span className="text-sm text-gray-500">({product.nb_avis || 0} {t('product.reviews')})</span>
            </div>

            <div className="mb-5 sm:mb-8 p-4 sm:p-6 bg-card dark:bg-card/40 backdrop-blur-md rounded-2xl border border-border shadow-inner">
              <div className="flex items-baseline gap-3 sm:gap-4 mb-3 flex-wrap">
                <span className="text-3xl sm:text-5xl font-black text-foreground tabular-nums">{product.prix.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}</span>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-foreground/80 leading-relaxed text-lg">{product.description}</p>
            </div>

            <Separator className="my-6" />

            {/* Stock */}
            <div className="mb-8">
              {product.qte_dispo > 0 ? (
                <div className="flex items-center gap-3 bg-green-500/10 w-fit px-4 py-2 rounded-full border border-green-500/20">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                  <span className="text-green-400 text-sm font-bold uppercase tracking-wider">{t('product.inStock')}: {product.qte_dispo} {t('product.units')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-red-500/10 w-fit px-4 py-2 rounded-full border border-red-500/20">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                  <span className="text-red-400 text-sm font-bold uppercase tracking-wider">{t('product.outOfStock')}</span>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 font-mono">{t('product.qtyConfig')}</label>
              <div className="flex items-center gap-4 bg-muted dark:bg-white/5 w-fit p-1 rounded-xl border border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 hover:bg-white/10 rounded-lg text-foreground"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-bold tabular-nums text-lg">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 hover:bg-white/10 rounded-lg text-foreground"
                  onClick={() => setQuantity(Math.min(product.qte_dispo, quantity + 1))}
                  disabled={quantity >= product.qte_dispo}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 sm:gap-4 mb-8 sm:mb-10">
              <Button variant="glow" onClick={handleAddToCart} disabled={product.qte_dispo === 0} className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold">
                <ShoppingCart className="w-5 h-5 mr-2 sm:mr-3" />
                {t('product.initPurchase')}
              </Button>
              <Button variant="glass" size="icon" onClick={() => product && toggleFavorite(product)} className="h-12 sm:h-14 w-12 sm:w-14">
                <Heart className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${favorite ? 'fill-destructive text-destructive drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'text-foreground'}`} />
              </Button>
            </div>

          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 sm:mt-20">
            <h2 className="text-xl sm:text-3xl font-extrabold text-foreground mb-5 sm:mb-8 tracking-tight">{t('product.similarModules')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={() => toast.success(t('product.addToCartSuccess'))} />
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <RecommendationBlock title={t('product.youMightAlsoLike') || 'Vous aimerez aussi...'} />

        {/* Reviews Section */}
        <div className="mt-20 sm:mt-32">
            <div className="flex flex-col md:flex-row gap-12 items-start">
                {/* Reviews List */}
                <div className="flex-1 w-full">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">{t('product.reviewsTitle')}</h2>
                        <Badge variant="outline" className="font-mono">{reviews.length} UNITS</Badge>
                    </div>

                    <div className="space-y-6">
                        {reviews.length > 0 ? (
                            reviews.map((review, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={review.id} 
                                    className="p-6 rounded-3xl bg-card dark:bg-card/20 backdrop-blur-xl border border-border hover:border-primary/30 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                                                {review.photo_auteur ? (
                                                    <img src={review.photo_auteur} alt={review.auteur} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Star className="w-5 h-5 text-primary" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">{review.auteur}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{new Date(review.date).toLocaleDateString(i18n.language)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className={`w-3 h-3 ${s <= review.note ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-foreground/80 leading-relaxed italic">"{review.contenu}"</p>
                                    <button 
                                      onClick={() => handleReport('avis', review.id)}
                                      className="mt-3 px-2 py-1 border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 flex items-center gap-1 transition-all font-bold text-[9px] rounded-md"
                                    >
                                      <AlertTriangle size={10} /> Signaler cet avis
                                    </button>
                                </motion.div>
                            ))
                        ) : (
                            <div className="p-12 rounded-3xl border border-dashed border-border text-center">
                                <p className="text-muted-foreground italic">{t('product.noReviewsYet')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Review Form */}
                <div className="w-full md:w-96 sticky top-24">
                    <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 backdrop-blur-md">
                        <h3 className="text-xl font-bold mb-6">{t('product.addReview')}</h3>
                        {user ? (
                            <form onSubmit={handleSubmitReview} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 font-mono">{t('product.rating')}</label>
                                    <div className="flex items-center gap-2 bg-muted dark:bg-white/5 p-2 rounded-xl border border-border w-fit">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setNewReview(prev => ({ ...prev, note: s }))}
                                                className="focus:outline-none transition-transform hover:scale-125"
                                            >
                                                <Star className={`w-6 h-6 ${s <= newReview.note ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-yellow-400/50'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 font-mono">{t('product.comment')}</label>
                                    <Textarea
                                        value={newReview.contenu}
                                        onChange={(e) => setNewReview(prev => ({ ...prev, contenu: e.target.value }))}
                                        placeholder={t('product.comment') + '...'}
                                        className="bg-background/50 border-border rounded-xl focus:ring-primary min-h-[120px]"
                                        required
                                    />
                                </div>
                                <Button 
                                    type="submit" 
                                    variant="glow" 
                                    className="w-full h-12 font-bold"
                                    disabled={submittingReview}
                                >
                                    {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : t('product.submitReview')}
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-muted-foreground text-sm mb-6">{t('product.mustBeLoggedIn')}</p>
                                <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>{t('nav.login')}</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Report Modal */}
      <Dialog open={reportModal.open} onOpenChange={(open) => setReportModal({ ...reportModal, open })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle size={20} />
              Signalement de {reportModal.type === 'produit' ? 'produit' : 'contenu'}
            </DialogTitle>
            <DialogDescription>
              Veuillez nous expliquer pourquoi vous signalez cet élément. Notre équipe de modération l'examinera dans les plus brefs délais.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
                placeholder="Ex: Contenu offensant, produit frauduleux, information erronée..."
                value={reportMotif}
                onChange={(e) => setReportMotif(e.target.value)}
                className="min-h-[120px] bg-background/50"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportModal({ ...reportModal, open: false })}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={submitReport} disabled={!reportMotif.trim()}>
              Envoyer le signalement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
