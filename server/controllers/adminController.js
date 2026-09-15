const User = require("../models/user");
const Donation = require("../models/Donation");
const Request = require("../models/Request");
const Pickup = require("../models/Pickup");

// Admin: view all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: users.length,
            users
        });
    } catch (error) {
        console.error("Get all users error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Admin: view all donations
const getAllDonations = async (req, res) => {
    try {
        const donations = await Donation.find()
            .populate("donor", "name email phone")
            .populate("receiver", "name email phone")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: donations.length,
            donations
        });
    } catch (error) {
        console.error("Get all donations error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Admin: view all requests
const getAllRequests = async (req, res) => {
    try {
        const requests = await Request.find()
            .populate("donation")
            .populate("ngo", "name email phone")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: requests.length,
            requests
        });
    } catch (error) {
        console.error("Get all requests error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// Admin: view all pickups
const getAllPickups = async (req, res) => {
    try {
        const pickups = await Pickup.find()
            .populate({
                path: "request",
                populate: [
                    { path: "donation" },
                    { path: "ngo", select: "name email phone" }
                ]
            })
            .populate("deliveryPartner", "name email phone")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: pickups.length,
            pickups
        });
    } catch (error) {
        console.error("Get all pickups error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getAllUsers,
    getAllDonations,
    getAllRequests,
    getAllPickups
};