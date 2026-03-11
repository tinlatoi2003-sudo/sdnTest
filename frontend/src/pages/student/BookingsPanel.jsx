import { useState, useEffect } from "react";
import { studentApi } from "../../services/studentApi";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";
const fmtNum = (n) => Number(n || 0).toLocaleString("vi-VN");

const STATUS_MAP = {
    pending: { label: "Chờ duyệt", cls: "pending" },
    approved: { label: "Đã duyệt", cls: "approved" },
    rejected: { label: "Từ chối", cls: "rejected" },
};

const ROOM_TYPE_LABEL = { standard: "Tiêu chuẩn", vip: "VIP", premium: "Premium" };
const ROOM_TYPE_COLOR = { standard: "#555", vip: "#2563eb", premium: "#d97706" };

export default function BookingsPanel() {
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [termCode, setTermCode] = useState("");
    const [note, setNote] = useState("");
    const [filterType, setFilterType] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState(null);

    const load = () => {
        setLoading(true);
        studentApi.getBookings()
            .then(r => setBookings(r.data.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    // Tải danh sách phòng khi mở form
    const openForm = () => {
        setShowForm(true);
        setAlert(null);
        setLoadingRooms(true);
        studentApi.getAvailableRooms({ type: filterType || undefined })
            .then(r => setRooms(r.data.data))
            .catch(() => setRooms([]))
            .finally(() => setLoadingRooms(false));
    };

    const handleFilterType = (type) => {
        setFilterType(type);
        setSelectedRoom(null);
        setLoadingRooms(true);
        studentApi.getAvailableRooms({ type: type || undefined })
            .then(r => setRooms(r.data.data))
            .catch(() => setRooms([]))
            .finally(() => setLoadingRooms(false));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRoom) { setAlert({ type: "error", msg: "Vui lòng chọn một phòng" }); return; }
        if (!termCode) { setAlert({ type: "error", msg: "Vui lòng nhập kỳ học" }); return; }
        setSubmitting(true);
        try {
            await studentApi.createBooking({ roomId: selectedRoom._id, termCode, note });
            setAlert({ type: "success", msg: "Đăng ký phòng thành công! Vui lòng chờ duyệt." });
            setShowForm(false);
            setSelectedRoom(null);
            setTermCode("");
            setNote("");
            load();
        } catch (err) {
            setAlert({ type: "error", msg: err.response?.data?.message || "Đăng ký thất bại" });
        }
        setSubmitting(false);
    };

    if (loading) return (
        <div className="sd-loading"><div className="sd-spinner" /><span>Đang tải...</span></div>
    );

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">📋 Đăng ký phòng</h2>
                <p className="sd-panel-subtitle">Đăng ký phòng KTX theo kỳ học</p>
            </div>

            {alert && (
                <div className={`sd-alert ${alert.type}`} style={{ marginBottom: 16 }}>
                    {alert.type === "success" ? "✅" : "❌"} {alert.msg}
                </div>
            )}

            <button className="sd-toggle-form" onClick={() => showForm ? setShowForm(false) : openForm()}>
                {showForm ? "✕ Đóng form" : "＋ Đăng ký phòng mới"}
            </button>

            {/* Form đăng ký */}
            {showForm && (
                <div className="sd-form" style={{ marginBottom: 24 }}>
                    <div className="sd-form-title">Chọn phòng & nhập thông tin đăng ký</div>

                    {/* Lọc loại phòng */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {["", "standard", "vip", "premium"].map(t => (
                            <button key={t} onClick={() => handleFilterType(t)} style={{
                                padding: "7px 16px", borderRadius: 8, border: "1.5px solid",
                                fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s",
                                borderColor: filterType === t ? "#e8540a" : "#e8e8e8",
                                background: filterType === t ? "rgba(232,84,10,.08)" : "#f5f5f5",
                                color: filterType === t ? "#e8540a" : "#666",
                            }}>
                                {t === "" ? "Tất cả" : ROOM_TYPE_LABEL[t]}
                            </button>
                        ))}
                    </div>

                    {/* Danh sách phòng */}
                    <div>
                        <div className="sd-label" style={{ marginBottom: 10 }}>
                            Chọn phòng <span style={{ color: "#ef4444" }}>*</span>
                            <span style={{ color: "#bbb", fontWeight: 400, marginLeft: 8 }}>
                                ({loadingRooms ? "Đang tải..." : `${rooms.length} phòng còn chỗ`})
                            </span>
                        </div>
                        {loadingRooms ? (
                            <div style={{ textAlign: "center", padding: "20px", color: "#bbb" }}>
                                <div className="sd-spinner" style={{ margin: "0 auto" }} />
                            </div>
                        ) : rooms.length === 0 ? (
                            <div style={{ padding: "16px", background: "#fafafa", borderRadius: 10, color: "#bbb", textAlign: "center", fontSize: 13 }}>
                                Không có phòng nào còn chỗ
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10, maxHeight: 360, overflowY: "auto" }}>
                                {rooms.map(room => {
                                    const isSelected = selectedRoom?._id === room._id;
                                    const pct = Math.round((room.currentOccupancy / room.maxOccupancy) * 100);
                                    return (
                                        <div key={room._id} onClick={() => setSelectedRoom(room)} style={{
                                            padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                                            border: isSelected ? "2px solid #e8540a" : "1.5px solid #e8e8e8",
                                            background: isSelected ? "rgba(232,84,10,.06)" : "#fff",
                                            transition: "all .2s",
                                            boxShadow: isSelected ? "0 0 0 3px rgba(232,84,10,.1)" : "none",
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                                <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>
                                                    Phòng {room.roomNumber}
                                                </span>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 600, padding: "2px 8px",
                                                    borderRadius: 6, color: ROOM_TYPE_COLOR[room.type],
                                                    background: ROOM_TYPE_COLOR[room.type] + "15"
                                                }}>
                                                    {ROOM_TYPE_LABEL[room.type]}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                                                🏢 {room.buildingId?.name || "—"} &nbsp;·&nbsp; Tầng {room.floor}
                                            </div>
                                            {/* Thanh hiển thị chỗ trống */}
                                            <div style={{ marginBottom: 6 }}>
                                                <div style={{ height: 4, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                                                    <div style={{ height: "100%", width: `${pct}%`, background: pct < 50 ? "#16a34a" : pct < 100 ? "#f59e0b" : "#dc2626", borderRadius: 4 }} />
                                                </div>
                                                <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                                                    {room.currentOccupancy}/{room.maxOccupancy} người &nbsp;·&nbsp; Còn {room.maxOccupancy - room.currentOccupancy} chỗ
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#e8540a" }}>
                                                {fmtNum(room.pricePerTerm)}đ / kỳ
                                            </div>
                                            {isSelected && (
                                                <div style={{ marginTop: 8, color: "#e8540a", fontSize: 12, fontWeight: 600 }}>✅ Đã chọn</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Kỳ học & ghi chú */}
                    <div className="sd-field">
                        <label className="sd-label">Kỳ học <span style={{ color: "#ef4444" }}>*</span></label>
                        <input className="sd-input" placeholder="VD: HK1-2025" value={termCode} onChange={e => setTermCode(e.target.value)} />
                    </div>
                    <div className="sd-field">
                        <label className="sd-label">Ghi chú</label>
                        <textarea className="sd-textarea" placeholder="Ghi chú thêm (không bắt buộc)" value={note} onChange={e => setNote(e.target.value)} />
                    </div>

                    {selectedRoom && (
                        <div style={{ padding: "12px 16px", background: "rgba(232,84,10,.05)", border: "1px solid rgba(232,84,10,.15)", borderRadius: 10, fontSize: 13, color: "#555" }}>
                            📌 Bạn đang đăng ký: <strong>Phòng {selectedRoom.roomNumber}</strong> – {selectedRoom.buildingId?.name} – Tầng {selectedRoom.floor} ({fmtNum(selectedRoom.pricePerTerm)}đ/kỳ)
                        </div>
                    )}

                    <div className="sd-form-actions">
                        <button type="button" className="sd-btn-secondary" onClick={() => { setShowForm(false); setSelectedRoom(null); }}>Hủy</button>
                        <button className="sd-btn-primary" onClick={handleSubmit} disabled={submitting || !selectedRoom || !termCode}>
                            {submitting ? "Đang gửi..." : "Gửi đăng ký"}
                        </button>
                    </div>
                </div>
            )}

            {/* Danh sách đăng ký đã có */}
            {bookings.length === 0 ? (
                <div className="sd-empty">
                    <span className="sd-empty-icon">📋</span>
                    <p className="sd-empty-text">Chưa có đơn đăng ký phòng nào</p>
                </div>
            ) : (
                <div className="sd-table-wrap">
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>Phòng</th>
                                <th>Kỳ học</th>
                                <th>Ngày đăng ký</th>
                                <th>Ghi chú BQL</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(item => {
                                const s = STATUS_MAP[item.status] || { label: item.status, cls: "info" };
                                return (
                                    <tr key={item._id}>
                                        <td>
                                            <strong>Phòng {item.roomId?.roomNumber || "—"}</strong>
                                            <br /><span style={{ color: "#888", fontSize: 12 }}>{item.roomId?.building || item.roomId?.buildingId?.name}</span>
                                        </td>
                                        <td><strong>{item.termCode}</strong></td>
                                        <td>{fmtDate(item.createdAt)}</td>
                                        <td style={{ color: "#777", fontSize: 13 }}>{item.reviewNote || "—"}</td>
                                        <td><span className={`sd-badge ${s.cls}`}>{s.label}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}
