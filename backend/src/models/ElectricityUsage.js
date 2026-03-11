const mongoose = require("mongoose");

const electricityUsageSchema = new mongoose.Schema(
    {
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
        },
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12,
        },
        year: {
            type: Number,
            required: true,
        },
        previousReading: {
            type: Number,
            required: true,
            min: 0,
        },
        currentReading: {
            type: Number,
            required: true,
            min: 0,
        },
        totalKwh: {
            type: Number,
            required: true,
            min: 0,
        },
        freeKwh: {
            type: Number,
            default: 0,
            min: 0,
        },
        excessKwh: {
            type: Number,
            default: 0,
            min: 0,
        },
        excessAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("ElectricityUsage", electricityUsageSchema);
