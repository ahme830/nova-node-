import { api } from './api';

export interface LoginResponse {
    message: string;
    userId: string;
    email: string;
    role: 'client' | 'vendeur' | 'admin';
    nomUtilisateur: string;
    photoUrl?: string;
    session: { access_token: string; refresh_token: string };
}

export interface RegisterResponse {
    message: string;
    userId: string;
    email: string;
    role: string;
}

export const authService = {
    login: (email: string, password: string) =>
        api.post<LoginResponse>('/auth/login', { email, password }),

    register: (username: string, email: string, password: string, role: string = 'client', storeName?: string, storeDescription?: string) =>
        api.post<RegisterResponse>('/auth/register', { username, email, password, role, storeName, storeDescription }),

    logout: () => api.post<{ message: string }>('/auth/logout', {}),
};
