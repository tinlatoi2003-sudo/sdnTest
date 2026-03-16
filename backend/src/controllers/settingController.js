const Setting = require("../models/Setting");

// Các key giá cấu hình
const PRICE_KEYS = [
    { key: "damage_compensation_rate", description: "Giá bồi thường thiệt hại (đồng/vụ)", defaultValue: 500000 },
    { key: "violation_fine_rate", description: "Phí vi phạm quy chế (đồng/lần)", defaultValue: 200000 },
    { key: "electricity_excess_rate", description: "Giá điện vượt trội (đồng/kWh)", defaultValue: 3500 },
    { key: "free_electricity_units", description: "Số điện miễn phí mỗi tháng (kWh/phòng)", defaultValue: 50 },
];

// ─────────────────────────────────────────
// [ADMIN] Lấy cài đặt giá
// GET /api/settings/prices
// ─────────────────────────────────────────
exports.getPrices = async (req, res) => {
    try {
        const keys = PRICE_KEYS.map(k => k.key);
        const settings = await Setting.find({ key: { $in: keys } }).lean();

        // Merge với default nếu chưa có trong DB
        const result = {};
        for (const item of PRICE_KEYS) {
            const found = settings.find(s => s.key === item.key);
            result[item.key] = {
                value: found ? found.value : item.defaultValue,
                description: item.description,
                updatedAt: found?.updatedAt || null,
            };
        }

        return res.json({ success: true, data: result });
    } catch (err) {
        console.error("getPrices error:", err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ─────────────────────────────────────────
// [ADMIN] Cập nhật cài đặt giá
// PUT /api/settings/prices
// Body: { damage_compensation_rate, violation_fine_rate, electricity_excess_rate }
// ─────────────────────────────────────────
exports.updatePrices = async (req, res) => {
    try {
        const updates = [];

        for (const item of PRICE_KEYS) {
            if (req.body[item.key] !== undefined) {
                const val = Number(req.body[item.key]);
                if (isNaN(val) || val < 0) continue;

                updates.push(
                    Setting.findOneAndUpdate(
                        { key: item.key },
                        { key: item.key, value: val, description: item.description, updatedBy: req.user._id },
                        { upsert: true, new: true }
                    )
                );
            }
        }

        await Promise.all(updates);
        return res.json({ success: true, message: "Đã cập nhật cài đặt giá thành công" });
    } catch (err) {
        console.error("updatePrices error:", err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ─────────────────────────────────────────
// [ADMIN] Lấy trạng thái cho phép đăng ký phòng
// GET /api/settings/registration-open
// ─────────────────────────────────────────
exports.getRegistrationOpen = async (req, res) => {
    try {
        const doc = await Setting.findOne({ key: "room_registration_open" }).lean();
        const isOpen = doc ? Boolean(doc.value) : true; // mặc định: mở
        return res.json({ success: true, data: { isOpen } });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};

// ─────────────────────────────────────────
// [ADMIN] Bật/Tắt cho phép đăng ký phòng
// PUT /api/settings/registration-open  { isOpen: true|false }
// ─────────────────────────────────────────
exports.setRegistrationOpen = async (req, res) => {
    try {
        const { isOpen } = req.body;
        if (typeof isOpen !== "boolean")
            return res.status(400).json({ success: false, message: "isOpen phải là boolean" });
        await Setting.findOneAndUpdate(
            { key: "room_registration_open" },
            { key: "room_registration_open", value: isOpen, description: "Cho phép sinh viên đăng ký phòng", updatedBy: req.user._id },
            { upsert: true, new: true }
        );
        return res.json({ success: true, message: isOpen ? "Đã mở đăng ký phòng" : "Đã đóng đăng ký phòng" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
};
