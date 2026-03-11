const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendResetPasswordEmail } = require("../config/mailer");


// ─── Đăng nhập ────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password)
            return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin" });

        // Tìm theo username hoặc email
        const user = await User.findOne({
            $or: [{ username: username.trim() }, { email: username.trim().toLowerCase() }],
        });

        if (!user)
            return res.status(401).json({ success: false, message: "Tài khoản không tồn tại" });

        if (!user.isActive)
            return res.status(403).json({ success: false, message: "Tài khoản đã bị vô hiệu hóa" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(401).json({ success: false, message: "Mật khẩu không chính xác" });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            message: "Đăng nhập thành công",
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role,
                permissions: user.permissions,
            },
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ─── Lấy thông tin user hiện tại ─────────────────────────────────────────────
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select(
            "-password -resetPasswordToken -resetPasswordExpires"
        );
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ─── Quên mật khẩu ───────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ success: false, message: "Vui lòng nhập email" });

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user)
            return res.status(404).json({ success: false, message: "Email không tồn tại trong hệ thống" });

        // Tạo mã 6 chữ số
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashed = crypto.createHash("sha256").update(resetCode).digest("hex");

        user.resetPasswordToken = hashed;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phút
        await user.save();

        // Gửi email chứa mã reset
        await sendResetPasswordEmail(email, resetCode);

        res.json({
            success: true,
            message: `Mã xác nhận đã được gửi về email ${email}. Vui lòng kiểm tra hộp thư (kể cả thư mục Spam).`,
        });
    } catch (err) {
        console.error("ForgotPassword error:", err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ─── Đặt lại mật khẩu ────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword, confirmPassword } = req.body;

        if (!email || !code || !newPassword || !confirmPassword)
            return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin" });

        if (newPassword !== confirmPassword)
            return res.status(400).json({ success: false, message: "Mật khẩu xác nhận không khớp" });

        if (newPassword.length < 6)
            return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 6 ký tự" });

        const hashed = crypto.createHash("sha256").update(code).digest("hex");

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
            resetPasswordToken: hashed,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user)
            return res.status(400).json({ success: false, message: "Mã xác nhận không hợp lệ hoặc đã hết hạn (15 phút)" });

        // Cập nhật password  — pre('save') hook sẽ tự hash
        user.password = newPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ success: true, message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại." });
    } catch (err) {
        console.error("ResetPassword error:", err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ─── Đăng xuất ───────────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
    // JWT là stateless — token được xóa ở phía client (localStorage).
    // Endpoint này để log activity và sẵn sàng cho token blacklist sau này.
    console.log(`👋 User ${req.user?.username || req.user?.id} logged out`);
    res.json({ success: true, message: "Đăng xuất thành công" });
};

