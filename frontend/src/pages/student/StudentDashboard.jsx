import { useEffect, useMemo, useState } from "react";
import "./StudentDashboard.css";
import { studentApi } from "../../services/studentApi";
import NewsPanel from "./NewsPanel";
import RoomHistoryPanel from "./RoomHistoryPanel";
import BookingsPanel from "./BookingsPanel";
import ElectricityPanel from "./ElectricityPanel";
import PaymentHistoryPanel from "./PaymentHistoryPanel";
import MyRequestsPanel from "./MyRequestsPanel";
import ViolationsPanel from "./ViolationsPanel";
import ChangePasswordModal from "../../components/ChangePasswordModal";

const MENU = [
    { id: "news", icon: "📰", label: "Tin tức" },
    { id: "room-history", icon: "📋", label: "Lịch sử phòng" },
    { id: "bookings", icon: "🗂️", label: "Đăng ký phòng" },
    { id: "electricity", icon: "⚡", label: "Điện nước" },
    { id: "payments", icon: "💰", label: "Thanh toán" },
    { id: "requests", icon: "📝", label: "Yêu cầu của tôi" },
    { id: "violations", icon: "⚠️", label: "Lịch sử phạt" },
];

export default function StudentDashboard() {
    const [active, setActive] = useState("news");
    const [profile, setProfile] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [showChangePw, setShowChangePw] = useState(false);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        Promise.all([
            studentApi.getProfile(),
            studentApi.getBookings(),
        ])
            .then(([profileRes, bookingRes]) => {
                setProfile(profileRes.data.data);
                setBookings(bookingRes.data.data || []);
            })
            .catch(() => {});
    }, []);

    const initials = (profile?.fullName || user.username || "SV")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const latestReservedBooking = useMemo(
        () =>
            [...bookings]
                .filter((item) => item.status === "approved" && !item.activatedAt)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0],
        [bookings]
    );

    const roomState = profile?.currentRoomId
        ? {
            label: "Đang ở",
            text: `${profile.currentRoomId.roomNumber} - ${profile.currentRoomId.buildingId?.name || "KTX"}`,
            cls: "approved",
        }
        : latestReservedBooking
            ? {
                label: "Đã giữ chỗ",
                text: `${latestReservedBooking.roomId?.roomNumber || "-"} - ${latestReservedBooking.roomId?.buildingId?.name || "KTX"}`,
                cls: "pending",
            }
            : {
                label: "Chưa có phòng",
                text: "Chưa có",
                cls: "info",
            };

    const panels = {
        news: <NewsPanel />,
        "room-history": <RoomHistoryPanel />,
        bookings: <BookingsPanel />,
        electricity: <ElectricityPanel />,
        payments: <PaymentHistoryPanel />,
        requests: <MyRequestsPanel />,
        violations: <ViolationsPanel />,
    };

    return (
        <div className="sd-wrapper">
            <aside className="sd-sidebar">
                <div className="sd-sidebar-header">
                    <div className="sd-sidebar-avatar">{initials}</div>
                    <div className="sd-sidebar-name">{profile?.fullName || user.username || "Sinh viên"}</div>
                    <div className="sd-sidebar-code">{profile?.studentCode || ""}</div>
                    <div className="sd-sidebar-meta">
                        Tài khoản: <strong>{profile?.userId?.username || user.username || "-"}</strong>
                    </div>
                    <div className="sd-sidebar-meta">
                        Trạng thái phòng:
                        {" "}
                        <span className={`sd-badge ${roomState.cls}`} style={{ marginLeft: 6 }}>
                            {roomState.label}
                        </span>
                    </div>
                    <div className="sd-sidebar-meta">
                        Phong:
                        {" "}
                        <strong>{roomState.text}</strong>
                    </div>
                    {!profile?.currentRoomId && latestReservedBooking && (
                        <div className="sd-sidebar-meta" style={{ color: "#b45309" }}>
                            Thanh toan hoa don tien phong de duoc luu vao phong.
                        </div>
                    )}
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
