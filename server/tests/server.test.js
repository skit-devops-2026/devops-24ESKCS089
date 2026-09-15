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
});