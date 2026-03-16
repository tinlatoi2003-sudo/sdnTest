const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Xác thực JWT — gắn req.user cho các route bảo vệ
exports.protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer "))
            return res.status(401).json({ success: false, message: "Không có quyền truy cập. Token bị thiếu." });

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");
        if (!user || !user.isActive)
            return res.status(401).json({ success: false, message: "Token không hợp lệ" });

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
    }
};

// Phân quyền theo role — dùng sau protect
// Ví dụ: authorize("admin"), authorize("admin", "manager")
exports.authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role))
        return res.status(403).json({
            success: false,
            message: `Bạn không có quyền thực hiện thao tác này (yêu cầu: ${roles.join(", ")})`,
        });
    next();
};

// Phân quyền theo permission cụ thể
// Ví dụ: hasPermission("manage_users")
exports.hasPermission = (permission) => (req, res, next) => {
    if (!req.user.permissions.includes(permission))
        return res.status(403).json({
            success: false,
            message: `Bạn không có quyền: ${permission}`,
        });
    next();
};
