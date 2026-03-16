import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

import "./AdminNotifications.css";

const TYPE_OPTIONS = [
    { value: "general", label: "📢 Thông báo chung" },
    { value: "payment_reminder", label: "💳 Nhắc thanh toán" },
    { value: "maintenance", label: "🔧 Bảo trì" },
    { value: "announcement", label: "📣 Thông báo quan trọng" },
];

const TYPE_ICONS = {
    general: "📢",
    payment_reminder: "💳",
    maintenance: "🔧",
    announcement: "📣",
};

function formatDate(d) {
    const date = new Date(d);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminNotificationsPage() {
    const INIT_FORM = { title: "", message: "", type: "general", receiverType: "role", targetRole: "student" };
    const [form, setForm] = useState(INIT_FORM);
    const [sending, setSending] = useState(false);
    const [alert, setAlert] = useState({ type: "", msg: "" });
    const [sentList, setSentList] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [activeTab, setActiveTab] = useState("send");
    // Individual recipient state
    const [searchRole, setSearchRole] = useState("student");
    const [userSearch, setUserSearch] = useState("");
    const [userResults, setUserResults] = useState([]);
    const [userSearching, setUserSearching] = useState(false);
    const [receiverIds, setReceiverIds] = useState([]); // [{_id, username, email}]

    const showAlert = (type, msg) => {
        setAlert({ type, msg });
        setTimeout(() => setAlert({ type: "", msg: "" }), 4000);
    };

    // Live search users by role (debounced 300ms)
    useEffect(() => {
        if (!userSearch.trim()) { setUserResults([]); return; }
        const timer = setTimeout(async () => {
            setUserSearching(true);
            try {
                const { data } = await api.get("/users", { params: { role: searchRole, search: userSearch } });
                setUserResults(data.users || []);
            } catch { setUserResults([]); }
            finally { setUserSearching(false); }
        }, 300);
        return () => clearTimeout(timer);
    }, [userSearch, searchRole]);

    const loadSentList = useCallback(async () => {
        setLoadingList(true);
        try {
            const { data } = await api.get("/notifications/sent?limit=30");
            setSentList(data.data);
        } catch {
            // silent
        } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => {
        loadSentList();
    }, [loadSentList]);

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSend = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.message.trim()) {
            showAlert("error", "Vui lòng điền đầy đủ tiêu đề và nội dung");
            return;
        }
        if (form.receiverType === "individual" && receiverIds.length === 0) {
            showAlert("error", "Vui lòng chọn ít nhất một người nhận");
            return;
        }
        setSending(true);
        try {
            const payload = { ...form, receiverIds: receiverIds.map(u => u._id) };
            const { data } = await api.post("/notifications/send", payload);
            showAlert("success", data.message || "Gửi thông báo thành công!");
            setForm(INIT_FORM);
            setReceiverIds([]);
            setUserSearch("");
            setUserResults([]);
            loadSentList();
            setActiveTab("history");
        } catch (err) {
            showAlert("error", err.response?.data?.message || "Gửi thất bại");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="an-page">
            {/* Header */}
            <div className="an-header">
                <div>
                    <h1 className="an-title">🔔 Gửi thông báo</h1>
                    <p className="an-subtitle">Gửi thông báo tới sinh viên và người dùng hệ thống</p>
                </div>
                <div className="an-header-actions">
                    <a href="/admin/dashboard" className="an-back-btn">← Dashboard</a>
                </div>
            </div>

            {/* Alert */}
            {alert.msg && (
                <div className={`an-alert ${alert.type}`}>
                    {alert.type === "success" ? "✅" : "⚠️"} {alert.msg}
                </div>
            )}

            {/* Tabs */}
            <div className="an-tabs">
                <button className={`an-tab ${activeTab === "send" ? "active" : ""}`} onClick={() => setActiveTab("send")}>
                    ✉️ Soạn thông báo
                </button>
                <button className={`an-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
                    📋 Lịch sử gửi {sentList.length > 0 && <span className="an-tab-count">{sentList.length}</span>}
                </button>
            </div>

            {/* Tab: Soạn thông báo */}
            {activeTab === "send" && (
                <div className="an-send-panel">
                    <form className="an-form" onSubmit={handleSend}>
                        {/* Loại thông báo */}
                        <div className="an-field">
                            <label className="an-label">Loại thông báo</label>
                            <div className="an-type-grid">
                                {TYPE_OPTIONS.map((t) => (
                                    <label key={t.value} className={`an-type-card ${form.type === t.value ? "selected" : ""}`}>
                                        <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={handleChange} />
                                        {t.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Đối tượng nhận */}
                        <div className="an-field">
                            <label className="an-label">Gửi đến</label>
                            <div className="an-receiver-row">
                                <select name="receiverType" value={form.receiverType} onChange={e => {
                                    handleChange(e);
                                    setReceiverIds([]);
                                    setUserSearch("");
                                    setUserResults([]);
                                }} className="an-select">
                                    <option value="role">Theo nhóm người dùng</option>
                                    <option value="individual">Cá nhân</option>
                                </select>
                                {form.receiverType === "role" && (
                                    <select name="targetRole" value={form.targetRole} onChange={handleChange} className="an-select">
                                        <option value="student">🎓 Tất cả sinh viên</option>
                                        <option value="manager">📋 Tất cả quản lý</option>
                                        <option value="all">👥 Tất cả người dùng</option>
                                    </select>
                                )}
                            </div>

                            {/* Individual: role selector + search */}
                            {form.receiverType === "individual" && (
                                <div style={{ marginTop: 10 }}>
                                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                        <select className="an-select" value={searchRole} onChange={e => { setSearchRole(e.target.value); setUserSearch(""); setUserResults([]); }}>
                                            <option value="student">🎓 Sinh viên</option>
                                            <option value="manager">🏢 Quản lý</option>
                                            <option value="admin">🛡️ Admin</option>
                                        </select>
                                    </div>
                                    <div style={{ position: "relative" }}>
                                        <input className="an-input" placeholder="🔍 Tìm username hoặc email..."
                                            value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                                        {userSearching && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#888" }}>Đang tìm...</span>}
                                        {userResults.length > 0 && (
                                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px #0002", zIndex: 100, maxHeight: 220, overflowY: "auto" }}>
                                                {userResults.map(u => (
                                                    <div key={u._id}
                                                        onClick={() => { if (!receiverIds.find(r => r._id === u._id)) setReceiverIds(prev => [...prev, u]); setUserSearch(""); setUserResults([]); }}
                                                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                                                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                                                            {u.username[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{u.username}</div>
                                                            <div style={{ fontSize: 11, color: "#888" }}>{u.email}</div>
                                                        </div>
                                                        {receiverIds.find(r => r._id === u._id) && <span style={{ marginLeft: "auto", color: "#22c55e", fontSize: 16 }}>✓</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {receiverIds.length > 0 && (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                                            {receiverIds.map(u => (
                                                <span key={u._id} style={{ display: "flex", alignItems: "center", gap: 5, background: "#6366f115", border: "1px solid #6366f130", borderRadius: 20, padding: "4px 10px", fontSize: 12, color: "#6366f1" }}>
                                                    👤 {u.username}
                                                    <button type="button" onClick={() => setReceiverIds(prev => prev.filter(r => r._id !== u._id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {receiverIds.length === 0 && <p style={{ fontSize: 12, color: "#e8540a", marginTop: 6 }}>⚠️ Chưa chọn người nhận nào</p>}
                                </div>
                            )}

                            <p className="an-receiver-hint">
                                📤 Sẽ gửi tới: <strong>
                                    {form.receiverType === "role"
                                        ? (form.targetRole === "all" ? "Tất cả người dùng" : form.targetRole === "student" ? "Tất cả sinh viên" : "Tất cả quản lý")
                                        : receiverIds.length > 0 ? `${receiverIds.length} người đã chọn` : "Chưa chọn"}
                                </strong>
                            </p>
                        </div>

                        {/* Tiêu đề */}
                        <div className="an-field">
                            <label className="an-label">Tiêu đề <span className="req">*</span></label>
                            <input
                                className="an-input"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="Nhập tiêu đề thông báo..."
                                maxLength={120}
                                required
                            />
                            <span className="an-char-count">{form.title.length}/120</span>
                        </div>

                        {/* Nội dung */}
                        <div className="an-field">
                            <label className="an-label">Nội dung <span className="req">*</span></label>
                            <textarea
                                className="an-textarea"
                                name="message"
                                value={form.message}
                                onChange={handleChange}
                                placeholder="Nhập nội dung thông báo chi tiết..."
                                rows={5}
                                maxLength={1000}
                                required
                            />
                            <span className="an-char-count">{form.message.length}/1000</span>
                        </div>

                        {/* Preview */}
                        {(form.title || form.message) && (
                            <div className="an-preview">
                                <p className="an-preview-label">👁️ Xem trước</p>
                                <div className="an-preview-card">
                                    <div className="an-preview-icon">{TYPE_ICONS[form.type]}</div>
                                    <div>
                                        <div className="an-preview-title">{form.title || "Tiêu đề..."}</div>
                                        <div className="an-preview-msg">{form.message || "Nội dung..."}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="an-form-actions">
                            <button type="button" className="an-btn-reset" onClick={() => setForm({ title: "", message: "", type: "general", receiverType: "role", targetRole: "student" })}>
                                🔄 Đặt lại
                            </button>
                            <button type="submit" className="an-btn-send" disabled={sending}>
                                {sending ? (
                                    <><span className="an-spinner"></span> Đang gửi...</>
                                ) : (
                                    "📤 Gửi thông báo"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tab: Lịch sử */}
            {activeTab === "history" && (
                <div className="an-history-panel">
                    {loadingList ? (
                        <div className="an-history-loading">
                            <div className="an-spinner-lg"></div>
                            <span>Đang tải lịch sử...</span>
                        </div>
                    ) : sentList.length === 0 ? (
                        <div className="an-history-empty">
                            <span>📭</span>
                            <p>Chưa có thông báo nào được gửi</p>
                        </div>
                    ) : (
                        <div className="an-history-list">
                            {sentList.map((n) => (
                                <div key={n._id} className="an-history-item">
                                    <div className="an-history-icon">{TYPE_ICONS[n.type] || "📢"}</div>
                                    <div className="an-history-content">
                                        <div className="an-history-title">{n.title}</div>
                                        <div className="an-history-msg">{n.message}</div>
                                        <div className="an-history-meta">
                                            <span className="an-history-target">
                                                {n.receiverType === "role"
                                                    ? (n.targetRole === "all" ? "👥 Tất cả" : n.targetRole === "student" ? "🎓 Sinh viên" : "📋 Quản lý")
                                                    : "👤 Cá nhân"}
                                            </span>
                                            <span className="an-history-receivers">
                                                {n.receiverIds?.length || 0} người nhận
                                            </span>
                                            <span className="an-history-read">
                                                ✅ {n.readBy?.length || 0} đã đọc
                                            </span>
                                            <span className="an-history-date">{formatDate(n.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
