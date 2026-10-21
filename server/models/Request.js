const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        donation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Donation",
            required: true
        },

        ngo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        message: {
            type: String,
            trim: true,
            default: ""
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "ACCEPTED",
                "REJECTED",
                "CANCELLED",
                "COMPLETED"
            ],
            default: "PENDING"
        }
    },
    {
        timestamps: true
    }
);

// Optimize queries for aid requests and NGO dashboard lookups
requestSchema.index({ donation: 1, ngo: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ ngo: 1, createdAt: -1 });

module.exports = mongoose.model("Request", requestSchema);