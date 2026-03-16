import { useState, useEffect } from "react";
import { studentApi } from "../../services/studentApi";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

export default function RoomHistoryPanel() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        studentApi.getRoomHistory()
            .then(r => setData(r.data.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="sd-loading"><div className="sd-spinner" /><span>Đang tải...</span></div>
    );

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">🏠 Lịch sử phòng</h2>
                <p className="sd-panel-subtitle">Lịch sử các phòng đã ở tại KTX FPT</p>
            </div>

            {data.length === 0 ? (
                <div className="sd-empty">
                    <span className="sd-empty-icon">🏠</span>
                    <p className="sd-empty-text">Chưa có lịch sử phòng</p>
                </div>
            ) : (
                <div className="sd-table-wrap">
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>Phòng</th>
                                <th>Tòa nhà</th>
                                <th>Tầng</th>
                                <th>Ngày vào</th>
                                <th>Ngày ra</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(item => (
                                <tr key={item._id}>
                                    <td><strong>Phòng {item.roomId?.roomNumber || "—"}</strong></td>
                                    <td>{item.roomId?.buildingId?.name || "—"}</td>
                                    <td>Tầng {item.roomId?.floor || "—"}</td>
                                    <td>{fmtDate(item.startDate)}</td>
                                    <td>{item.endDate ? fmtDate(item.endDate) : <span className="sd-badge approved">Hiện tại</span>}</td>
                                    <td>
                                        <span className={`sd-badge ${item.status === "active" ? "approved" : "info"}`}>
                                            {item.status === "active" ? "Đang ở" : item.status}
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
