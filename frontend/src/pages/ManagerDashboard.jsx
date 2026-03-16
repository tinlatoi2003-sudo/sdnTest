import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import "./student/StudentDashboard.css";
import api from "../services/api";
import ChangePasswordModal from "../components/ChangePasswordModal";

const MENU = [
    { id: "overview", icon: "📊", label: "Tổng quan" },
    { id: "requests", icon: "📝", label: "Yêu cầu" },
    { id: "reports", icon: "📋", label: "Báo cáo" },
    { id: "unpaid", icon: "⚠️", label: "Chưa thanh toán" },
    { id: "buildings", icon: "🏢", label: "Tòa nhà" },
    { id: "notifications", icon: "🔔", label: "Thông báo" },
];

export default function ManagerDashboard() {
    const location = useLocation();
    const [active, setActive] = useState("overview");
    const [showChangePw, setShowChangePw] = useState(false);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        if (tab && ["overview", "requests", "reports", "unpaid", "buildings", "notifications"].includes(tab)) {
            setActive(tab);
        }
    }, [location.search]);

    const initials = (user.username || "MN")
        .slice(0, 2)
        .toUpperCase();

    // ── PANELS ──
    const OverviewPanel = () => {
        const [stats, setStats] = useState({});

        useEffect(() => {
            Promise.all([
                api.get("/manager/requests").catch(() => ({ data: { data: [] } })),
                api.get("/reports").catch(() => ({ data: { reports: [] } })),
                api.get("/buildings").catch(() => ({ data: { data: [] } })),
            ]).then(([reqs, reps, blds]) => {
                setStats({
                    pendingRequests: reqs.data.data?.filter(r => r.status === "pending").length || 0,
                    totalRequests: reqs.data.data?.length || 0,
                    pendingReports: reps.data.reports?.filter(r => r.status === "pending").length || 0,
                    totalReports: reps.data.reports?.length || 0,
                    totalBuildings: blds.data.data?.length || 0,
                });
            });
        }, []);

        return (
            <>
                <div className="sd-panel-header">
                    <h2 className="sd-panel-title">📊 Tổng quan</h2>
                    <p className="sd-panel-subtitle">Thống kê nhanh công việc quản lý</p>
                </div>

                <div className="ad-stats-grid">
                    <StatCard icon="📝" label="Yêu cầu chờ" value={stats.pendingRequests} color="#f59e0b" />
                    <StatCard icon="📑" label="Tổng yêu cầu" value={stats.totalRequests} color="#6366f1" />
                    <StatCard icon="📋" label="Báo cáo chờ" value={stats.pendingReports} color="#ef4444" />
                    <StatCard icon="🏢" label="Tòa nhà quản lý" value={stats.totalBuildings} color="#22c55e" />
                </div>

                <div className="sd-panel-header" style={{ marginTop: 32 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>⚡ Truy cập nhanh</h3>
                </div>
                <div className="ad-quick-grid">
                    <QuickLink icon="📝" label="Xử lý yêu cầu" onClick={() => setActive('requests')} />
                    <QuickLink icon="📋" label="Duyệt báo cáo" onClick={() => setActive('reports')} />
                    <QuickLink icon="🔔" label="Gửi thông báo" onClick={() => setActive('notifications')} />
                </div>
            </>
        );
    };

    const MR_TYPE_LABEL = {
        damage_report: "🔧 Báo hỏng hóc",
        room_transfer: "🔄 Chuyển phòng",
        room_retention: "📌 Giữ phòng",
        other: "📝 Khác",
    };
    const MR_STATUS_MAP = {
        pending: { label: "Chờ xử lý", color: "#f59e0b" },
        manager_approved: { label: "Đã duyệt", color: "#16a34a" },
        manager_rejected: { label: "Đã từ chối", color: "#dc2626" },
        completed: { label: "Hoàn thành", color: "#6366f1" },
    };
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

    const RequestsPanel = () => {
        const [data, setData] = useState([]);
        const [loading, setLoading] = useState(true);
        const [filterStatus, setFilterStatus] = useState("");
        const [filterType, setFilterType] = useState("");
        const [reqAlert, setReqAlert] = useState(null);
        const [modal, setModal] = useState(null);
        const [note, setNote] = useState("");
        const [nextTerm, setNextTerm] = useState("");
        const [submitting, setSubmitting] = useState(false);

        const showReqAlert = (type, msg) => { setReqAlert({ type, msg }); setTimeout(() => setReqAlert(null), 4000); };

        const load = useCallback(() => {
            setLoading(true);
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterType) params.type = filterType;
            api.get("/manager/requests", { params })
                .then(r => setData(r.data.data || []))
                .catch(() => showReqAlert("error", "Không thể tải danh sách yêu cầu"))
                .finally(() => setLoading(false));
        }, [filterStatus, filterType]);

        useEffect(() => { load(); }, [load]);



        const openModal = (mode, item) => { setModal({ mode, item }); setNote(""); setNextTerm(""); };

        const handleSubmit = async () => {
            setSubmitting(true);
            try {
                if (modal.mode === "retention") {
                    if (!nextTerm) { setSubmitting(false); return showReqAlert("error", "Nhập kỳ học tiếp theo"); }
                    await api.put(`/manager/requests/${modal.item._id}/approve-retention`, { nextTermCode: nextTerm });
                    showReqAlert("success", `✅ Đã duyệt giữ phòng kỳ ${nextTerm}`);
                } else {
                    const action = modal.mode === "approve" ? "approve" : "reject";
                    await api.put(`/manager/requests/${modal.item._id}`, { action, note });
                    showReqAlert("success", `✅ Đã ${action === "approve" ? "duyệt" : "từ chối"} yêu cầu`);
                }
                setModal(null);
                load();
            } catch (err) {
                showReqAlert("error", err.response?.data?.message || "Thao tác thất bại");
            }
            setSubmitting(false);
        };

        const pending = data.filter(r => r.status === "pending").length;
        const approved = data.filter(r => r.status === "manager_approved" || r.status === "completed").length;

        const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" };

        return (
            <>
                <div className="sd-panel-header">
                    <h2 className="sd-panel-title">📝 Yêu cầu sinh viên</h2>
                    <p className="sd-panel-subtitle">Duyệt và quản lý yêu cầu từ sinh viên KTX</p>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                    {[
                        { label: "Chờ xử lý", val: pending, color: "#f59e0b" },
                        { label: "Đã duyệt", val: approved, color: "#16a34a" },
                        { label: "Tổng cộng", val: data.length, color: "#e8540a" },
                    ].map(s => (
                        <div key={s.label} style={{ flex: 1, minWidth: 100, padding: "12px 16px", borderRadius: 10, background: s.color + "0f", border: `1.5px solid ${s.color}33` }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                            <div style={{ fontSize: 12, color: "#777", fontWeight: 600 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Alert */}
                {reqAlert && (
                    <div style={{
                        padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600,
                        background: reqAlert.type === "success" ? "#dcfce7" : "#fee2e2",
                        color: reqAlert.type === "success" ? "#16a34a" : "#dc2626",
                        border: `1px solid ${reqAlert.type === "success" ? "#86efac" : "#fca5a5"}`,
                    }}>
                        {reqAlert.msg}
                    </div>
                )}

                {/* Filters */}
                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                    <select style={{ ...inputStyle, flex: 1, minWidth: 140 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">Tất cả trạng thái</option>
                        <option value="pending">Chờ xử lý</option>
                        <option value="manager_approved">Đã duyệt</option>
                        <option value="manager_rejected">Đã từ chối</option>
                        <option value="completed">Hoàn thành</option>
                    </select>
                    <select style={{ ...inputStyle, flex: 1, minWidth: 140 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="">Tất cả loại</option>
                        <option value="damage_report">Báo hỏng hóc</option>
                        <option value="room_transfer">Chuyển phòng</option>
                        <option value="room_retention">Giữ phòng</option>
                        <option value="other">Khác</option>
                    </select>
                </div>

                {/* Table / List */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: 24, color: "#bbb" }}>
                        <div className="sd-spinner" style={{ margin: "0 auto" }} />
                    </div>
                ) : data.length === 0 ? (
                    <div className="sd-empty">
                        <span className="sd-empty-icon">📭</span>
                        <p className="sd-empty-text">Không có yêu cầu nào</p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                                    {["Sinh viên", "Loại yêu cầu", "Tiêu đề", "Phòng", "Ngày gửi", "Trạng thái", "Thao tác"].map(h => (
                                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#374151", whiteSpace: "nowrap" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map(item => {
                                    const s = MR_STATUS_MAP[item.status] || { label: item.status, color: "#888" };
                                    const sv = item.studentId;
                                    return (
                                        <tr key={item._id} style={{ borderBottom: "1px solid #f1f5f9" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                            onMouseLeave={e => e.currentTarget.style.background = ""}>
                                            <td style={{ padding: "10px 12px" }}>
                                                <div style={{ fontWeight: 700 }}>{sv?.fullName || sv?.userId?.username || "—"}</div>
                                                <div style={{ fontSize: 11, color: "#888" }}>{sv?.studentCode || ""}</div>
                                            </td>
                                            <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{MR_TYPE_LABEL[item.type] || item.type}</td>
                                            <td style={{ padding: "10px 12px", maxWidth: 200 }}>
                                                <div style={{ fontWeight: 600 }}>{item.title}</div>
                                                <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>{item.description?.slice(0, 60)}{item.description?.length > 60 ? "..." : ""}</div>
                                            </td>
                                            <td style={{ padding: "10px 12px", color: "#555" }}>
                                                {item.currentRoomId ? `P.${item.currentRoomId.roomNumber}` : "—"}
                                            </td>
                                            <td style={{ padding: "10px 12px", color: "#666", whiteSpace: "nowrap" }}>{fmtDate(item.createdAt)}</td>
                                            <td style={{ padding: "10px 12px" }}>
                                                <span style={{
                                                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                                    background: s.color + "15", color: s.color, border: `1px solid ${s.color}33`,
                                                    whiteSpace: "nowrap",
                                                }}>{s.label}</span>
                                                {item.managerReview?.note && <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{item.managerReview.note}</div>}
                                            </td>
                                            <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                                                {item.status === "pending" ? (
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        {item.type === "room_retention" ? (
                                                            <button onClick={() => openModal("retention", item)}
                                                                style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "#16a34a", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                                                                📌 Duyệt
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => openModal("approve", item)}
                                                                style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "#16a34a", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                                                                ✅ Duyệt
                                                            </button>
                                                        )}
                                                        <button onClick={() => openModal("reject", item)}
                                                            style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                                                            ✕ Từ chối
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: 12, color: "#bbb" }}>Đã xử lý</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal */}
                {modal && (
                    <div style={{ position: "fixed", inset: 0, background: "#0005", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
                        onClick={() => setModal(null)}>
                        <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px #0003" }}
                            onClick={e => e.stopPropagation()}>
                            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "#1a1a1a" }}>
                                {modal.mode === "retention" ? "📌 Duyệt giữ phòng" : modal.mode === "approve" ? "✅ Duyệt yêu cầu" : "✕ Từ chối yêu cầu"}
                            </div>
                            <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
                                <strong>{modal.item.title}</strong><br />
                                Sinh viên: {modal.item.studentId?.fullName || "—"}
                            </div>
                            {modal.mode === "retention" && (
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                                        Kỳ học tiếp theo <span style={{ color: "#ef4444" }}>*</span>
                                    </label>
                                    <input style={inputStyle} placeholder="VD: HK1-2025" value={nextTerm} onChange={e => setNextTerm(e.target.value)} />
                                </div>
                            )}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                                    Ghi chú {modal.mode !== "retention" ? "(tuỳ chọn)" : ""}
                                </label>
                                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                                    placeholder="Lý do hoặc ghi chú..." value={note} onChange={e => setNote(e.target.value)} />
                            </div>
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                <button onClick={() => setModal(null)}
                                    style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#555" }}>
                                    Hủy
                                </button>
                                <button onClick={handleSubmit} disabled={submitting}
                                    style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: submitting ? "#ccc" : (modal.mode === "reject" ? "#ef4444" : "#16a34a"), color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13 }}>
                                    {submitting ? "Đang xử lý..." : "Xác nhận"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    };


    const ReportsPanel = () => {
        const [data, setData] = useState([]);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            api.get("/reports?limit=5")
                .then((r) => setData(r.data.reports || []))
                .catch(() => { })
                .finally(() => setLoading(false));
        }, []);

        return (
            <>
                <div className="sd-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h2 className="sd-panel-title">📋 Báo cáo gần đây</h2>
                        <p className="sd-panel-subtitle">5 báo cáo mới nhất</p>
                    </div>
                    <button
                        style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: "1.5px solid #e8540a",
                            background: "#fff",
                            color: "#e8540a",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: 14,
                        }}
                        onClick={() => setActive('reports')}
                    >
                        Xem tất cả →
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "#bbb" }}>
                        <div className="sd-spinner" style={{ margin: "0 auto" }} />
                    </div>
                ) : data.length === 0 ? (
                    <div className="sd-empty">
                        <span className="sd-empty-icon">📋</span>
                        <p className="sd-empty-text">Không có báo cáo nào</p>
                    </div>
                ) : (
                    <div className="sd-list">
                        {data.map((item) => (
                            <div key={item._id} className="sd-list-item">
                                <div className="sd-list-icon" style={{ background: "#6366f122", color: "#6366f1" }}>📋</div>
                                <div className="sd-list-body">
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <span className="sd-list-title">{item.title}</span>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                padding: "2px 8px",
                                                borderRadius: 6,
                                                background: item.status === "pending" ? "#f59e0b22" : "#22c55e22",
                                                color: item.status === "pending" ? "#f59e0b" : "#22c55e",
                                            }}
                                        >
                                            {item.status === "pending" ? "Chờ duyệt" : "Đã duyệt"}
                                        </span>
                                    </div>
                                    <p className="sd-list-text">{item.content?.slice(0, 80)}...</p>
                                    <div className="sd-list-meta">
                                        Từ: {item.createdBy?.username || "—"} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "—"}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };

    const TYPE_OPTIONS = [
        { value: "general", label: "📢 Thông báo chung" },
        { value: "payment_reminder", label: "💳 Nhắc thanh toán" },
        { value: "maintenance", label: "🔧 Bảo trì" },
        { value: "announcement", label: "📣 Thông báo quan trọng" },
    ];

    const NotificationsPanel = () => {
        const INIT_FORM = { title: "", message: "", type: "general", receiverType: "building" };
        const [form, setForm] = useState(INIT_FORM);
        const [sending, setSending] = useState(false);
        const [notifAlert, setNotifAlert] = useState({ type: "", msg: "" });
        const [sentList, setSentList] = useState([]);
        const [loadingList, setLoadingList] = useState(true);
        const [activeNotifTab, setActiveNotifTab] = useState("send");

        // Building info & student search
        const [buildingInfo, setBuildingInfo] = useState({ buildings: [], students: [], total: 0 });
        const [loadingBuilding, setLoadingBuilding] = useState(true);
        const [searchKw, setSearchKw] = useState("");
        const [searchResults, setSearchResults] = useState([]);
        const [searching, setSearching] = useState(false);
        const [selectedStudents, setSelectedStudents] = useState([]); // [{userId, fullName, studentCode, userId.username}]

        const showNotifAlert = (type, msg) => {
            setNotifAlert({ type, msg });
            setTimeout(() => setNotifAlert({ type: "", msg: "" }), 4000);
        };

        const loadBuildingInfo = async () => {
            setLoadingBuilding(true);
            try {
                const { data } = await api.get("/notifications/manager/building-students");
                setBuildingInfo(data);
            } catch { /* silent */ }
            finally { setLoadingBuilding(false); }
        };

        const loadSentList = async () => {
            setLoadingList(true);
            try {
                const { data } = await api.get("/notifications/sent?limit=30");
                setSentList(data.data || []);
            } catch { /* silent */ }
            finally { setLoadingList(false); }
        };

        useEffect(() => {
            loadBuildingInfo();
            loadSentList();
        }, []);

        // Debounced search
        useEffect(() => {
            if (!searchKw.trim()) { setSearchResults([]); return; }
            const timer = setTimeout(async () => {
                setSearching(true);
                try {
                    const { data } = await api.get(`/notifications/manager/building-students?search=${encodeURIComponent(searchKw)}`);
                    setSearchResults(data.students || []);
                } catch { setSearchResults([]); }
                finally { setSearching(false); }
            }, 300);
            return () => clearTimeout(timer);
        }, [searchKw]);

        const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

        const addStudent = (s) => {
            const uid = String(s.userId?._id || s.userId);
            if (!selectedStudents.find(x => String(x.userId) === uid)) {
                setSelectedStudents(prev => [...prev, {
                    userId: uid,
                    fullName: s.fullName,
                    studentCode: s.studentCode,
                    username: s.userId?.username || "",
                    building: s.currentRoomId?.buildingId?.name || "",
                }]);
            }
            setSearchKw("");
            setSearchResults([]);
        };

        const removeStudent = (uid) => setSelectedStudents(prev => prev.filter(x => x.userId !== uid));

        const handleSend = async (e) => {
            e.preventDefault();
            if (!form.title.trim() || !form.message.trim()) {
                showNotifAlert("error", "Vui lòng điền đầy đủ tiêu đề và nội dung");
                return;
            }
            if (form.receiverType === "individual" && selectedStudents.length === 0) {
                showNotifAlert("error", "Vui lòng chọn ít nhất một sinh viên");
                return;
            }
            setSending(true);
            try {
                const payload = {
                    ...form,
                    receiverIds: form.receiverType === "individual" ? selectedStudents.map(s => s.userId) : [],
                };
                const { data } = await api.post("/notifications/send", payload);
                showNotifAlert("success", data.message || "Gửi thông báo thành công!");
                setForm(INIT_FORM);
                setSelectedStudents([]);
                setSearchKw("");
                loadSentList();
                setActiveNotifTab("history");
            } catch (err) {
                showNotifAlert("error", err.response?.data?.message || "Gửi thất bại");
            } finally {
                setSending(false);
            }
        };

        const inputStyle = {
            width: "100%", padding: "10px 14px", borderRadius: 8,
            border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none",
            boxSizing: "border-box", fontFamily: "inherit",
        };
        const labelStyle = { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" };
        const tabBtn = (id, label) => (
            <button onClick={() => setActiveNotifTab(id)} style={{
                padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 13,
                background: activeNotifTab === id ? "#e8540a" : "#f3f4f6",
                color: activeNotifTab === id ? "#fff" : "#555",
                transition: "all .2s",
            }}>{label}</button>
        );

        const buildingNames = buildingInfo.buildings?.map(b => b.name).join(", ") || "—";

        return (
            <>
                <div className="sd-panel-header">
                    <h2 className="sd-panel-title">🔔 Gửi thông báo</h2>
                    <p className="sd-panel-subtitle">Gửi thông báo tới sinh viên trong tòa nhà bạn quản lý</p>
                </div>

                {/* Building summary */}
                {!loadingBuilding && (
                    <div style={{
                        display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap",
                    }}>
                        <div style={{
                            flex: 1, minWidth: 160, padding: "12px 16px", borderRadius: 10,
                            background: "#f0fdf4", border: "1.5px solid #86efac",
                        }}>
                            <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, marginBottom: 2 }}>🏢 TÒA NHÀ QUẢN LÝ</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>{buildingNames || "Chưa được gán"}</div>
                        </div>
                        <div style={{
                            flex: 1, minWidth: 160, padding: "12px 16px", borderRadius: 10,
                            background: "#eff6ff", border: "1.5px solid #93c5fd",
                        }}>
                            <div style={{ fontSize: 11, color: "#1d4ed8", fontWeight: 600, marginBottom: 2 }}>🎓 TỔNG SINH VIÊN</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: "#1e40af" }}>{buildingInfo.total ?? "—"}</div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                    {tabBtn("send", "✉️ Soạn thông báo")}
                    {tabBtn("history", `📋 Lịch sử${sentList.length > 0 ? ` (${sentList.length})` : ""}`)}
                </div>

                {/* Alert */}
                {notifAlert.msg && (
                    <div style={{
                        padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600,
                        background: notifAlert.type === "success" ? "#dcfce7" : "#fee2e2",
                        color: notifAlert.type === "success" ? "#16a34a" : "#dc2626",
                        border: `1px solid ${notifAlert.type === "success" ? "#86efac" : "#fca5a5"}`,
                    }}>
                        {notifAlert.type === "success" ? "✅" : "⚠️"} {notifAlert.msg}
                    </div>
                )}

                {/* Tab: Soạn */}
                {activeNotifTab === "send" && (
                    <>
                        {buildingInfo.buildings?.length === 0 && !loadingBuilding ? (
                            <div style={{ padding: "24px", textAlign: "center", background: "#fff7ed", borderRadius: 10, border: "1.5px solid #fed7aa" }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>🏢</div>
                                <div style={{ fontWeight: 700, color: "#c2410c", marginBottom: 4 }}>Bạn chưa được gán quản lý tòa nhà nào</div>
                                <div style={{ fontSize: 13, color: "#9a3412" }}>Liên hệ admin để được phân công tòa nhà trước khi gửi thông báo.</div>
                            </div>
                        ) : (
                            <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                                {/* Loại thông báo */}
                                <div>
                                    <label style={labelStyle}>Loại thông báo</label>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                                        {TYPE_OPTIONS.map((t) => (
                                            <label key={t.value} style={{
                                                display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                                                borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                                                border: `1.5px solid ${form.type === t.value ? "#e8540a" : "#e2e8f0"}`,
                                                background: form.type === t.value ? "#fff4f0" : "#fafafa",
                                                color: form.type === t.value ? "#e8540a" : "#555",
                                            }}>
                                                <input type="radio" name="type" value={t.value}
                                                    checked={form.type === t.value} onChange={handleChange}
                                                    style={{ display: "none" }} />
                                                {t.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Đối tượng nhận */}
                                <div>
                                    <label style={labelStyle}>Gửi đến</label>
                                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                        {[
                                            { val: "building", icon: "🏢", label: `Tất cả sinh viên (${buildingInfo.total})` },
                                            { val: "individual", icon: "👤", label: "Chọn sinh viên cụ thể" },
                                        ].map(opt => (
                                            <button key={opt.val} type="button"
                                                onClick={() => { setForm(p => ({ ...p, receiverType: opt.val })); setSelectedStudents([]); setSearchKw(""); }}
                                                style={{
                                                    flex: 1, padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                                                    fontWeight: 600, fontSize: 13,
                                                    border: `1.5px solid ${form.receiverType === opt.val ? "#e8540a" : "#e2e8f0"}`,
                                                    background: form.receiverType === opt.val ? "#fff4f0" : "#fafafa",
                                                    color: form.receiverType === opt.val ? "#e8540a" : "#555",
                                                }}>
                                                {opt.icon} {opt.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Individual: search + tags */}
                                    {form.receiverType === "individual" && (
                                        <div>
                                            <div style={{ position: "relative" }}>
                                                <input style={inputStyle}
                                                    placeholder="🔍 Tìm tên, mã sinh viên, username..."
                                                    value={searchKw}
                                                    onChange={e => setSearchKw(e.target.value)} />
                                                {searching && (
                                                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#999" }}>
                                                        Đang tìm...
                                                    </span>
                                                )}
                                                {searchResults.length > 0 && (
                                                    <div style={{
                                                        position: "absolute", top: "100%", left: 0, right: 0, background: "#fff",
                                                        border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px #0002",
                                                        zIndex: 100, maxHeight: 220, overflowY: "auto", marginTop: 4,
                                                    }}>
                                                        {searchResults.map(s => {
                                                            const uid = String(s.userId?._id || s.userId);
                                                            const alreadyAdded = selectedStudents.find(x => x.userId === uid);
                                                            return (
                                                                <div key={uid}
                                                                    onClick={() => !alreadyAdded && addStudent(s)}
                                                                    style={{
                                                                        padding: "10px 14px", cursor: alreadyAdded ? "default" : "pointer",
                                                                        borderBottom: "1px solid #f1f5f9",
                                                                        display: "flex", alignItems: "center", gap: 10,
                                                                        background: alreadyAdded ? "#f0fdf4" : "#fff",
                                                                        opacity: alreadyAdded ? 0.7 : 1,
                                                                    }}
                                                                    onMouseEnter={e => { if (!alreadyAdded) e.currentTarget.style.background = "#f8fafc"; }}
                                                                    onMouseLeave={e => { if (!alreadyAdded) e.currentTarget.style.background = "#fff"; }}>
                                                                    <div style={{
                                                                        width: 34, height: 34, borderRadius: "50%",
                                                                        background: "#e8540a", color: "#fff",
                                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                                        fontSize: 13, fontWeight: 700, flexShrink: 0,
                                                                    }}>
                                                                        {s.fullName[0]}
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{s.fullName}</div>
                                                                        <div style={{ fontSize: 11, color: "#888" }}>
                                                                            {s.studentCode} · {s.userId?.username} · 🏢 {s.currentRoomId?.buildingId?.name}
                                                                        </div>
                                                                    </div>
                                                                    {alreadyAdded && <span style={{ color: "#22c55e", fontSize: 16 }}>✓</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                {searchKw && !searching && searchResults.length === 0 && (
                                                    <div style={{ padding: "10px 14px", fontSize: 13, color: "#888", background: "#fafafa", border: "1px solid #e2e8f0", borderRadius: 8, marginTop: 4 }}>
                                                        Không tìm thấy sinh viên nào trong tòa nhà của bạn
                                                    </div>
                                                )}
                                            </div>

                                            {/* Selected tags */}
                                            {selectedStudents.length > 0 ? (
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                                                    {selectedStudents.map(s => (
                                                        <span key={s.userId} style={{
                                                            display: "flex", alignItems: "center", gap: 5,
                                                            background: "#fff4f0", border: "1px solid #fed7aa",
                                                            borderRadius: 20, padding: "4px 10px", fontSize: 12, color: "#ea580c",
                                                        }}>
                                                            👤 {s.fullName} ({s.studentCode})
                                                            <button type="button" onClick={() => removeStudent(s.userId)}
                                                                style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: 0, lineHeight: 1 }}>
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ fontSize: 12, color: "#e8540a", marginTop: 8 }}>⚠️ Chưa chọn sinh viên nào</p>
                                            )}
                                        </div>
                                    )}

                                    {form.receiverType === "building" && (
                                        <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
                                            📤 Sẽ gửi đến <strong>{buildingInfo.total}</strong> sinh viên trong: <strong>{buildingNames}</strong>
                                        </p>
                                    )}
                                </div>

                                {/* Tiêu đề */}
                                <div>
                                    <label style={labelStyle}>Tiêu đề <span style={{ color: "#e8540a" }}>*</span></label>
                                    <input style={inputStyle} name="title" value={form.title}
                                        onChange={handleChange} placeholder="Nhập tiêu đề thông báo..."
                                        maxLength={120} required />
                                    <span style={{ fontSize: 11, color: "#aaa", float: "right", marginTop: 2 }}>{form.title.length}/120</span>
                                </div>

                                {/* Nội dung */}
                                <div>
                                    <label style={labelStyle}>Nội dung <span style={{ color: "#e8540a" }}>*</span></label>
                                    <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
                                        name="message" value={form.message} onChange={handleChange}
                                        placeholder="Nhập nội dung thông báo..." rows={4} maxLength={1000} required />
                                    <span style={{ fontSize: 11, color: "#aaa", float: "right", marginTop: 2 }}>{form.message.length}/1000</span>
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
                                    <button type="button" onClick={() => { setForm(INIT_FORM); setSelectedStudents([]); setSearchKw(""); }}
                                        style={{ padding: "10px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#555" }}>
                                        🔄 Đặt lại
                                    </button>
                                    <button type="submit" disabled={sending || buildingInfo.buildings?.length === 0}
                                        style={{
                                            padding: "10px 24px", borderRadius: 8, border: "none",
                                            background: (sending || buildingInfo.buildings?.length === 0) ? "#ccc" : "#e8540a",
                                            color: "#fff",
                                            cursor: (sending || buildingInfo.buildings?.length === 0) ? "not-allowed" : "pointer",
                                            fontWeight: 700, fontSize: 13,
                                        }}>
                                        {sending ? "⏳ Đang gửi..." : "📤 Gửi thông báo"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                )}

                {/* Tab: Lịch sử */}
                {activeNotifTab === "history" && (
                    <div>
                        {loadingList ? (
                            <div style={{ textAlign: "center", padding: 24, color: "#bbb" }}>
                                <div className="sd-spinner" style={{ margin: "0 auto" }} />
                            </div>
                        ) : sentList.length === 0 ? (
                            <div className="sd-empty">
                                <span className="sd-empty-icon">📭</span>
                                <p className="sd-empty-text">Chưa có thông báo nào được gửi</p>
                            </div>
                        ) : (
                            <div className="sd-list">
                                {sentList.map((n) => (
                                    <div key={n._id} className="sd-list-item">
                                        <div className="sd-list-icon" style={{ background: "#2563eb22", color: "#2563eb" }}>🔔</div>
                                        <div className="sd-list-body">
                                            <div className="sd-list-title">{n.title}</div>
                                            <p className="sd-list-text">{n.message?.slice(0, 80)}{n.message?.length > 80 ? "..." : ""}</p>
                                            <div className="sd-list-meta">
                                                {n.receiverIds?.length || 0} người nhận · ✅ {n.readBy?.length || 0} đã đọc · {n.createdAt ? new Date(n.createdAt).toLocaleDateString("vi-VN") : "—"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </>
        );
    };


    const UnpaidStudentsPanel = () => {
        const [data, setData] = useState([]);
        const [overview, setOverview] = useState({ studentCount: 0, totalDebt: 0, overdueCount: 0 });
        const [loading, setLoading] = useState(true);
        const [alert, setAlert] = useState(null);
        const [sendingReminderId, setSendingReminderId] = useState(null);

        const fmtMoney = (value) => Number(value || 0).toLocaleString("vi-VN");

        const load = useCallback(() => {
            setLoading(true);
            api.get("/manager/unpaid-students")
                .then((r) => {
                    setData(r.data.data || []);
                    setOverview(r.data.overview || { studentCount: 0, totalDebt: 0, overdueCount: 0 });
                })
                .catch((err) => setAlert({ type: "error", msg: err.response?.data?.message || "Không thể tải danh sách sinh viên còn nợ" }))
                .finally(() => setLoading(false));
        }, []);

        useEffect(() => { load(); }, [load]);

        const sendReminder = async (item) => {
            const receiverId = item.student?.userId?._id;
            if (!receiverId) {
                setAlert({ type: "error", msg: "Không tìm thấy tài khoản sinh viên để gửi nhắc thanh toán" });
                return;
            }

            setSendingReminderId(String(item.studentId));
            try {
                await api.post("/notifications/send", {
                    title: "Nhắc thanh toán hóa đơn KTX",
                    message: `Bạn còn ${item.invoiceCount} hóa đơn chưa thanh toán với tổng số tiền ${fmtMoney(item.totalDebt)}d. Vui lòng vào mục Thanh toán để hoàn tất sớm.`,
                    type: "payment_reminder",
                    receiverType: "individual",
                    receiverIds: [receiverId],
                });
                setAlert({ type: "success", msg: `Đã gửi nhắc thanh toán cho ${item.student?.fullName}` });
            } catch (err) {
                setAlert({ type: "error", msg: err.response?.data?.message || "Gửi nhắc thanh toán thất bại" });
            } finally {
                setSendingReminderId(null);
            }
        };

        return (
            <>
                <div className="sd-panel-header">
                    <h2 className="sd-panel-title">Sinh viên chưa thanh toán</h2>
                    <p className="sd-panel-subtitle">Danh sách sinh viên còn nợ trong các tòa nhà bạn quản lý</p>
                </div>

                {alert && (
                    <div style={{
                        padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600,
                        background: alert.type === "success" ? "#dcfce7" : "#fee2e2",
                        color: alert.type === "success" ? "#16a34a" : "#dc2626",
                        border: `1px solid ${alert.type === "success" ? "#86efac" : "#fca5a5"}`,
                    }}>
                        {alert.msg}
                    </div>
                )}

                <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 180, padding: "12px 16px", borderRadius: 10, background: "#eff6ff", border: "1.5px solid #93c5fd55" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#2563eb" }}>{overview.studentCount}</div>
                        <div style={{ fontSize: 12, color: "#777", fontWeight: 600 }}>Sinh viên còn nợ</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 180, padding: "12px 16px", borderRadius: 10, background: "#fff7ed", border: "1.5px solid #fdba7455" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#ea580c" }}>{fmtMoney(overview.totalDebt)}d</div>
                        <div style={{ fontSize: 12, color: "#777", fontWeight: 600 }}>Tổng công nợ</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 180, padding: "12px 16px", borderRadius: 10, background: "#fef2f2", border: "1.5px solid #fca5a555" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#dc2626" }}>{overview.overdueCount}</div>
                        <div style={{ fontSize: 12, color: "#777", fontWeight: 600 }}>Bill quá hạn</div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#bbb" }}>
                        <div className="sd-spinner" style={{ margin: "0 auto" }} />
                    </div>
                ) : data.length === 0 ? (
                    <div className="sd-empty">
                        <span className="sd-empty-icon">OK</span>
                        <p className="sd-empty-text">Không có sinh viên nào còn nợ trong tòa nhà bạn quản lý</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {data.map((item) => (
                            <div key={item.studentId} style={{ border: "1.5px solid #e2e8f0", borderRadius: 12, padding: 16, background: "#fff" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>
                                            {item.student?.fullName} <span style={{ color: "#94a3b8", fontWeight: 600 }}>({item.student?.studentCode})</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                                            {item.building?.name || "�"} � Phong {item.student?.currentRoom?.roomNumber || "�"} � {item.student?.userId?.email || "�"}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: "#dc2626" }}>{fmtMoney(item.totalDebt)}d</div>
                                        <div style={{ fontSize: 12, color: "#777" }}>{item.invoiceCount} bill � qua han {item.overdueCount}</div>
                                        <button
                                            onClick={() => sendReminder(item)}
                                            disabled={sendingReminderId === String(item.studentId)}
                                            style={{
                                                marginTop: 8,
                                                padding: "8px 12px",
                                                borderRadius: 8,
                                                border: "none",
                                                background: sendingReminderId === String(item.studentId) ? "#cbd5e1" : "#f59e0b",
                                                color: "#fff",
                                                cursor: sendingReminderId === String(item.studentId) ? "not-allowed" : "pointer",
                                                fontWeight: 700,
                                                fontSize: 12,
                                            }}
                                        >
                                            {sendingReminderId === String(item.studentId) ? "Dang gui..." : "Gui nhac thanh toan"}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                                    {item.invoices.map((invoice) => (
                                        <div key={invoice._id} style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "10px 12px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 13, color: "#334155" }}>{invoice.invoiceCode}</div>
                                                <div style={{ fontSize: 12, color: "#64748b" }}>{invoice.description || "�"}</div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontWeight: 800, fontSize: 13, color: invoice.status === "overdue" ? "#dc2626" : "#ea580c" }}>
                                                    {fmtMoney(invoice.remainingAmount)}d
                                                </div>
                                                <div style={{ fontSize: 12, color: "#64748b" }}>
                                                    Han: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("vi-VN") : "�"} � {invoice.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };
    // ─── BUILDINGS PANEL ───────────────────────────────────────────────────────
    const BuildingsPanel = () => {
        const [buildings, setBuildings] = useState([]);
        const [loading, setLoading] = useState(true);
        const [openBldg, setOpenBldg] = useState(null);   // building._id đang mở
        const [selectedSv, setSelectedSv] = useState(null); // { sv, roomId, buildingName }
        const [billModal, setBillModal] = useState(null);  // { type: 'violation'|'damage', sv, roomId }
        const [billForm, setBillForm] = useState({ amount: "", description: "", dueDate: "" });
        const [electricModal, setElectricModal] = useState(null); // { room, buildingName }
        const [electricForm, setElectricForm] = useState({
            currentReading: "",
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            dueDate: "",
        });
        const [sending, setSending] = useState(false);
        const [recordingElectricity, setRecordingElectricity] = useState(false);
        const [bldAlert, setBldAlert] = useState(null);

        const showAlert = (type, msg) => { setBldAlert({ type, msg }); setTimeout(() => setBldAlert(null), 5000); };

        const loadBuildingRooms = useCallback(async () => {
            const r = await api.get("/manager/building-rooms");
            setBuildings(r.data.data || []);
        }, []);

        useEffect(() => {
            api.get("/manager/building-rooms")
                .then(r => setBuildings(r.data.data || []))
                .catch(() => showAlert("error", "Không thể tải dữ liệu tòa nhà"))
                .finally(() => setLoading(false));
        }, []);

        const openBill = (type, sv, roomId, buildingName) => {
            setBillModal({ type, sv, roomId, buildingName });
            // Tự điền giá mặc định cho vi phạm (từ setting, hardcode 200000)
            const defaultAmt = type === "violation" ? "200000" : "";
            // Hạn thanh toán mặc định 15 ngày
            const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
            setBillForm({ amount: defaultAmt, description: "", dueDate });
        };

        const handleSendBill = async () => {
            if (!billForm.amount || Number(billForm.amount) <= 0)
                return showAlert("error", "Vui lòng nhập số tiền hợp lệ");
            if (!billForm.dueDate)
                return showAlert("error", "Vui lòng chọn hạn thanh toán");

            setSending(true);
            try {
                const invoiceType = billModal.type === "violation" ? "violation_fine" : "damage_compensation";
                await api.post("/invoices", {
                    studentId: billModal.sv._id,
                    type: invoiceType,
                    amount: Number(billForm.amount),
                    description: billForm.description || (billModal.type === "violation" ? "Vi phạm quy chế KTX" : "Đền bù thiệt hại cơ sở vật chất"),
                    dueDate: billForm.dueDate,
                });
                showAlert("success", `✅ Đã gửi bill cho sinh viên ${billModal.sv.fullName}`);
                setBillModal(null);
                setSelectedSv(null);
            } catch (err) {
                showAlert("error", err.response?.data?.message || "Gửi bill thất bại");
            }
            setSending(false);
        };

        const openElectricityModal = (room, buildingName) => {
            setElectricModal({ room, buildingName });
            setElectricForm({
                currentReading: "",
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                dueDate: "",
            });
        };

        const handleRecordElectricity = async () => {
            const reading = Number(electricForm.currentReading);
            const month = Number(electricForm.month);
            const year = Number(electricForm.year);

            if (!electricModal?.room?._id) return;
            if (Number.isNaN(reading) || reading < 0) {
                return showAlert("error", "Vui lòng nhập chỉ số điện hợp lệ");
            }
            if (Number.isNaN(month) || month < 1 || month > 12) {
                return showAlert("error", "Tháng phải từ 1 đến 12");
            }
            if (Number.isNaN(year) || year < 2000 || year > 2100) {
                return showAlert("error", "Năm không hợp lệ");
            }

            setRecordingElectricity(true);
            try {
                const payload = {
                    currentReading: reading,
                    month,
                    year,
                };
                if (electricForm.dueDate) payload.dueDate = electricForm.dueDate;

                const { data } = await api.post(`/manager/rooms/${electricModal.room._id}/electricity`, payload);
                const billing = data?.data?.billing;
                showAlert(
                    "success",
                    `Đã ghi số điện P.${electricModal.room.roomNumber}. Tổng ${billing?.totalKwh ?? 0} kWh, vượt free ${billing?.excessKwh ?? 0} kWh, chia ${billing?.occupantCount ?? 0} sinh viên.`
                );
                setElectricModal(null);
                await loadBuildingRooms();
            } catch (err) {
                showAlert("error", err.response?.data?.message || "Ghi số điện thất bại");
            } finally {
                setRecordingElectricity(false);
            }
        };

        const ROOM_STATUS_COLORS = { available: "#16a34a", partial: "#f59e0b", full: "#ef4444", maintenance: "#6b7280" };
        const ROOM_STATUS_LABELS = { available: "Còn trống", partial: "Còn chỗ", full: "Đầy", maintenance: "Bảo trì" };
        const TYPE_LABELS = { standard: "Tiêu chuẩn", vip: "VIP", premium: "Premium" };
        const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" };

        return (
            <>
                <div className="sd-panel-header">
                    <h2 className="sd-panel-title">🏢 Quản lý tòa nhà</h2>
                    <p className="sd-panel-subtitle">Xem phòng và sinh viên trong tòa nhà bạn quản lý</p>
                </div>

                {bldAlert && (
                    <div style={{
                        padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600,
                        background: bldAlert.type === "success" ? "#dcfce7" : "#fee2e2",
                        color: bldAlert.type === "success" ? "#16a34a" : "#dc2626",
                        border: `1px solid ${bldAlert.type === "success" ? "#86efac" : "#fca5a5"}`,
                    }}>
                        {bldAlert.msg}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#bbb" }}>
                        <div className="sd-spinner" style={{ margin: "0 auto" }} />
                    </div>
                ) : buildings.length === 0 ? (
                    <div className="sd-empty">
                        <span className="sd-empty-icon">🏗️</span>
                        <p className="sd-empty-text">Bạn chưa được gán quản lý tòa nhà nào</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {buildings.map(b => (
                            <div key={b._id} style={{ border: "1.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
                                {/* Building header */}
                                <div
                                    onClick={() => setOpenBldg(openBldg === b._id ? null : b._id)}
                                    style={{
                                        padding: "14px 20px", background: "#f8fafc", cursor: "pointer",
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                    }}
                                >
                                    <div>
                                        <span style={{ fontWeight: 800, fontSize: 16, color: "#1a1a1a" }}>🏢 {b.name}</span>
                                        <span style={{ marginLeft: 12, fontSize: 12, color: "#888" }}>
                                            📍 {b.address || "—"} · {b.totalFloors} tầng · {b.rooms?.length || 0} phòng
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <span style={{
                                            padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                            background: b.status === "active" ? "#dcfce7" : "#fee2e2",
                                            color: b.status === "active" ? "#16a34a" : "#dc2626",
                                        }}>{b.status === "active" ? "Hoạt động" : b.status === "maintenance" ? "Bảo trì" : "Tạm đóng"}</span>
                                        <span style={{ fontSize: 18, color: "#94a3b8", transform: openBldg === b._id ? "rotate(180deg)" : "none", transition: "0.2s" }}>▾</span>
                                    </div>
                                </div>

                                {/* Rooms grid */}
                                {openBldg === b._id && (
                                    <div style={{ padding: 16 }}>
                                        {b.rooms?.length === 0 ? (
                                            <div style={{ textAlign: "center", color: "#bbb", padding: 20 }}>Chưa có phòng nào</div>
                                        ) : (
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                                                {b.rooms.map(room => {
                                                    const statusColor = ROOM_STATUS_COLORS[room.status] || "#6b7280";
                                                    const hasStudents = room.students?.length > 0;
                                                    return (
                                                        <div key={room._id} style={{
                                                            border: `1.5px solid ${statusColor}44`,
                                                            borderRadius: 10, padding: 12, background: statusColor + "08",
                                                        }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                                                <span style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a" }}>P.{room.roomNumber}</span>
                                                                <span style={{
                                                                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                                                                    background: statusColor + "20", color: statusColor,
                                                                }}>{ROOM_STATUS_LABELS[room.status] || room.status}</span>
                                                            </div>
                                                            <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>
                                                                Tầng {room.floor} · {TYPE_LABELS[room.type] || room.type} · {room.currentOccupancy}/{room.maxOccupancy} người
                                                            </div>
                                                            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>
                                                                Chỉ số gần nhất: <strong>{room.latestElectricity?.currentReading ?? 0}</strong>
                                                                {" "}({room.latestElectricity ? `${room.latestElectricity.month}/${room.latestElectricity.year}` : "chưa có"})
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openElectricityModal(room, b.name); }}
                                                                style={{
                                                                    width: "100%",
                                                                    padding: "7px 10px",
                                                                    marginBottom: 10,
                                                                    borderRadius: 7,
                                                                    border: "1px solid #f59e0b55",
                                                                    background: "#fff7ed",
                                                                    color: "#c2410c",
                                                                    cursor: "pointer",
                                                                    fontSize: 12,
                                                                    fontWeight: 700,
                                                                }}
                                                            >
                                                                ⚡ Nhập số điện và gửi bill cả phòng
                                                            </button>

                                                            {/* Students in room */}
                                                            {hasStudents ? (
                                                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                                    {room.students.map(sv => (
                                                                        <div
                                                                            key={sv._id}
                                                                            onClick={() => setSelectedSv(selectedSv?._id === sv._id ? null : { ...sv, roomId: room._id, buildingName: b.name })}
                                                                            style={{
                                                                                padding: "8px 10px", borderRadius: 8, background: selectedSv?._id === sv._id ? "#fff4ed" : "#fff",
                                                                                border: selectedSv?._id === sv._id ? "1.5px solid #e8540a" : "1px solid #e2e8f0",
                                                                                cursor: "pointer", transition: "all 0.15s",
                                                                            }}
                                                                        >
                                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                                <div style={{
                                                                                    width: 28, height: 28, borderRadius: "50%",
                                                                                    background: "#e8540a", color: "#fff",
                                                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                                                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                                                                                }}>
                                                                                    {(sv.fullName || "?")[0].toUpperCase()}
                                                                                </div>
                                                                                <div>
                                                                                    <div style={{ fontWeight: 700, fontSize: 12 }}>{sv.fullName}</div>
                                                                                    <div style={{ fontSize: 10, color: "#888" }}>{sv.studentCode}</div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Action buttons when selected */}
                                                                            {selectedSv?._id === sv._id && (
                                                                                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                                                                                    <div style={{ fontSize: 11, color: "#555", marginBottom: 2 }}>
                                                                                        📧 {sv.userId?.email || "—"} · {sv.gender === "male" ? "Nam" : "Nữ"}
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={e => { e.stopPropagation(); openBill("violation", sv, room._id, b.name); }}
                                                                                        style={{
                                                                                            padding: "7px 10px", borderRadius: 7, border: "none",
                                                                                            background: "#f59e0b", color: "#fff",
                                                                                            cursor: "pointer", fontSize: 12, fontWeight: 700, textAlign: "left",
                                                                                        }}
                                                                                    >
                                                                                        ⚠️ Xử lý vi phạm quy chế
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={e => { e.stopPropagation(); openBill("damage", sv, room._id, b.name); }}
                                                                                        style={{
                                                                                            padding: "7px 10px", borderRadius: 7, border: "none",
                                                                                            background: "#ef4444", color: "#fff",
                                                                                            cursor: "pointer", fontSize: 12, fontWeight: 700, textAlign: "left",
                                                                                        }}
                                                                                    >
                                                                                        🔨 Đền bù thiệt hại CSVC
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div style={{ fontSize: 11, color: "#bbb", fontStyle: "italic", textAlign: "center", paddingTop: 4 }}>Phòng trống</div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Bill Modal */}
                {billModal && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
                        onClick={() => setBillModal(null)}>
                        <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 460, boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}
                            onClick={e => e.stopPropagation()}>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a" }}>
                                        {billModal.type === "violation" ? "⚠️ Xử lý vi phạm quy chế" : "🔨 Đền bù thiệt hại CSVC"}
                                    </div>
                                    <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                                        Sinh viên: <strong>{billModal.sv.fullName}</strong> ({billModal.sv.studentCode})
                                    </div>
                                    <div style={{ fontSize: 12, color: "#888" }}>Tòa nhà: {billModal.buildingName}</div>
                                </div>
                                <button onClick={() => setBillModal(null)}
                                    style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                                        Số tiền (VNĐ) <span style={{ color: "#ef4444" }}>*</span>
                                    </label>
                                    <input
                                        type="number" min="1000" step="1000"
                                        style={inputStyle}
                                        placeholder={billModal.type === "violation" ? "VD: 200000" : "VD: 500000"}
                                        value={billForm.amount}
                                        onChange={e => setBillForm(p => ({ ...p, amount: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                                        Mô tả vi phạm / thiệt hại
                                    </label>
                                    <textarea
                                        rows={3}
                                        style={{ ...inputStyle, resize: "vertical" }}
                                        placeholder={billModal.type === "violation" ? "VD: Vi phạm giờ giấc, gây mất trật tự..." : "VD: Làm hỏng bàn ghế, vỡ kính cửa sổ..."}
                                        value={billForm.description}
                                        onChange={e => setBillForm(p => ({ ...p, description: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                                        Hạn thanh toán <span style={{ color: "#ef4444" }}>*</span>
                                    </label>
                                    <input
                                        type="date"
                                        style={inputStyle}
                                        value={billForm.dueDate}
                                        min={new Date().toISOString().split("T")[0]}
                                        onChange={e => setBillForm(p => ({ ...p, dueDate: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Summary */}
                            {billForm.amount > 0 && (
                                <div style={{
                                    marginTop: 16, padding: "10px 14px", borderRadius: 8,
                                    background: billModal.type === "violation" ? "#fffbeb" : "#fff5f5",
                                    border: `1px solid ${billModal.type === "violation" ? "#fde68a" : "#fca5a5"}`,
                                    fontSize: 13,
                                }}>
                                    <strong>{billModal.type === "violation" ? "Phạt vi phạm" : "Đền bù"}:</strong>{" "}
                                    <span style={{ color: billModal.type === "violation" ? "#d97706" : "#dc2626", fontWeight: 700 }}>
                                        {Number(billForm.amount).toLocaleString("vi-VN")}đ
                                    </span>
                                    {" "}→ sẽ gửi bill đến <strong>{billModal.sv.fullName}</strong>
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
                                <button onClick={() => setBillModal(null)}
                                    style={{ padding: "9px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#555" }}>
                                    Hủy
                                </button>
                                <button onClick={handleSendBill} disabled={sending}
                                    style={{
                                        padding: "9px 20px", borderRadius: 8, border: "none",
                                        background: sending ? "#ccc" : (billModal.type === "violation" ? "#f59e0b" : "#ef4444"),
                                        color: "#fff", cursor: sending ? "not-allowed" : "pointer",
                                        fontWeight: 700, fontSize: 13,
                                    }}>
                                    {sending ? "⏳ Đang gửi..." : "📤 Gửi bill"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Electricity Modal */}
                {electricModal && (
                    <div
                        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 320, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
                        onClick={() => setElectricModal(null)}
                    >
                        <div
                            style={{ background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 460, boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a" }}>
                                        ⚡ Nhập số điện phòng {electricModal.room.roomNumber}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                                        Tòa nhà: {electricModal.buildingName}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#666" }}>
                                        Chỉ số cũ: <strong>{electricModal.room.latestElectricity?.currentReading ?? 0}</strong>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setElectricModal(null)}
                                    style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={{ display: "grid", gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                                        Chỉ số điện mới <span style={{ color: "#ef4444" }}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        style={inputStyle}
                                        value={electricForm.currentReading}
                                        onChange={(e) => setElectricForm((p) => ({ ...p, currentReading: e.target.value }))}
                                        placeholder="VD: 1450"
                                    />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Tháng</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="12"
                                            style={inputStyle}
                                            value={electricForm.month}
                                            onChange={(e) => setElectricForm((p) => ({ ...p, month: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Năm</label>
                                        <input
                                            type="number"
                                            min="2000"
                                            max="2100"
                                            style={inputStyle}
                                            value={electricForm.year}
                                            onChange={(e) => setElectricForm((p) => ({ ...p, year: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                                        Hạn thanh toán bill (tùy chọn)
                                    </label>
                                    <input
                                        type="date"
                                        style={inputStyle}
                                        value={electricForm.dueDate}
                                        onChange={(e) => setElectricForm((p) => ({ ...p, dueDate: e.target.value }))}
                                    />
                                </div>
                                <div style={{ fontSize: 12, color: "#555", background: "#fff7ed", border: "1px solid #fdba74", borderRadius: 8, padding: "10px 12px" }}>
                                    Hệ thống sẽ tự tính: (số mới - số cũ) - số điện free, sau đó chia đều theo đầu người và tạo bill cho toàn bộ sinh viên trong phòng.
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
                                <button
                                    onClick={() => setElectricModal(null)}
                                    style={{ padding: "9px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#555" }}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleRecordElectricity}
                                    disabled={recordingElectricity}
                                    style={{
                                        padding: "9px 16px",
                                        borderRadius: 8,
                                        border: "none",
                                        background: recordingElectricity ? "#cbd5e1" : "#f59e0b",
                                        color: "#fff",
                                        cursor: recordingElectricity ? "not-allowed" : "pointer",
                                        fontWeight: 700,
                                        fontSize: 13,
                                    }}
                                >
                                    {recordingElectricity ? "Đang xử lý..." : "Tính tiền và gửi bill"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    };

    const panels = {
        overview: <OverviewPanel />,
        requests: <RequestsPanel />,
        reports: <ReportsPanel />,
        unpaid: <UnpaidStudentsPanel />,
        buildings: <BuildingsPanel />,
        notifications: <NotificationsPanel />,
    };

    return (
        <div className="sd-wrapper">
            <aside className="sd-sidebar">
                <div className="sd-sidebar-header">
                    <div className="sd-sidebar-avatar">{initials}</div>
                    <div className="sd-sidebar-name">{user.username || "Quản lý"}</div>
                    <div className="sd-sidebar-code">role: {user.role}</div>
                </div>

                <nav className="sd-menu">
                    {MENU.map((item) => (
                        <button
                            key={item.id}
                            className={`sd-menu-item${active === item.id ? " active" : ""}`}
                            onClick={() => setActive(item.id)}
                        >
                            <span className="sd-menu-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                    <button
                        className="sd-menu-item"
                        style={{ marginTop: 8, color: "#e8540a", borderTop: "1px solid #f0e8e4", paddingTop: 12 }}
                        onClick={() => setShowChangePw(true)}
                    >
                        <span className="sd-menu-icon">🔐</span>
                        Đổi mật khẩu
                    </button>
                </nav>
            </aside>

            <main className="sd-content">{panels[active]}</main>

            {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
        </div>
    );
}

// Sub-components
function StatCard({ icon, label, value, color = "#e8540a" }) {
    return (
        <div className="ad-stat-card">
            <div className="ad-stat-icon" style={{ background: color + "18" }}>{icon}</div>
            <div>
                <div className="ad-stat-num" style={{ color }}>{value ?? "—"}</div>
                <div className="sd-stat-label">{label}</div>
            </div>
        </div>
    );
}

function QuickLink({ icon, label, onClick }) {
    return (
        <button className="ad-quick-link" onClick={onClick}>
            <span style={{ fontSize: 24 }}>{icon}</span>
            <span>{label}</span>
        </button>
    );
}


