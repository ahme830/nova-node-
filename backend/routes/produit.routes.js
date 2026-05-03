const express = require("express");
const router = express.Router();
const produitController = require("../controllers/produit.controller");
const verifyToken = require("../middleware/auth.middleware");
const { upload } = require("../middleware/upload"); // Ajouté depuis feature-seller

// ==========================================
// Public Routes (Visitors, Clients, Sellers, Admins)
// ==========================================
router.get("/", produitController.searchProduits);
router.post("/recommendations", produitController.getRecommendations);
router.get("/magasin/:id", produitController.getByMagasin);
router.get("/:id", produitController.getProduitById);

// ==========================================
// Protected Routes (Sellers Only)
// ==========================================
// Route to create a product (Handles the image upload and the database save)
router.post("/", verifyToken, upload.single("image"), produitController.createProduit);

// Route to update an existing product
router.put("/:id", verifyToken, upload.single("image"), produitController.updateProduit);

// Route to delete a product
router.delete("/:id", verifyToken, produitController.deleteProduit);

module.exports = router;