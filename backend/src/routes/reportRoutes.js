const express = require("express");
const router = express.Router();
const {
    getReports,
    getReportById,
    createReport,
    reviewReport,
    deleteReport,
    getMyBuildings,
} = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

// Manager & Admin có thể xem và tạo báo cáo
router.get("/", authorize("manager", "admin"), getReports);
router.get("/my-buildings", authorize("manager"), getMyBuildings);
router.get("/:id", authorize("manager", "admin"), getReportById);
router.post("/", authorize("manager"), createReport);
router.delete("/:id", authorize("manager"), deleteReport);

// Chỉ Admin mới duyệt được
router.put("/:id/review", authorize("admin"), reviewReport);

module.exports = router;
