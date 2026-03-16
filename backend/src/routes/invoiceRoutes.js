const express = require("express");
const router = express.Router();
const { getAllInvoices, createInvoice, getDebtors, searchStudents } = require("../controllers/invoiceController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

// Manager và Admin đều có thể tạo hóa đơn
router.post("/", authorize("admin", "manager"), createInvoice);

// Chỉ Admin mới xem toàn bộ và quản lý
router.use(authorize("admin"));
router.get("/search-students", searchStudents);   // tìm sinh viên để gửi bill
router.get("/debtors", getDebtors);               // danh sách sinh viên còn nợ
router.get("/", getAllInvoices);                   // tất cả hóa đơn

module.exports = router;
