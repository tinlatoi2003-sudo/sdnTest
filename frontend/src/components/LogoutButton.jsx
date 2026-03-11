import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./LogoutButton.css";

/**
 * LogoutButton — dùng chung cho mọi trang sau khi đăng nhập
 * Props:
 *   variant: "fixed" (button nổi góc phải dưới, default) | "inline" (button thông thường)
 */
export default function LogoutButton({ variant = "fixed" }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            // Gọi backend để log activity (không bắt lỗi nếu server down)
            await api.post("/auth/logout").catch(() => { });
        } finally {
            // Xóa token + thông tin user khỏi localStorage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            // Chuyển về trang login
            navigate("/login", { replace: true });
        }
    };

    if (variant === "inline") {
        return (
            <button className="logout-btn-inline" onClick={handleLogout} title="Đăng xuất">
                🚪 Đăng xuất
            </button>
        );
    }

    return (
        <button className="logout-btn-fixed" onClick={handleLogout} title="Đăng xuất">
            <span className="logout-icon">🚪</span>
            <span className="logout-label">Đăng xuất</span>
        </button>
    );
}
