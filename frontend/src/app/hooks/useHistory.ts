import { useState, useEffect } from 'react';

const HISTORY_KEY = 'nova_node_user_history';

interface UserHistory {
  viewedProducts: string[];
  recentSearches: string[];
  viewedCategories: string[];
}

const defaultHistory: UserHistory = {
  viewedProducts: [],
  recentSearches: [],
  viewedCategories: []
};

export function useHistory() {
  const [history, setHistory] = useState<UserHistory>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : defaultHistory;
    } catch (e) {
      return defaultHistory;
    }
  });

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const addViewedProduct = (productId: string) => {
    setHistory(prev => {
      const filtered = prev.viewedProducts.filter(id => id !== productId);
      return {
        ...prev,
        viewedProducts: [productId, ...filtered].slice(0, 10) // Keep last 10
      };
    });
  };

  const addRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim().toLowerCase();
    
    setHistory(prev => {
      const filtered = prev.recentSearches.filter(s => s !== query);
      return {
        ...prev,
        recentSearches: [query, ...filtered].slice(0, 5) // Keep last 5
      };
    });
  };

  const addViewedCategory = (category: string) => {
    if (!category) return;
    
    setHistory(prev => {
      const filtered = prev.viewedCategories.filter(c => c !== category);
      return {
        ...prev,
        viewedCategories: [category, ...filtered].slice(0, 5) // Keep last 5
      };
    });
  };

  const clearHistory = () => {
    setHistory(defaultHistory);
  };

  return {
    history,
    addViewedProduct,
    addRecentSearch,
    addViewedCategory,
    clearHistory
  };
}
