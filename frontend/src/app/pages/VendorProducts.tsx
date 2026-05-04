import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package, Edit2, Trash2, Search, Filter, AlertCircle, ShoppingBag, X, Loader2 } from 'lucide-react';
import { produitService, Product } from '../../services/produit.service';
import { magasinService } from '../../services/magasin.service';
import { catalogService, Type } from '../../services/catalog.service';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Button } from '../components/ui/button';

export const VendorProducts = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nom_produit: '',
    description: '',
    prix: '',
    qte_dispo: '',
    image_url: '',
    id_type: ''
  });

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' });

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [storeRes, typesRes] = await Promise.all([
        magasinService.getByVendeur(user!.id),
        catalogService.getTypes()
      ]);
      
      setTypes(typesRes.types || []);

      if (storeRes.magasin) {
        setStoreId(storeRes.magasin.id);
        const prodRes = await produitService.getByMagasin(storeRes.magasin.id);
        setProducts(prodRes.produits || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nom_produit: product.nom_produit,
        description: product.description || '',
        prix: product.prix.toString(),
        qte_dispo: product.qte_dispo.toString(),
        image_url: product.image_url || '',
        id_type: product.type?.nom ? types.find(t => t.nom === product.type?.nom)?.id || '' : ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nom_produit: '',
        description: '',
        prix: '',
        qte_dispo: '',
        image_url: '',
        id_type: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return toast.error("Store not found");
    
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        prix: parseFloat(formData.prix),
        qte_dispo: parseInt(formData.qte_dispo),
        id_magasin: storeId
      };

      if (editingProduct) {
        const res = await produitService.update(editingProduct.id, payload);
        toast.success(t('vendorDashboard.updateSuccess') || "Product updated");
        // Update local list
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...payload, type: types.find(t => t.id === formData.id_type) ? { nom: types.find(t => t.id === formData.id_type)!.nom } : p.type } : p));
      } else {
        const res = await produitService.create(payload);
        toast.success(t('vendorDashboard.addSuccess') || "Product added");
        // Reload products to get the new list with relations
        const prodRes = await produitService.getByMagasin(storeId);
        setProducts(prodRes.produits || []);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error saving product");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    const { id } = deleteModal;
    if (!id) return;
    try {
      await produitService.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success(t('vendorDashboard.deleteSuccess'));
    } catch (error) {
      toast.error(t('vendorDashboard.deleteError'));
    } finally {
        setDeleteModal({ open: false, id: '' });
    }
  };

  const handleDelete = (id: string) => {
    setDeleteModal({ open: true, id });
  };

  const filteredProducts = products.filter(p => 
    p.nom_produit.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.type?.nom || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-vh-100">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-12 px-3 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-5 sm:space-y-8">
        
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-mono text-foreground tracking-widest flex items-center gap-3 italic">
              <span className="w-1.5 h-8 sm:h-10 bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"></span>
              {t('vendorDashboard.profiledCatalog')}
            </h1>
            <p className="mt-1 text-primary/50 font-mono text-xs uppercase tracking-tighter">
              {t('vendorDashboard.inventoryAssets')}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative group flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
              <input 
                type="text"
                placeholder={t('catalog.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-card dark:bg-card/40 border border-border rounded-xl pl-10 pr-4 py-2 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:min-w-[220px] transition-all"
              />
            </div>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-primary/10 border border-primary/50 p-2 text-primary hover:bg-primary/20 transition-all rounded-xl flex items-center gap-1.5 px-3 shadow-soft whitespace-nowrap"
            >
              <Plus size={16} />
              <span className="font-mono text-xs font-bold uppercase tracking-wider hidden sm:inline">{t('common.add')}</span>
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          <AnimatePresence>
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-card dark:bg-card/40 border border-border hover:border-primary/50 transition-all p-3 rounded-2xl backdrop-blur-md shadow-soft"
              >
                <div className={`absolute top-4 right-4 z-10 px-2 py-0.5 rounded-full text-[8px] font-mono border ${
                  product.qte_dispo > 0 ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
                }`}>
                  {product.qte_dispo > 0 ? t('vendorDashboard.inStock') : t('vendorDashboard.outOfStock')}
                </div>

                <div className="relative h-48 overflow-hidden rounded-xl bg-muted mb-4 border border-border/50 shadow-inner">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.nom_produit} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10">
                      <ShoppingBag size={80} className="text-primary" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">{product.type?.nom || ''}</p>
                  <h3 className="text-foreground font-mono font-bold tracking-tight text-lg line-clamp-1 group-hover:text-primary transition-colors uppercase">{product.nom_produit}</h3>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xl font-mono text-foreground tracking-widest">{product.prix} <small className="text-[10px] text-primary/50">DZD</small></span>
                    <span className="text-xs font-mono text-muted-foreground/60 uppercase">{t('product.quantity')}: {product.qte_dispo}</span>
                  </div>
                </div>

                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 border border-primary/50 rounded-2xl">
                  <button 
                    onClick={() => handleOpenModal(product)}
                    className="p-3 bg-primary/20 border border-primary/50 text-primary rounded-full hover:bg-primary hover:text-white transition-all shadow-md"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="p-3 bg-destructive/20 border border-destructive/50 text-destructive rounded-full hover:bg-destructive hover:text-white transition-all shadow-md"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-muted/20 border border-dashed border-border rounded-2xl">
            <Package size={48} className="mx-auto text-muted-foreground/30 mb-4 animate-pulse" />
            <h3 className="text-muted-foreground font-mono text-sm tracking-widest uppercase italic">{t('vendorDashboard.zeroProducts')}</h3>
            <p className="text-muted-foreground/30 font-mono text-[10px] mt-2 uppercase">{t('vendorDashboard.initInventory')}</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-card border border-border p-6 sm:p-8 rounded-2xl overflow-hidden relative shadow-2xl z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>

              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Edit2 size={200} className="text-primary" />
              </div>

              <h2 className="text-2xl font-mono text-foreground mb-8 tracking-widest italic flex items-center gap-4">
                  <span className="w-1 h-6 bg-primary"></span>
                  {editingProduct ? t('vendorDashboard.activeModification') : t('vendorDashboard.newRecord')}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6 relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-primary/70">{t('product.name')}</label>
                    <input 
                      required
                      type="text"
                      value={formData.nom_produit}
                      onChange={e => setFormData({...formData, nom_produit: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                      placeholder="NOVA-NODE-PRO-01"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-primary/70">{t('catalog.category')}</label>
                    <select 
                      required
                      value={formData.id_type}
                      onChange={e => setFormData({...formData, id_type: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all cursor-pointer appearance-none"
                    >
                      <option value="">{t('catalog.allCategories')}</option>
                      {types.map(type => (
                        <option key={type.id} value={type.id}>{type.nom} ({type.categorie?.nom})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-primary/70">{t('product.price')} (DZD)</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      value={formData.prix}
                      onChange={e => setFormData({...formData, prix: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-primary/70">{t('product.quantity')}</label>
                    <input 
                      required
                      type="number"
                      value={formData.qte_dispo}
                      onChange={e => setFormData({...formData, qte_dispo: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-primary/70">{t('product.description')}</label>
                  <textarea 
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-none"
                    placeholder="Module description..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Image URL</label>
                  <input 
                    type="url"
                    value={formData.image_url}
                    onChange={e => setFormData({...formData, image_url: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-mono focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <button 
                  disabled={submitting}
                  type="submit"
                  className="w-full py-4 bg-primary text-white font-mono uppercase text-sm tracking-[0.4em] rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="animate-spin w-4 h-4" />}
                  {editingProduct ? t('common.save') : t('common.add')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AlertDialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ ...deleteModal, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('vendorDashboard.confirmDelete') || 'Supprimer ce produit ?'}</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le produit sera définitivement retiré de votre boutique.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                Confirmer la suppression
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};
