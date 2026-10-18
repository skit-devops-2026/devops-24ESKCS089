const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const promClient = require("prom-client");
require("dotenv").config();

// Initialize Prometheus metrics collection
promClient.collectDefaultMetrics({ prefix: "food_rescue_" });

const httpRequestsTotal = new promClient.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests processed",
    labelNames: ["method", "route", "status_code"]
});

const httpRequestDurationSeconds = new promClient.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const donationRoutes = require("./routes/donationRoutes");
const requestRoutes = require("./routes/requestRoutes");
const pickupRoutes = require("./routes/pickupRoutes");
const adminRoutes = require("./routes/adminRoutes");
const app = express();

app.use(cors());
app.use(express.json());

// Metrics middleware to track request rate and latency
app.use((req, res, next) => {
    const startTime = process.hrtime();
    res.on("finish", () => {
        const diff = process.hrtime(startTime);
        const duration = diff[0] + diff[1] / 1e9;
        const route = req.route ? req.route.path : req.path;
        httpRequestsTotal.inc({
            method: req.method,
            route: route,
            status_code: res.statusCode
        });
        httpRequestDurationSeconds.observe({
            method: req.method,
            route: route,
            status_code: res.statusCode
        }, duration);
    });
    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/pickups", pickupRoutes);
app.use("/api/admin", adminRoutes);

// Test route
app.get("/", (req, res) => {
    res.json({ message: "Rescue Network API is running!" });
});

// Advanced health check endpoint
app.get("/health", (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    };
    const dbStatus = dbStatusMap[dbState] || "unknown";

    const mem = process.memoryUsage();
    const toMB = (bytes) => +(bytes / 1024 / 1024).toFixed(2);

    res.status(200).json({
        status: "ok",
        commit: process.env.GITHUB_SHA || "local",
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`,
        environment: process.env.NODE_ENV || "development",
        checks: {
            database: {
                status: dbStatus,
                connected: dbState === 1
            },
            memory: {
                heapUsedMB: toMB(mem.heapUsed),
                heapTotalMB: toMB(mem.heapTotal),
                rssMB: toMB(mem.rss)
            },
            process: {
                nodeVersion: process.version,
                pid: process.pid
            }
        }
    });
});

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
    try {
        res.set("Content-Type", promClient.register.contentType);
        res.end(await promClient.register.metrics());
    } catch (error) {
        res.status(500).end(error.message);
    }
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    if (process.env.MONGODB_URI) {
        mongoose
            .connect(process.env.MONGODB_URI)
            .then(() => {
                console.log("MongoDB connected successfully!");
            })
            .catch((error) => {
                console.error("MongoDB connection failed:", error.message);
            });
    } else {
        console.log("No MONGODB_URI configured, running without persistent database.");
    }

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;