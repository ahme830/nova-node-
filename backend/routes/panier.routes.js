const express = require("express");
const router = express.Router();
const panierController = require("../controllers/panier.controller");
const verifyToken = require("../middleware/auth.middleware");

router.use(verifyToken); // all cart routes are protected

router.get("/", panierController.getPanier);
router.post("/", panierController.addToPanier);
router.put("/:produit_id", panierController.updateQuantite);
router.delete("/:produit_id", panierController.removeFromPanier);

module.exports = router;