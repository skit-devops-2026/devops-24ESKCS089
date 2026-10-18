const mongoose = require("mongoose");
const Donation = require("../models/Donation");

// Create a new donation
const createDonation = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message: "Database unavailable: MongoDB is not connected. Please ensure MongoDB Atlas IP whitelist (0.0.0.0/0) is enabled and MONGODB_URI is configured."
            });
        }
        const {
            title,
            description,
            category,
            quantity,
            condition,
            pickupAddress,
            availableUntil
        } = req.body;

        if (
            !title ||
            !description ||
            !category ||
            !quantity ||
            !pickupAddress ||
            !availableUntil
        ) {
            return res.status(400).json({
                message: "Please provide all required donation details"
            });
        }

        const donation = await Donation.create({
            donor: req.user.userId,
            title,
            description,
            category,
            quantity,
            condition: condition || "GOOD",
            pickupAddress,
            availableUntil
        });

        res.status(201).json({
            message: "Donation created successfully",
            donation
        });
    } catch (error) {
        console.error("Create donation error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Get all available donations
const getAvailableDonations = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json({
                count: 0,
                donations: []
            });
        }

        const donations = await Donation.find({ status: "AVAILABLE" })
            .populate("donor", "name email phone")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: donations.length,
            donations
        });
    } catch (error) {
        console.error("Get available donations error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Get donations created by the logged-in donor
const getMyDonations = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(200).json({
                count: 0,
                donations: []
            });
        }

        const donations = await Donation.find({
            donor: req.user.userId
        }).sort({ createdAt: -1 });

        res.status(200).json({
            count: donations.length,
            donations
        });
    } catch (error) {
        console.error("Get my donations error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    createDonation,
    getAvailableDonations,
    getMyDonations
};