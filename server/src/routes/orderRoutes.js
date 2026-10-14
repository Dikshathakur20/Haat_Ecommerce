const router = require("express").Router();
const { create, mine } = require("../controllers/orderController");
const { protect } = require("../middleware/auth");

router.post("/", protect, create);
router.get("/", protect, mine);

module.exports = router;
