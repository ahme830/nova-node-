import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../../services/user.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { User, Mail, Shield, LogOut, Loader2, CheckCircle2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function Profile() {
    const { user, logout, updateUser } = useAuth();
    const { t } = useTranslation();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
    });
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsUpdating(true);
        try {
            await userService.updateProfile(user.id, {
                nom_utilisateur: formData.name,
                email: formData.email,
            });

            // Update local storage and context
            updateUser({
                name: formData.name,
                email: formData.email,
            });

            toast.success(t('profile.updateSuccess'));
        } catch (error: any) {
            toast.error(t('profile.updateError') + ': ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const result = await userService.uploadAvatar(user.id, file);
            console.log("Upload result:", result);
            if (result && (result.photo_url || (result as any).photoUrl)) {
                const newAvatar = result.photo_url || (result as any).photoUrl;
                updateUser({ avatar: newAvatar });
                toast.success("Photo de profil mise à jour !");
            }
        } catch (error: any) {
            toast.error("Erreur lors de l'upload : " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 pb-20">
            {/* Profile Hero Header */}
            <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 via-primary/5 to-background border-b border-border">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--primary),0.1),transparent_50%)]"></div>
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 md:left-24 md:translate-x-0">
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-background rounded-full p-1.5 shadow-2xl border border-border group relative">
                        <div className="w-full h-full bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                            {isUploading ? (
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            ) : (
                                <img
                                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-1 right-1 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-background hover:scale-110 transition-all z-20"
                            disabled={isUploading}
                        >
                            <Camera size={18} />
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept="image/*" 
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-16 sm:mt-20 md:mt-10">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar / Info */}
                    <div className="w-full lg:w-1/3">
                        <Card className="border-border/50 bg-card dark:bg-card/40 backdrop-blur-xl shadow-xl lg:sticky top-24">
                            <CardHeader className="text-center pt-8 md:pt-12">
                                <CardTitle className="text-3xl font-extrabold tracking-tight">{user.name}</CardTitle>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mt-2 mx-auto">
                                    {user.role}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 py-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm font-medium text-foreground">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <span>{t('profile.accountStatus')} : <span className="text-green-500 font-bold uppercase tracking-widest">Actif</span></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-foreground">
                                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        <span>{t('profile.memberSince')} : {t('profile.memberDate')}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-foreground">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-6 border-t border-border">
                                <Button
                                    variant="outline"
                                    className="w-full border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
                                    onClick={logout}
                                >
                                    <LogOut className="mr-2 w-4 h-4" />
                                    {t('profile.logout')}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Main Content / Form */}
                    <div className="flex-1 space-y-8">
                        <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-lg overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent"></div>
                            <CardHeader className="pb-8">
                                <CardTitle className="text-2xl font-bold">{t('profile.editProfile')}</CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    {t('profile.manageInfo')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        <div className="space-y-2.5">
                                            <Label htmlFor="name" className="text-sm font-semibold ml-1">{t('profile.fullName')}</Label>
                                            <div className="relative group">
                                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    id="name"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="pl-11 h-12 bg-muted/30 border-border/50 focus-visible:bg-background focus-visible:ring-primary/40 rounded-xl transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label htmlFor="email" className="text-sm font-semibold ml-1">{t('profile.emailAddress')}</Label>
                                            <div className="relative group">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="pl-11 h-12 bg-muted/30 border-border/50 focus-visible:bg-background focus-visible:ring-primary/40 rounded-xl transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-border">
                                        <Button type="submit" className="h-12 px-12 text-base font-bold shadow-glow hover:shadow-glow-lg transition-all rounded-xl" disabled={isUpdating}>
                                            {isUpdating ? (
                                                <>
                                                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                                                    {t('profile.updating')}
                                                </>
                                            ) : (
                                                t('profile.saveChanges')
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Account Settings / Privacy Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-border/50 hover:border-primary/30 transition-colors shadow-md group">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-white transition-all">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <CardTitle className="text-lg">{t('profile.security')}</CardTitle>
                                    <CardDescription>{t('profile.securityDesc')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="ghost" className="p-0 h-auto font-semibold text-primary hover:bg-transparent">
                                        {t('profile.manageSecurity')} →
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-border/50 hover:border-primary/30 transition-colors shadow-md group">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-white transition-all">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <CardTitle className="text-lg">{t('profile.notifications')}</CardTitle>
                                    <CardDescription>{t('profile.notificationsDesc')}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="ghost" className="p-0 h-auto font-semibold text-primary hover:bg-transparent">
                                        {t('profile.configureAlerts')} →
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
