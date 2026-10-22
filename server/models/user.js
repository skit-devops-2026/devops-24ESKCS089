const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["DONOR", "NGO", "DELIVERY", "ADMIN"],
            default: "DONOR"
        },

        address: {
            type: String,
            trim: true,
            default: ""
        },

        city: {
            type: String,
            trim: true,
            default: ""
        },

        state: {
            type: String,
            trim: true,
            default: ""
        },

        pincode: {
            type: String,
            trim: true,
            default: ""
        },

        coordinates: {
            lat: { type: Number, default: null },
            lng: { type: Number, default: null }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);