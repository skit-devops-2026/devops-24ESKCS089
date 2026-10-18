const request = require("supertest");
const app = require("../server");

describe("Rescue Network API", () => {
    test("GET / should return API running message", async () => {
        const response = await request(app).get("/");

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe(
            "Rescue Network API is running!"
        );
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

    test("GET /metrics should return Prometheus metrics", async () => {
        const response = await request(app).get("/metrics");

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/text\/plain/);
        expect(response.text).toContain("http_requests_total");
    });
});