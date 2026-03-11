import { useState, useEffect } from "react";
import { studentApi } from "../../services/studentApi";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

const TYPE_LABEL = {
    damage_report: "🔧 Báo hỏng hóc",
    room_transfer: "🔄 Chuyển phòng",
    room_retention: "📌 Giữ phòng",
    other: "📝 Khác",
};

const STATUS_MAP = {
    pending: { label: "Chờ xử lý", cls: "pending" },
    manager_approved: { label: "Manager đã duyệt", cls: "approved" },
    manager_rejected: { label: "Manager từ chối", cls: "rejected" },
    admin_approved: { label: "Admin đã duyệt", cls: "approved" },
    admin_rejected: { label: "Admin từ chối", cls: "rejected" },
    completed: { label: "Hoàn thành", cls: "completed" },
};

export default function MyRequestsPanel() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ type: "damage_report", title: "", description: "" });
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState(null);

    const load = () => {
        setLoading(true);
        studentApi.getRequests()
            .then(r => setData(r.data.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description) {
            setAlert({ type: "error", msg: "Vui lòng nhập tiêu đề và mô tả" });
            return;
        }
        setSubmitting(true);
        try {
            await studentApi.createRequest(form);
            setAlert({ type: "success", msg: "Gửi yêu cầu thành công! Vui lòng chờ xử lý." });
            setForm({ type: "damage_report", title: "", description: "" });
            setShowForm(false);
            load();
        } catch (err) {
            setAlert({ type: "error", msg: err.response?.data?.message || "Gửi yêu cầu thất bại" });
        }
        setSubmitting(false);
    };

    if (loading) return (
        <div className="sd-loading"><div className="sd-spinner" /><span>Đang tải...</span></div>
    );

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">📝 Yêu cầu của tôi</h2>
                <p className="sd-panel-subtitle">Các yêu cầu bạn đã gửi lên Ban quản lý</p>
            </div>

            {alert && (
                <div className={`sd-alert ${alert.type}`} style={{ marginBottom: 16 }}>
                    {alert.type === "success" ? "✅" : "❌"} {alert.msg}
                </div>
            )}

            <button className="sd-toggle-form" onClick={() => { setShowForm(v => !v); setAlert(null); }}>
                {showForm ? "✕ Đóng form" : "＋ Gửi yêu cầu mới"}
            </button>

            {showForm && (
                <form className="sd-form" onSubmit={handleSubmit}>
                    <div className="sd-form-title">Gửi yêu cầu mới</div>
                    <div className="sd-field">
                        <label className="sd-label">Loại yêu cầu <span style={{ color: "#ef4444" }}>*</span></label>
                        <select
                            className="sd-select"
                            value={form.type}
                            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                        >
                            <option value="damage_report">🔧 Báo hỏng hóc</option>
                            <option value="room_transfer">🔄 Xin chuyển phòng</option>
                            <option value="room_retention">📌 Xin giữ phòng</option>
                            <option value="other">📝 Khác</option>
                        </select>
                    </div>
                    <div className="sd-field">
                        <label className="sd-label">Tiêu đề <span style={{ color: "#ef4444" }}>*</span></label>
                        <input
                            className="sd-input"
                            placeholder="Nhập tiêu đề yêu cầu"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        />
                    </div>
                    <div className="sd-field">
                        <label className="sd-label">Mô tả chi tiết <span style={{ color: "#ef4444" }}>*</span></label>
                        <textarea
                            className="sd-textarea"
                            placeholder="Mô tả rõ nội dung yêu cầu..."
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
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
                    <span className="sd-empty-icon">📝</span>
                    <p className="sd-empty-text">Chưa có yêu cầu nào</p>
                </div>
            ) : (
                <div className="sd-list">
                    {data.map(item => {
                        const s = STATUS_MAP[item.status] || { label: item.status, cls: "info" };
                        return (
                            <div key={item._id} className="sd-list-item">
                                <div className="sd-list-icon">
                                    {TYPE_LABEL[item.type]?.split(" ")[0] || "📝"}
                                </div>
                                <div className="sd-list-body">
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <span className="sd-list-title">{item.title}</span>
                                        <span className={`sd-badge ${s.cls}`}>{s.label}</span>
                                    </div>
                                    <p className="sd-list-text">{item.description}</p>
                                    <div className="sd-list-meta">
                                        {TYPE_LABEL[item.type]} &nbsp;·&nbsp; 📅 {fmtDate(item.createdAt)}
                                        {item.currentRoomId && ` · Phòng ${item.currentRoomId.roomNumber}`}
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
