import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../student/StudentDashboard.css"; // reuse same CSS variables
import "./AdminDashboard.css";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import "../AdminNotifications.css";
import "../AdminUsers.css";
import "../AdminReports.css";
import "../AdminBuildingsPage.css";

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

/* ── Users helpers ── */
const U_ROLE_LABELS = { admin: "Admin", manager: "Quản lý", student: "Sinh viên" };
const U_ROLE_COLORS = { admin: "#f59e0b", manager: "#6366f1", student: "#22c55e" };
const U_DEFAULT_PERMS = {
    admin: ["manage_users", "manage_students", "manage_buildings", "manage_rooms", "manage_settings", "view_revenue", "approve_reports", "assign_permissions", "send_notifications", "view_room_list", "view_unpaid_students"],
    manager: ["manage_requests", "send_reports", "send_notifications", "view_room_list", "view_unpaid_students"],
    student: ["submit_requests", "register_room", "make_payment", "view_own_history", "view_room_list"],
};
const U_PERM_LABELS = {
    manage_users: "Quản lý người dùng", manage_students: "Quản lý sinh viên",
    manage_buildings: "Quản lý tòa nhà", manage_rooms: "Quản lý phòng",
    manage_settings: "Cài đặt hệ thống", view_revenue: "Xem doanh thu",
    approve_reports: "Duyệt báo cáo", assign_permissions: "Cấp quyền",
    send_notifications: "Gửi thông báo", view_room_list: "Xem danh sách phòng",
    view_unpaid_students: "Xem SV chưa đóng tiền",
    manage_requests: "Quản lý yêu cầu", send_reports: "Gửi báo cáo",
    submit_requests: "Gửi yêu cầu", register_room: "Đăng ký phòng",
    make_payment: "Thanh toán", view_own_history: "Xem lịch sử cá nhân",
};

