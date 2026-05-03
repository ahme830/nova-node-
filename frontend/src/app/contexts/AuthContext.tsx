import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../../services/auth.service';

export type UserRole = 'visitor' | 'customer' | 'vendor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: UserRole, storeName?: string, storeDescription?: string) => Promise<void>;
  logout: () => void;
  updateRole: (role: UserRole) => void;
  updateUser: (data: Partial<User>) => void;
}

const roleMap: Record<string, UserRole> = {
  client: 'customer',
  vendeur: 'vendor',
  admin: 'admin',
};

const TOKEN_KEY = 'auth-token';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restauration de la session au chargement
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        // Réparation automatique du nom si c'est un nom générique (ex: sessions existantes)
        const emailPrefix = (parsedUser.email?.split('@')[0] || '').split(/[._-]/)[0];
        const cleanPrefix = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        const currentName = (parsedUser.name || '').trim();
        const genericNames = ['anonyme', 'utilisateur', 'anonymous', 'user', 'guest'];

        if (!currentName || genericNames.includes(currentName.toLowerCase())) {
          parsedUser.name = cleanPrefix || 'Utilisateur';
          localStorage.setItem('auth_user', JSON.stringify(parsedUser));
          console.info(`[Auth] Repaired Name: ${parsedUser.name}`);
        }

        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);

    // Persist token for API calls
    localStorage.setItem(TOKEN_KEY, data.session.access_token);

    const mappedRole: UserRole = roleMap[data.role] || 'customer';

    // Logique pour déterminer le nom à afficher (premier mot du préfixe de l'email)
    const emailPrefix = (data.email?.split('@')[0] || '').split(/[._-]/)[0];
    const cleanPrefix = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

    // Si le nom est absent ou générique, on utilise le préfixe de l'email
    const rawName = (data.nomUtilisateur || '').trim();
    const genericNames = ['anonyme', 'utilisateur', 'anonymous', 'user', 'guest'];
    const isGeneric = !rawName || genericNames.includes(rawName.toLowerCase());

    const displayName = isGeneric ? (cleanPrefix || 'Utilisateur') : rawName;
    console.info(`[Auth] User Name: ${displayName} (Original: ${rawName})`);

    const loggedUser: User = {
      id: data.userId,
      name: displayName,
      email: data.email,
      role: mappedRole,
      avatar: data.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
    };

    setUser(loggedUser);
    localStorage.setItem('auth_user', JSON.stringify(loggedUser));
  };

  const register = async (name: string, email: string, password: string, role: UserRole = 'customer', storeName?: string, storeDescription?: string) => {
    // Map frontend role to backend role
    const backendRole = role === 'vendor' ? 'vendeur' : role === 'admin' ? 'admin' : 'client';

    // 1. Inscription
    await authService.register(name, email, password, backendRole, storeName, storeDescription);

    // 2. Tentative d'auto-connexion
    try {
      await login(email, password);
    } catch (loginError) {
      console.warn("Auto-login failed after registration:", loginError);
      // On ne jette pas l'erreur d'inscription si seule la connexion échoue (ex: confirmation email requise)
      throw new Error("Inscription réussie ! Veuillez vous connecter manuellement (vérifiez vos emails si nécessaire).");
    }
  };

  const logout = () => {
    authService.logout().catch(() => { });
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('nexus_local_cart');
    setUser(null);
  };

  const updateRole = (role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateRole, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
