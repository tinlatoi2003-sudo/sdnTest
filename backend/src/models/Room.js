const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
    {
        buildingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Building",
            required: [true, "Tòa nhà là bắt buộc"],
        },
        roomNumber: {
            type: String,
            required: [true, "Số phòng là bắt buộc"],
            trim: true,
        },
        floor: {
            type: Number,
            required: true,
            min: 1,
        },
        type: {
            type: String,
            enum: ["standard", "vip", "premium"],
            default: "standard",
        },
        maxOccupancy: {
            type: Number,
            required: true,
            min: 1,
            default: 4,
        },
        currentOccupancy: {
            type: Number,
            default: 0,
            min: 0,
        },
        pricePerTerm: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["available", "partial", "full", "maintenance"],
            default: "available",
        },
        amenities: [
            {
                type: String,
                trim: true,
            },
        ],
        description: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Room", roomSchema);
