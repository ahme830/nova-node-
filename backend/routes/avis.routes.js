const express = require("express");
const router = express.Router();
const avisController = require("../controllers/avis.controller");
const verifyToken = require("../middleware/auth.middleware");

router.get("/produit/:id_produit", avisController.getAvisByProduit); // public
router.post("/", verifyToken, avisController.submitAvis);

module.exports = router;