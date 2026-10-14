const router = require("express").Router();
const c = require("../controllers/productController");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", c.list);
router.get("/categories", c.categories);
router.get("/:id", c.getOne);

router.post("/", protect, adminOnly, c.create);
router.put("/:id", protect, adminOnly, c.update);
router.patch("/:id/stock", protect, adminOnly, c.updateStock);
router.delete("/:id", protect, adminOnly, c.remove);

module.exports = router;
