import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Trash2, Search, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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

export const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { t, i18n } = useTranslation();

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await adminService.getAllProducts();
      setProducts(response.produits || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    const { id } = deleteModal;
    if (!id) return;
    
    try {
      await adminService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success("Produit supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
        setDeleteModal({ open: false, id: '' });
    }
  };

  const handleDelete = (id: string) => {
    setDeleteModal({ open: true, id });
  };

  const filteredProducts = products.filter(p => 
    p.nom_produit.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.magasin?.nom_magasin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Package className="text-primary" /> Gestion des Produits
            </h1>
            <p className="text-muted-foreground mt-1">Supervision globale de l'inventaire Nova Node</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Rechercher un produit ou un magasin..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-card dark:bg-card/40 border border-border rounded-2xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/60 dark:bg-muted/50 border-b border-border">
                  <th className="p-4 text-[10px] font-bold opacity-60">Produit</th>
                  <th className="p-4 text-[10px] font-bold opacity-60">Magasin</th>
                  <th className="p-4 text-[10px] font-bold opacity-60">Prix</th>
                  <th className="p-4 text-[10px] font-bold opacity-60">Stock</th>
                  <th className="p-4 text-[10px] font-bold opacity-60 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/50 dark:hover:bg-primary/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={product.image_url || 'https://via.placeholder.com/40'} 
                          alt="" 
                          className="w-10 h-10 rounded-lg object-cover border border-border"
                        />
                        <div>
                          <p className="font-bold text-sm">{product.nom_produit}</p>
                          <p className="text-[10px] text-muted-foreground">{product.type?.nom || 'Sans type'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium">{product.magasin?.nom_magasin || 'N/A'}</span>
                    </td>
                    <td className="p-4 text-sm">
                      {product.prix.toLocaleString(i18n.language)} DZD
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${product.qte_dispo > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {product.qte_dispo} en stock
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="hover:text-primary" onClick={() => window.open(`/product/${product.id}`, '_blank')}>
                          <ExternalLink size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:text-red-500" onClick={() => handleDelete(product.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground italic">
                      Aucun produit trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <AlertDialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ ...deleteModal, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le produit sera définitivement retiré de la boutique et du catalogue.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
