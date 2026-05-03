# Analyse et Liste des Étapes Restantes pour le Frontend (Marketplace Complète)

Ce document dresse la liste exhaustive de toutes les interfaces, pages et composants nécessaires pour rendre la plateforme marketplace 100% fonctionnelle et prête pour le grand public.

Il se base sur l'analyse de tes routes actuelles (`routes.tsx`) et des routes du backend (`server.js` - commandes, adresses, avis, signalements, favoris, etc.).

---

## 1. 🌐 Pages Publiques (Visiteurs)

Actuellement, il y a l'Accueil, le Catalogue, et le Détail Produit. Il manque les éléments essentiels pour rassurer et guider le client :

- [ ] **Page 404 (Not Found) :** Actuellement redirigée vers `/`. Il faut une vraie page 404 engageante avec un bouton "Retour à l'accueil" et une barre de recherche.
- [ ] **Pages Légales :**
  - [ ] Conditions Générales de Vente (CGV)
  - [ ] Conditions Générales d'Utilisation (CGU)
  - [ ] Mentions Légales
  - [ ] Politique de Confidentialité (RGPD)
- [ ] **Pages d'Information :**
  - [ ] À Propos (Qui sommes-nous ?)
  - [ ] Page Contact (Formulaire de contact avec le support)
  - [ ] FAQ (Foire Aux Questions)
- [ ] **Boutiques (Magasins) :**
  - [ ] Liste des boutiques / vendeurs.
  - [ ] Page Profil d'une boutique (Storefront) avec sa bannière, sa description et ses produits associés.

---

## 2. 🛒 Flux d'Achat (Checkout)

La page "Panier" (`Cart`) est présente, mais le processus complet d'achat est à construire :

- [ ] **Tunnel de Commande (Checkout Wizard) :**
  - [ ] **Étape 1 :** Récapitulatif du panier.
  - [ ] **Étape 2 :** Choix / Ajout de l'Adresse de Livraison et de Facturation (Utilisation des routes `/api/adresse`).
  - [ ] **Étape 3 :** Choix des méthodes de livraison.
  - [ ] **Étape 4 :** Paiement (Intégration Stripe/Paypal ou autre).
- [ ] **Pages Post-Paiement :**
  - [ ] **Page de Succès (Order Success) :** Confirmation de commande, numéro de suivi et message de remerciement.
  - [ ] **Page d'Échec (Order Cancelled/Failed) :** Explications de l'échec et option pour réessayer le paiement.

---

## 3. 🧑‍💼 Espace Client (Acheteur)

Le dashboard et profil sont ébauchés (`Profile`, `CustomerDashboard`), mais il manque les sous-vues dédiées :

- [ ] **Gestion du Profil :**
  - [ ] Modification des infos personnelles (Nom, email, tel, photo).
  - [ ] Changement de mot de passe.
  - [ ] Carnet d'adresses (Ajouter, modifier, supprimer des adresses).
- [ ] **Commandes & Achats :**
  - [ ] Liste détaillée de l'historique des commandes.
  - [ ] Page "Détail d'une commande" (Statut d'expédition, facture téléchargeable, articles achetés).
  - [ ] Interface de retour ou de réclamation (litiges).
- [ ] **Interaction & Avis :**
  - [ ] Page "Mes Favoris" (Wishlist - `/api/favoris`).
  - [ ] Interface pour "Laisser un avis" après une commande (`/api/avis`).
  - [ ] Centre de notifications (Pastille et dropdown avec les alertes - `/api/notification`).

---

## 4. 🏪 Espace Vendeur (Marchand)

Le `VendorDashboard` existe comme point d'entrée, mais l'interface marchand nécessite des outils complexes :

- [ ] **Création / Paramétrage de la Boutique :**
  - [ ] Formulaire d'onboarding (Si le compte est nouveau) pour configurer le Magasin (`/api/magasin`).
  - [ ] Configuration de la boutique (Logo, bannière, description, politiques de retour personnalisées).
- [ ] **Gestion du Catalogue :**
  - [ ] Page "Mes Produits" (Vue tableau avec filtres, statuts actif/inactif, stocks).
  - [ ] Formulaire "Ajouter un Produit" (Upload d'images via Cloudinary, prix, description, catégories, attributs).
  - [ ] Formulaire "Modifier un Produit".
- [ ] **Gestion des Ventes & Commandes :**
  - [ ] Liste des commandes à préparer / expédier.
  - [ ] Interface de mise à jour du statut d'une commande (ex: "En préparation", "Expédié" + numéro de suivi).
  - [ ] Détail d'une commande reçue (Bordereau PDF à imprimer).
- [ ] **Relation Client & Performance :**
  - [ ] Réponse aux avis laissés par les clients.
  - [ ] Tableau de bord financier (Chiffre d'affaires, statistiques de vente, demandes de retraits/payouts).

---

## 5. 👑 Espace Administrateur (Admin)

L'`AdminDashboard` doit permettre de gérer le bon fonctionnement global de la plateforme :

- [ ] **Statistiques Globales :** KPI, Volume des ventes de la plateforme, Nouveaux inscrits.
- [ ] **Gestion des Utilisateurs :**
  - [ ] Tableau des Acheteurs (Bannir, avertir, voir les stats).
  - [ ] Tableau des Vendeurs (Bannir, voir les performances).
- [ ] **Approbation & Modération :**
  - [ ] Validation des nouveaux vendeurs ou des nouveaux produits (si mode manuel activé).
  - [ ] Gestion des Signalements (`/api/signalement`) : Utilisateurs suspects, faux avis, produits interdits.
  - [ ] Résolution des Litiges (Intervention en cas de problème entre vendeur et client).
- [ ] **Gestion de la Plateforme :**
  - [ ] Interface de gestion des Catégories et Sous-catégories (Ajouter, Editer, Supprimer).
  - [ ] Gestion du "Machine Learning / Prédictions" (`/api/prediction`) pour la mise en avant de produits sur la page d'accueil.
  - [ ] Paramètres du site (Commissions appliquées).

---

## 6. 🧩 Composants Transversaux (Développement)

Pour garantir une bonne UX sur toutes ces pages :

- [ ] **Système de Toast / Alertes :** Feedback visuel suite à l'ajout au panier, erreur réseau, succès d'enregistrement, etc.
- [ ] **Modales (Modals) :** "Êtes-vous sûr de vouloir supprimer ?", Aperçu rapide d'un produit, etc.
- [ ] **Pagination & Scroll Infini :** Sur le catalogue, l'historique des commandes, etc.
- [ ] **Loaders et Skeletons :** Pour remplacer les temps de chargement vides par des interfaces agréables visuellement.
- [ ] **Système de Chat / Messagerie Interne (Optionnel mais recommandé) :** Pour permettre à un acheteur de poser une question à un vendeur avant l'achat ou suite à une commande.

## Ordre de Priorité Suggéré

1. **Pages Essentielles :** Checkout complet, Page de Succès du paiement, Adresses et Profil.
2. **Dashboard Vendeur :** Ajout & Edition de vrais produits, Gestion des expéditions de commandes.
3. **Fonctionnalités Sociales :** Avis clients, Favoris, Boutiques vendeurs publiques.
4. **Dashboard Admin :** Modération, catégories et signalements.
5. **Pages Secondaires :** 404, FAQ, Mentions légales.
