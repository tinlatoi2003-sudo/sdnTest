const express = require("express");
const router = express.Router();
const { getPrices, updatePrices, getRegistrationOpen, setRegistrationOpen } = require("../controllers/settingController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

// Mọi role đều có thể đọc trạng thái đăng ký phòng
router.get("/registration-open", getRegistrationOpen);

// Chỉ admin mới được cấu hình
router.use(authorize("admin"));
router.get("/prices", getPrices);
router.put("/prices", updatePrices);
router.put("/registration-open", setRegistrationOpen);

module.exports = router;
