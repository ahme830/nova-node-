import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, Trash2, Edit2, ChevronDown, ChevronRight, Loader2, X, Check } from 'lucide-react';
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

export const AdminCategories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCatName, setNewTypeCatName] = useState('');

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: 'category' | 'type'; id: string }>({ open: false, type: 'category', id: '' });

  const { t } = useTranslation();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await adminService.getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des catégories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await adminService.createCategory(newCatName);
      setNewCatName('');
      fetchCategories();
      toast.success("Catégorie ajoutée");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erreur lors de l'ajout");
    }
  };

  const confirmDelete = async () => {
    const { id, type } = confirmModal;
    if (!id) return;
    
    try {
      if (type === 'category') {
        await adminService.deleteCategory(id);
        toast.success("Catégorie supprimée");
      } else {
        await adminService.deleteType(id);
        toast.success("Type supprimé");
      }
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erreur lors de la suppression");
    } finally {
        setConfirmModal({ open: false, type: 'category', id: '' });
    }
  };

  const handleDeleteCategory = (id: string) => {
    setConfirmModal({ open: true, type: 'category', id });
  };

  const handleUpdateCategory = async (id: string) => {
    try {
      await adminService.updateCategory(id, editingCatName);
      setEditingCatId(null);
      fetchCategories();
      toast.success("Catégorie mise à jour");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erreur lors de la mise à jour");
    }
  };

  const handleAddType = async (e: React.FormEvent, catName: string) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    try {
      await adminService.createType(newTypeName, catName);
      setNewTypeName('');
      fetchCategories();
      toast.success("Type ajouté");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erreur lors de l'ajout du type");
    }
  };

  const handleDeleteType = (id: string) => {
    setConfirmModal({ open: true, type: 'type', id });
  };

  const toggleExpand = (id: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Tag className="text-primary" /> Gestion du Catalogue
          </h1>
          <p className="text-muted-foreground mt-1">Structurez les catégories et types de produits</p>
        </div>

        {/* Add Category Form */}
        <div className="bg-card dark:bg-card/40 border border-border p-6 rounded-2xl shadow-soft">
          <h2 className="text-sm font-bold mb-4">Nouvelle Catégorie</h2>
          <form onSubmit={handleAddCategory} className="flex gap-3">
            <Input 
              placeholder="Ex: Électronique, Vêtements..." 
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="glow">
              <Plus className="w-4 h-4 mr-2" /> Ajouter
            </Button>
          </form>
        </div>

        {/* Categories List */}
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-card dark:bg-card/20 border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 flex items-center justify-between hover:bg-muted/50 dark:hover:bg-muted dark:bg-white/5 transition-colors group">
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleExpand(cat.id)}>
                  {expandedCats.has(cat.id) ? <ChevronDown size={18} className="text-primary" /> : <ChevronRight size={18} className="text-muted-foreground" />}
                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                      <Input 
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="h-8 py-1 max-w-[200px]"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => handleUpdateCategory(cat.id)}>
                        <Check size={16} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setEditingCatId(null)}>
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <span className="font-bold text-lg">{cat.nom}</span>
                  )}
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {cat.type?.length || 0} TYPES
                  </span>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                    setEditingCatId(cat.id);
                    setEditingCatName(cat.nom);
                  }}>
                    <Edit2 size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500" onClick={() => handleDeleteCategory(cat.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {expandedCats.has(cat.id) && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border bg-muted/30 dark:bg-black/5"
                  >
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cat.type?.map((t: any) => (
                          <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/50 group/type">
                            <span className="text-sm">{t.nom}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/type:opacity-100" onClick={() => handleDeleteType(t.id)}>
                              <Trash2 size={12} className="text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <form onSubmit={(e) => handleAddType(e, cat.nom)} className="flex gap-2 pt-2">
                        <Input 
                          placeholder="Nouveau type (ex: Smartphone, Laptop...)" 
                          value={newTypeCatName === cat.nom ? newTypeName : ''}
                          onFocus={() => setNewTypeCatName(cat.nom)}
                          onChange={(e) => {
                            setNewTypeCatName(cat.nom);
                            setNewTypeName(e.target.value);
                          }}
                          className="h-9 text-sm"
                        />
                        <Button type="submit" size="sm" variant="outline" className="h-9">
                          <Plus size={14} />
                        </Button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          
          {categories.length === 0 && (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl text-muted-foreground italic">
              Aucune catégorie définie
            </div>
          )}
        </div>

        <AlertDialog open={confirmModal.open} onOpenChange={(open) => setConfirmModal({ ...confirmModal, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cet élément ?</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmModal.type === 'category' 
                    ? "Supprimer cette catégorie supprimera également tous les types associés. Cette action est irréversible."
                    : "Ce type sera définitivement retiré de cette catégorie."}
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
