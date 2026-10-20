const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const promClient = require("prom-client");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
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

// API test route for automated testing
if (process.env.NODE_ENV === "test") {
    app.get("/", (req, res) => {
        res.json({ message: "Rescue Network API is running!" });
    });
}

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

// Serve static frontend assets in production / containerized environments
const clientDistPath = path.resolve(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath) && process.env.NODE_ENV !== "test") {
    app.use(express.static(clientDistPath));
    app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api") || req.path === "/health" || req.path === "/metrics") {
            return next();
        }
        res.sendFile(path.join(clientDistPath, "index.html"));
    });
} else if (process.env.NODE_ENV !== "test") {
    app.get("/", (req, res) => {
        res.json({ message: "Rescue Network API is running!" });
    });
}

const PORT = process.env.PORT || 5000;

function sanitizeMongoUri(uri) {
    if (!uri) return uri;
    // Auto-encode unescaped @ in password (e.g. user:pass@@host -> user:pass%40@host)
    if (uri.includes("@@")) {
        return uri.replace("@@", "%40@");
    }
    return uri;
}

let isConnecting = false;
let retryTimer = null;

const connectWithRetry = async (retryDelay = 5000) => {
    if (mongoose.connection.readyState === 1 || isConnecting) {
        return;
    }

    const rawUri = process.env.MONGODB_URI;
    if (!rawUri) {
        console.log("No MONGODB_URI configured, running without persistent database.");
        return;
    }

    const mongoUri = sanitizeMongoUri(rawUri);
    isConnecting = true;
    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 20000
        });
        console.log("MongoDB connected successfully!");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        console.log("Tip: Check MongoDB Atlas credentials and verify IP whitelist allows 0.0.0.0/0 under Network Access.");
        console.log(`Retrying MongoDB connection in ${retryDelay / 1000}s...`);
        clearTimeout(retryTimer);
        retryTimer = setTimeout(() => {
            isConnecting = false;
            connectWithRetry(Math.min(retryDelay * 1.5, 30000));
        }, retryDelay);
    } finally {
        isConnecting = false;
    }
};

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Attempting reconnection...");
    connectWithRetry();
});

mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
});

if (require.main === module) {
    connectWithRetry();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;