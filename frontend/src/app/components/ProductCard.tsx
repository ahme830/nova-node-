import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Product } from '../../services/produit.service';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFavoris } from '../contexts/FavorisContext';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { isFavorite, toggleFavorite } = useFavoris();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const favorite = isFavorite(product.id);

  // Mapping backend fields to component fields
  const name = (product as any).nom_produit || (product as any).name || t('product.unnamed');
  const price = (product as any).prix || (product as any).price || 0;
  const image = (product as any).image_url || (product as any).image || '';
  const stock = (product as any).qte_dispo ?? (product as any).stock ?? 0;
  const vendor = (product as any).magasin?.nom_magasin || (product as any).vendor || t('product.unknown');
  const category = (product as any).type?.categorie?.nom || (product as any).category || t('product.general');
  const rating = (product as any).note_moyenne || (product as any).rating || 0;
  const reviews = (product as any).nb_avis ?? (product as any).reviews ?? 0;
  const originalPrice = (product as any).originalPrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product);
  };

  const handleClick = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group bg-card dark:bg-card rounded-xl border border-border shadow-soft hover:shadow-md hover:-translate-y-1 hover:border-primary/30 transition-all duration-300 cursor-pointer relative overflow-hidden"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {originalPrice && (
          <Badge variant="destructive" className="absolute top-3 left-3 shadow-sm">
            -{Math.round(((originalPrice - price) / originalPrice) * 100)}%
          </Badge>
        )}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-3 right-3 w-9 h-9 bg-background/80 backdrop-blur-md border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-background hover:scale-110 transition-all"
        >
          <Heart className={`w-4 h-4 transition-colors ${favorite ? 'fill-destructive text-destructive' : 'text-muted-foreground hover:text-foreground'}`} />
        </button>
        {stock < 10 && stock > 0 && (
          <Badge variant="neon" className="absolute bottom-3 left-3 border-orange-500/50 text-orange-600 dark:text-orange-400 bg-orange-500/10">
            {t('product.onlyLeft', { count: stock })}
          </Badge>
        )}
      </div>

      <div className="p-5 space-y-4 text-left">
        <div>
          <p className="text-[10px] text-primary/80 font-bold mb-1 tracking-widest uppercase">{category}</p>
          <h3 className="font-bold text-text-primary line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-tight">{name}</h3>
          <p className="text-sm text-text-secondary">{vendor}</p>
        </div>

        <div className="flex items-center gap-1.5 bg-muted w-fit px-2 py-1 rounded-md border border-border">
          <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
          <span className="text-sm font-medium text-foreground">{rating}</span>
          <span className="text-xs text-muted-foreground">({reviews})</span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-text-primary">
              {price.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}
            </span>
            {originalPrice && (
              <span className="text-sm text-text-secondary line-through decoration-text-secondary/50">
                {originalPrice.toLocaleString(i18n.language, { style: 'currency', currency: 'DZD' })}
              </span>
            )}
          </div>
        </div>

        <Button
          variant="glow"
          onClick={handleAddToCart}
          className="w-full opacity-90 group-hover:opacity-100 transition-opacity"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {t('product.addToCart')}
        </Button>
      </div>
    </div>
  );
}
