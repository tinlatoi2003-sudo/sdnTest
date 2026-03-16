import { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";
import "./NotificationBell.css";

const TYPE_ICONS = {
    general: "📢",
    payment_reminder: "💳",
    maintenance: "🔧",
    announcement: "📣",
};

const TYPE_LABELS = {
    general: "Chung",
    payment_reminder: "Nhắc thanh toán",
    maintenance: "Bảo trì",
    announcement: "Thông báo",
};

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Lấy số thông báo chưa đọc
    const fetchUnreadCount = useCallback(async () => {
        try {
            const { data } = await api.get("/notifications/unread-count");
            setUnreadCount(data.count);
        } catch {
            // silent fail
        }
    }, []);

    // Lấy danh sách thông báo
    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/notifications/my?limit=15");
            setNotifications(data.data);
        } catch {
            // silent fail
        } finally {
            setLoading(false);
        }
    }, []);

    // Poll unread count mỗi 30 giây
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    // Đóng dropdown khi click bên ngoài
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleOpen = () => {
        if (!open) {
            fetchNotifications();
        }
        setOpen((prev) => !prev);
    };

    // Đánh dấu 1 thông báo đã đọc
    const handleMarkRead = async (notif) => {
        if (notif.isRead) return;
        try {
            await api.put(`/notifications/${notif._id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch {
            // silent
        }
    };

    // Đánh dấu tất cả đã đọc
    const handleMarkAll = async () => {
        try {
            await api.put("/notifications/read-all");
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {
            // silent
        }
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = (now - d) / 1000;
        if (diff < 60) return "Vừa xong";
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        return d.toLocaleDateString("vi-VN");
    };

    return (
        <div className="nb-wrap" ref={dropdownRef}>
            <button className="nb-btn" onClick={handleOpen} title="Thông báo">
                <span className="nb-icon">🔔</span>
                {unreadCount > 0 && (
                    <span className="nb-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                )}
            </button>

            {open && (
                <div className="nb-dropdown">
                    <div className="nb-header">
                        <span className="nb-header-title">🔔 Thông báo</span>
                        {unreadCount > 0 && (
                            <button className="nb-mark-all" onClick={handleMarkAll}>
                                Đọc tất cả
                            </button>
                        )}
                    </div>

                    <div className="nb-list">
                        {loading ? (
                            <div className="nb-loading">
                                <div className="nb-spinner"></div>
                                <span>Đang tải...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="nb-empty">
                                <span>🔕</span>
                                <p>Không có thông báo nào</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n._id}
                                    className={`nb-item ${n.isRead ? "read" : "unread"}`}
                                    onClick={() => handleMarkRead(n)}
                                >
                                    <div className="nb-item-icon">
                                        {TYPE_ICONS[n.type] || "📢"}
                                    </div>
                                    <div className="nb-item-content">
                                        <div className="nb-item-title">{n.title}</div>
                                        <div className="nb-item-msg">{n.message}</div>
                                        <div className="nb-item-meta">
                                            <span className="nb-item-type">
                                                {TYPE_LABELS[n.type] || "Chung"}
                                            </span>
                                            <span className="nb-item-time">
                                                {formatTime(n.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    {!n.isRead && <div className="nb-dot"></div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
