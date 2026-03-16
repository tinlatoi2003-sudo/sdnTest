// Student API service
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const studentApi = {
    getProfile: () => axios.get(`${BASE}/student/profile`, authHeader()),
    getNews: () => axios.get(`${BASE}/student/news`, authHeader()),
    getRoomHistory: () => axios.get(`${BASE}/student/room-history`, authHeader()),
    getBookings: () => axios.get(`${BASE}/student/bookings`, authHeader()),
    createBooking: (data) => axios.post(`${BASE}/student/bookings`, data, authHeader()),
    getElectricity: () => axios.get(`${BASE}/student/electricity`, authHeader()),
    getPayments: () => axios.get(`${BASE}/student/payments`, authHeader()),
    getOutstandingPayments: () => axios.get(`${BASE}/student/payments/outstanding`, authHeader()),
    payOutstandingPayments: (data) => axios.post(`${BASE}/student/payments/pay`, data, authHeader()),
    createPaymentQrSession: (data) => axios.post(`${BASE}/student/payments/qr-session`, data, authHeader()),
    getPaymentQrSession: (id) => axios.get(`${BASE}/student/payments/qr-session/${id}`, authHeader()),
    confirmPaymentQrSession: (id) => axios.post(`${BASE}/student/payments/qr-session/${id}/confirm`, {}, authHeader()),
    getRequests: () => axios.get(`${BASE}/student/requests`, authHeader()),
    createRequest: (data) => axios.post(`${BASE}/student/requests`, data, authHeader()),
    getViolations: () => axios.get(`${BASE}/student/violations`, authHeader()),
    getAvailableRooms: (params) => axios.get(`${BASE}/student/rooms/available`, { ...authHeader(), params }),
};
