const express = require("express");
const router = express.Router();
const signalementController = require("../controllers/signalement.controller");
const verifyToken = require("../middleware/auth.middleware");

router.use(verifyToken);

router.post("/", signalementController.signalerProduit);
router.post("/produit", signalementController.signalerProduit);

// Vendor reporting requires a schema migration first (see signalement.controller.js note)
// router.post("/vendeur", signalementController.signalerVendeur);

module.exports = router;