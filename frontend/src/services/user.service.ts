import { api } from './api';

export interface UpdateProfileData {
    nom_utilisateur?: string;
    email?: string;
    photo_url?: string;
}

export const userService = {
    getProfile: (userId: string) => api.get(`/utilisateurs/${userId}`),
    updateProfile: (userId: string, data: UpdateProfileData) =>
        api.patch<any>(`/utilisateurs/${userId}`, data),
    uploadAvatar: (userId: string, file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        return api.patch<{ photo_url: string }>(`/utilisateurs/${userId}`, formData);
    }
};
