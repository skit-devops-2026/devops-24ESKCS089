const mongoose = require("mongoose");

const pickupSchema = new mongoose.Schema(
    {
        request: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Request",
            required: true,
            unique: true
        },

        pickupMethod: {
            type: String,
            enum: ["SELF_PICKUP", "DELIVERY"],
            required: true
        },

        pickupAddress: {
            type: String,
            required: true,
            trim: true
        },

        scheduledDate: {
            type: Date,
            required: true
        },

        deliveryStatus: {
            type: String,
            enum: [
                "PENDING",
                "SCHEDULED",
                "PICKED_UP",
                "DELIVERED",
                "CANCELLED"
            ],
            default: "PENDING"
        },

        deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
},
        deliveryFee: {
            type: Number,
            default: 0
        },

        notes: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

// Optimize query performance for courier runs, driver pickups, and scheduling
pickupSchema.index({ deliveryStatus: 1, pickupMethod: 1 });
pickupSchema.index({ deliveryPartner: 1, deliveryStatus: 1 });
pickupSchema.index({ scheduledDate: 1 });

module.exports = mongoose.model("Pickup", pickupSchema);