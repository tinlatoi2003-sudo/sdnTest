import { useState, useEffect } from "react";
import "./StudentDashboard.css";
import { studentApi } from "../../services/studentApi";
import NewsPanel from "./NewsPanel";
import RoomHistoryPanel from "./RoomHistoryPanel";
import BookingsPanel from "./BookingsPanel";
import ElectricityPanel from "./ElectricityPanel";
import PaymentHistoryPanel from "./PaymentHistoryPanel";
import MyRequestsPanel from "./MyRequestsPanel";
import ViolationsPanel from "./ViolationsPanel";

const MENU = [
    { id: "news", icon: "🔔", label: "Tin tức" },
    { id: "room-history", icon: "🏠", label: "Lịch sử phòng" },
    { id: "bookings", icon: "📋", label: "Đăng ký phòng" },
    { id: "electricity", icon: "⚡", label: "Điện nước" },
    { id: "payments", icon: "💳", label: "Lịch sử thanh toán" },
    { id: "requests", icon: "📝", label: "Yêu cầu của tôi" },
    { id: "violations", icon: "⚠️", label: "Lịch sử phạt" },
];

export default function StudentDashboard() {
    const [active, setActive] = useState("news");
    const [profile, setProfile] = useState(null);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        studentApi.getProfile()
            .then(r => setProfile(r.data.data))
            .catch(() => { });
    }, []);

    const initials = (profile?.fullName || user.username || "SV")
        .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    const panels = {
        "news": <NewsPanel />,
        "room-history": <RoomHistoryPanel />,
        "bookings": <BookingsPanel />,
        "electricity": <ElectricityPanel />,
        "payments": <PaymentHistoryPanel />,
        "requests": <MyRequestsPanel />,
        "violations": <ViolationsPanel />,
    };

    return (
        <div className="sd-wrapper">
            {/* ── Sidebar ── */}
            <aside className="sd-sidebar">
                <div className="sd-sidebar-header">
                    <div className="sd-sidebar-avatar">{initials}</div>
                    <div className="sd-sidebar-name">
                        {profile?.fullName || user.username || "Sinh viên"}
                    </div>
                    <div className="sd-sidebar-code">
                        {profile?.studentCode || ""}
                    </div>
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
