const express = require("express");
const router = express.Router();
const { getFinanceSummary } = require("../controllers/financeController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.use(authorize("admin"));

router.get("/summary", getFinanceSummary);

module.exports = router;
