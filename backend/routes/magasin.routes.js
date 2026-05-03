const express = require("express");
const router = express.Router();
const magasinController = require("../controllers/magasin.controller");
const verifyToken = require("../middleware/auth.middleware");
const { upload } = require("../middleware/upload");

// ==========================================
// Public & Admin Routes
// ==========================================
// Récupérer tous les magasins
router.get("/", magasinController.getAllMagasins); 

// Récupérer un magasin spécifique (Anciennes et nouvelles routes)
router.get("/vendeur/:id", magasinController.getMagasinByVendeur);
router.get("/:id", magasinController.getMagasinByVendeur); 

// Mise à jour du statut par un administrateur (Sécurisé)
router.patch("/:id/statut", verifyToken, magasinController.updateMagasinStatut); 

// ==========================================
// Protected Seller Routes
// ==========================================
// Créer un magasin (Gère l'upload de la "photo")
router.post("/", verifyToken, upload.single("photo"), magasinController.createMagasin); 

// Mettre à jour son propre magasin/logo (Nouvelle route de feature-seller)
router.put("/mon-magasin", verifyToken, upload.single("photo"), magasinController.updateMagasin);

// Mettre à jour un magasin via son ID (Ancienne route de master, conservée par sécurité)
router.patch("/:id", verifyToken, upload.single("photo"), magasinController.updateMagasin);

module.exports = router;