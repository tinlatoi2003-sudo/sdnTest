const mongoose = require("mongoose");

const buildingSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Tên tòa nhà là bắt buộc"],
            unique: true,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        totalFloors: {
            type: Number,
            required: true,
            min: 1,
        },
        description: {
            type: String,
            trim: true,
        },
        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            enum: ["active", "inactive", "maintenance"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Building", buildingSchema);
