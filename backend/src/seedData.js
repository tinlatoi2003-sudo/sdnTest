/**
 * Seed Script - Dữ liệu mẫu cho Dormitory Management System
 * Chạy bằng lệnh: node src/seedData.js
 *
 * Không cần mongoimport. Script dùng Mongoose kết nối trực tiếp.
 * CÁC LỖI ĐÃ SỬA:
 *   - senderId trong Notifications: string → ObjectId
 *   - targetBuildingId trong Notifications: string → ObjectId
 *   - recordedBy trong ElectricityUsage: string → ObjectId
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ─── Import Models ────────────────────────────────────────────────────────────
const User = require("./models/User");
const Student = require("./models/Student");
const Building = require("./models/Building");
const Room = require("./models/Room");
const RoomAssignment = require("./models/RoomAssignment");
const RoomRegistration = require("./models/RoomRegistration");
const Request = require("./models/Request");
const Report = require("./models/Report");
const Invoice = require("./models/Invoice");
const Payment = require("./models/Payment");
const Notification = require("./models/Notification");
const Setting = require("./models/Setting");
const ViolationRecord = require("./models/ViolationRecord");
const ElectricityUsage = require("./models/ElectricityUsage");

// Helper: chuyển hex string → ObjectId
const id = (hex) => new mongoose.Types.ObjectId(hex);

// ─── 1. USERS ─────────────────────────────────────────────────────────────────
const usersData = [
    {
        _id: id("665a1b2c3d4e5f6a7b8c9d01"),
        username: "admin01",
        password: "123456",
        email: "admin01@university.edu.vn",
        phone: "0901234567",
        role: "admin",
        permissions: ["manage_users", "manage_students", "manage_buildings", "manage_rooms", "manage_settings", "view_revenue", "approve_reports", "assign_permissions", "send_notifications", "view_room_list", "view_unpaid_students"],
        isActive: true,
        createdBy: null,
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    },
    {
        _id: id("665a1b2c3d4e5f6a7b8c9d02"),
        username: "manager01",
        password: "123456",
        email: "manager01@university.edu.vn",
        phone: "0912345678",
        role: "manager",
        permissions: ["manage_requests", "send_reports", "send_notifications", "view_room_list", "view_unpaid_students"],
        isActive: true,
        createdBy: id("665a1b2c3d4e5f6a7b8c9d01"),
        createdAt: new Date("2025-01-02T08:00:00.000Z"),
        updatedAt: new Date("2025-01-02T08:00:00.000Z"),
    },
    {
        _id: id("665a1b2c3d4e5f6a7b8c9d03"),
        username: "manager02",
        password: "123456",
        email: "manager02@university.edu.vn",
        phone: "0912345679",
        role: "manager",
        permissions: ["manage_requests", "send_reports", "send_notifications", "view_room_list", "view_unpaid_students"],
        isActive: true,
        createdBy: id("665a1b2c3d4e5f6a7b8c9d01"),
        createdAt: new Date("2025-01-02T08:30:00.000Z"),
        updatedAt: new Date("2025-01-02T08:30:00.000Z"),
    },
    {
        _id: id("665a1b2c3d4e5f6a7b8c9d04"),
        username: "sv001",
        password: "123456",
        email: "nguyenvana@student.university.edu.vn",
        phone: "0923456789",
        role: "student",
        permissions: ["submit_requests", "register_room", "make_payment", "view_own_history", "view_room_list"],
        isActive: true,
        createdBy: id("665a1b2c3d4e5f6a7b8c9d01"),
        createdAt: new Date("2025-01-05T09:00:00.000Z"),
        updatedAt: new Date("2025-01-05T09:00:00.000Z"),
    },
    {
        _id: id("665a1b2c3d4e5f6a7b8c9d05"),
        username: "sv002",
        password: "123456",
        email: "tranthib@student.university.edu.vn",
        phone: "0934567890",
        role: "student",
        permissions: ["submit_requests", "register_room", "make_payment", "view_own_history", "view_room_list"],
        isActive: true,
        createdBy: id("665a1b2c3d4e5f6a7b8c9d01"),
        createdAt: new Date("2025-01-05T09:30:00.000Z"),
        updatedAt: new Date("2025-01-05T09:30:00.000Z"),
    },
    {
        _id: id("665a1b2c3d4e5f6a7b8c9d06"),
        username: "sv003",
        password: "123456",
        email: "levanc@student.university.edu.vn",
        phone: "0945678901",
        role: "student",
        permissions: ["submit_requests", "register_room", "make_payment", "view_own_history", "view_room_list"],
        isActive: true,
        createdBy: id("665a1b2c3d4e5f6a7b8c9d01"),
        createdAt: new Date("2025-01-05T10:00:00.000Z"),
        updatedAt: new Date("2025-01-05T10:00:00.000Z"),
    },
    {
        _id: id("665a1b2c3d4e5f6a7b8c9d07"),
        username: "sv004",
        password: "123456",
        email: "phamthid@student.university.edu.vn",
        phone: "0956789012",
        role: "student",
        permissions: ["submit_requests", "register_room", "make_payment", "view_own_history", "view_room_list"],
        isActive: true,
        createdBy: id("665a1b2c3d4e5f6a7b8c9d01"),
        createdAt: new Date("2025-01-05T10:30:00.000Z"),
        updatedAt: new Date("2025-01-05T10:30:00.000Z"),
    },
    {
        _id: id("665a1b2c3d4e5f6a7b8c9d08"),
        username: "sv005",
        password: "123456",
        email: "hoangvane@student.university.edu.vn",
        phone: "0967890123",
        role: "student",
        permissions: ["submit_requests", "register_room", "make_payment", "view_own_history", "view_room_list"],
        isActive: true,
        createdBy: id("665a1b2c3d4e5f6a7b8c9d01"),
        createdAt: new Date("2025-01-05T11:00:00.000Z"),
        updatedAt: new Date("2025-01-05T11:00:00.000Z"),
    },
];

// ─── 2. STUDENTS ──────────────────────────────────────────────────────────────
const studentsData = [
    {
        _id: id("665b1b2c3d4e5f6a7b8c9d01"),
        userId: id("665a1b2c3d4e5f6a7b8c9d04"),
        studentCode: "SV001", fullName: "Nguyen Van A", gender: "male",
        dateOfBirth: new Date("2003-05-15T00:00:00.000Z"),
        identityNumber: "079203001234",
        faculty: "Cong nghe thong tin", major: "Ky thuat phan mem",
        classCode: "SE1601", academicYear: "K20",
        address: "123 Nguyen Hue, Quan 1, TP.HCM",
        emergencyContact: { name: "Nguyen Van B", phone: "0901111222", relationship: "Bo" },
        currentRoomId: id("665d1b2c3d4e5f6a7b8c9d01"),
        status: "active",
        createdAt: new Date("2025-01-05T09:00:00.000Z"),
        updatedAt: new Date("2025-02-01T08:00:00.000Z"),
    },
    {
        _id: id("665b1b2c3d4e5f6a7b8c9d02"),
        userId: id("665a1b2c3d4e5f6a7b8c9d05"),
        studentCode: "SV002", fullName: "Tran Thi B", gender: "female",
        dateOfBirth: new Date("2003-08-20T00:00:00.000Z"),
        identityNumber: "079203005678",
        faculty: "Quan tri kinh doanh", major: "Marketing",
        classCode: "MK1601", academicYear: "K20",
        address: "456 Le Loi, Quan 3, TP.HCM",
        emergencyContact: { name: "Tran Thi C", phone: "0902222333", relationship: "Me" },
        currentRoomId: id("665d1b2c3d4e5f6a7b8c9d01"),
        status: "active",
        createdAt: new Date("2025-01-05T09:30:00.000Z"),
        updatedAt: new Date("2025-02-01T08:00:00.000Z"),
    },
    {
        _id: id("665b1b2c3d4e5f6a7b8c9d03"),
        userId: id("665a1b2c3d4e5f6a7b8c9d06"),
        studentCode: "SV003", fullName: "Le Van C", gender: "male",
        dateOfBirth: new Date("2002-12-10T00:00:00.000Z"),
        identityNumber: "079202009012",
        faculty: "Cong nghe thong tin", major: "An toan thong tin",
        classCode: "IS1601", academicYear: "K19",
        address: "789 Tran Hung Dao, Quan 5, TP.HCM",
        emergencyContact: { name: "Le Van D", phone: "0903333444", relationship: "Bo" },
        currentRoomId: id("665d1b2c3d4e5f6a7b8c9d02"),
        status: "active",
        createdAt: new Date("2025-01-05T10:00:00.000Z"),
        updatedAt: new Date("2025-02-01T08:00:00.000Z"),
    },
    {
        _id: id("665b1b2c3d4e5f6a7b8c9d04"),
        userId: id("665a1b2c3d4e5f6a7b8c9d07"),
        studentCode: "SV004", fullName: "Pham Thi D", gender: "female",
        dateOfBirth: new Date("2003-03-25T00:00:00.000Z"),
        identityNumber: "079203003456",
        faculty: "Ngoai ngu", major: "Ngon ngu Anh",
        classCode: "EN1601", academicYear: "K20",
        address: "321 Hai Ba Trung, Quan 1, TP.HCM",
        emergencyContact: { name: "Pham Van E", phone: "0904444555", relationship: "Bo" },
        currentRoomId: id("665d1b2c3d4e5f6a7b8c9d04"),
        status: "active",
        createdAt: new Date("2025-01-05T10:30:00.000Z"),
        updatedAt: new Date("2025-02-01T08:00:00.000Z"),
    },
    {
        _id: id("665b1b2c3d4e5f6a7b8c9d05"),
        userId: id("665a1b2c3d4e5f6a7b8c9d08"),
        studentCode: "SV005", fullName: "Hoang Van E", gender: "male",
        dateOfBirth: new Date("2002-07-08T00:00:00.000Z"),
        identityNumber: "079202007890",
        faculty: "Dien - Dien tu", major: "Ky thuat dien",
        classCode: "EE1601", academicYear: "K19",
        address: "654 Vo Van Tan, Quan 3, TP.HCM",
        emergencyContact: { name: "Hoang Thi F", phone: "0905555666", relationship: "Me" },
        currentRoomId: null,
        status: "active",
        createdAt: new Date("2025-01-05T11:00:00.000Z"),
        updatedAt: new Date("2025-01-05T11:00:00.000Z"),
    },
];

// ─── 3. BUILDINGS ─────────────────────────────────────────────────────────────
const buildingsData = [
    {
        _id: id("665c1b2c3d4e5f6a7b8c9d01"),
        name: "Toa A",
        address: "Khu Ky tuc xa, Khu pho 6, Thu Duc, TP.HCM",
        totalFloors: 5,
        description: "Toa nha danh cho sinh vien nam, xay dung nam 2020",
        managerId: id("665a1b2c3d4e5f6a7b8c9d02"),
        status: "active",
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    },
    {
        _id: id("665c1b2c3d4e5f6a7b8c9d02"),
        name: "Toa B",
        address: "Khu Ky tuc xa, Khu pho 6, Thu Duc, TP.HCM",
        totalFloors: 5,
        description: "Toa nha danh cho sinh vien nu, xay dung nam 2021",
        managerId: id("665a1b2c3d4e5f6a7b8c9d03"),
        status: "active",
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    },
];

// ─── 4. ROOMS ─────────────────────────────────────────────────────────────────
const roomsData = [
    {
        _id: id("665d1b2c3d4e5f6a7b8c9d01"),
        buildingId: id("665c1b2c3d4e5f6a7b8c9d01"),
        roomNumber: "A101", floor: 1, type: "standard",
        maxOccupancy: 4, currentOccupancy: 2, pricePerTerm: 3600000, status: "partial",
        amenities: ["wifi", "fan", "hot_water"], description: "Phong 4 giuong, tang 1", isActive: true,
        createdAt: new Date("2025-01-01T00:00:00.000Z"), updatedAt: new Date("2025-02-01T08:00:00.000Z"),
    },
    {
        _id: id("665d1b2c3d4e5f6a7b8c9d02"),
        buildingId: id("665c1b2c3d4e5f6a7b8c9d01"),
        roomNumber: "A102", floor: 1, type: "standard",
        maxOccupancy: 4, currentOccupancy: 1, pricePerTerm: 3600000, status: "partial",
        amenities: ["wifi", "fan", "hot_water"], description: "Phong 4 giuong, tang 1", isActive: true,
        createdAt: new Date("2025-01-01T00:00:00.000Z"), updatedAt: new Date("2025-02-01T08:00:00.000Z"),
    },
    {
        _id: id("665d1b2c3d4e5f6a7b8c9d03"),
        buildingId: id("665c1b2c3d4e5f6a7b8c9d01"),
        roomNumber: "A201", floor: 2, type: "vip",
        maxOccupancy: 2, currentOccupancy: 0, pricePerTerm: 5400000, status: "available",
        amenities: ["wifi", "air_con", "hot_water"], description: "Phong VIP 2 giuong, co dieu hoa, tang 2", isActive: true,
        createdAt: new Date("2025-01-01T00:00:00.000Z"), updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    },
    {
        _id: id("665d1b2c3d4e5f6a7b8c9d04"),
        buildingId: id("665c1b2c3d4e5f6a7b8c9d02"),
        roomNumber: "B101", floor: 1, type: "standard",
        maxOccupancy: 4, currentOccupancy: 1, pricePerTerm: 3600000, status: "partial",
        amenities: ["wifi", "fan", "hot_water"], description: "Phong 4 giuong nu, tang 1", isActive: true,
        createdAt: new Date("2025-01-01T00:00:00.000Z"), updatedAt: new Date("2025-02-01T08:00:00.000Z"),
    },
    {
        _id: id("665d1b2c3d4e5f6a7b8c9d05"),
        buildingId: id("665c1b2c3d4e5f6a7b8c9d02"),
        roomNumber: "B102", floor: 1, type: "standard",
        maxOccupancy: 4, currentOccupancy: 4, pricePerTerm: 3600000, status: "full",
        amenities: ["wifi", "fan", "hot_water"], description: "Phong 4 giuong nu, tang 1 - DAY", isActive: true,
        createdAt: new Date("2025-01-01T00:00:00.000Z"), updatedAt: new Date("2025-02-15T10:00:00.000Z"),
    },
    {
        _id: id("665d1b2c3d4e5f6a7b8c9d06"),
        buildingId: id("665c1b2c3d4e5f6a7b8c9d02"),
        roomNumber: "B201", floor: 2, type: "vip",
        maxOccupancy: 2, currentOccupancy: 0, pricePerTerm: 5400000, status: "available",
        amenities: ["wifi", "air_con", "hot_water"], description: "Phong VIP 2 giuong nu, co dieu hoa, tang 2", isActive: true,
        createdAt: new Date("2025-01-01T00:00:00.000Z"), updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    },
];

// ─── 5. ROOM ASSIGNMENTS ──────────────────────────────────────────────────────
const roomAssignmentsData = [
    {
        _id: id("665e1b2c3d4e5f6a7b8c9d01"),
        studentId: id("665b1b2c3d4e5f6a7b8c9d01"), roomId: id("665d1b2c3d4e5f6a7b8c9d01"),
        buildingId: id("665c1b2c3d4e5f6a7b8c9d01"), termCode: "2025-HK1",
        startDate: new Date("2025-02-01T00:00:00.000Z"), endDate: null, status: "active",
        createdAt: new Date("2025-02-01T08:00:00.000Z"), updatedAt: new Date("2025-02-01T08:00:00.000Z"),
    },
    {
        _id: id("665e1b2c3d4e5f6a7b8c9d02"),
        studentId: id("665b1b2c3d4e5f6a7b8c9d02"), roomId: id("665d1b2c3d4e5f6a7b8c9d01"),
        buildingId: id("665c1b2c3d4e5f6a7b8c9d01"), termCode: "2025-HK1",
        startDate: new Date("2025-02-01T00:00:00.000Z"), endDate: null, status: "active",
        createdAt: new Date("2025-02-01T08:00:00.000Z"), updatedAt: new Date("2025-02-01T08:00:00.000Z"),
    },
    {
        _id: id("665e1b2c3d4e5f6a7b8c9d03"),
        studentId: id("665b1b2c3d4e5f6a7b8c9d03"), roomId: id("665d1b2c3d4e5f6a7b8c9d02"),
        buildingId: id("665c1b2c3d4e5f6a7b8c9d01"), termCode: "2025-HK1",
        startDate: new Date("2025-02-01T00:00:00.000Z"), endDate: null, status: "active",
        createdAt: new Date("2025-02-01T08:00:00.000Z"), updatedAt: new Date("2025-02-01T08:00:00.000Z"),
    },
    {
        _id: id("665e1b2c3d4e5f6a7b8c9d04"),
        studentId: id("665b1b2c3d4e5f6a7b8c9d04"), roomId: id("665d1b2c3d4e5f6a7b8c9d04"),
        buildingId: id("665c1b2c3d4e5f6a7b8c9d02"), termCode: "2025-HK1",
        startDate: new Date("2025-02-01T00:00:00.000Z"), endDate: null, status: "active",
        createdAt: new Date("2025-02-01T08:00:00.000Z"), updatedAt: new Date("2025-02-01T08:00:00.000Z"),
    },
    {
        _id: id("665e1b2c3d4e5f6a7b8c9d05"),
        studentId: id("665b1b2c3d4e5f6a7b8c9d01"), roomId: id("665d1b2c3d4e5f6a7b8c9d03"),
        buildingId: id("665c1b2c3d4e5f6a7b8c9d01"), termCode: "2024-HK2",
        startDate: new Date("2024-09-01T00:00:00.000Z"), endDate: new Date("2025-01-31T00:00:00.000Z"),
        status: "ended",
        createdAt: new Date("2024-09-01T08:00:00.000Z"), updatedAt: new Date("2025-01-31T08:00:00.000Z"),
    },
];

// ─── 6. ROOM REGISTRATIONS ────────────────────────────────────────────────────
const roomRegistrationsData = [
    {
        _id: id("665f1b2c3d4e5f6a7b8c9d01"),
        studentId: id("665b1b2c3d4e5f6a7b8c9d01"), roomId: id("665d1b2c3d4e5f6a7b8c9d01"),
        termCode: "2025-HK1", status: "approved",
        note: "Em muon dang ky phong A101",
        reviewedBy: id("665a1b2c3d4e5f6a7b8c9d02"),
        reviewedAt: new Date("2025-01-20T14:00:00.000Z"),
        reviewNote: "Da duyet, phong con cho",
        createdAt: new Date("2025-01-15T09:00:00.000Z"), updatedAt: new Date("2025-01-20T14:00:00.000Z"),
    },
    {
        _id: id("665f1b2c3d4e5f6a7b8c9d02"),
        studentId: id("665b1b2c3d4e5f6a7b8c9d05"), roomId: id("665d1b2c3d4e5f6a7b8c9d03"),
        termCode: "2025-HK1", status: "pending",
        note: "Em muon dang ky phong VIP A201",
        reviewedBy: null, reviewedAt: null, reviewNote: null,
        createdAt: new Date("2025-02-20T10:00:00.000Z"), updatedAt: new Date("2025-02-20T10:00:00.000Z"),
    },
];

// ─── 7. REQUESTS ──────────────────────────────────────────────────────────────
const requestsData = [
    {
        _id: id("66601b2c3d4e5f6a7b8c9d01"),
        studentId: id("665b1b2c3d4e5f6a7b8c9d01"),
        type: "damage_report", title: "Quat tran phong A101 bi hong",
        description: "Quat tran so 2 trong phong A101 khong quay duoc.",
        attachments: [], currentRoomId: id("665d1b2c3d4e5f6a7b8c9d01"), targetRoomId: null,
        status: "manager_approved",
        managerReview: {
            reviewedBy: id("665a1b2c3d4e5f6a7b8c9d02"), status: "approved",
            note: "Da kiem tra, quat hong motor.", reviewedAt: new Date("2025-02-16T10:00:00.000Z"),
        },
        adminReview: null,
        createdAt: new Date("2025-02-15T08:00:00.000Z"), updatedAt: new Date("2025-02-16T10:00:00.000Z"),
    },
    {
        _id: id("66601b2c3d4e5f6a7b8c9d02"),
        studentId: id("665b1b2c3d4e5f6a7b8c9d03"),
        type: "room_transfer", title: "Xin chuyen tu phong A102 sang A201",
        description: "Em muon chuyen sang phong VIP A201.",
        attachments: [], currentRoomId: id("665d1b2c3d4e5f6a7b8c9d02"),
        targetRoomId: id("665d1b2c3d4e5f6a7b8c9d03"),
        status: "pending", managerReview: null, adminReview: null,
        createdAt: new Date("2025-02-18T14:00:00.000Z"), updatedAt: new Date("2025-02-18T14:00:00.000Z"),
    },
    {
        _id: id("66601b2c3d4e5f6a7b8c9d03"),
        studentId: id("665b1b2c3d4e5f6a7b8c9d02"),
        type: "room_retention", title: "Xin giu phong A101 ky tiep theo",
        description: "Em muon tiep tuc o phong A101 cho HK2 nam 2025.",
        attachments: [], currentRoomId: id("665d1b2c3d4e5f6a7b8c9d01"), targetRoomId: null,
        status: "pending", managerReview: null, adminReview: null,
        createdAt: new Date("2025-02-25T09:00:00.000Z"), updatedAt: new Date("2025-02-25T09:00:00.000Z"),
    },
];

// ─── 8. REPORTS ───────────────────────────────────────────────────────────────
const reportsData = [
    {
        _id: id("66611b2c3d4e5f6a7b8c9d01"),
        managerId: id("665a1b2c3d4e5f6a7b8c9d02"), buildingId: id("665c1b2c3d4e5f6a7b8c9d01"),
        title: "Bao cao tinh trang Toa A thang 2/2025",
        content: "Toa A hien co 2 phong dang su dung, 1 phong VIP trong.",
        type: "general", attachments: [], status: "pending", adminReview: null,
        createdAt: new Date("2025-02-28T15:00:00.000Z"), updatedAt: new Date("2025-02-28T15:00:00.000Z"),
    },
    {
        _id: id("66611b2c3d4e5f6a7b8c9d02"),
        managerId: id("665a1b2c3d4e5f6a7b8c9d03"), buildingId: id("665c1b2c3d4e5f6a7b8c9d02"),
        title: "Su co ong nuoc tang 1 Toa B",
        content: "Ong nuoc tang 1 bi ro ri vao sang ngay 20/02.",
        type: "maintenance", attachments: [], status: "reviewed",
        adminReview: {
            reviewedBy: id("665a1b2c3d4e5f6a7b8c9d01"),
            note: "Da ghi nhan. Se len ke hoach thay ong nuoc.",
            reviewedAt: new Date("2025-02-22T09:00:00.000Z"),
        },
        createdAt: new Date("2025-02-20T11:00:00.000Z"), updatedAt: new Date("2025-02-22T09:00:00.000Z"),
    },
];

// ─── 9. INVOICES ──────────────────────────────────────────────────────────────
const invoicesData = [
    {
        _id: id("66621b2c3d4e5f6a7b8c9d01"), invoiceCode: "INV-2025-0001",
        studentId: id("665b1b2c3d4e5f6a7b8c9d01"), roomId: id("665d1b2c3d4e5f6a7b8c9d01"),
        type: "room_fee", termCode: "2025-HK1", description: "Tien phong A101 - HK1/2025",
        amount: 3600000, paidAmount: 3600000, dueDate: new Date("2025-02-28T23:59:59.000Z"),
        status: "paid", relatedRequestId: null, createdBy: id("665a1b2c3d4e5f6a7b8c9d01"),
        createdAt: new Date("2025-02-01T00:00:00.000Z"), updatedAt: new Date("2025-02-10T14:30:00.000Z"),
    },
    {
        _id: id("66621b2c3d4e5f6a7b8c9d02"), invoiceCode: "INV-2025-0002",
        studentId: id("665b1b2c3d4e5f6a7b8c9d02"), roomId: id("665d1b2c3d4e5f6a7b8c9d01"),
        type: "room_fee", termCode: "2025-HK1", description: "Tien phong A101 - HK1/2025",
        amount: 3600000, paidAmount: 0, dueDate: new Date("2025-02-28T23:59:59.000Z"),
        status: "overdue", relatedRequestId: null, createdBy: id("665a1b2c3d4e5f6a7b8c9d01"),
        createdAt: new Date("2025-02-01T00:00:00.000Z"), updatedAt: new Date("2025-03-01T00:00:00.000Z"),
    },
    {
        _id: id("66621b2c3d4e5f6a7b8c9d03"), invoiceCode: "INV-2025-0003",
        studentId: id("665b1b2c3d4e5f6a7b8c9d03"), roomId: id("665d1b2c3d4e5f6a7b8c9d02"),
        type: "room_fee", termCode: "2025-HK1", description: "Tien phong A102 - HK1/2025",
        amount: 3600000, paidAmount: 1800000, dueDate: new Date("2025-02-28T23:59:59.000Z"),
        status: "partial", relatedRequestId: null, createdBy: id("665a1b2c3d4e5f6a7b8c9d01"),
        createdAt: new Date("2025-02-01T00:00:00.000Z"), updatedAt: new Date("2025-02-15T10:00:00.000Z"),
    },
    {
        _id: id("66621b2c3d4e5f6a7b8c9d04"), invoiceCode: "INV-2025-0004",
        studentId: id("665b1b2c3d4e5f6a7b8c9d04"), roomId: id("665d1b2c3d4e5f6a7b8c9d04"),
        type: "room_fee", termCode: "2025-HK1", description: "Tien phong B101 - HK1/2025",
        amount: 3600000, paidAmount: 3600000, dueDate: new Date("2025-02-28T23:59:59.000Z"),
        status: "paid", relatedRequestId: null, createdBy: id("665a1b2c3d4e5f6a7b8c9d01"),
        createdAt: new Date("2025-02-01T00:00:00.000Z"), updatedAt: new Date("2025-02-05T11:00:00.000Z"),
    },
    {
        _id: id("66621b2c3d4e5f6a7b8c9d05"), invoiceCode: "INV-2025-0005",
        studentId: id("665b1b2c3d4e5f6a7b8c9d03"), roomId: id("665d1b2c3d4e5f6a7b8c9d02"),
        type: "violation_fine", termCode: null, description: "Phat vi pham gio gioi nghiem ngay 10/02/2025",
        amount: 200000, paidAmount: 0, dueDate: new Date("2025-03-10T23:59:59.000Z"),
        status: "unpaid", relatedRequestId: null, createdBy: id("665a1b2c3d4e5f6a7b8c9d02"),
        createdAt: new Date("2025-02-11T08:00:00.000Z"), updatedAt: new Date("2025-02-11T08:00:00.000Z"),
    },
    {
        _id: id("66621b2c3d4e5f6a7b8c9d06"), invoiceCode: "INV-2025-0006",
        studentId: id("665b1b2c3d4e5f6a7b8c9d01"), roomId: id("665d1b2c3d4e5f6a7b8c9d01"),
        type: "damage_compensation", termCode: null, description: "Boi thuong ghe bi gay chan trong phong A101",
        amount: 400000, paidAmount: 0, dueDate: new Date("2025-03-15T23:59:59.000Z"),
        status: "unpaid", relatedRequestId: null, createdBy: id("665a1b2c3d4e5f6a7b8c9d01"),
        createdAt: new Date("2025-02-20T09:00:00.000Z"), updatedAt: new Date("2025-02-20T09:00:00.000Z"),
    },
];

// ─── 10. PAYMENTS ─────────────────────────────────────────────────────────────
const paymentsData = [
    {
        _id: id("66631b2c3d4e5f6a7b8c9d01"),
        invoiceId: id("66621b2c3d4e5f6a7b8c9d01"), studentId: id("665b1b2c3d4e5f6a7b8c9d01"),
        amount: 3600000, paymentMethod: "bank_transfer",
        transactionCode: "VCB20250210143000001", note: "Chuyen khoan Vietcombank",
        paidAt: new Date("2025-02-10T14:30:00.000Z"), createdAt: new Date("2025-02-10T14:30:00.000Z"),
    },
    {
        _id: id("66631b2c3d4e5f6a7b8c9d02"),
        invoiceId: id("66621b2c3d4e5f6a7b8c9d03"), studentId: id("665b1b2c3d4e5f6a7b8c9d03"),
        amount: 1800000, paymentMethod: "e_wallet",
        transactionCode: "MOMO20250215100000001", note: "Thanh toan 1 nua qua Momo",
        paidAt: new Date("2025-02-15T10:00:00.000Z"), createdAt: new Date("2025-02-15T10:00:00.000Z"),
    },
    {
        _id: id("66631b2c3d4e5f6a7b8c9d03"),
        invoiceId: id("66621b2c3d4e5f6a7b8c9d04"), studentId: id("665b1b2c3d4e5f6a7b8c9d04"),
        amount: 3600000, paymentMethod: "cash",
        transactionCode: "CASH20250205110000001", note: "Nop tien mat tai van phong",
        paidAt: new Date("2025-02-05T11:00:00.000Z"), createdAt: new Date("2025-02-05T11:00:00.000Z"),
    },
];

// ─── 11. NOTIFICATIONS ────────────────────────────────────────────────────────
// ✅ ĐÃ SỬA: senderId và targetBuildingId từ string → ObjectId
const notificationsData = [
    {
        _id: id("66641b2c3d4e5f6a7b8c9d01"),
        senderId: id("665a1b2c3d4e5f6a7b8c9d01"),              // ✅ Sửa
        receiverIds: [
            id("665a1b2c3d4e5f6a7b8c9d04"), id("665a1b2c3d4e5f6a7b8c9d05"),
            id("665a1b2c3d4e5f6a7b8c9d06"), id("665a1b2c3d4e5f6a7b8c9d07"),
            id("665a1b2c3d4e5f6a7b8c9d08"),
        ],
        receiverType: "role", targetRole: "student", targetBuildingId: null,
        title: "Thong bao dong tien phong HK1/2025",
        message: "Han dong tien phong HK1/2025 la ngay 28/02/2025.",
        type: "payment_reminder",
        readBy: [
            { userId: id("665a1b2c3d4e5f6a7b8c9d04"), readAt: new Date("2025-02-02T08:30:00.000Z") },
            { userId: id("665a1b2c3d4e5f6a7b8c9d07"), readAt: new Date("2025-02-02T09:15:00.000Z") },
        ],
        createdAt: new Date("2025-02-01T07:00:00.000Z"),
    },
    {
        _id: id("66641b2c3d4e5f6a7b8c9d02"),
        senderId: id("665a1b2c3d4e5f6a7b8c9d02"),              // ✅ Sửa
        receiverIds: [
            id("665a1b2c3d4e5f6a7b8c9d04"), id("665a1b2c3d4e5f6a7b8c9d05"),
            id("665a1b2c3d4e5f6a7b8c9d06"),
        ],
        receiverType: "building", targetRole: null,
        targetBuildingId: id("665c1b2c3d4e5f6a7b8c9d01"),      // ✅ Sửa
        title: "Lich ve sinh tong Toa A",
        message: "Toa A se tien hanh tong ve sinh vao CN 02/03/2025.",
        type: "general", readBy: [],
        createdAt: new Date("2025-02-27T16:00:00.000Z"),
    },
];

// ─── 12. SETTINGS ─────────────────────────────────────────────────────────────
const settingsData = [
    { _id: id("66651b2c3d4e5f6a7b8c9d01"), key: "electricity_excess_price", value: 3500, description: "Gia dien vuot muc cho phep (VND/kWh)", updatedBy: id("665a1b2c3d4e5f6a7b8c9d01"), createdAt: new Date("2025-01-01T00:00:00.000Z"), updatedAt: new Date("2025-01-01T00:00:00.000Z") },
    { _id: id("66651b2c3d4e5f6a7b8c9d02"), key: "electricity_free_limit", value: 50, description: "So kWh dien mien phi moi phong moi thang", updatedBy: id("665a1b2c3d4e5f6a7b8c9d01"), createdAt: new Date("2025-01-01T00:00:00.000Z"), updatedAt: new Date("2025-01-01T00:00:00.000Z") },
    { _id: id("66651b2c3d4e5f6a7b8c9d03"), key: "damage_compensation_rates", value: { fan: 500000, bed: 1000000, desk: 800000, chair: 400000, door: 1500000, window: 1200000, air_conditioner: 5000000, water_heater: 3000000 }, description: "Bang gia boi thuong thiet hai (VND)", updatedBy: id("665a1b2c3d4e5f6a7b8c9d01"), createdAt: new Date("2025-01-01T00:00:00.000Z"), updatedAt: new Date("2025-01-01T00:00:00.000Z") },
    { _id: id("66651b2c3d4e5f6a7b8c9d04"), key: "term_duration_months", value: 4, description: "So thang moi ky thanh toan tien phong", updatedBy: id("665a1b2c3d4e5f6a7b8c9d01"), createdAt: new Date("2025-01-01T00:00:00.000Z"), updatedAt: new Date("2025-01-01T00:00:00.000Z") },
    { _id: id("66651b2c3d4e5f6a7b8c9d05"), key: "late_payment_penalty_rate", value: 0.05, description: "Ty le phat khi thanh toan tre han (5%)", updatedBy: id("665a1b2c3d4e5f6a7b8c9d01"), createdAt: new Date("2025-01-01T00:00:00.000Z"), updatedAt: new Date("2025-01-01T00:00:00.000Z") },
];

// ─── 13. VIOLATION RECORDS ────────────────────────────────────────────────────
const violationRecordsData = [
    {
        _id: id("66661b2c3d4e5f6a7b8c9d01"),
        studentId: id("665b1b2c3d4e5f6a7b8c9d03"), roomId: id("665d1b2c3d4e5f6a7b8c9d02"),
        type: "curfew", description: "Sinh vien Le Van C ve phong luc 23h45, qua gio gioi nghiem.",
        fineAmount: 200000, invoiceId: id("66621b2c3d4e5f6a7b8c9d05"),
        reportedBy: id("665a1b2c3d4e5f6a7b8c9d02"),
        evidence: [], status: "invoiced",
        createdAt: new Date("2025-02-10T23:50:00.000Z"), updatedAt: new Date("2025-02-11T08:00:00.000Z"),
    },
];

// ─── 14. ELECTRICITY USAGE ────────────────────────────────────────────────────
// ✅ ĐÃ SỬA: recordedBy từ string → ObjectId
const electricityUsageData = [
    {
        _id: id("66671b2c3d4e5f6a7b8c9d01"),
        roomId: id("665d1b2c3d4e5f6a7b8c9d01"),
        month: 2, year: 2025, previousReading: 1000, currentReading: 1075,
        totalKwh: 75, freeKwh: 50, excessKwh: 25, excessAmount: 87500,
        recordedBy: id("665a1b2c3d4e5f6a7b8c9d02"),            // ✅ Sửa
        createdAt: new Date("2025-03-01T08:00:00.000Z"),
    },
    {
        _id: id("66671b2c3d4e5f6a7b8c9d02"),
        roomId: id("665d1b2c3d4e5f6a7b8c9d02"),
        month: 2, year: 2025, previousReading: 500, currentReading: 540,
        totalKwh: 40, freeKwh: 50, excessKwh: 0, excessAmount: 0,
        recordedBy: id("665a1b2c3d4e5f6a7b8c9d02"),            // ✅ Sửa
        createdAt: new Date("2025-03-01T08:00:00.000Z"),
    },
    {
        _id: id("66671b2c3d4e5f6a7b8c9d03"),
        roomId: id("665d1b2c3d4e5f6a7b8c9d04"),
        month: 2, year: 2025, previousReading: 800, currentReading: 860,
        totalKwh: 60, freeKwh: 50, excessKwh: 10, excessAmount: 35000,
        recordedBy: id("665a1b2c3d4e5f6a7b8c9d03"),            // ✅ Sửa
        createdAt: new Date("2025-03-01T08:30:00.000Z"),
    },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
    try {
        console.log("🔌 Dang ket noi MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Ket noi thanh cong!\n");

        console.log("🗑️  Xoa du lieu cu...");
        await Promise.all([
            User.deleteMany({}), Student.deleteMany({}),
            Building.deleteMany({}), Room.deleteMany({}),
            RoomAssignment.deleteMany({}), RoomRegistration.deleteMany({}),
            Request.deleteMany({}), Report.deleteMany({}),
            Invoice.deleteMany({}), Payment.deleteMany({}),
            Notification.deleteMany({}), Setting.deleteMany({}),
            ViolationRecord.deleteMany({}), ElectricityUsage.deleteMany({}),
        ]);
        console.log("✅ Xoa xong!\n");

        console.log("📥 Dang chen du lieu...");

        // Hash password cho tất cả users trước khi insert
        const salt = await bcrypt.genSalt(10);
        const hashedUsersData = await Promise.all(
            usersData.map(async (u) => ({ ...u, password: await bcrypt.hash(u.password, salt) }))
        );

        await User.insertMany(hashedUsersData); console.log("   ✔ Users: 8");
        await Building.insertMany(buildingsData); console.log("   ✔ Buildings: 2");
        await Room.insertMany(roomsData); console.log("   ✔ Rooms: 6");
        await Student.insertMany(studentsData); console.log("   ✔ Students: 5");
        await RoomAssignment.insertMany(roomAssignmentsData); console.log("   ✔ RoomAssignments: 5");
        await RoomRegistration.insertMany(roomRegistrationsData); console.log("   ✔ RoomRegistrations: 2");
        await Request.insertMany(requestsData); console.log("   ✔ Requests: 3");
        await Report.insertMany(reportsData); console.log("   ✔ Reports: 2");
        await Invoice.insertMany(invoicesData); console.log("   ✔ Invoices: 6");
        await Payment.insertMany(paymentsData); console.log("   ✔ Payments: 3");
        await Notification.insertMany(notificationsData); console.log("   ✔ Notifications: 2");
        await Setting.insertMany(settingsData); console.log("   ✔ Settings: 5");
        await ViolationRecord.insertMany(violationRecordsData); console.log("   ✔ ViolationRecords: 1");
        await ElectricityUsage.insertMany(electricityUsageData); console.log("   ✔ ElectricityUsage: 3");

        console.log("\n🎉 Seed du lieu hoan tat!");
        console.log("\n📋 Tai khoan mau (password: 123456 cho tat ca):");
        console.log("   Admin   : admin01 / 123456");
        console.log("   Manager1: manager01 / 123456");
        console.log("   Manager2: manager02 / 123456");
        console.log("   Student1: sv001 / 123456");

    } catch (err) {
        console.error("❌ Loi:", err.message);
        if (err.errors) {
            Object.keys(err.errors).forEach(k => console.error(`   - ${k}: ${err.errors[k].message}`));
        }
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Da ngat ket noi MongoDB.");
    }
}

seed();
