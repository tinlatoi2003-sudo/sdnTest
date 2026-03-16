const Building = require("../models/Building");
const Room = require("../models/Room");

// ─── BUILDINGS ────────────────────────────────────────────────────────────────

// GET /api/buildings
exports.getBuildings = async (req, res) => {
    try {
        const buildings = await Building.find()
            .populate("managerId", "username email")
            .sort({ name: 1 });
        res.json({ success: true, data: buildings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/buildings
exports.createBuilding = async (req, res) => {
    try {
        const { name, address, totalFloors, description, managerId, status } = req.body;
        if (!name || !totalFloors)
            return res.status(400).json({ success: false, message: "name và totalFloors là bắt buộc" });
        const building = await Building.create({ name, address, totalFloors, description, managerId: managerId || null, status: status || "active" });
        res.status(201).json({ success: true, message: "Tạo tòa nhà thành công", data: building });
    } catch (err) {
        if (err.code === 11000)
            return res.status(409).json({ success: false, message: "Tên tòa nhà đã tồn tại" });
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/buildings/:id
exports.updateBuilding = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, totalFloors, description, managerId, status } = req.body;
        const building = await Building.findByIdAndUpdate(
            id,
            { name, address, totalFloors, description, managerId: managerId || null, status },
            { new: true, runValidators: true }
        );
        if (!building) return res.status(404).json({ success: false, message: "Không tìm thấy tòa nhà" });
        res.json({ success: true, message: "Cập nhật thành công", data: building });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/buildings/:id
exports.deleteBuilding = async (req, res) => {
    try {
        const { id } = req.params;
        const roomCount = await Room.countDocuments({ buildingId: id });
        if (roomCount > 0)
            return res.status(400).json({ success: false, message: `Không thể xóa: tòa nhà còn ${roomCount} phòng` });
        await Building.findByIdAndDelete(id);
        res.json({ success: true, message: "Đã xóa tòa nhà" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── ROOMS ────────────────────────────────────────────────────────────────────

// GET /api/buildings/:id/rooms
exports.getRoomsByBuilding = async (req, res) => {
    try {
        const rooms = await Room.find({ buildingId: req.params.id }).sort({ floor: 1, roomNumber: 1 });
        res.json({ success: true, data: rooms });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/buildings/:id/rooms
exports.createRoom = async (req, res) => {
    try {
        const { roomNumber, floor, type, maxOccupancy, pricePerTerm, status, amenities, description } = req.body;
        if (!roomNumber || !floor || !pricePerTerm)
            return res.status(400).json({ success: false, message: "roomNumber, floor, pricePerTerm là bắt buộc" });

        const existing = await Room.findOne({ buildingId: req.params.id, roomNumber });
        if (existing)
            return res.status(409).json({ success: false, message: "Số phòng đã tồn tại trong tòa nhà này" });

        const room = await Room.create({
            buildingId: req.params.id,
            roomNumber,
            floor: Number(floor),
            type: type || "standard",
            maxOccupancy: Number(maxOccupancy) || 4,
            pricePerTerm: Number(pricePerTerm),
            status: status || "available",
            amenities: amenities || [],
            description,
        });
        res.status(201).json({ success: true, message: "Tạo phòng thành công", data: room });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/rooms/:id
exports.updateRoom = async (req, res) => {
    try {
        const { floor, type, maxOccupancy, pricePerTerm, status, amenities, description } = req.body;
        const room = await Room.findByIdAndUpdate(
            req.params.id,
            { floor, type, maxOccupancy, pricePerTerm, status, amenities, description },
            { new: true, runValidators: true }
        );
        if (!room) return res.status(404).json({ success: false, message: "Không tìm thấy phòng" });
        res.json({ success: true, message: "Cập nhật phòng thành công", data: room });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/rooms/:id
exports.deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ success: false, message: "Không tìm thấy phòng" });
        if (room.currentOccupancy > 0)
            return res.status(400).json({ success: false, message: "Không thể xóa phòng đang có người ở" });
        await Room.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Đã xóa phòng" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
