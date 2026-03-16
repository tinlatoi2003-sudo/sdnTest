import { useState, useEffect } from "react";
import { studentApi } from "../../services/studentApi";

const fmtNum = (n) => Number(n || 0).toLocaleString("vi-VN");

export default function ElectricityPanel() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        studentApi.getElectricity()
            .then(r => {
                setData(r.data.data);
                if (r.data.message) setMsg(r.data.message);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="sd-loading"><div className="sd-spinner" /><span>Đang tải...</span></div>
    );

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">⚡ Điện nước</h2>
                <p className="sd-panel-subtitle">Chỉ số điện phòng hiện tại (12 tháng gần nhất)</p>
            </div>

            {msg && (
                <div className="sd-alert error" style={{ marginBottom: 16 }}>
                    ℹ️ {msg}
                </div>
            )}

            {data.length === 0 && !msg ? (
                <div className="sd-empty">
                    <span className="sd-empty-icon">⚡</span>
                    <p className="sd-empty-text">Chưa có dữ liệu điện nước</p>
                </div>
            ) : (
                <>
                    {/* Summary stats */}
                    {data.length > 0 && (
                        <div className="sd-stats">
                            <div className="sd-stat-card">
                                <div className="sd-stat-num">{data[0].totalKwh}</div>
                                <div className="sd-stat-label">kWh tháng {data[0].month}/{data[0].year}</div>
                            </div>
                            <div className="sd-stat-card">
                                <div className="sd-stat-num" style={{ color: data[0].excessKwh > 0 ? "#dc2626" : "#16a34a" }}>
                                    {data[0].excessKwh}
                                </div>
                                <div className="sd-stat-label">kWh vượt miễn phí</div>
                            </div>
                            <div className="sd-stat-card">
                                <div className="sd-stat-num" style={{ color: "#e8540a" }}>
                                    {fmtNum(data[0].excessAmount)}đ
                                </div>
                                <div className="sd-stat-label">Phí vượt định mức</div>
                            </div>
                        </div>
                    )}

                    <div className="sd-table-wrap">
                        <table className="sd-table">
                            <thead>
                                <tr>
                                    <th>Tháng/Năm</th>
                                    <th>Chỉ số cũ</th>
                                    <th>Chỉ số mới</th>
                                    <th>Tổng kWh</th>
                                    <th>Miễn phí (kWh)</th>
                                    <th>Vượt (kWh)</th>
                                    <th>Tiền vượt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map(item => (
                                    <tr key={item._id}>
                                        <td><strong>T{item.month}/{item.year}</strong></td>
                                        <td>{item.previousReading}</td>
                                        <td>{item.currentReading}</td>
                                        <td><strong>{item.totalKwh} kWh</strong></td>
                                        <td style={{ color: "#16a34a" }}>{item.freeKwh}</td>
                                        <td style={{ color: item.excessKwh > 0 ? "#dc2626" : "#16a34a" }}>
                                            {item.excessKwh}
                                        </td>
                                        <td style={{ color: item.excessAmount > 0 ? "#dc2626" : "#888" }}>
                                            {fmtNum(item.excessAmount)}đ
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </>
    );
}
