const User = require("../models/User");
const Student = require("../models/Student");

// Danh sách quyền hợp lệ theo role
const PERMISSIONS = {
    admin: [
        "manage_users", "manage_students", "manage_buildings", "manage_rooms",
        "manage_settings", "view_revenue", "approve_reports", "assign_permissions",
        "send_notifications", "view_room_list", "view_unpaid_students",
    ],
    manager: [
        "manage_requests", "send_reports", "send_notifications",
        "view_room_list", "view_unpaid_students",
    ],
    student: [
        "submit_requests", "register_room", "make_payment",
        "view_own_history", "view_room_list",
    ],
};

// ── Lấy danh sách tất cả users ──────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
    try {
        const { role, search } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        const users = await User.find(filter)
            .select("-password -resetPasswordToken -resetPasswordExpires")
            .sort({ createdAt: -1 });
        res.json({ success: true, count: users.length, users });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ── Tạo tài khoản mới ────────────────────────────────────────────────────────
exports.createUser = async (req, res) => {
    try {
        const { username, password, email, phone, role } = req.body;

        if (!username || !password || !email || !role)
            return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin bắt buộc" });

        if (!["admin", "manager", "student"].includes(role))
            return res.status(400).json({ success: false, message: "Role không hợp lệ" });

        if (password.length < 6)
            return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 6 ký tự" });

        const existing = await User.findOne({ $or: [{ username }, { email: email.toLowerCase() }] });
        if (existing)
            return res.status(409).json({ success: false, message: "Username hoặc email đã tồn tại" });

        // Gán quyền mặc định theo role
        const defaultPermissions = PERMISSIONS[role] || [];

        const user = await User.create({
            username: username.trim(),
            password, // pre-save hook tự hash
            email: email.trim().toLowerCase(),
            phone: phone?.trim(),
            role,
            permissions: defaultPermissions,
            createdBy: req.user._id,
        });

        // Nếu role = student → tự động tạo hồ sơ sinh viên cơ bản
        if (role === "student") {
            const { fullName, studentCode, gender, dateOfBirth, identityNumber, faculty, major, classCode, academicYear } = req.body;
            await Student.create({
                userId: user._id,
                studentCode: (studentCode || username).trim(),
                fullName: (fullName || username).trim(),
                gender: gender || "male",
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date("2000-01-01"),
                identityNumber: identityNumber || user._id.toString().slice(-9),
                faculty: faculty || "Chưa cập nhật",
                major: major || "Chưa cập nhật",
                classCode: classCode || "Chưa cập nhật",
                academicYear: academicYear || new Date().getFullYear().toString(),
            });
        }

        const userResponse = user.toObject();
        delete userResponse.password;
        res.status(201).json({ success: true, message: "Tạo tài khoản thành công", user: userResponse });
    } catch (err) {
        if (err.code === 11000)
            return res.status(409).json({ success: false, message: "Username hoặc email đã tồn tại" });
        res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
    }
};

// ── Cập nhật thông tin + quyền user ─────────────────────────────────────────
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { phone, isActive, permissions, role } = req.body;

        const user = await User.findById(id);
        if (!user)
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

        // Không cho tự sửa chính mình bằng API này
        if (user._id.toString() === req.user._id.toString())
            return res.status(400).json({ success: false, message: "Không thể tự chỉnh sửa tài khoản của mình qua API này" });

        if (phone !== undefined) user.phone = phone;
        if (isActive !== undefined) user.isActive = isActive;
        if (role !== undefined && ["admin", "manager", "student"].includes(role)) user.role = role;

        // Cập nhật permissions — chỉ cho phép quyền hợp lệ
        if (permissions !== undefined) {
            const validPerms = PERMISSIONS[user.role] || [];
            user.permissions = permissions.filter((p) => validPerms.includes(p));
        }

        await user.save();
        const updated = await User.findById(id).select("-password -resetPasswordToken -resetPasswordExpires");
        res.json({ success: true, message: "Cập nhật thành công", user: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ── Xóa user ─────────────────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === req.user._id.toString())
            return res.status(400).json({ success: false, message: "Không thể xóa tài khoản của chính mình" });

        const user = await User.findByIdAndDelete(id);
        if (!user)
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });

        res.json({ success: true, message: "Đã xóa tài khoản thành công" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ── Lấy danh sách permissions theo role ─────────────────────────────────────
exports.getPermissionsByRole = async (req, res) => {
    res.json({ success: true, permissions: PERMISSIONS });
};