function UCreateModal({ onClose, onSuccess, onError }) {
    const [form, setForm] = useState({ username: "", password: "", email: "", phone: "", role: "student", fullName: "", studentCode: "", gender: "male", dateOfBirth: "", faculty: "", major: "", classCode: "", academicYear: "" });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setErr("");
        try { await api.post("/users", form); onSuccess(); }
        catch (error) { const m = error.response?.data?.message || "Tạo thất bại"; setErr(m); onError(m); }
        finally { setLoading(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box wide" onClick={e => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
                <div className="modal-header"><h2>➕ Tạo tài khoản mới</h2><button className="modal-close" onClick={onClose}>✕</button></div>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#e8540a", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>Thông tin tài khoản</p>
                    <div className="form-row"><label>Username <span className="req">*</span></label><input name="username" placeholder="Nhập username" value={form.username} onChange={hc} required /></div>
                    <div className="form-row"><label>Email <span className="req">*</span></label><input name="email" type="email" placeholder="Nhập email" value={form.email} onChange={hc} required /></div>
                    <div className="form-row"><label>Mật khẩu <span className="req">*</span></label><input name="password" type="password" placeholder="Ít nhất 6 ký tự" value={form.password} onChange={hc} required /></div>
                    <div className="form-row"><label>Số điện thoại</label><input name="phone" placeholder="Nhập SĐT (tuỳ chọn)" value={form.phone} onChange={hc} /></div>
                    <div className="form-row"><label>Role <span className="req">*</span></label>
                        <select name="role" value={form.role} onChange={hc}>
                            <option value="student">Sinh viên</option>
                            <option value="manager">Quản lý</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    {form.role === "student" && (
                        <>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#e8540a", textTransform: "uppercase", letterSpacing: "0.5px", margin: "8px 0 0" }}>Thông tin sinh viên</p>
                            <div className="form-row"><label>Họ và tên <span className="req">*</span></label><input name="fullName" placeholder="Nguyễn Văn A" value={form.fullName} onChange={hc} required /></div>
                            <div className="form-row"><label>Mã sinh viên</label><input name="studentCode" placeholder="VD: SE180001" value={form.studentCode} onChange={hc} /></div>
                            <div className="form-row"><label>Giới tính</label><select name="gender" value={form.gender} onChange={hc}><option value="male">Nam</option><option value="female">Nữ</option></select></div>
                            <div className="form-row"><label>Ngày sinh</label><input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={hc} /></div>
                            <div className="form-row"><label>Khoa</label><input name="faculty" placeholder="VD: Công nghệ thông tin" value={form.faculty} onChange={hc} /></div>
                            <div className="form-row"><label>Chuyên ngành</label><input name="major" placeholder="VD: Kỹ thuật phần mềm" value={form.major} onChange={hc} /></div>
                            <div className="form-row"><label>Lớp</label><input name="classCode" placeholder="VD: SE1801" value={form.classCode} onChange={hc} /></div>
                            <div className="form-row"><label>Năm học</label><input name="academicYear" placeholder="VD: 2024" value={form.academicYear} onChange={hc} /></div>
                        </>
                    )}
                    {err && <div className="modal-err">⚠️ {err}</div>}
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
                        <button type="submit" className="btn-submit" disabled={loading}>{loading ? "Đang tạo..." : "Tạo tài khoản"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function UPermModal({ user, onClose, onSuccess, onError }) {
    const allPerms = U_DEFAULT_PERMS[user.role] || [];
    const [sel, setSel] = useState(new Set(user.permissions || []));
    const [loading, setLoading] = useState(false);
    const toggle = (p) => setSel(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
    const handleSave = async () => {
        setLoading(true);
        try { await api.put(`/users/${user._id}`, { permissions: [...sel] }); onSuccess(); }
        catch (err) { onError(err.response?.data?.message || "Cập nhật thất bại"); }
        finally { setLoading(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2>🔑 Phân quyền — {user.username}</h2><button className="modal-close" onClick={onClose}>✕</button></div>
                <p className="perm-desc">Role: <strong>{U_ROLE_LABELS[user.role]}</strong></p>
                <div className="perm-list">
                    {allPerms.map(p => (
                        <label key={p} className={`perm-item ${sel.has(p) ? "checked" : ""}`}>
                            <input type="checkbox" checked={sel.has(p)} onChange={() => toggle(p)} />
                            <span className="perm-name">{U_PERM_LABELS[p] || p}</span>
                            <span className="perm-key">{p}</span>
                        </label>
                    ))}
                </div>
                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose}>Hủy</button>
                    <button className="btn-submit" onClick={handleSave} disabled={loading}>{loading ? "Đang lưu..." : `Lưu quyền (${sel.size})`}</button>
                </div>
            </div>
        </div>
    );
}

function UsersPanel() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [modal, setModal] = useState(null);
    const [selected, setSelected] = useState(null);
    const [alert, setAlert] = useState({ type: "", msg: "" });

    const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert({ type: "", msg: "" }), 4000); };

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (roleFilter) params.role = roleFilter;
            if (search) params.search = search;
            const { data } = await api.get("/users", { params });
            setUsers(data.users || []);
        } catch { showAlert("error", "Không thể tải danh sách người dùng"); }
        finally { setLoading(false); }
    }, [roleFilter, search]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const handleDelete = async (u) => {
        if (!window.confirm(`Xóa tài khoản "${u.username}"? Không thể hoàn tác.`)) return;
        try { await api.delete(`/users/${u._id}`); showAlert("success", "Đã xóa tài khoản"); loadUsers(); }
        catch (err) { showAlert("error", err.response?.data?.message || "Xóa thất bại"); }
    };

    const handleToggle = async (u) => {
        try { await api.put(`/users/${u._id}`, { isActive: !u.isActive }); showAlert("success", u.isActive ? "Đã vô hiệu hóa" : "Đã kích hoạt"); loadUsers(); }
        catch (err) { showAlert("error", err.response?.data?.message || "Cập nhật thất bại"); }
    };

    return (
        <>
            <div className="sd-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h2 className="sd-panel-title">👥 Quản lý tài khoản</h2>
                    <p className="sd-panel-subtitle">Tạo, chỉnh sửa và cấp quyền cho người dùng</p>
                </div>
                <button className="btn-create" onClick={() => setModal("create")}>+ Tạo tài khoản</button>
            </div>

            {alert.msg && (
                <div className={`au-alert ${alert.type}`} style={{ marginBottom: 16 }}>
                    {alert.type === "success" ? "✅" : "⚠️"} {alert.msg}
                </div>
            )}

            <div className="au-filters" style={{ marginBottom: 16 }}>
                <input className="au-search" placeholder="🔍 Tìm theo username hoặc email..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="au-role-filter" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                    <option value="">Tất cả role</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Quản lý</option>
                    <option value="student">Sinh viên</option>
                </select>
            </div>

            <div className="au-table-wrap">
                {loading ? (
                    <div className="au-loading">Đang tải...</div>
                ) : users.length === 0 ? (
                    <div className="au-empty">Không tìm thấy tài khoản nào</div>
                ) : (
                    <table className="au-table">
                        <thead>
                            <tr>
                                <th>Người dùng</th><th>Role</th><th>Trạng thái</th><th>Phân quyền</th><th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id}>
                                    <td>
                                        <div className="user-info">
                                            <div className="user-avatar" style={{ background: U_ROLE_COLORS[u.role] }}>{u.username[0].toUpperCase()}</div>
                                            <div><div className="user-name">{u.username}</div><div className="user-email">{u.email}</div></div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="role-badge" style={{ background: U_ROLE_COLORS[u.role] + "22", color: U_ROLE_COLORS[u.role], border: `1px solid ${U_ROLE_COLORS[u.role]}44` }}>
                                            {U_ROLE_LABELS[u.role]}
                                        </span>
                                    </td>
                                    <td>
                                        <button className={`status-toggle ${u.isActive ? "active" : "inactive"}`} onClick={() => handleToggle(u)}>
                                            {u.isActive ? "✅ Hoạt động" : "⛔ Bị khóa"}
                                        </button>
                                    </td>
                                    <td>
                                        <span className="perm-count">{u.permissions?.length || 0} quyền</span>
                                        <button className="btn-perm" onClick={() => { setSelected(u); setModal("perm"); }}>Chỉnh sửa</button>
                                    </td>
                                    <td><button className="btn-del" onClick={() => handleDelete(u)}>🗑️ Xóa</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modal === "create" && (
                <UCreateModal
                    onClose={() => setModal(null)}
                    onSuccess={() => { setModal(null); loadUsers(); showAlert("success", "Tạo tài khoản thành công"); }}
                    onError={msg => showAlert("error", msg)}
                />
            )}
            {modal === "perm" && selected && (
                <UPermModal
                    user={selected}
                    onClose={() => { setModal(null); setSelected(null); }}
                    onSuccess={() => { setModal(null); setSelected(null); loadUsers(); showAlert("success", "Cập nhật quyền thành công"); }}
                    onError={msg => showAlert("error", msg)}
                />
            )}
        </>
    );
}

/* ── Buildings helpers ── */
const B_fmtNum = (n) => Number(n || 0).toLocaleString("vi-VN");
const B_ROOM_STATUS = { available: "Còn chỗ", partial: "Còn chỗ", full: "Hết chỗ", maintenance: "Bảo trì" };
const B_TYPE_LABEL = { standard: "Tiêu chuẩn", vip: "VIP", premium: "Premium" };
const B_occColor = (pct) => pct < 50 ? "#16a34a" : pct < 100 ? "#f59e0b" : "#dc2626";

function BBuildingCard({ building, onEdit, onDelete, onAddRoom, showAlert }) {
    const [open, setOpen] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [loadingR, setLoadingR] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const loadRooms = useCallback(async () => {
        if (loaded) return;
        setLoadingR(true);
        try { const r = await api.get(`/buildings/${building._id}/rooms`); setRooms(r.data.data); setLoaded(true); }
        catch { showAlert("error", "Không thể tải phòng"); }
        finally { setLoadingR(false); }
    }, [building._id, loaded, showAlert]);

    const refreshRooms = async () => {
        setLoaded(false);
        const r = await api.get(`/buildings/${building._id}/rooms`);
        setRooms(r.data.data); setLoaded(true);
    };

    const handleDeleteRoom = async (room) => {
        if (!window.confirm(`Xóa phòng ${room.roomNumber}?`)) return;
        try { await api.delete(`/rooms/${room._id}`); showAlert("success", `Đã xóa phòng ${room.roomNumber}`); refreshRooms(); }
        catch (err) { showAlert("error", err.response?.data?.message || "Xóa phòng thất bại"); }
    };

    const handleToggle = () => { const next = !open; setOpen(next); if (next) loadRooms(); };

    return (
        <div className={`ab-building-card ${open ? "expanded" : ""}`}>
            <div className="ab-building-header" onClick={handleToggle}>
                <div className="ab-building-icon">🏢</div>
                <div className="ab-building-info">
                    <div className="ab-building-name">{building.name}</div>
                    <div className="ab-building-meta">
                        📍 {building.address || "—"} &nbsp;·&nbsp; 🏬 {building.totalFloors} tầng &nbsp;·&nbsp; 👤 {building.managerId?.username || "Chưa có manager"}
                    </div>
                </div>
                <div className="ab-building-right">
                    <span className={`ab-status-badge ${building.status}`}>
                        {building.status === "active" ? "Hoạt động" : building.status === "maintenance" ? "Bảo trì" : "Tạm đóng"}
                    </span>
                    <button className="ab-btn-edit" onClick={e => { e.stopPropagation(); onEdit(building); }}>✏️ Sửa</button>
                    <button className="ab-btn-del" onClick={e => { e.stopPropagation(); onDelete(building); }}>🗑️</button>
                    <span className={`ab-chevron ${open ? "open" : ""}`}>⏄</span>
                </div>
            </div>
            {open && (
                <div className="ab-rooms-section">
                    <div className="ab-rooms-header">
                        <span className="ab-rooms-title">Danh sách phòng {loaded ? `(${rooms.length})` : ""}</span>
                        <button className="ab-btn-add-room" onClick={() => onAddRoom(building, refreshRooms)}>＋ Thêm phòng</button>
                    </div>
                    {loadingR ? (
                        <div className="ab-rooms-loading"><span className="ab-spinner" />Đang tải phòng...</div>
                    ) : rooms.length === 0 ? (
                        <div className="ab-rooms-empty">🛢 Chưa có phòng nào — nhấn "Thêm phòng" để tạo</div>
                    ) : (
                        <div className="ab-rooms-grid">
                            {rooms.map(room => {
                                const pct = Math.round((room.currentOccupancy / room.maxOccupancy) * 100);
                                return (
                                    <div key={room._id} className="ab-room-card">
                                        <div className="ab-room-top">
                                            <span className="ab-room-num">P.{room.roomNumber}</span>
                                            <span className={`ab-room-status ${room.status}`}>{B_ROOM_STATUS[room.status] || room.status}</span>
                                        </div>
                                        <div className="ab-room-info">Tầng {room.floor} · {B_TYPE_LABEL[room.type] || room.type}</div>
                                        <div className="ab-room-occupancy">
                                            <div className="ab-room-occ-bar" style={{ width: `${pct}%`, background: B_occColor(pct) }} />
                                        </div>
                                        <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>{room.currentOccupancy}/{room.maxOccupancy} người</div>
                                        <div className="ab-room-price">{B_fmtNum(room.pricePerTerm)}đ/kỳ</div>
                                        <div className="ab-room-actions">
                                            <button className="ab-btn-room-del" onClick={() => handleDeleteRoom(room)}>🗑️ Xóa</button>
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

function BBuildingModal({ building, onClose, onSuccess }) {
    const isEdit = !!building;
    const [form, setForm] = useState({
        name: building?.name || "",
        address: building?.address || "",
        totalFloors: building?.totalFloors || "",
        description: building?.description || "",
        status: building?.status || "active",
        managerId: building?.managerId?._id || building?.managerId || "",
    });
    const [managers, setManagers] = useState([]);
    const [loadingMgr, setLoadingMgr] = useState(true);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    useEffect(() => {
        api.get("/users", { params: { role: "manager" } })
            .then(r => setManagers(r.data.users || []))
            .catch(() => { })
            .finally(() => setLoadingMgr(false));
    }, []);

    const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async () => {
        if (!form.name || !form.totalFloors) { setErr("Vui lòng nhập tên và số tầng"); return; }
        setLoading(true); setErr("");
        try {
            const payload = { ...form, managerId: form.managerId || null };
            if (isEdit) await api.put(`/buildings/${building._id}`, payload);
            else await api.post("/buildings", payload);
            onSuccess();
        } catch (e) { setErr(e.response?.data?.message || "Thao tác thất bại"); }
        setLoading(false);
    };

    const selectedMgr = managers.find(m => m._id === form.managerId);

    return (
        <div className="ab-overlay" onClick={onClose}>
            <div className="ab-modal" onClick={e => e.stopPropagation()}>
                <div className="ab-modal-title">{isEdit ? "✏️ Sửa tòa nhà" : "🏢 Tạo tòa nhà mới"}</div>
                <div className="ab-modal-grid">
                    <div className="ab-field"><label className="ab-label">Tên tòa nhà *</label><input className="ab-input" name="name" placeholder="VD: Tòa A1" value={form.name} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Số tầng *</label><input className="ab-input" name="totalFloors" type="number" min="1" placeholder="VD: 6" value={form.totalFloors} onChange={hc} /></div>
                    <div className="ab-field full"><label className="ab-label">Địa chỉ</label><input className="ab-input" name="address" placeholder="Địa chỉ tòa nhà" value={form.address} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Trạng thái</label>
                        <select className="ab-select" name="status" value={form.status} onChange={hc}>
                            <option value="active">Hoạt động</option>
                            <option value="maintenance">Bảo trì</option>
                            <option value="inactive">Tạm đóng</option>
                        </select>
                    </div>

                    {/* Manager picker */}
                    <div className="ab-field">
                        <label className="ab-label">👤 Quản lý phụ trách</label>
                        {loadingMgr ? (
                            <div style={{ fontSize: 13, color: "#94a3b8", padding: "8px 0" }}>Đang tải danh sách quản lý...</div>
                        ) : (
                            <select className="ab-select" name="managerId" value={form.managerId} onChange={hc}>
                                <option value="">— Chưa phân công —</option>
                                {managers.map(m => (
                                    <option key={m._id} value={m._id}>{m.username} ({m.email})</option>
                                ))}
                            </select>
                        )}
                        {selectedMgr && (
                            <div style={{ marginTop: 6, fontSize: 12, color: "#6366f1", display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                    {selectedMgr.username[0].toUpperCase()}
                                </div>
                                <span>Đã chọn: <strong>{selectedMgr.username}</strong> — {selectedMgr.email}</span>
                                <button type="button" onClick={() => setForm(p => ({ ...p, managerId: "" }))}
                                    style={{ marginLeft: "auto", background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>
                                    ✕ Xóa phân quyền
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="ab-field full"><label className="ab-label">Mô tả</label><textarea className="ab-textarea" name="description" placeholder="Mô tả thêm..." value={form.description} onChange={hc} /></div>
                </div>
                {err && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 10 }}>⚠️ {err}</div>}
                <div className="ab-modal-actions">
                    <button className="ab-btn-cancel" onClick={onClose}>Hủy</button>
                    <button className="ab-btn-confirm" onClick={handleSubmit} disabled={loading}>{loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo tòa nhà"}</button>
                </div>
            </div>
        </div>
    );
}


function BRoomModal({ building, onClose, onSuccess }) {
    const [form, setForm] = useState({ roomNumber: "", floor: "", type: "standard", maxOccupancy: "4", pricePerTerm: "", status: "available", description: "" });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSubmit = async () => {
        if (!form.roomNumber || !form.floor || !form.pricePerTerm) { setErr("Vui lòng nhập đầy đủ: số phòng, tầng, giá/kỳ"); return; }
        setLoading(true); setErr("");
        try { await api.post(`/buildings/${building._id}/rooms`, form); onSuccess(); }
        catch (e) { setErr(e.response?.data?.message || "Tạo phòng thất bại"); }
        setLoading(false);
    };
    return (
        <div className="ab-overlay" onClick={onClose}>
            <div className="ab-modal" onClick={e => e.stopPropagation()}>
                <div className="ab-modal-title">🛢 Thêm phòng — {building.name}</div>
                <div className="ab-modal-grid">
                    <div className="ab-field"><label className="ab-label">Số phòng *</label><input className="ab-input" name="roomNumber" placeholder="VD: 101" value={form.roomNumber} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Tầng *</label><input className="ab-input" name="floor" type="number" min="1" placeholder="VD: 1" value={form.floor} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Loại phòng</label>
                        <select className="ab-select" name="type" value={form.type} onChange={hc}>
                            <option value="standard">Tiêu chuẩn</option>
                            <option value="vip">VIP</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                    <div className="ab-field"><label className="ab-label">Sức chứa tối đa</label><input className="ab-input" name="maxOccupancy" type="number" min="1" value={form.maxOccupancy} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Giá / kỳ (đồng) *</label><input className="ab-input" name="pricePerTerm" type="number" min="0" placeholder="VD: 1500000" value={form.pricePerTerm} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Trạng thái</label>
                        <select className="ab-select" name="status" value={form.status} onChange={hc}>
                            <option value="available">Còn chỗ</option>
                            <option value="maintenance">Bảo trì</option>
                        </select>
                    </div>
                    <div className="ab-field full"><label className="ab-label">Mô tả / tiện nghi</label><textarea className="ab-textarea" name="description" placeholder="VD: Phòng có điều hòa, tủ đồ..." value={form.description} onChange={hc} /></div>
                </div>
                {err && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 10 }}>⚠️ {err}</div>}
                <div className="ab-modal-actions">
                    <button className="ab-btn-cancel" onClick={onClose}>Hủy</button>
                    <button className="ab-btn-confirm" onClick={handleSubmit} disabled={loading}>{loading ? "Đang tạo..." : "Tạo phòng"}</button>
                </div>
            </div>
        </div>
    );
}

function BuildingsPanel() {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState(null);
    const [modal, setModal] = useState(null);

    const showAlert = useCallback((type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000); }, []);

    const load = useCallback(() => {
        setLoading(true);
        api.get("/buildings")
            .then(r => setBuildings(r.data.data || []))
            .catch(() => showAlert("error", "Không thể tải danh sách tòa nhà"))
            .finally(() => setLoading(false));
    }, [showAlert]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (building) => {
        if (!window.confirm(`Xóa tòa nhà "${building.name}"?`)) return;
        try { await api.delete(`/buildings/${building._id}`); showAlert("success", `Đã xóa tòa nhà ${building.name}`); load(); }
        catch (err) { showAlert("error", err.response?.data?.message || "Xóa thất bại"); }
    };

    return (
        <>
            <div className="sd-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h2 className="sd-panel-title">🏢 Quản lý Tòa nhà &amp; Phòng</h2>
                    <p className="sd-panel-subtitle">Tạo và quản lý tòa nhà, phòng ở KTX</p>
                </div>
                <button className="ab-btn-create" onClick={() => setModal({ type: "building" })}>＋ Tạo tòa nhà</button>
            </div>

            {alert && <div className={`ab-alert ${alert.type}`} style={{ marginBottom: 16 }}>{alert.type === "success" ? "✅" : "❌"} {alert.msg}</div>}

            {/* Stats */}
            <div className="ab-stats" style={{ marginBottom: 16 }}>
                <div className="ab-stat"><div className="ab-stat-num">{buildings.length}</div><div className="ab-stat-label">Tòa nhà</div></div>
                <div className="ab-stat"><div className="ab-stat-num">{buildings.filter(b => b.status === "active").length}</div><div className="ab-stat-label">Đang hoạt động</div></div>
                <div className="ab-stat"><div className="ab-stat-num">{buildings.filter(b => b.status === "maintenance").length}</div><div className="ab-stat-label">Đang bảo trì</div></div>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "60px", color: "#bbb" }}><span className="ab-spinner" />Đang tải...</div>
            ) : buildings.length === 0 ? (
                <div className="ab-empty-page"><span className="ab-empty-icon">🏗️</span><p>Chưa có tòa nhà nào. Nhấn "+Tạo tòa nhà" để bắt đầu!</p></div>
            ) : (
                <div className="ab-building-list">
                    {buildings.map(b => (
                        <BBuildingCard
                            key={b._id}
                            building={b}
                            onEdit={building => setModal({ type: "building-edit", data: building })}
                            onDelete={handleDelete}
                            onAddRoom={(building, refresh) => setModal({ type: "room", data: building, onRoomSuccess: refresh })}
                            showAlert={showAlert}
                        />
                    ))}
                </div>
            )}

            {modal?.type === "building" && (
                <BBuildingModal building={null} onClose={() => setModal(null)} onSuccess={() => { setModal(null); showAlert("success", "Tạo tòa nhà thành công!"); load(); }} />
            )}
            {modal?.type === "building-edit" && (
                <BBuildingModal building={modal.data} onClose={() => setModal(null)} onSuccess={() => { setModal(null); showAlert("success", "Cập nhật tòa nhà thành công!"); load(); }} />
            )}
            {modal?.type === "room" && (
                <BRoomModal
                    building={modal.data}
                    onClose={() => setModal(null)}
                    onSuccess={() => { setModal(null); showAlert("success", "Tạo phòng thành công!"); if (modal.onRoomSuccess) modal.onRoomSuccess(); }}
                />
            )}
        </>
    );
}

/* ── Reports helpers ── */
const R_TYPE_LABELS = { general: "📋 Tổng quát", maintenance: "🔧 Bảo trì", incident: "⚠️ Sự cố", monthly: "📅 Hàng tháng" };
const R_TYPE_COLORS = { general: "#6366f1", maintenance: "#f59e0b", incident: "#ef4444", monthly: "#22c55e" };

function RReviewModal({ report, onClose, onSuccess, onError }) {
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const handleSubmit = async e => {
        e.preventDefault(); setLoading(true);
        try { await api.put(`/reports/${report._id}/review`, { note }); onSuccess(); }
        catch (err) { onError(err.response?.data?.message || "Duyệt thất bại"); }
        finally { setLoading(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2>✅ Duyệt báo cáo</h2><button className="modal-close" onClick={onClose}>✕</button></div>
                <div className="review-preview">
                    <div className="rp-row"><span className="rp-label">Tiêu đề</span><span className="rp-val">{report.title}</span></div>
                    <div className="rp-row"><span className="rp-label">Người gửi</span><span className="rp-val">{report.managerId?.username} · {report.buildingId?.name}</span></div>
                    <div className="rp-row"><span className="rp-label">Nội dung</span><span className="rp-val content-preview">{report.content}</span></div>
                </div>
                <form onSubmit={handleSubmit} className="review-form">
                    <div className="form-row"><label>Ghi chú phản hồi (tuỳ chọn)</label>
                        <textarea rows={4} placeholder="Nhập phản hồi gửi lại cho quản lý..." value={note} onChange={e => setNote(e.target.value)} />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
                        <button type="submit" className="btn-approve-modal" disabled={loading}>{loading ? "Đang duyệt..." : "✅ Xác nhận duyệt"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function RDetailModal({ report, onClose }) {
    const col = R_TYPE_COLORS[report.type] || "#6366f1";
    const isPending = report.status === "pending";
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box wide" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2>📄 Chi tiết báo cáo</h2><button className="modal-close" onClick={onClose}>✕</button></div>
                <div className="detail-grid">
                    <div className="detail-item"><span className="d-label">Loại</span><span className="d-val"><span style={{ background: col + "20", color: col, padding: "3px 10px", borderRadius: 20, fontSize: 13 }}>{R_TYPE_LABELS[report.type]}</span></span></div>
                    <div className="detail-item"><span className="d-label">Trạng thái</span><span className={`d-badge ${isPending ? "pending" : "reviewed"}`}>{isPending ? "⏳ Chờ duyệt" : "✅ Đã duyệt"}</span></div>
                    <div className="detail-item"><span className="d-label">Người gửi</span><span className="d-val">{report.managerId?.username}</span></div>
                    <div className="detail-item"><span className="d-label">Tòa nhà</span><span className="d-val">{report.buildingId?.name} — {report.buildingId?.address}</span></div>
                    <div className="detail-item"><span className="d-label">Ngày gửi</span><span className="d-val">{new Date(report.createdAt).toLocaleString("vi-VN")}</span></div>
                </div>
                <div className="detail-content-box"><span className="d-label">Nội dung báo cáo</span><p>{report.content}</p></div>
                {report.adminReview?.note && (
                    <div className="detail-admin-note">
                        <span className="d-label">💬 Phản hồi từ Admin</span>
                        <p>{report.adminReview.note}</p>
                        <span className="note-meta">— {report.adminReview.reviewedBy?.username} | {new Date(report.adminReview.reviewedAt).toLocaleString("vi-VN")}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function ReportsPanel() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("pending");
    const [filterType, setFilterType] = useState("");
    const [selected, setSelected] = useState(null);
    const [modal, setModal] = useState(null);
    const [alert, setAlert] = useState({ type: "", msg: "" });

    const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert({ type: "", msg: "" }), 4000); };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { status: tab };
            if (filterType) params.type = filterType;
            const { data } = await api.get("/reports", { params });
            setReports(data.reports || []);
        } catch { showAlert("error", "Không thể tải danh sách báo cáo"); }
        finally { setLoading(false); }
    }, [tab, filterType]);

    useEffect(() => { load(); }, [load]);

    const closeModal = () => { setSelected(null); setModal(null); };
    const pending = reports.filter(r => r.status === "pending").length;

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">📑 Duyệt báo cáo</h2>
                <p className="sd-panel-subtitle">Xem xét và phản hồi báo cáo từ quản lý</p>
            </div>

            {alert.msg && (
                <div className={`ar-alert ${alert.type}`} style={{ marginBottom: 16 }}>
                    {alert.type === "success" ? "✅" : "⚠️"} {alert.msg}
                </div>
            )}

            <div className="ar-toolbar" style={{ marginBottom: 16 }}>
                <div className="ar-tabs">
                    <button className={`ar-tab ${tab === "pending" ? "active" : ""}`} onClick={() => setTab("pending")}>
                        ⏳ Chờ duyệt {pending > 0 && <span className="ar-badge">{pending}</span>}
                    </button>
                    <button className={`ar-tab ${tab === "reviewed" ? "active" : ""}`} onClick={() => setTab("reviewed")}>✅ Đã duyệt</button>
                </div>
                <select className="ar-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="">Tất cả loại</option>
                    <option value="general">Tổng quát</option>
                    <option value="maintenance">Bảo trì</option>
                    <option value="incident">Sự cố</option>
                    <option value="monthly">Hàng tháng</option>
                </select>
            </div>

            <div className="ar-list">
                {loading ? (
                    <div className="ar-empty">Đang tải...</div>
                ) : reports.length === 0 ? (
                    <div className="ar-empty">{tab === "pending" ? "🎉 Không có báo cáo nào chờ duyệt!" : "Chưa có báo cáo nào được duyệt"}</div>
                ) : (
                    reports.map(r => {
                        const col = R_TYPE_COLORS[r.type] || "#6366f1";
                        return (
                            <div key={r._id} className="ar-row">
                                <div className="ar-row-accent" style={{ background: col }} />
                                <div className="ar-row-body">
                                    <div className="ar-row-top">
                                        <span className="ar-type" style={{ background: col + "20", color: col, border: `1px solid ${col}40` }}>{R_TYPE_LABELS[r.type]}</span>
                                        <span className="ar-sender">👤 {r.managerId?.username} &nbsp;·&nbsp; 🏢 {r.buildingId?.name}</span>
                                        <span className="ar-date">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</span>
                                    </div>
                                    <h3 className="ar-row-title">{r.title}</h3>
                                    <p className="ar-row-preview">{r.content?.slice(0, 120)}{r.content?.length > 120 ? "..." : ""}</p>
                                    {r.adminReview?.note && <div className="ar-note">💬 Phản hồi: {r.adminReview.note}</div>}
                                </div>
                                <div className="ar-row-actions">
                                    <button className="btn-view" onClick={() => { setSelected(r); setModal("detail"); }}>👁️ Xem</button>
                                    {r.status === "pending" && (
                                        <button className="btn-approve" onClick={() => { setSelected(r); setModal("review"); }}>✅ Duyệt</button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {modal === "review" && selected && (
                <RReviewModal
                    report={selected}
                    onClose={closeModal}
                    onSuccess={() => { closeModal(); load(); showAlert("success", "Đã duyệt báo cáo thành công!"); }}
                    onError={msg => showAlert("error", msg)}
                />
            )}
            {modal === "detail" && selected && (
                <RDetailModal report={selected} onClose={closeModal} />
            )}
        </>
    );
}

const AN_TYPE_OPTIONS = [
    { value: "general", label: "📢 Thông báo chung" },
    { value: "payment_reminder", label: "💳 Nhắc thanh toán" },
    { value: "maintenance", label: "🔧 Bảo trì" },
    { value: "announcement", label: "📣 Quan trọng" },
];

const AN_TYPE_ICONS = { general: "📢", payment_reminder: "💳", maintenance: "🔧", announcement: "📣" };

function formatDate(d) {
    return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const AN_INIT_FORM = { title: "", message: "", type: "general", receiverType: "role", targetRole: "student", receiverIds: [] };

/* ── Finance Panel ── */
const FIN_TYPE_LABELS = { room_fee: "Phí phòng", electricity: "Điện", violation_fine: "Phí vi phạm", damage_compensation: "Bồi thường", other: "Khác" };
const FIN_TYPE_COLORS = { room_fee: "#6366f1", electricity: "#f59e0b", violation_fine: "#ef4444", damage_compensation: "#ec4899", other: "#94a3b8" };
const fmtMoney = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";

function FinancePanel() {
    const [overview, setOverview] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [byType, setByType] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const [invoiceStatus, setInvoiceStatus] = useState(""); // "" = all
    const [alertMsg, setAlertMsg] = useState("");

    // Load overview + chart data once
    useEffect(() => {
        setLoading(true);
        api.get("/finance/summary")
            .then(r => {
                const d = r.data.data;
                setOverview(d.overview);
                setMonthlyData(d.monthlyData || []);
                setByType(d.byType || []);
                setInvoices(d.recentInvoices || []);
            })
            .catch(() => setAlertMsg("Không thể tải dữ liệu tài chính"))
            .finally(() => setLoading(false));
    }, []);

    // Reload only invoices when filter changes (skip initial load)
    const isFirstRender = useCallback(() => { }, []);
    useEffect(() => {
        if (loading) return; // wait for initial load
        setInvoiceLoading(true);
        const params = invoiceStatus ? { status: invoiceStatus } : {};
        api.get("/finance/summary", { params })
            .then(r => setInvoices(r.data.data?.recentInvoices || []))
            .catch(() => { })
            .finally(() => setInvoiceLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoiceStatus]);

    if (loading) return <div style={{ textAlign: "center", padding: "60px", color: "#bbb" }}><div className="ab-spinner" /><p>Đang tải...</p></div>;

    const ov = overview || {};
    const maxRev = Math.max(...monthlyData.map(m => m.revenue), 1);

    const STATUS_FILTERS = [
        { value: "", label: "Tất cả", color: "#64748b" },
        { value: "paid", label: "Đã thanh toán", color: "#22c55e" },
        { value: "unpaid", label: "Chưa thanh toán", color: "#ef4444" },
        { value: "partial", label: "Một phần", color: "#f59e0b" },
        { value: "overdue", label: "Quá hạn", color: "#dc2626" },
    ];

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">💰 Báo cáo Tài chính</h2>
                <p className="sd-panel-subtitle">Tổng hợp doanh thu và hóa đơn toàn hệ thống</p>
            </div>

            {alertMsg && <div className="ab-alert error" style={{ marginBottom: 16 }}>{alertMsg}</div>}

            {/* Overview stats */}
            <div className="ad-stats-grid" style={{ marginBottom: 24 }}>
                <div className="ad-stat-card">
                    <div className="ad-stat-icon" style={{ background: "#22c55e18" }}>💵</div>
                    <div>
                        <div className="ad-stat-num" style={{ color: "#22c55e" }}>{fmtMoney(ov.totalRevenue)}</div>
                        <div className="sd-stat-label">Đã thu về</div>
                    </div>
                </div>
                <div className="ad-stat-card">
                    <div className="ad-stat-icon" style={{ background: "#ef444418" }}>⚠️</div>
                    <div>
                        <div className="ad-stat-num" style={{ color: "#ef4444" }}>{fmtMoney(ov.unpaidAmount)}</div>
                        <div className="sd-stat-label">Chưa thu</div>
                    </div>
                </div>
                <div className="ad-stat-card">
                    <div className="ad-stat-icon" style={{ background: "#6366f118" }}>📊</div>
                    <div>
                        <div className="ad-stat-num" style={{ color: "#6366f1" }}>{ov.totalInvoices || 0}</div>
                        <div className="sd-stat-label">Tổng hóa đơn</div>
                    </div>
                </div>
                <div className="ad-stat-card">
                    <div className="ad-stat-icon" style={{ background: "#f59e0b18" }}>🎯</div>
                    <div>
                        <div className="ad-stat-num" style={{ color: "#f59e0b" }}>{ov.collectionRate || 0}%</div>
                        <div className="sd-stat-label">Tỷ lệ thu</div>
                    </div>
                </div>
            </div>

            {/* Invoice status breakdown — click to filter */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                    { label: "Đã thanh toán", count: ov.paidCount, color: "#22c55e", val: "paid" },
                    { label: "Chưa thanh toán", count: ov.unpaidCount, color: "#ef4444", val: "unpaid" },
                    { label: "Thanh toán một phần", count: ov.partialCount, color: "#f59e0b", val: "partial" },
                    { label: "Quá hạn", count: ov.overdueCount, color: "#dc2626", val: "overdue" },
                ].map(s => (
                    <div
                        key={s.label}
                        onClick={() => setInvoiceStatus(prev => prev === s.val ? "" : s.val)}
                        title="Click để lọc hóa đơn"
                        style={{
                            flex: "1 1 130px", borderRadius: 10, padding: "12px 16px", textAlign: "center",
                            cursor: "pointer", transition: "all .2s",
                            background: invoiceStatus === s.val ? s.color : s.color + "12",
                            border: `2px solid ${invoiceStatus === s.val ? s.color : s.color + "40"}`,
                            color: invoiceStatus === s.val ? "#fff" : "inherit",
                        }}
                    >
                        <div style={{ fontSize: 22, fontWeight: 800, color: invoiceStatus === s.val ? "#fff" : s.color }}>{s.count || 0}</div>
                        <div style={{ fontSize: 12, marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Monthly bar chart */}
            <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#444", marginBottom: 12 }}>📅 Doanh thu 12 tháng gần nhất</h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, overflowX: "auto", paddingBottom: 8 }}>
                    {monthlyData.map(m => {
                        const pct = Math.round((m.revenue / maxRev) * 100);
                        return (
                            <div key={`${m.year}-${m.month}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 48, flex: 1 }}>
                                <div style={{ fontSize: 9, color: "#888", marginBottom: 3, whiteSpace: "nowrap" }}>
                                    {m.revenue > 0 ? (m.revenue / 1e6).toFixed(1) + "M" : ""}
                                </div>
                                <div title={`${m.label}: ${fmtMoney(m.revenue)}`} style={{ width: "100%", maxWidth: 40, height: `${Math.max(pct, 3)}%`, background: pct > 0 ? "linear-gradient(180deg,#6366f1,#818cf8)" : "#e5e7eb", borderRadius: "4px 4px 0 0", transition: "height .3s" }} />
                                <div style={{ fontSize: 9, color: "#888", marginTop: 4, transform: "rotate(-30deg)", transformOrigin: "top left", whiteSpace: "nowrap", paddingTop: 8 }}>{m.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* By type */}
            {byType.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#444", marginBottom: 12 }}>🏷️ Phân loại doanh thu</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {byType.map(t => {
                            const col = FIN_TYPE_COLORS[t.type] || "#94a3b8";
                            const pct = ov.totalBilled > 0 ? Math.round((t.totalBilled / ov.totalBilled) * 100) : 0;
                            return (
                                <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 110, fontSize: 12, color: "#555", flexShrink: 0 }}>{t.label}</div>
                                    <div style={{ flex: 1, height: 10, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                                        <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 5 }} />
                                    </div>
                                    <div style={{ width: 90, fontSize: 11, color: "#777", textAlign: "right", flexShrink: 0 }}>{fmtMoney(t.totalBilled)}</div>
                                    <div style={{ width: 36, fontSize: 11, color: col, fontWeight: 700, flexShrink: 0 }}>{pct}%</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent invoices with filter */}
            <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#444", margin: 0 }}>
                        📜 Hóa đơn {invoiceStatus ? `— ${STATUS_FILTERS.find(f => f.value === invoiceStatus)?.label}` : "gần nhất"}
                        <span style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8", marginLeft: 6 }}>({invoices.length})</span>
                    </h3>
                    {/* Filter pills */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {STATUS_FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => setInvoiceStatus(f.value)}
                                style={{
                                    padding: "4px 12px", fontSize: 12, borderRadius: 20, cursor: "pointer", border: "1.5px solid",
                                    borderColor: invoiceStatus === f.value ? f.color : "#e2e8f0",
                                    background: invoiceStatus === f.value ? f.color : "#f8fafc",
                                    color: invoiceStatus === f.value ? "#fff" : "#555",
                                    fontWeight: invoiceStatus === f.value ? 700 : 400,
                                    transition: "all .15s",
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="sd-table-wrap" style={{ position: "relative" }}>
                    {invoiceLoading && (
                        <div style={{ position: "absolute", inset: 0, background: "#fff9", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, borderRadius: 8 }}>
                            <div className="ab-spinner" />
                        </div>
                    )}
                    {invoices.length === 0 && !invoiceLoading ? (
                        <div style={{ textAlign: "center", padding: 32, color: "#94a3b8", fontSize: 14 }}>
                            🎉 Không có hóa đơn nào {invoiceStatus ? `với trạng thái "${STATUS_FILTERS.find(f => f.value === invoiceStatus)?.label}"` : ""}
                        </div>
                    ) : (
                        <table className="sd-table">
                            <thead>
                                <tr><th>Mã HD</th><th>Sinh viên</th><th>Loại</th><th>Số tiền</th><th>Trạng thái</th></tr>
                            </thead>
                            <tbody>
                                {invoices.map(inv => (
                                    <tr key={inv._id}>
                                        <td style={{ fontFamily: "monospace", fontSize: 11 }}>{inv.invoiceCode}</td>
                                        <td>{inv.studentId?.fullName || "—"}<br /><span style={{ fontSize: 11, color: "#999" }}>{inv.studentId?.studentCode}</span></td>
                                        <td><span style={{ fontSize: 11, background: (FIN_TYPE_COLORS[inv.type] || "#94a3b8") + "20", color: FIN_TYPE_COLORS[inv.type] || "#94a3b8", padding: "2px 8px", borderRadius: 10 }}>{FIN_TYPE_LABELS[inv.type] || inv.type}</span></td>
                                        <td style={{ fontWeight: 700 }}>{fmtMoney(inv.amount)}</td>
                                        <td>
                                            <span className={`sd-badge ${inv.status === "paid" ? "approved" : inv.status === "unpaid" || inv.status === "overdue" ? "rejected" : "pending"}`}>
                                                {{ paid: "Đã TT", unpaid: "Chưa TT", overdue: "Quá hạn", partial: "Một phần" }[inv.status] || inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}

function NotificationsPanel() {
    const [form, setForm] = useState(AN_INIT_FORM);
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

    // Live search users by role
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
            setSentList(data.data || []);
        } catch { /* silent */ } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => { loadSentList(); }, [loadSentList]);

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
            setForm(AN_INIT_FORM);
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
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">🔔 Thông báo</h2>
                <p className="sd-panel-subtitle">Gửi thông báo đến sinh viên và quản lý</p>
            </div>

            {/* Alert */}
            {alert.msg && (
                <div className={`an-alert ${alert.type}`} style={{ marginBottom: 16 }}>
                    {alert.type === "success" ? "✅" : "⚠️"} {alert.msg}
                </div>
            )}

            {/* Tabs */}
            <div className="an-tabs" style={{ marginBottom: 20 }}>
                <button className={`an-tab ${activeTab === "send" ? "active" : ""}`} onClick={() => setActiveTab("send")}>
                    ✉️ Soạn thông báo
                </button>
                <button className={`an-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
                    📋 Lịch sử gửi {sentList.length > 0 && <span className="an-tab-count">{sentList.length}</span>}
                </button>
            </div>

            {/* Tab: Soạn thông báo */}
            {activeTab === "send" && (
                <div className="an-send-panel" style={{ maxWidth: "100%" }}>
                    <form className="an-form" onSubmit={handleSend}>
                        {/* Loại thông báo */}
                        <div className="an-field">
                            <label className="an-label">Loại thông báo</label>
                            <div className="an-type-grid">
                                {AN_TYPE_OPTIONS.map((t) => (
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
                                    {/* Role filter for search */}
                                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                        <select className="an-select" value={searchRole} onChange={e => { setSearchRole(e.target.value); setUserSearch(""); setUserResults([]); }}>
                                            <option value="student">🎓 Sinh viên</option>
                                            <option value="manager">🏢 Quản lý</option>
                                            <option value="admin">🛡️ Admin</option>
                                        </select>
                                    </div>

                                    {/* Search input */}
                                    <div style={{ position: "relative" }}>
                                        <input
                                            className="an-input"
                                            placeholder="🔍 Tìm username hoặc email..."
                                            value={userSearch}
                                            onChange={e => setUserSearch(e.target.value)}
                                        />
                                        {userSearching && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#888" }}>Đang tìm...</span>}
                                        {userResults.length > 0 && (
                                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px #0002", zIndex: 100, maxHeight: 220, overflowY: "auto" }}>
                                                {userResults.map(u => (
                                                    <div
                                                        key={u._id}
                                                        onClick={() => {
                                                            if (!receiverIds.find(r => r._id === u._id)) {
                                                                setReceiverIds(prev => [...prev, u]);
                                                            }
                                                            setUserSearch("");
                                                            setUserResults([]);
                                                        }}
                                                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                                        onMouseLeave={e => e.currentTarget.style.background = ""}
                                                    >
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

                                    {/* Selected tags */}
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
                            <input className="an-input" name="title" value={form.title} onChange={handleChange}
                                placeholder="Nhập tiêu đề thông báo..." maxLength={120} required />
                            <span className="an-char-count">{form.title.length}/120</span>
                        </div>

                        {/* Nội dung */}
                        <div className="an-field">
                            <label className="an-label">Nội dung <span className="req">*</span></label>
                            <textarea className="an-textarea" name="message" value={form.message} onChange={handleChange}
                                placeholder="Nhập nội dung thông báo chi tiết..." rows={4} maxLength={1000} required />
                            <span className="an-char-count">{form.message.length}/1000</span>
                        </div>

                        {/* Preview */}
                        {(form.title || form.message) && (
                            <div className="an-preview">
                                <p className="an-preview-label">👁️ Xem trước</p>
                                <div className="an-preview-card">
                                    <div className="an-preview-icon">{AN_TYPE_ICONS[form.type]}</div>
                                    <div>
                                        <div className="an-preview-title">{form.title || "Tiêu đề..."}</div>
                                        <div className="an-preview-msg">{form.message || "Nội dung..."}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="an-form-actions">
                            <button type="button" className="an-btn-reset" onClick={() => { setForm(AN_INIT_FORM); setReceiverIds([]); setUserSearch(""); setUserResults([]); }}>🔄 Đặt lại</button>
                            <button type="submit" className="an-btn-send" disabled={sending}>
                                {sending ? <><span className="an-spinner" /> Đang gửi...</> : "📤 Gửi thông báo"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tab: Lịch sử */}
            {activeTab === "history" && (
                <div className="an-history-panel" style={{ maxWidth: "100%" }}>
                    {loadingList ? (
                        <div className="an-history-loading"><div className="an-spinner-lg" /><span>Đang tải lịch sử...</span></div>
                    ) : sentList.length === 0 ? (
                        <div className="an-history-empty"><span>📭</span><p>Chưa có thông báo nào được gửi</p></div>
                    ) : (
                        <div className="an-history-list">
                            {sentList.map((n) => (
                                <div key={n._id} className="an-history-item">
                                    <div className="an-history-icon">{AN_TYPE_ICONS[n.type] || "📢"}</div>
                                    <div className="an-history-content">
                                        <div className="an-history-title">{n.title}</div>
                                        <div className="an-history-msg">{n.message}</div>
                                        <div className="an-history-meta">
                                            <span className="an-history-target">
                                                {n.receiverType === "role"
                                                    ? (n.targetRole === "all" ? "👥 Tất cả" : n.targetRole === "student" ? "🎓 Sinh viên" : "📋 Quản lý")
                                                    : "👤 Cá nhân"}
                                            </span>
                                            <span className="an-history-receivers">{n.receiverIds?.length || 0} người nhận</span>
                                            <span className="an-history-read">✅ {n.readBy?.length || 0} đã đọc</span>
                                            <span className="an-history-date">{formatDate(n.createdAt)}</span>
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
}

/* ── Settings Panel ──────────────────────────────────────────────────────── */

const INV_TYPE_OPTIONS = [
    { value: "violation_fine", label: "🚫 Vi phạm quy chế" },
    { value: "damage_compensation", label: "💥 Bồi thường thiệt hại" },
    { value: "electricity", label: "⚡ Điện vượt trội" },
    { value: "room_fee", label: "🏠 Phí phòng" },
    { value: "other", label: "📄 Khác" },
];

const PRICE_CONFIG = [
    { key: "violation_fine_rate", label: "🚫 Phí vi phạm quy chế", unit: "đồng/lần", suffix: "đ", color: "#ef4444" },
    { key: "electricity_excess_rate", label: "⚡ Điện vượt trội", unit: "đồng/kWh", suffix: "đ", color: "#f59e0b" },
    { key: "damage_compensation_rate", label: "💥 Bồi thường thiệt hại", unit: "đồng/vụ", suffix: "đ", color: "#ec4899" },
    { key: "free_electricity_units", label: "💡 Số điện miễn phí mỗi tháng", unit: "kWh/phòng", suffix: "kWh", color: "#22c55e" },
];


function SettingsPanel() {
    const [activeTab, setActiveTab] = useState("prices");
    // Prices state
    const [prices, setPrices] = useState({});
    const [priceLoading, setPriceLoading] = useState(true);
    const [priceSaving, setPriceSaving] = useState(false);
    const [priceAlert, setPriceAlert] = useState({ type: "", msg: "" });
    const showPriceAlert = (type, msg) => { setPriceAlert({ type, msg }); setTimeout(() => setPriceAlert({ type: "", msg: "" }), 4000); };

    // Registration open toggle
    const [regOpen, setRegOpen] = useState(true);
    const [regToggling, setRegToggling] = useState(false);
    const handleToggleReg = async () => {
        setRegToggling(true);
        try {
            await api.put("/settings/registration-open", { isOpen: !regOpen });
            setRegOpen(p => !p);
            showPriceAlert("success", !regOpen ? "Đã mở đăng ký phòng!" : "Đã tắt đăng ký phòng!");
        } catch { showPriceAlert("error", "Không thể thay đổi trạng thái"); }
        finally { setRegToggling(false); }
    };

    // Bill sender state
    // Tạo kỳ học tự động từ ngày hiện tại
    const now = new Date();
    const mo = now.getMonth() + 1; // 1-12
    const yr = now.getFullYear();
    const semester = mo <= 3 ? "Spring" : mo <= 8 ? "Summer" : "Fall";
    const autoTermCode = `${semester}${yr}`;
    // Hạn thanh toán mặc định: 2 tuần kể từ hôm nay
    const twWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const BILL_INIT = { studentSearch: "", selectedStudent: null, type: "violation_fine", amount: "", excessKwh: "", description: "", dueDate: twWeeksLater, termCode: autoTermCode };
    const [bill, setBill] = useState(BILL_INIT);
    const [studentResults, setStudentResults] = useState([]);
    const [studentSearching, setStudentSearching] = useState(false);
    const [billSending, setBillSending] = useState(false);
    const [billAlert, setBillAlert] = useState({ type: "", msg: "" });
    const showBillAlert = (type, msg) => { setBillAlert({ type, msg }); setTimeout(() => setBillAlert({ type: "", msg: "" }), 5000); };

    // Debtor list
    const [debtors, setDebtors] = useState([]);
    const [debtorLoading, setDebtorLoading] = useState(false);

    // Load prices on mount
    useEffect(() => {
        api.get("/settings/prices")
            .then(r => {
                const d = r.data.data;
                const flat = {};
                for (const key of Object.keys(d)) flat[key] = d[key].value;
                setPrices(flat);
            })
            .catch(() => showPriceAlert("error", "Không thể tải cài đặt giá"))
            .finally(() => setPriceLoading(false));

        // Load trạng thái đăng ký phòng
        api.get("/settings/registration-open")
            .then(r => setRegOpen(r.data.data.isOpen))
            .catch(() => { });
    }, []);

    // Load debtors when switching to bill tab
    useEffect(() => {
        if (activeTab !== "bill") return;
        setDebtorLoading(true);
        api.get("/invoices/debtors")
            .then(r => setDebtors(r.data.data || []))
            .catch(() => { })
            .finally(() => setDebtorLoading(false));
    }, [activeTab]);

    // Debounced student search
    useEffect(() => {
        if (!bill.studentSearch.trim()) { setStudentResults([]); return; }
        const t = setTimeout(async () => {
            setStudentSearching(true);
            try { const r = await api.get("/invoices/search-students", { params: { q: bill.studentSearch } }); setStudentResults(r.data.data || []); }
            catch { setStudentResults([]); }
            finally { setStudentSearching(false); }
        }, 350);
        return () => clearTimeout(t);
    }, [bill.studentSearch]);

    const handleSavePrices = async () => {
        setPriceSaving(true);
        try {
            await api.put("/settings/prices", prices);
            showPriceAlert("success", "Cập nhật giá thành công!");
        } catch { showPriceAlert("error", "Lưu thất bại"); }
        finally { setPriceSaving(false); }
    };

    const handleSendBill = async () => {
        if (!bill.selectedStudent) { showBillAlert("error", "Vui lòng chọn sinh viên"); return; }
        if (!bill.dueDate) { showBillAlert("error", "Vui lòng chọn hạn thanh toán"); return; }

        // Tính số tiền
        let finalAmount;
        if (bill.type === "electricity") {
            if (!bill.excessKwh || Number(bill.excessKwh) <= 0) { showBillAlert("error", "Vui lòng nhập số kWh vượt mức hợp lệ"); return; }
            if (!prices.electricity_excess_rate) { showBillAlert("error", "Chưa có giá điện trong cài đặt"); return; }
            const totalElec = Number(bill.excessKwh) * Number(prices.electricity_excess_rate);
            const occupants = bill.selectedStudent?.currentRoomId?.currentOccupancy || 1;
            finalAmount = Math.ceil(totalElec / occupants); // chia đều, làm tròn lên
        } else {
            if (!bill.amount || Number(bill.amount) <= 0) { showBillAlert("error", "Số tiền phải lớn hơn 0"); return; }
            finalAmount = Number(bill.amount);
        }
        setBillSending(true);
        try {
            const occupants = bill.selectedStudent?.currentRoomId?.currentOccupancy || 1;
            const { data } = await api.post("/invoices", {
                studentId: bill.selectedStudent._id,
                type: bill.type,
                amount: finalAmount,
                description: bill.description || (
                    bill.type === "electricity"
                        ? `Điện vượt mức: ${bill.excessKwh} kWh × ${fmtMoney(prices.electricity_excess_rate)}/kWh ÷ ${occupants} người = ${fmtMoney(finalAmount)}/người`
                        : ""
                ),
                dueDate: bill.dueDate,
                termCode: bill.termCode,
            });
            showBillAlert("success", data.message || "Tạo hóa đơn thành công!");
            setBill(BILL_INIT); setStudentResults([]);
            // Reload debtors
            api.get("/invoices/debtors").then(r => setDebtors(r.data.data || []));
        } catch (e) { showBillAlert("error", e.response?.data?.message || "Tạo hóa đơn thất bại"); }
        finally { setBillSending(false); }
    };

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">⚙️ Cài đặt & Thanh toán</h2>
                <p className="sd-panel-subtitle">Quản lý giá dịch vụ và gửi hóa đơn cho sinh viên</p>
            </div>

            {/* Tabs */}
            <div className="an-tabs" style={{ marginBottom: 24 }}>
                <button className={`an-tab ${activeTab === "prices" ? "active" : ""}`} onClick={() => setActiveTab("prices")}>
                    💲 Cài đặt giá
                </button>
                <button className={`an-tab ${activeTab === "bill" ? "active" : ""}`} onClick={() => setActiveTab("bill")}>
                    💻 Gửi Bill thanh toán
                </button>
            </div>

            {/* ─── Tab: Cài đặt giá ─── */}
            {activeTab === "prices" && (
                <div style={{ maxWidth: 640 }}>
                    {priceAlert.msg && (
                        <div className={`an-alert ${priceAlert.type}`} style={{ marginBottom: 16 }}>
                            {priceAlert.type === "success" ? "✅" : "⚠️"} {priceAlert.msg}
                        </div>
                    )}

                    {priceLoading ? (
                        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}><div className="ab-spinner" /></div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            {/* ── Toggle đăng ký phòng ── */}
                            <div style={{ background: regOpen ? "#dcfce7" : "#fef2f2", border: `1.5px solid ${regOpen ? "#16a34a40" : "#ef444430"}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                                <span style={{ fontSize: 22 }}>{regOpen ? "🟢" : "🔴"}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>Cho phép sinh viên đăng ký phòng</div>
                                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                                        {regOpen ? "Đang mở — Sinh viên có thể gửi đơn đăng ký" : "Đang tắt — Sinh viên không thể đăng ký phòng"}
                                    </div>
                                </div>
                                <button
                                    onClick={handleToggleReg}
                                    disabled={regToggling}
                                    style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .2s", background: regOpen ? "#ef4444" : "#16a34a", color: "#fff", opacity: regToggling ? .6 : 1 }}
                                >
                                    {regToggling ? "..." : regOpen ? "🔴 Tắt" : "🟢 Bật"}
                                </button>
                            </div>

                            {PRICE_CONFIG.map(cfg => (
                                <div key={cfg.key} style={{ background: cfg.color + "0a", border: `1.5px solid ${cfg.color}30`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 4 }}>{cfg.label}</div>
                                        <div style={{ fontSize: 12, color: "#888" }}>({cfg.unit})</div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <input
                                            type="number" min="0"
                                            value={prices[cfg.key] ?? ""}
                                            onChange={e => setPrices(p => ({ ...p, [cfg.key]: e.target.value }))}
                                            style={{ width: 160, padding: "9px 12px", border: `1.5px solid ${cfg.color}50`, borderRadius: 8, fontSize: 14, fontWeight: 700, color: cfg.color, textAlign: "right", outline: "none" }}
                                        />
                                        <span style={{ fontSize: 13, color: "#666" }}>{cfg.suffix || "đ"}</span>
                                    </div>
                                </div>
                            ))}

                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                                <button
                                    onClick={handleSavePrices}
                                    disabled={priceSaving}
                                    style={{ padding: "10px 28px", background: "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                                >
                                    {priceSaving ? <><span className="an-spinner" /> Đang lưu...</> : "💾 Lưu cài đặt"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Tab: Gửi Bill ─── */}
            {activeTab === "bill" && (
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>

                    {/* Form gửi bill */}
                    <div style={{ flex: "1 1 360px" }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#444", marginBottom: 16 }}>📝 Tạo hóa đơn mới</h3>

                        {billAlert.msg && (
                            <div className={`an-alert ${billAlert.type}`} style={{ marginBottom: 12 }}>
                                {billAlert.type === "success" ? "✅" : "⚠️"} {billAlert.msg}
                            </div>
                        )}

                        {/* Search student */}
                        <div className="an-field">
                            <label className="an-label">🎓 Sinh viên *</label>
                            {bill.selectedStudent ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#6366f110", border: "1.5px solid #6366f140", borderRadius: 8 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                        {bill.selectedStudent.fullName[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 13 }}>{bill.selectedStudent.fullName}</div>
                                        <div style={{ fontSize: 11, color: "#888" }}>MSSV: {bill.selectedStudent.studentCode}</div>
                                    </div>
                                    <button type="button" onClick={() => setBill(p => ({ ...p, selectedStudent: null, studentSearch: "" }))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                                </div>
                            ) : (
                                <div style={{ position: "relative" }}>
                                    <input
                                        className="an-input"
                                        placeholder="🔍 Tìm theo tên hoặc mã sinh viên..."
                                        value={bill.studentSearch}
                                        onChange={e => setBill(p => ({ ...p, studentSearch: e.target.value }))}
                                    />
                                    {studentSearching && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#888" }}>Đang tìm...</span>}
                                    {studentResults.length > 0 && (
                                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px #0002", zIndex: 100, maxHeight: 200, overflowY: "auto" }}>
                                            {studentResults.map(s => (
                                                <div
                                                    key={s._id}
                                                    onClick={() => { setBill(p => ({ ...p, selectedStudent: s, studentSearch: "" })); setStudentResults([]); }}
                                                    style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", flexDirection: "column" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                                    onMouseLeave={e => e.currentTarget.style.background = ""}
                                                >
                                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{s.fullName}</span>
                                                    <span style={{ fontSize: 11, color: "#888" }}>MSSV: {s.studentCode} {!s.currentRoomId ? "⚠️ Chưa có phòng" : ""}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Loại hóa đơn */}
                        <div className="an-field">
                            <label className="an-label">Loại hóa đơn *</label>
                            <select className="an-select" value={bill.type} onChange={e => setBill(p => ({ ...p, type: e.target.value }))}>
                                {INV_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>

                        {/* Số tiền — thay đổi theo loại hóa đơn */}
                        {bill.type === "electricity" ? (
                            <div className="an-field">
                                <label className="an-label">⚡ Số kWh vượt mức *</label>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <input
                                        className="an-input"
                                        type="number" min="0" step="0.1"
                                        placeholder="VD: 15"
                                        value={bill.excessKwh}
                                        onChange={e => setBill(p => ({ ...p, excessKwh: e.target.value }))}
                                        style={{ flex: 1 }}
                                    />
                                    <span style={{ fontSize: 13, color: "#888", flexShrink: 0 }}>kWh</span>
                                </div>
                                {bill.excessKwh > 0 && prices.electricity_excess_rate ? (() => {
                                    const total = Number(bill.excessKwh) * Number(prices.electricity_excess_rate);
                                    const occ = bill.selectedStudent?.currentRoomId?.currentOccupancy || 1;
                                    const perPerson = Math.ceil(total / occ);
                                    return (
                                        <div style={{ marginTop: 8, padding: "10px 14px", background: "#f59e0b10", border: "1.5px solid #f59e0b30", borderRadius: 8 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: occ > 1 ? 6 : 0 }}>
                                                <span style={{ fontSize: 12, color: "#888" }}>{bill.excessKwh} kWh × {fmtMoney(prices.electricity_excess_rate)}/kWh</span>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{fmtMoney(total)}</span>
                                            </div>
                                            {occ > 1 && (
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f59e0b20", paddingTop: 6 }}>
                                                    <span style={{ fontSize: 12, color: "#16a34a" }}>÷ {occ} người trong phòng</span>
                                                    <span style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{fmtMoney(perPerson)}/người</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })() : bill.excessKwh > 0 && !prices.electricity_excess_rate ? (
                                    <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>⚠️ Chưa cài đặt giá điện — vui lòng cài đặt trước</p>
                                ) : null}
                            </div>
                        ) : (
                            <div className="an-field">
                                <label className="an-label">Số tiền (VND) *</label>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <input
                                        className="an-input"
                                        type="number" min="0"
                                        placeholder="VD: 500000"
                                        value={bill.amount}
                                        onChange={e => setBill(p => ({ ...p, amount: e.target.value }))}
                                    />
                                    {/* Gợi ý giá định sẵn cho vi phạm */}
                                    {bill.type === "violation_fine" && prices.violation_fine_rate && (
                                        <button type="button"
                                            onClick={() => setBill(p => ({ ...p, amount: prices.violation_fine_rate }))}
                                            style={{ whiteSpace: "nowrap", fontSize: 11, padding: "5px 10px", background: "#ef444415", border: "1px solid #ef444430", borderRadius: 6, cursor: "pointer", color: "#ef4444" }}
                                        >= {fmtMoney(prices.violation_fine_rate)}</button>
                                    )}
                                </div>
                                {bill.type === "damage_compensation" && (
                                    <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>💡 Bồi thường thiệt hại — nhập số tiền cụ thể theo mức độ thiệt hại thực tế</p>
                                )}
                            </div>
                        )}

                        {/* Mô tả */}
                        <div className="an-field">
                            <label className="an-label">Mô tả</label>
                            <textarea className="an-textarea" rows={2} placeholder="Lý do / chi tiết..." value={bill.description} onChange={e => setBill(p => ({ ...p, description: e.target.value }))} />
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            {/* Hạn thanh toán */}
                            <div className="an-field" style={{ flex: 1 }}>
                                <label className="an-label">Hạn thanh toán *</label>
                                <input className="an-input" type="date" value={bill.dueDate}
                                    min={new Date().toISOString().slice(0, 10)}
                                    onChange={e => setBill(p => ({ ...p, dueDate: e.target.value }))} />
                            </div>
                            {/* Kỳ học */}
                            <div className="an-field" style={{ flex: 1 }}>
                                <label className="an-label">Kỳ học</label>
                                <input className="an-input" placeholder="VD: 2024-1" value={bill.termCode} onChange={e => setBill(p => ({ ...p, termCode: e.target.value }))} />
                            </div>
                        </div>

                        <button
                            onClick={handleSendBill}
                            disabled={billSending}
                            style={{ width: "100%", padding: "12px", marginTop: 8, background: "linear-gradient(135deg,#e8540a,#ff7c3a)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                        >
                            {billSending ? <><span className="an-spinner" /> Đang tạo...</> : "💻 Tạo & Gửi hóa đơn"}
                        </button>
                    </div>

                    {/* Danh sách sinh viên còn nợ */}
                    <div style={{ flex: "1 1 300px" }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#444", marginBottom: 12 }}>⚠️ Sinh viên còn nợ ({debtors.length})</h3>
                        {debtorLoading ? (
                            <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}><div className="ab-spinner" /></div>
                        ) : debtors.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 24, color: "#94a3b8", fontSize: 13 }}>🎉 Không có sinh viên nào còn nợ!</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 520, overflowY: "auto" }}>
                                {debtors.map(d => (
                                    <div
                                        key={d.studentId}
                                        onClick={() => d.student && setBill(p => ({ ...p, selectedStudent: d.student, studentSearch: "", type: "violation_fine" }))}
                                        style={{ padding: "12px 14px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "border-color .15s" }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = "#e8540a50"}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
                                            {d.student?.fullName?.[0] || "?"}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.student?.fullName}</div>
                                            <div style={{ fontSize: 11, color: "#888" }}>MSSV: {d.student?.studentCode}</div>
                                        </div>
                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: "#ef4444" }}>{fmtMoney(d.totalDebt)}</div>
                                            <div style={{ fontSize: 10, color: "#94a3b8" }}>{d.invoiceCount} hóa đơn</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

/* ── Main AdminDashboard ─────────────────────────────────────────────────── */

const MENU = [
    { id: "overview", icon: "🛡️", label: "Tổng quan" },
    { id: "users", icon: "👥", label: "Tài khoản" },
    { id: "buildings", icon: "🏢", label: "Tòa nhà & Phòng" },
    { id: "reports", icon: "📑", label: "Báo cáo" },
    { id: "finance", icon: "💰", label: "Tài chính" },
    { id: "settings", icon: "⚙️", label: "Cài đặt & Bill" },
    { id: "notifications", icon: "🔔", label: "Thông báo" },
];

export default function AdminDashboard() {
    const [active, setActive] = useState("overview");
    const [showChangePw, setShowChangePw] = useState(false);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const initials = (user.username || "AD").slice(0, 2).toUpperCase();

    const panels = {
        overview: <OverviewPanel />,
        users: <UsersPanel />,
        buildings: <BuildingsPanel />,
        reports: <ReportsPanel />,
        finance: <FinancePanel />,
        settings: <SettingsPanel />,
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

            {/* ── Content ── */}
            <main className="sd-content">
                {panels[active]}
            </main>

            {showChangePw && (
                <ChangePasswordModal onClose={() => setShowChangePw(false)} />
            )}
        </div>
    );
}
