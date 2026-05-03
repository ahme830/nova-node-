const express = require("express");
const router = express.Router();
const adresseController = require("../controllers/adresse.controller");
const verifyToken = require("../middleware/auth.middleware");

router.use(verifyToken);

router.get("/",    adresseController.getAdresses);
router.post("/",   adresseController.addAdresse);
router.delete("/:id", adresseController.deleteAdresse);

module.exports = router;