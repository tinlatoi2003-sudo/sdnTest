import { useEffect, useMemo, useState } from "react";
import { studentApi } from "../../services/studentApi";
import api from "../../services/api";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "-");
const fmtNum = (n) => Number(n || 0).toLocaleString("vi-VN");

const STATUS_MAP = {
    pending: { label: "Chờ duyệt", cls: "pending" },
    approved: { label: "Đã duyệt", cls: "approved" },
    rejected: { label: "Từ chối", cls: "rejected" },
};

const ROOM_TYPE_LABEL = { standard: "Tiêu chuẩn", vip: "VIP", premium: "Premium" };
const ROOM_TYPE_COLOR = { standard: "#555", vip: "#2563eb", premium: "#d97706" };

const getCurrentTermCode = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    return `HK${month < 6 ? 1 : 2}-${now.getFullYear()}`;
};

export default function BookingsPanel() {
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [termCode, setTermCode] = useState(getCurrentTermCode());
    const [note, setNote] = useState("");
    const [filterType, setFilterType] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState(null);
    const [regOpen, setRegOpen] = useState(true);

    const hasCurrentRoom = Boolean(profile?.currentRoomId);

    const latestReservedBooking = useMemo(
        () =>
            [...bookings]
                .filter((item) => item.status === "approved" && !item.activatedAt)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0],
        [bookings]
    );

    const hasReservedRoom = Boolean(latestReservedBooking);
    const bookingLocked = hasCurrentRoom || hasReservedRoom;

    const getBookingStatus = (item) => {
        const isCurrentRoomBooking =
            profile?.currentRoomId &&
            item.roomId &&
            String(profile.currentRoomId._id || profile.currentRoomId) === String(item.roomId._id || item.roomId);

        if (item.status === "approved" && (item.activatedAt || isCurrentRoomBooking)) {
            return { label: "Đã vào phòng", cls: "approved" };
        }
        if (item.status === "approved" && item.activatedAt) {
            return { label: "Đã vào phòng", cls: "approved" };
        }
        if (item.status === "approved" && !item.activatedAt) {
            return { label: "Đã giữ chỗ - chờ kích hoạt", cls: "pending" };
        }
        return STATUS_MAP[item.status] || { label: item.status, cls: "info" };
    };

    const isCurrentRoomBooking = (item) =>
        Boolean(
            profile?.currentRoomId &&
            item.roomId &&
            String(profile.currentRoomId._id || profile.currentRoomId) === String(item.roomId._id || item.roomId)
        );

    const load = () => {
        setLoading(true);
        Promise.all([
            studentApi.getBookings().then((r) => setBookings(r.data.data || [])),
            studentApi.getProfile().then((r) => setProfile(r.data.data || null)),
        ])
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        api.get("/settings/registration-open")
            .then((r) => setRegOpen(r.data.data.isOpen))
            .catch(() => {});
    }, []);

    const fetchRooms = (typeValue) => {
        setLoadingRooms(true);
        studentApi.getAvailableRooms({ type: typeValue || undefined })
            .then((r) => setRooms(r.data.data || []))
            .catch(() => setRooms([]))
            .finally(() => setLoadingRooms(false));
    };

    const openForm = () => {
        setAlert(null);

        if (hasCurrentRoom) {
            setAlert({
                type: "error",
                msg: "Bạn đang có phòng hiện tại. Nếu muốn đổi phòng, vui lòng gửi yêu cầu chuyển phòng.",
            });
            return;
        }

        if (hasReservedRoom) {
            setAlert({
                type: "error",
                    msg: "Bạn đã được giữ chỗ. Hãy thanh toán hóa đơn tiền phòng trong mục Thanh toán để kích hoạt phòng.",
            });
            return;
        }

        setShowForm(true);
        fetchRooms(filterType);
    };

    const handleFilterType = (type) => {
        setFilterType(type);
        setSelectedRoom(null);
        fetchRooms(type);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRoom) {
            setAlert({ type: "error", msg: "Vui long chon mot phong" });
            return;
        }
        if (!termCode) {
            setAlert({ type: "error", msg: "Vui long nhap ky hoc" });
            return;
        }

        setSubmitting(true);
        try {
            await studentApi.createBooking({ roomId: selectedRoom._id, termCode, note });
            setAlert({
                type: "success",
                msg: "Dang ky phong thanh cong, da giu cho va tao 1 hoa don tien phong cho ca ky. Thanh toan de kich hoat phong.",
            });
            setShowForm(false);
            setSelectedRoom(null);
            setNote("");
            load();
        } catch (err) {
            setAlert({ type: "error", msg: err.response?.data?.message || "Dang ky that bai" });
        }
        setSubmitting(false);
    };

    if (loading) {
        return (
            <div className="sd-loading">
                <div className="sd-spinner" />
                <span>Đang tải...</span>
            </div>
        );
    }

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">Đăng ký phòng</h2>
                <p className="sd-panel-subtitle">Đăng ký phòng KTX và theo dõi trạng thái kích hoạt</p>
            </div>

            {hasCurrentRoom && (
                <div style={{ padding: "12px 16px", background: "#effaf3", border: "1.5px solid #16a34a30", borderRadius: 10, marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#15803d" }}>Bạn đang ở trong phòng</div>
                    <div style={{ fontSize: 12, color: "#3f3f46", marginTop: 4 }}>
                        Phòng {profile.currentRoomId?.roomNumber} - {profile.currentRoomId?.buildingId?.name || "KTX"}.
                    </div>
                </div>
            )}

            {!hasCurrentRoom && hasReservedRoom && (
                <div style={{ padding: "12px 16px", background: "#fff8eb", border: "1.5px solid rgba(217,119,6,0.2)", borderRadius: 10, marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#b45309" }}>Bạn đã được giữ chỗ nhưng chưa vào phòng</div>
                    <div style={{ fontSize: 12, color: "#3f3f46", marginTop: 4 }}>
                        Phòng {latestReservedBooking?.roomId?.roomNumber || "-"} - {latestReservedBooking?.roomId?.buildingId?.name || "KTX"}.
                        Thanh toán hóa đơn tiền phòng trong mục Thanh toán để hệ thống lưu bạn vào phòng này.
                    </div>
                </div>
            )}

            {!regOpen && (
                <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1.5px solid #ef444430", borderRadius: 10, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>!</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#dc2626" }}>Tạm dừng nhận đơn đăng ký</div>
                        <div style={{ fontSize: 12, color: "#999" }}>Ban quản lý hiện chưa mở đăng ký phòng.</div>
                    </div>
                </div>
            )}

            {alert && (
                <div className={`sd-alert ${alert.type}`} style={{ marginBottom: 16 }}>
                    {alert.msg}
                </div>
            )}

            <button
                className="sd-toggle-form"
                disabled={!regOpen || bookingLocked}
                onClick={() => (showForm ? setShowForm(false) : openForm())}
                style={!regOpen || bookingLocked ? { opacity: 0.45, cursor: "not-allowed" } : {}}
            >
                {showForm ? "Đóng form" : "Đăng ký phòng mới"}
            </button>

            {showForm && regOpen && !bookingLocked && (
                <div className="sd-form" style={{ marginBottom: 24 }}>
                    <div className="sd-form-title">Chọn phòng và nhập thông tin đăng ký</div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {["", "standard", "vip", "premium"].map((t) => (
                            <button
                                key={t}
                                onClick={() => handleFilterType(t)}
                                style={{
                                    padding: "7px 16px",
                                    borderRadius: 8,
                                    border: "1.5px solid",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all .2s",
                                    borderColor: filterType === t ? "#e8540a" : "#e8e8e8",
                                    background: filterType === t ? "rgba(232,84,10,.08)" : "#f5f5f5",
                                    color: filterType === t ? "#e8540a" : "#666",
                                }}
                            >
                                {t === "" ? "Tất cả" : ROOM_TYPE_LABEL[t]}
                            </button>
                        ))}
                    </div>

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
                                {rooms.map((room) => {
                                    const isSelected = selectedRoom?._id === room._id;
                                    const pct = Math.round((room.currentOccupancy / room.maxOccupancy) * 100);
                                    return (
                                        <div
                                            key={room._id}
                                            onClick={() => setSelectedRoom(room)}
                                            style={{
                                                padding: "14px 16px",
                                                borderRadius: 12,
                                                cursor: "pointer",
                                                border: isSelected ? "2px solid #e8540a" : "1.5px solid #e8e8e8",
                                                background: isSelected ? "rgba(232,84,10,.06)" : "#fff",
                                                transition: "all .2s",
                                                boxShadow: isSelected ? "0 0 0 3px rgba(232,84,10,.1)" : "none",
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                                <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Phòng {room.roomNumber}</span>
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        padding: "2px 8px",
                                                        borderRadius: 6,
                                                        color: ROOM_TYPE_COLOR[room.type],
                                                        background: `${ROOM_TYPE_COLOR[room.type]}15`,
                                                    }}
                                                >
                                                    {ROOM_TYPE_LABEL[room.type]}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                                                {room.buildingId?.name || "-"} · Tầng {room.floor}
                                            </div>
                                            <div style={{ marginBottom: 6 }}>
                                                <div style={{ height: 4, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                                                    <div style={{ height: "100%", width: `${pct}%`, background: pct < 50 ? "#16a34a" : pct < 100 ? "#f59e0b" : "#dc2626", borderRadius: 4 }} />
                                                </div>
                                                <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                                                    {room.currentOccupancy}/{room.maxOccupancy} người · Còn {room.maxOccupancy - room.currentOccupancy} chỗ
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#e8540a" }}>{fmtNum(room.pricePerTerm)}đ / kỳ</div>
                                            {isSelected && <div style={{ marginTop: 8, color: "#e8540a", fontSize: 12, fontWeight: 600 }}>Đã chọn</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="sd-field">
                        <label className="sd-label">Kỳ học <span style={{ color: "#ef4444" }}>*</span></label>
                        <input className="sd-input" placeholder="VD: HK1-2026" value={termCode} onChange={(e) => setTermCode(e.target.value)} />
                    </div>
                    <div className="sd-field">
                        <label className="sd-label">Ghi chú</label>
                        <textarea className="sd-textarea" placeholder="Ghi chú thêm" value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>

                    {selectedRoom && (
                        <div style={{ padding: "12px 16px", background: "rgba(232,84,10,.05)", border: "1px solid rgba(232,84,10,.15)", borderRadius: 10, fontSize: 13, color: "#555" }}>
                            Bạn đang đăng ký: <strong>Phòng {selectedRoom.roomNumber}</strong> - {selectedRoom.buildingId?.name} - Tầng {selectedRoom.floor} ({fmtNum(selectedRoom.pricePerTerm)}đ/kỳ)
                        </div>
                    )}

                    <div className="sd-form-actions">
                        <button type="button" className="sd-btn-secondary" onClick={() => { setShowForm(false); setSelectedRoom(null); }}>Hủy</button>
                        <button className="sd-btn-primary" onClick={handleSubmit} disabled={submitting || !selectedRoom || !termCode}>
                            {submitting ? "Đang gửi..." : "Đăng ký ngay"}
                        </button>
                    </div>
                </div>
            )}

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
                                <th>Ngày kích hoạt</th>
                                <th>Ghi chú BQL</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((item) => {
                                const s = getBookingStatus(item);
                                return (
                                    <tr key={item._id}>
                                        <td>
                                            <strong>Phòng {item.roomId?.roomNumber || "-"}</strong>
                                            <br />
                                            <span style={{ color: "#888", fontSize: 12 }}>{item.roomId?.buildingId?.name || "-"}</span>
                                        </td>
                                        <td><strong>{item.termCode}</strong></td>
                                        <td>{fmtDate(item.createdAt)}</td>
                                        <td>
                                            {item.activatedAt || isCurrentRoomBooking(item) ? (
                                                <span style={{ color: "#16a34a", fontWeight: 600 }}>
                                                    {fmtDate(item.activatedAt || item.reviewedAt || item.createdAt)}
                                                </span>
                                            ) : (
                                                <span style={{ color: "#d97706", fontSize: 12 }}>Chưa kích hoạt</span>
                                            )}
                                        </td>
                                        <td style={{ color: "#777", fontSize: 13 }}>
                                            {(item.activatedAt || isCurrentRoomBooking(item))
                                                ? `${item.reviewNote || "-"}${item.reviewNote ? " · " : ""}Đã vào phòng`
                                            : (item.reviewNote || "Cho thanh toan hoa don tien phong de kich hoat")}
                                        </td>
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
