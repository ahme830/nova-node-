const express = require("express");
const router = express.Router();
const verifyAdmin = require("../middleware/admin.middleware"); 
const catalogCtrl = require("../controllers/catalog.controller");

router.get("/categories", catalogCtrl.getCategories);

router.post("/categories", verifyAdmin, catalogCtrl.createCategorie);
router.put("/categories/:id", verifyAdmin, catalogCtrl.updateCategorie);
router.delete("/categories/:id", verifyAdmin, catalogCtrl.deleteCategorie);

router.get("/types", catalogCtrl.getTypes);

router.post("/types", verifyAdmin, catalogCtrl.createType);
router.put("/types/:id", verifyAdmin, catalogCtrl.updateType);
router.delete("/types/:id", verifyAdmin, catalogCtrl.deleteType);


module.exports = router;