const express = require("express");
const router = express.Router();
const favorisController = require("../controllers/favoris.controller");
const verifyToken = require("../middleware/auth.middleware");

router.use(verifyToken);

router.get("/",              favorisController.getFavoris);
router.post("/",             favorisController.addFavori);
router.delete("/",            favorisController.clearFavoris);
router.delete("/:id_produit", favorisController.removeFavori);

module.exports = router;