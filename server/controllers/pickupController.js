const Pickup = require("../models/Pickup");
const Request = require("../models/Request");
const Donation = require("../models/Donation");

// NGO: View my pickups
const getMyPickups = async (req, res) => {
    try {
        const pickups = await Pickup.find().populate({
            path: "request",
            populate: [
                { path: "donation" },
                { path: "ngo", select: "name email phone" }
            ]
        });

        const myPickups = pickups.filter(
            (pickup) =>
                pickup.request &&
                pickup.request.ngo &&
                pickup.request.ngo._id.toString() === req.user.userId
        );

        res.status(200).json({
            count: myPickups.length,
            pickups: myPickups
        });
    } catch (error) {
        console.error("Get my pickups error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// DELIVERY: Update pickup/delivery status
const updatePickupStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ["SCHEDULED", "PICKED_UP", "DELIVERED", "CANCELLED"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid delivery status" });
        }

        const pickup = await Pickup.findById(req.params.id);
        if (!pickup) {
            return res.status(404).json({ message: "Pickup not found" });
        }

        if (req.user.role !== "DELIVERY") {
            return res.status(403).json({
                message: "Only delivery partners can update delivery status"
            });
        }

        if (!pickup.deliveryPartner || pickup.deliveryPartner.toString() !== req.user.userId) {
            return res.status(403).json({
                message: "You are not assigned to this delivery"
            });
        }

        pickup.deliveryStatus = status;
        await pickup.save();

        // Sync donation status based on delivery progress
        const request = await Request.findById(pickup.request);
        if (request) {
            if (status === "DELIVERED") {
                await Donation.findByIdAndUpdate(request.donation, { status: "COMPLETED" });
                request.status = "COMPLETED";
                await request.save();
            } else if (status === "PICKED_UP") {
                await Donation.findByIdAndUpdate(request.donation, { status: "IN_TRANSIT" });
            }
        }

        res.status(200).json({
            message: "Delivery status updated successfully",
            pickup
        });
    } catch (error) {
        console.error("Update delivery status error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// NGO: Schedule a pickup
const schedulePickup = async (req, res) => {
    try {
        const {
            requestId,
            pickupMethod,
            pickupAddress,
            scheduledDate,
            deliveryFee,
            notes
        } = req.body;

        if (!requestId || !pickupMethod || !pickupAddress || !scheduledDate) {
            return res.status(400).json({
                message: "Request ID, pickup method, address and scheduled date are required"
            });
        }

        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.ngo.toString() !== req.user.userId) {
            return res.status(403).json({
                message: "You are not allowed to schedule pickup for this request"
            });
        }

        if (request.status !== "ACCEPTED") {
            return res.status(400).json({
                message: "Pickup can only be scheduled after the request is accepted"
            });
        }

        const existingPickup = await Pickup.findOne({ request: requestId });
        if (existingPickup) {
            return res.status(400).json({
                message: "Pickup has already been scheduled for this request"
            });
        }

        const finalDeliveryFee = pickupMethod === "SELF_PICKUP" ? 0 : Number(deliveryFee) || 0;

        const pickup = await Pickup.create({
            request: requestId,
            pickupMethod,
            pickupAddress,
            scheduledDate,
            deliveryFee: finalDeliveryFee,
            notes: notes || "",
            deliveryStatus: pickupMethod === "SELF_PICKUP" ? "SCHEDULED" : "PENDING"
        });

        await Donation.findByIdAndUpdate(request.donation, {
            status: "PICKUP_SCHEDULED"
        });

        res.status(201).json({
            message: "Pickup scheduled successfully",
            pickup
        });
    } catch (error) {
        console.error("Schedule pickup error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// DELIVERY: View available delivery jobs
const getAvailableDeliveries = async (req, res) => {
    try {
        const pickups = await Pickup.find({
            pickupMethod: "DELIVERY",
            deliveryPartner: null,
            deliveryStatus: "PENDING"
        }).populate({
            path: "request",
            populate: [
                { path: "donation" },
                { path: "ngo", select: "name email phone" }
            ]
        });

        res.status(200).json({
            count: pickups.length,
            deliveries: pickups
        });
    } catch (error) {
        console.error("Get available deliveries error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// DELIVERY: Accept a delivery job
const acceptDelivery = async (req, res) => {
    try {
        const pickup = await Pickup.findById(req.params.id);

        if (!pickup) {
            return res.status(404).json({ message: "Pickup not found" });
        }

        if (req.user.role !== "DELIVERY") {
            return res.status(403).json({
                message: "Only delivery partners can accept delivery jobs"
            });
        }

        if (pickup.pickupMethod !== "DELIVERY") {
            return res.status(400).json({ message: "This pickup does not require delivery" });
        }

        if (pickup.deliveryPartner) {
            return res.status(400).json({ message: "This delivery has already been assigned" });
        }

        pickup.deliveryPartner = req.user.userId;
        pickup.deliveryStatus = "SCHEDULED";
        await pickup.save();

        res.status(200).json({
            message: "Delivery accepted successfully",
            pickup
        });
    } catch (error) {
        console.error("Accept delivery error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// DELIVERY: View my assigned deliveries
const getMyDeliveries = async (req, res) => {
    try {
        const pickups = await Pickup.find({
            deliveryPartner: req.user.userId
        }).populate({
            path: "request",
            populate: [
                { path: "donation" },
                { path: "ngo", select: "name email phone" }
            ]
        });

        res.status(200).json({
            count: pickups.length,
            deliveries: pickups
        });
    } catch (error) {
        console.error("Get my deliveries error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    schedulePickup,
    getMyPickups,
    updatePickupStatus,
    getAvailableDeliveries,
    acceptDelivery,
    getMyDeliveries
};