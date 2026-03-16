import { useEffect, useMemo, useState } from "react";
import { studentApi } from "../../services/studentApi";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "-");

const TYPE_LABEL = {
    damage_report: "Báo Hỏng Hóc",
    room_transfer: "Chuyển Phòng",
    room_retention: "Giữ Phòng",
    room_reservation_cancel: "Hủy Phòng đã giữ chỗ",
    other: "Khác",
};

const STATUS_MAP = {
    pending: { label: "Chờ xử lý", cls: "pending" },
    manager_approved: { label: "Manager đã duyệt", cls: "approved" },
    manager_rejected: { label: "Manager từ chối", cls: "rejected" },
    admin_approved: { label: "Admin đã duyệt", cls: "approved" },
    admin_rejected: { label: "Admin từ chối", cls: "rejected" },
    completed: { label: "Hoàn Thành", cls: "completed" },
};

export default function MyRequestsPanel() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [profile, setProfile] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [form, setForm] = useState({
        type: "damage_report",
        title: "",
        description: "",
        targetRoomId: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState(null);

    const reservedBooking = useMemo(
        () =>
            [...bookings]
                .filter((item) => item.status === "approved" && !item.activatedAt)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0],
        [bookings]
    );

    const load = () => {
        setLoading(true);
        Promise.all([
            studentApi.getRequests().then((r) => setData(r.data.data || [])),
            studentApi.getProfile().then((r) => setProfile(r.data.data || null)),
            studentApi.getBookings().then((r) => setBookings(r.data.data || [])),
        ])
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    const loadAvailableRooms = () => {
        setLoadingRooms(true);
        studentApi.getAvailableRooms()
            .then((r) => {
                const currentRoomId = profile?.currentRoomId?._id;
                const roomList = (r.data.data || []).filter((room) => String(room._id) !== String(currentRoomId || ""));
                setRooms(roomList);
            })
            .catch(() => setRooms([]))
            .finally(() => setLoadingRooms(false));
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        if (showForm && form.type === "room_transfer") {
            loadAvailableRooms();
        }
    }, [showForm, form.type, profile?.currentRoomId?._id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description) {
            setAlert({ type: "error", msg: "Vui lòng nhập tiêu đề và mô tả" });
            return;
        }

        if (form.type === "room_transfer") {
            if (!profile?.currentRoomId) {
                setAlert({ type: "error", msg: "Bạn chưa có phòng hiện tại để gửi yêu cầu chuyển phòng" });
                return;
            }
            if (!form.targetRoomId) {
                setAlert({ type: "error", msg: "Vui lòng chọn phòng muốn chuyển đến" });
                return;
            }
        }

        if (form.type === "room_reservation_cancel" && !reservedBooking) {
            setAlert({ type: "error", msg: "Bạn không có phòng giữ chỗ để hủy" });
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                type: form.type,
                title: form.title,
                description: form.description,
            };
            if (form.type === "room_transfer") payload.targetRoomId = form.targetRoomId;

            await studentApi.createRequest(payload);
            setAlert({ type: "success", msg: "Gửi yêu cầu thành công!" });
            setForm({ type: "damage_report", title: "", description: "", targetRoomId: "" });
            setShowForm(false);
            load();
        } catch (err) {
            setAlert({ type: "error", msg: err.response?.data?.message || "Gửi yêu cầu thất bại" });
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
                <h2 className="sd-panel-title">Yêu cầu của tôi</h2>
                <p className="sd-panel-subtitle">Các yêu cầu bạn đã gửi lên Ban quản lý</p>
            </div>

            {alert && (
                <div className={`sd-alert ${alert.type}`} style={{ marginBottom: 16 }}>
                    {alert.msg}
                </div>
            )}

            <button
                className="sd-toggle-form"
                onClick={() => {
                    setShowForm((v) => !v);
                    setAlert(null);
                }}
            >
                {showForm ? "Đóng form" : "Gửi yêu cầu mới"}
            </button>

            {showForm && (
                <form className="sd-form" onSubmit={handleSubmit}>
                    <div className="sd-form-title">Gửi yêu cầu mới</div>
                    <div className="sd-field">
                        <label className="sd-label">Loại yêu cầu <span style={{ color: "#ef4444" }}>*</span></label>
                        <select
                            className="sd-select"
                            value={form.type}
                            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, targetRoomId: "" }))}
                        >
                            <option value="damage_report">Báo hỏng hóc</option>
                            <option value="room_transfer" disabled={!profile?.currentRoomId}>Xin chuyển phòng</option>
                            <option value="room_retention">Xin giữ phòng</option>
                            <option value="room_reservation_cancel" disabled={profile?.currentRoomId || !reservedBooking}>Xin hủy phòng đã giữ chỗ</option>
                            <option value="other">Khác</option>
                        </select>
                    </div>

                    {form.type === "room_transfer" && profile?.currentRoomId && (
                        <>
                            <div className="sd-field">
                                <label className="sd-label">Phòng hiện tại</label>
                                <input
                                    className="sd-input"
                                    disabled
                                    value={`Phòng ${profile.currentRoomId.roomNumber} - ${profile.currentRoomId.buildingId?.name || "KTX"}`}
                                />
                            </div>
                            <div className="sd-field">
                                <label className="sd-label">Phòng muốn chuyển đến <span style={{ color: "#ef4444" }}>*</span></label>
                                <select
                                    className="sd-select"
                                    value={form.targetRoomId}
                                    onChange={(e) => setForm((f) => ({ ...f, targetRoomId: e.target.value }))}
                                >
                                    <option value="">Chọn phòng còn trống</option>
                                    {rooms.map((room) => (
                                        <option key={room._id} value={room._id}>
                                            {`Phòng ${room.roomNumber} - ${room.buildingId?.name || "KTX"} (Còn ${room.maxOccupancy - room.currentOccupancy} chỗ)`}
                                        </option>
                                    ))}
                                </select>
                                {loadingRooms && <div style={{ color: "#999", fontSize: 12 }}>Đang tải danh sách phòng trống...</div>}
                            </div>
                        </>
                    )}

                    {form.type === "room_reservation_cancel" && reservedBooking && (
                        <div style={{ padding: "12px 16px", background: "#fff8eb", border: "1px solid rgba(217,119,6,0.2)", borderRadius: 10, fontSize: 13, color: "#555" }}>
                            Bạn đang xin hủy giữ chỗ: <strong>Phòng {reservedBooking.roomId?.roomNumber || "-"}</strong>
                            {" - "}
                            {reservedBooking.roomId?.buildingId?.name || "KTX"}.
                        </div>
                    )}

                    <div className="sd-field">
                        <label className="sd-label">Tiêu đề <span style={{ color: "#ef4444" }}>*</span></label>
                        <input
                            className="sd-input"
                            placeholder="Nhập tiêu đề yêu cầu"
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        />
                    </div>
                    <div className="sd-field">
                        <label className="sd-label">Mô tả chi tiết <span style={{ color: "#ef4444" }}>*</span></label>
                        <textarea
                            className="sd-textarea"
                            placeholder="Mô tả rõ nội dung yêu cầu..."
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        />
                    </div>
                    <div className="sd-form-actions">
                        <button type="button" className="sd-btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
                        <button type="submit" className="sd-btn-primary" disabled={submitting}>
                            {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
                        </button>
                    </div>
                </form>
            )}

            {data.length === 0 ? (
                <div className="sd-empty">
                    <span className="sd-empty-icon">📋</span>
                    <p className="sd-empty-text">Chưa có yêu cầu nào</p>
                </div>
            ) : (
                <div className="sd-list">
                    {data.map((item) => {
                        const s = STATUS_MAP[item.status] || { label: item.status, cls: "info" };
                        return (
                            <div key={item._id} className="sd-list-item">
                                <div className="sd-list-icon">{TYPE_LABEL[item.type]?.split(" ")[0] || "?"}</div>
                                <div className="sd-list-body">
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <span className="sd-list-title">{item.title}</span>
                                        <span className={`sd-badge ${s.cls}`}>{s.label}</span>
                                    </div>
                                    <p className="sd-list-text">{item.description}</p>
                                    <div className="sd-list-meta">
                                        {TYPE_LABEL[item.type]} · {fmtDate(item.createdAt)}
                                        {item.currentRoomId && ` · Phong ${item.currentRoomId.roomNumber}`}
                                        {item.targetRoomId && ` -> Phong ${item.targetRoomId.roomNumber}`}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
