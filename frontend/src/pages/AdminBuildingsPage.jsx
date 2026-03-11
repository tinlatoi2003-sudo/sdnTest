import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import "./AdminBuildingsPage.css";

const fmtNum = (n) => Number(n || 0).toLocaleString("vi-VN");

const ROOM_STATUS = { available: "Còn chỗ", partial: "Còn chỗ", full: "Hết chỗ", maintenance: "Bảo trì" };
const TYPE_LABEL = { standard: "Tiêu chuẩn", vip: "VIP", premium: "Premium" };
const occColor = (pct) => pct < 50 ? "#16a34a" : pct < 100 ? "#f59e0b" : "#dc2626";

/* ─── BuildingCard ─────────────────────────── */
function BuildingCard({ building, onEdit, onDelete, onAddRoom, onDeleteRoom, showAlert }) {
    const [open, setOpen] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const loadRooms = useCallback(async () => {
        if (loaded) return;
        setLoading(true);
        try {
            const r = await api.get(`/buildings/${building._id}/rooms`);
            setRooms(r.data.data);
            setLoaded(true);
        } catch {
            showAlert("error", "Không thể tải phòng");
        } finally {
            setLoading(false);
        }
    }, [building._id, loaded, showAlert]);

    const handleToggle = () => {
        const next = !open;
        setOpen(next);
        if (next) loadRooms();
    };

    const refreshRooms = async () => {
        setLoaded(false);
        const r = await api.get(`/buildings/${building._id}/rooms`);
        setRooms(r.data.data);
        setLoaded(true);
    };

    const handleDeleteRoom = async (room) => {
        if (!window.confirm(`Xóa phòng ${room.roomNumber}?`)) return;
        try {
            await api.delete(`/rooms/${room._id}`);
            showAlert("success", `Đã xóa phòng ${room.roomNumber}`);
            refreshRooms();
        } catch (err) {
            showAlert("error", err.response?.data?.message || "Xóa phòng thất bại");
        }
    };

    return (
        <div className={`ab-building-card ${open ? "expanded" : ""}`}>
            {/* Header */}
            <div className="ab-building-header" onClick={handleToggle}>
                <div className="ab-building-icon">🏢</div>
                <div className="ab-building-info">
                    <div className="ab-building-name">{building.name}</div>
                    <div className="ab-building-meta">
                        📍 {building.address || "—"} &nbsp;·&nbsp;
                        🏬 {building.totalFloors} tầng &nbsp;·&nbsp;
                        👤 {building.managerId?.username || "Chưa có manager"}
                    </div>
                </div>
                <div className="ab-building-right">
                    <span className={`ab-status-badge ${building.status}`}>
                        {building.status === "active" ? "Hoạt động" : building.status === "maintenance" ? "Bảo trì" : "Tạm đóng"}
                    </span>
                    <button className="ab-btn-edit" onClick={e => { e.stopPropagation(); onEdit(building); }}>✏️ Sửa</button>
                    <button className="ab-btn-del" onClick={e => { e.stopPropagation(); onDelete(building); }}>🗑️</button>
                    <span className={`ab-chevron ${open ? "open" : ""}`}>⌄</span>
                </div>
            </div>

            {/* Rooms section */}
            {open && (
                <div className="ab-rooms-section">
                    <div className="ab-rooms-header">
                        <span className="ab-rooms-title">
                            Danh sách phòng {loaded ? `(${rooms.length})` : ""}
                        </span>
                        <button className="ab-btn-add-room" onClick={() => onAddRoom(building, refreshRooms)}>
                            ＋ Thêm phòng
                        </button>
                    </div>

                    {loading ? (
                        <div className="ab-rooms-loading">
                            <span className="ab-spinner" />Đang tải phòng...
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="ab-rooms-empty">🚪 Chưa có phòng nào — nhấn "Thêm phòng" để tạo</div>
                    ) : (
                        <div className="ab-rooms-grid">
                            {rooms.map(room => {
                                const pct = Math.round((room.currentOccupancy / room.maxOccupancy) * 100);
                                return (
                                    <div key={room._id} className="ab-room-card">
                                        <div className="ab-room-top">
                                            <span className="ab-room-num">P.{room.roomNumber}</span>
                                            <span className={`ab-room-status ${room.status}`}>
                                                {ROOM_STATUS[room.status] || room.status}
                                            </span>
                                        </div>
                                        <div className="ab-room-info">
                                            Tầng {room.floor} · {TYPE_LABEL[room.type] || room.type}
                                        </div>
                                        <div className="ab-room-occupancy">
                                            <div className="ab-room-occ-bar" style={{ width: `${pct}%`, background: occColor(pct) }} />
                                        </div>
                                        <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>
                                            {room.currentOccupancy}/{room.maxOccupancy} người
                                        </div>
                                        <div className="ab-room-price">{fmtNum(room.pricePerTerm)}đ/kỳ</div>
                                        <div className="ab-room-actions">
                                            <button className="ab-btn-room-del" onClick={() => handleDeleteRoom(room)}>
                                                🗑️ Xóa
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Modal: Tạo/Sửa Tòa nhà ─────────────── */
function BuildingModal({ building, onClose, onSuccess }) {
    const isEdit = !!building;
    const [form, setForm] = useState({
        name: building?.name || "",
        address: building?.address || "",
        totalFloors: building?.totalFloors || "",
        description: building?.description || "",
        status: building?.status || "active",
    });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async () => {
        if (!form.name || !form.totalFloors) { setErr("Vui lòng nhập tên và số tầng"); return; }
        setLoading(true); setErr("");
        try {
            if (isEdit) await api.put(`/buildings/${building._id}`, form);
            else await api.post("/buildings", form);
            onSuccess();
        } catch (e) {
            setErr(e.response?.data?.message || "Thao tác thất bại");
        }
        setLoading(false);
    };

    return (
        <div className="ab-overlay" onClick={onClose}>
            <div className="ab-modal" onClick={e => e.stopPropagation()}>
                <div className="ab-modal-title">{isEdit ? "✏️ Sửa tòa nhà" : "🏢 Tạo tòa nhà mới"}</div>
                <div className="ab-modal-grid">
                    <div className="ab-field">
                        <label className="ab-label">Tên tòa nhà *</label>
                        <input className="ab-input" name="name" placeholder="VD: Tòa A1" value={form.name} onChange={handleChange} />
                    </div>
                    <div className="ab-field">
                        <label className="ab-label">Số tầng *</label>
                        <input className="ab-input" name="totalFloors" type="number" min="1" placeholder="VD: 6" value={form.totalFloors} onChange={handleChange} />
                    </div>
                    <div className="ab-field full">
                        <label className="ab-label">Địa chỉ</label>
                        <input className="ab-input" name="address" placeholder="Địa chỉ tòa nhà" value={form.address} onChange={handleChange} />
                    </div>
                    <div className="ab-field">
                        <label className="ab-label">Trạng thái</label>
                        <select className="ab-select" name="status" value={form.status} onChange={handleChange}>
                            <option value="active">Hoạt động</option>
                            <option value="maintenance">Bảo trì</option>
                            <option value="inactive">Tạm đóng</option>
                        </select>
                    </div>
                    <div className="ab-field full">
                        <label className="ab-label">Mô tả</label>
                        <textarea className="ab-textarea" name="description" placeholder="Mô tả thêm..." value={form.description} onChange={handleChange} />
                    </div>
                </div>
                {err && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 10 }}>⚠️ {err}</div>}
                <div className="ab-modal-actions">
                    <button className="ab-btn-cancel" onClick={onClose}>Hủy</button>
                    <button className="ab-btn-confirm" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo tòa nhà"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Modal: Thêm phòng ───────────────────── */
function RoomModal({ building, onClose, onSuccess }) {
    const [form, setForm] = useState({
        roomNumber: "", floor: "", type: "standard",
        maxOccupancy: "4", pricePerTerm: "", status: "available", description: "",
    });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async () => {
        if (!form.roomNumber || !form.floor || !form.pricePerTerm) {
            setErr("Vui lòng nhập đầy đủ: số phòng, tầng, giá/kỳ"); return;
        }
        setLoading(true); setErr("");
        try {
            await api.post(`/buildings/${building._id}/rooms`, form);
            onSuccess();
        } catch (e) {
            setErr(e.response?.data?.message || "Tạo phòng thất bại");
        }
        setLoading(false);
    };

    return (
        <div className="ab-overlay" onClick={onClose}>
            <div className="ab-modal" onClick={e => e.stopPropagation()}>
                <div className="ab-modal-title">🚪 Thêm phòng — {building.name}</div>
                <div className="ab-modal-grid">
                    <div className="ab-field">
                        <label className="ab-label">Số phòng *</label>
                        <input className="ab-input" name="roomNumber" placeholder="VD: 101" value={form.roomNumber} onChange={handleChange} />
                    </div>
                    <div className="ab-field">
                        <label className="ab-label">Tầng *</label>
                        <input className="ab-input" name="floor" type="number" min="1" placeholder="VD: 1" value={form.floor} onChange={handleChange} />
                    </div>
                    <div className="ab-field">
                        <label className="ab-label">Loại phòng</label>
                        <select className="ab-select" name="type" value={form.type} onChange={handleChange}>
                            <option value="standard">Tiêu chuẩn</option>
                            <option value="vip">VIP</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                    <div className="ab-field">
                        <label className="ab-label">Sức chứa tối đa</label>
                        <input className="ab-input" name="maxOccupancy" type="number" min="1" value={form.maxOccupancy} onChange={handleChange} />
                    </div>
                    <div className="ab-field">
                        <label className="ab-label">Giá / kỳ (đồng) *</label>
                        <input className="ab-input" name="pricePerTerm" type="number" min="0" placeholder="VD: 1500000" value={form.pricePerTerm} onChange={handleChange} />
                    </div>
                    <div className="ab-field">
                        <label className="ab-label">Trạng thái</label>
                        <select className="ab-select" name="status" value={form.status} onChange={handleChange}>
                            <option value="available">Còn chỗ</option>
                            <option value="maintenance">Bảo trì</option>
                        </select>
                    </div>
                    <div className="ab-field full">
                        <label className="ab-label">Mô tả / tiện nghi</label>
                        <textarea className="ab-textarea" name="description" placeholder="VD: Phòng có điều hòa, tủ đồ..." value={form.description} onChange={handleChange} />
                    </div>
                </div>
                {err && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 10 }}>⚠️ {err}</div>}
                <div className="ab-modal-actions">
                    <button className="ab-btn-cancel" onClick={onClose}>Hủy</button>
                    <button className="ab-btn-confirm" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Đang tạo..." : "Tạo phòng"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Main Page ───────────────────────────── */
export default function AdminBuildingsPage() {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState(null);
    const [modal, setModal] = useState(null); // { type:"building"|"building-edit"|"room", data, onRoomSuccess }

    const showAlert = useCallback((type, msg) => {
        setAlert({ type, msg });
        setTimeout(() => setAlert(null), 4000);
    }, []);

    const load = useCallback(() => {
        setLoading(true);
        api.get("/buildings")
            .then(r => setBuildings(r.data.data))
            .catch(() => showAlert("error", "Không thể tải danh sách tòa nhà"))
            .finally(() => setLoading(false));
    }, [showAlert]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (building) => {
        if (!window.confirm(`Xóa tòa nhà "${building.name}"?`)) return;
        try {
            await api.delete(`/buildings/${building._id}`);
            showAlert("success", `Đã xóa tòa nhà ${building.name}`);
            load();
        } catch (err) {
            showAlert("error", err.response?.data?.message || "Xóa thất bại");
        }
    };

    const totalRooms = buildings.reduce((s, b) => s + (b.totalFloors || 0), 0);

    return (
        <div className="ab-page">
            <div className="ab-header">
                <div>
                    <h1 className="ab-title">🏢 Quản lý Ký túc xá</h1>
                    <p className="ab-subtitle">Tạo và quản lý tòa nhà, phòng ở KTX FPT</p>
                </div>
                <button className="ab-btn-create" onClick={() => setModal({ type: "building" })}>
                    ＋ Tạo tòa nhà
                </button>
            </div>

            {alert && <div className={`ab-alert ${alert.type}`}>{alert.type === "success" ? "✅" : "❌"} {alert.msg}</div>}

            {/* Stats */}
            <div className="ab-stats">
                <div className="ab-stat">
                    <div className="ab-stat-num">{buildings.length}</div>
                    <div className="ab-stat-label">Tòa nhà</div>
                </div>
                <div className="ab-stat">
                    <div className="ab-stat-num">{buildings.filter(b => b.status === "active").length}</div>
                    <div className="ab-stat-label">Đang hoạt động</div>
                </div>
                <div className="ab-stat">
                    <div className="ab-stat-num">{buildings.filter(b => b.status === "maintenance").length}</div>
                    <div className="ab-stat-label">Đang bảo trì</div>
                </div>
            </div>

            {/* Building list */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "60px", color: "#bbb" }}>
                    <span className="ab-spinner" />Đang tải...
                </div>
            ) : buildings.length === 0 ? (
                <div className="ab-empty-page">
                    <span className="ab-empty-icon">🏗️</span>
                    <p>Chưa có tòa nhà nào. Nhấn "Tạo tòa nhà" để bắt đầu!</p>
                </div>
            ) : (
                <div className="ab-building-list">
                    {buildings.map(b => (
                        <BuildingCard
                            key={b._id}
                            building={b}
                            onEdit={(building) => setModal({ type: "building-edit", data: building })}
                            onDelete={handleDelete}
                            onAddRoom={(building, refresh) => setModal({ type: "room", data: building, onRoomSuccess: refresh })}
                            showAlert={showAlert}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            {modal?.type === "building" && (
                <BuildingModal
                    building={null}
                    onClose={() => setModal(null)}
                    onSuccess={() => { setModal(null); showAlert("success", "Tạo tòa nhà thành công!"); load(); }}
                />
            )}
            {modal?.type === "building-edit" && (
                <BuildingModal
                    building={modal.data}
                    onClose={() => setModal(null)}
                    onSuccess={() => { setModal(null); showAlert("success", "Cập nhật tòa nhà thành công!"); load(); }}
                />
            )}
            {modal?.type === "room" && (
                <RoomModal
                    building={modal.data}
                    onClose={() => setModal(null)}
                    onSuccess={() => {
                        setModal(null);
                        showAlert("success", "Tạo phòng thành công!");
                        if (modal.onRoomSuccess) modal.onRoomSuccess();
                    }}
                />
            )}
        </div>
    );
}
