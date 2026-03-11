import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../student/StudentDashboard.css"; // reuse same CSS variables
import "./AdminDashboard.css";

/* ── tiny sub-components ────────────────────────────────────────────────── */

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

function QuickLink({ icon, label, href }) {
    const navigate = useNavigate();
    return (
        <button className="ad-quick-link" onClick={() => navigate(href)}>
            <span style={{ fontSize: 24 }}>{icon}</span>
            <span>{label}</span>
        </button>
    );
}

/* ── Panels ─────────────────────────────────────────────────────────────── */

function OverviewPanel() {
    const [stats, setStats] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            api.get("/users").catch(() => ({ data: { data: [] } })),
            api.get("/buildings").catch(() => ({ data: { data: [] } })),
            api.get("/reports").catch(() => ({ data: { data: [] } })),
        ]).then(([users, buildings, reports]) => {
            setStats({
                totalUsers: users.data.data?.length || 0,
                totalStudents: users.data.data?.filter(u => u.role === "student").length || 0,
                totalBuildings: buildings.data.data?.length || 0,
                pendingReports: reports.data.data?.filter(r => r.status === "pending").length || 0,
            });
        });
    }, []);

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">🛡️ Tổng quan hệ thống</h2>
                <p className="sd-panel-subtitle">Thống kê nhanh toàn bộ hệ thống KTX</p>
            </div>

            {/* Stats */}
            <div className="ad-stats-grid">
                <StatCard icon="👥" label="Tổng người dùng" value={stats.totalUsers} color="#e8540a" />
                <StatCard icon="🎓" label="Sinh viên" value={stats.totalStudents} color="#2563eb" />
                <StatCard icon="🏢" label="Tòa nhà" value={stats.totalBuildings} color="#16a34a" />
                <StatCard icon="📑" label="Báo cáo chờ" value={stats.pendingReports} color="#d97706" />
            </div>

            {/* Quick links */}
            <div className="sd-panel-header" style={{ marginTop: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>⚡ Truy cập nhanh</h3>
            </div>
            <div className="ad-quick-grid">
                <QuickLink icon="👥" label="Quản lý tài khoản" href="/admin/users" />
                <QuickLink icon="🏢" label="Quản lý KTX" href="/admin/buildings" />
                <QuickLink icon="📑" label="Duyệt báo cáo" href="/admin/reports" />
                <QuickLink icon="🔔" label="Gửi thông báo" href="/admin/notifications" />
            </div>
        </>
    );
}

