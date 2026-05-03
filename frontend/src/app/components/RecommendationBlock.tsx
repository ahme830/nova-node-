import { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { useHistory } from '../hooks/useHistory';
import { Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useCart } from '../contexts/CartContext';

export function RecommendationBlock({ title = "Sélectionnés pour vous" }: { title?: string }) {
  const { history } = useHistory();
  const { addItem } = useCart();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/produit/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(history)
        });
        const data = await res.json();
        if (data.recommandations) setRecommendations(data.recommandations);
      } catch (err) {
        console.error('Error fetching recommendations', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Slight delay to not block main thread on mount
    const timer = setTimeout(fetchRecommendations, 500);
    return () => clearTimeout(timer);
  }, []); // Only run once on mount so it doesn't constantly refresh

  const handleAddToCart = async (product: any) => {
    try {
      await addItem(product, 1);
    } catch (err) {}
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 w-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="my-10 sm:my-16 w-full">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="p-2 sm:p-3 bg-primary/10 rounded-xl border border-primary/20">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {recommendations.map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="h-full"
          >
            <ProductCard product={product} onAddToCart={() => handleAddToCart(product)} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
