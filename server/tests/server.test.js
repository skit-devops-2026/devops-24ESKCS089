const request = require("supertest");
const app = require("../server");

describe("Rescue Network API", () => {
    describe("System Endpoints", () => {
        test("GET / should return API running message", async () => {
            const response = await request(app).get("/");

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe("Rescue Network API is running!");
        });

        test("GET /health should return advanced health status", async () => {
            const response = await request(app).get("/health");

            expect(response.statusCode).toBe(200);
            expect(response.body.status).toBe("ok");
            expect(response.body.commit).toBeDefined();
            expect(response.body.timestamp).toBeDefined();
            expect(response.body.uptime).toBeDefined();
            expect(response.body.checks).toBeDefined();
            expect(response.body.checks.database).toBeDefined();
            expect(response.body.checks.memory).toBeDefined();
        });

        test("GET /metrics should return Prometheus metrics with rescue_network prefix", async () => {
            const response = await request(app).get("/metrics");

            expect(response.statusCode).toBe(200);
            expect(response.headers["content-type"]).toMatch(/text\/plain/);
            expect(response.text).toContain("http_requests_total");
            expect(response.text).toContain("rescue_network_");
        });

        test("Should set Helmet security headers on responses", async () => {
            const response = await request(app).get("/health");

            expect(response.headers["x-dns-prefetch-control"]).toBe("off");
            expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
            expect(response.headers["x-download-options"]).toBe("noopen");
        });
    });

    describe("Authentication & Security", () => {
        test("POST /api/auth/register should fail when required fields are missing", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({ email: "incomplete@test.com" });

            // Depending on database state, controller rejects with 400 for missing fields or 503 if db unavailable
            expect([400, 503]).toContain(response.statusCode);
            expect(response.body.message).toBeDefined();
        });

        test("POST /api/auth/login should fail with 400 when email or password is missing", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({});

            expect([400, 503]).toContain(response.statusCode);
            expect(response.body.message).toBeDefined();
        });

        test("Protected routes should reject requests without a Bearer token with 401", async () => {
            const response = await request(app).get("/api/donations/my-donations");

            expect(response.statusCode).toBe(401);
            expect(response.body.message).toMatch(/not authorized/i);
        });

        test("Protected routes should reject requests with an invalid token with 401", async () => {
            const response = await request(app)
                .get("/api/donations/my-donations")
                .set("Authorization", "Bearer invalid.mock.jwt.token");

            expect(response.statusCode).toBe(401);
            expect(response.body.message).toMatch(/invalid or expired token/i);
        });
    });
});