function UsersPanel() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get("/users")
            .then(r => setUsers(r.data.data?.slice(0, 10) || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="sd-loading"><div className="sd-spinner" /><span>Đang tải...</span></div>;

    return (
        <>
            <div className="sd-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h2 className="sd-panel-title">👥 Tài khoản</h2>
                    <p className="sd-panel-subtitle">10 tài khoản gần nhất trong hệ thống</p>
                </div>
                <button className="sd-btn-primary" onClick={() => navigate("/admin/users")}>
                    Xem tất cả →
                </button>
            </div>
            <div className="sd-table-wrap">
                <table className="sd-table">
                    <thead>
                        <tr>
                            <th>Tên đăng nhập</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id}>
                                <td><strong>{u.username}</strong></td>
                                <td style={{ color: "#777" }}>{u.email}</td>
                                <td>
                                    <span className={`sd-badge ${u.role === "admin" ? "rejected" : u.role === "manager" ? "info" : "approved"}`}>
                                        {u.role === "admin" ? "Admin" : u.role === "manager" ? "Manager" : "Sinh viên"}
                                    </span>
                                </td>
                                <td>
                                    <span className={`sd-badge ${u.isActive !== false ? "approved" : "rejected"}`}>
                                        {u.isActive !== false ? "Hoạt động" : "Khóa"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function BuildingsPanel() {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get("/buildings")
            .then(r => setBuildings(r.data.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="sd-loading"><div className="sd-spinner" /><span>Đang tải...</span></div>;

    return (
        <>
            <div className="sd-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h2 className="sd-panel-title">🏢 Tòa nhà & Phòng</h2>
                    <p className="sd-panel-subtitle">Tổng hợp các tòa nhà trong KTX</p>
                </div>
                <button className="sd-btn-primary" onClick={() => navigate("/admin/buildings")}>
                    Quản lý →
                </button>
            </div>

            {buildings.length === 0 ? (
                <div className="sd-empty">
                    <span className="sd-empty-icon">🏗️</span>
                    <p className="sd-empty-text">Chưa có tòa nhà nào</p>
                </div>
            ) : (
                <div className="sd-table-wrap">
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>Tên tòa nhà</th>
                                <th>Địa chỉ</th>
                                <th>Số tầng</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {buildings.map(b => (
                                <tr key={b._id}>
                                    <td><strong>🏢 {b.name}</strong></td>
                                    <td style={{ color: "#777" }}>{b.address || "—"}</td>
                                    <td>{b.totalFloors} tầng</td>
                                    <td>
                                        <span className={`sd-badge ${b.status === "active" ? "approved" : b.status === "maintenance" ? "pending" : "rejected"}`}>
                                            {b.status === "active" ? "Hoạt động" : b.status === "maintenance" ? "Bảo trì" : "Tạm đóng"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

function ReportsPanel() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get("/reports")
            .then(r => setReports(r.data.data?.slice(0, 8) || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const STATUS = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" };
    const STATUS_CLS = { pending: "pending", approved: "approved", rejected: "rejected" };

    if (loading) return <div className="sd-loading"><div className="sd-spinner" /><span>Đang tải...</span></div>;

    return (
        <>
            <div className="sd-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h2 className="sd-panel-title">📑 Báo cáo</h2>
                    <p className="sd-panel-subtitle">8 báo cáo mới nhất từ quản lý</p>
                </div>
                <button className="sd-btn-primary" onClick={() => navigate("/admin/reports")}>
                    Xem tất cả →
                </button>
            </div>

            {reports.length === 0 ? (
                <div className="sd-empty"><span className="sd-empty-icon">📋</span><p>Chưa có báo cáo</p></div>
            ) : (
                <div className="sd-table-wrap">
                    <table className="sd-table">
                        <thead>
                            <tr><th>Tiêu đề</th><th>Người gửi</th><th>Loại</th><th>Trạng thái</th></tr>
                        </thead>
                        <tbody>
                            {reports.map(r => (
                                <tr key={r._id}>
                                    <td><strong>{r.title}</strong></td>
                                    <td style={{ color: "#777" }}>{r.managerId?.username || "—"}</td>
                                    <td style={{ fontSize: 12 }}>{r.type}</td>
                                    <td><span className={`sd-badge ${STATUS_CLS[r.status] || "info"}`}>{STATUS[r.status] || r.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

function NotificationsPanel() {
    const navigate = useNavigate();
    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">🔔 Thông báo</h2>
                <p className="sd-panel-subtitle">Gửi thông báo đến sinh viên và quản lý</p>
            </div>
            <div className="ad-notify-cta">
                <div style={{ fontSize: 56, marginBottom: 16 }}>📢</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "#1a1a1a" }}>Gửi thông báo mới</h3>
                <p style={{ color: "#888", marginBottom: 20, fontSize: 14 }}>Tạo thông báo cho toàn bộ sinh viên, theo tòa nhà, hoặc từng cá nhân</p>
                <button className="sd-btn-primary" onClick={() => navigate("/admin/notifications")}>
                    📝 Mở trang Thông báo
                </button>
            </div>
        </>
    );
}

/* ── Main AdminDashboard ─────────────────────────────────────────────────── */

const MENU = [
    { id: "overview", icon: "🛡️", label: "Tổng quan" },
    { id: "users", icon: "👥", label: "Tài khoản" },
    { id: "buildings", icon: "🏢", label: "Tòa nhà & Phòng" },
    { id: "reports", icon: "📑", label: "Báo cáo" },
    { id: "notifications", icon: "🔔", label: "Thông báo" },
];

export default function AdminDashboard() {
    const [active, setActive] = useState("overview");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const initials = (user.username || "AD").slice(0, 2).toUpperCase();

    const panels = {
        overview: <OverviewPanel />,
        users: <UsersPanel />,
        buildings: <BuildingsPanel />,
        reports: <ReportsPanel />,
        notifications: <NotificationsPanel />,
    };

    return (
        <div className="sd-wrapper">
            {/* ── Sidebar ── */}
            <aside className="sd-sidebar">
                <div className="sd-sidebar-header">
                    <div className="sd-sidebar-avatar">{initials}</div>
                    <div className="sd-sidebar-name">{user.username || "Admin"}</div>
                    <div className="sd-sidebar-code" style={{ color: "#e8540a", fontWeight: 600, fontSize: 11 }}>🛡️ Quản trị viên</div>
                </div>
                <nav className="sd-menu">
                    {MENU.map(item => (
                        <button
                            key={item.id}
                            className={`sd-menu-item${active === item.id ? " active" : ""}`}
                            onClick={() => setActive(item.id)}
                        >
                            <span className="sd-menu-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* ── Content ── */}
            <main className="sd-content">
                {panels[active]}
            </main>
        </div>
    );
}
