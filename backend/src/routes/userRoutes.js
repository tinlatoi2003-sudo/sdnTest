const express = require("express");
const router = express.Router();
const {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getPermissionsByRole,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Tất cả routes đều yêu cầu đăng nhập + role admin
router.use(protect);
router.use(authorize("admin"));

router.get("/", getAllUsers);
router.get("/permissions", getPermissionsByRole);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
