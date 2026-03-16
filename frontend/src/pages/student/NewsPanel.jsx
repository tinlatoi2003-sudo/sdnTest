import { useState, useEffect } from "react";
import { studentApi } from "../../services/studentApi";

const fmtDatetime = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    const day = String(dt.getDate()).padStart(2, "0");
    const mon = String(dt.getMonth() + 1).padStart(2, "0");
    const year = dt.getFullYear();
    const h = String(dt.getHours()).padStart(2, "0");
    const m = String(dt.getMinutes()).padStart(2, "0");
    return `${day}/${mon}/${year} ${h}:${m}`;
};

const TYPE_ICON = { general: "📢", payment: "💳", maintenance: "🔧", event: "🎉", other: "📌" };
const TYPE_LABEL = { general: "Chung", payment: "Thanh toán", maintenance: "Bảo trì", event: "Sự kiện", other: "Khác" };

export default function NewsPanel() {
    const [all, setAll] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");   // confirmed search
    const [selected, setSelected] = useState(null); // clicked item

    useEffect(() => {
        studentApi.getNews()
            .then(r => setAll(r.data.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    // Filter by query
    const filtered = all.filter(item =>
        !query ||
        item.title?.toLowerCase().includes(query.toLowerCase()) ||
        item.message?.toLowerCase().includes(query.toLowerCase())
    );

    const handleSearch = (e) => {
        e.preventDefault();
        setQuery(search.trim());
        setSelected(null);
    };

    if (loading) return (
        <div className="sd-loading"><div className="sd-spinner" /><span>Đang tải...</span></div>
    );

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">🔔 Tin tức & Thông báo</h2>
                <p className="sd-panel-subtitle">Thông báo mới nhất từ Ban quản lý KTX</p>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <div style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 8,
                    border: "1.5px solid #e8e8e8", borderRadius: 10, padding: "0 14px",
                    background: "#fff", transition: "border-color .2s"
                }}>
                    <span style={{ color: "#bbb", fontSize: 16 }}>🔍</span>
                    <input
                        style={{ border: "none", outline: "none", flex: 1, fontSize: 14, padding: "11px 0", fontFamily: "Inter,sans-serif", background: "transparent", color: "#1a1a1a" }}
                        placeholder="Tìm kiếm thông báo..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); if (!e.target.value) { setQuery(""); setSelected(null); } }}
                    />
                </div>
                <button type="submit" style={{
                    padding: "11px 22px", background: "linear-gradient(135deg,#e8540a,#ff7c3a)",
                    color: "#fff", border: "none", borderRadius: 10, fontSize: 14,
                    fontWeight: 600, cursor: "pointer", fontFamily: "Inter,sans-serif",
                    boxShadow: "0 4px 12px rgba(232,84,10,.3)", whiteSpace: "nowrap"
                }}>Tìm kiếm</button>
            </form>

            {query && (
                <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
                    {filtered.length > 0
                        ? `Tìm thấy ${filtered.length} kết quả cho "${query}"`
                        : `Không có kết quả cho "${query}"`}
                    &nbsp;<span
                        style={{ color: "#e8540a", cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => { setQuery(""); setSearch(""); setSelected(null); }}
                    >Xóa</span>
                </div>
            )}

            {/* Detail view */}
            {selected ? (
                <div style={{ background: "#fff", border: "1px solid #efefef", borderRadius: 16, padding: 24 }}>
                    <button onClick={() => setSelected(null)} style={{
                        background: "none", border: "none", color: "#e8540a",
                        fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 16
                    }}>← Quay lại danh sách</button>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <span style={{ fontSize: 28 }}>{TYPE_ICON[selected.type] || "📌"}</span>
                        <div>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>{selected.title}</h3>
                            <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>
                                <span className="sd-badge info" style={{ fontSize: 11 }}>{TYPE_LABEL[selected.type] || selected.type}</span>
                                &nbsp;·&nbsp; 👤 {selected.senderId?.username || "Admin"}
                                &nbsp;·&nbsp; 🕐 {fmtDatetime(selected.createdAt)}
                            </div>
                        </div>
                    </div>
                    <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "0 0 16px" }} />
                    <p style={{ fontSize: 15, color: "#444", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                        {selected.message}
                    </p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="sd-empty">
                    <span className="sd-empty-icon">📭</span>
                    <p className="sd-empty-text">
                        {query ? `Không tìm thấy thông báo nào cho "${query}"` : "Chưa có thông báo nào"}
                    </p>
                </div>
            ) : (
                /* News list */
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {filtered.map((item, idx) => (
                        <div
                            key={item._id}
                            onClick={() => setSelected(item)}
                            style={{
                                padding: "16px 20px", cursor: "pointer",
                                background: "#fff", borderRadius: idx === 0 ? "14px 14px 0 0" : idx === filtered.length - 1 ? "0 0 14px 14px" : 0,
                                border: "1px solid #efefef",
                                borderBottom: idx === filtered.length - 1 ? "1px solid #efefef" : "none",
                                transition: "background .15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#fef9f7"}
                            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                        >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                <span style={{ fontSize: 20, marginTop: 1 }}>{TYPE_ICON[item.type] || "📌"}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 4, lineHeight: 1.4 }}>
                                        {item.title}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#e8540a" }}>
                                        {fmtDatetime(item.createdAt)}
                                    </div>
                                </div>
                                <span style={{ color: "#bbb", fontSize: 16, marginTop: 2 }}>›</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
