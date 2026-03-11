const mongoose = require("mongoose");

const roomAssignmentSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
        },
        buildingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Building",
            required: true,
        },
        termCode: {
            type: String,
            required: true,
            trim: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ["active", "ended", "cancelled"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("RoomAssignment", roomAssignmentSchema);
