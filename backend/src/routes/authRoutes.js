const express = require("express");
const router = express.Router();
const {
    login,
    getMe,
    forgotPassword,
    resetPassword,
    logout,
    changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Public routes (không cần đăng nhập)
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected route (cần đăng nhập)
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.put("/change-password", protect, changePassword);

module.exports = router;
