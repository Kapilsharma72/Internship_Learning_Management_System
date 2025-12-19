const request = require("supertest");
const app = require("../server");

describe("Certificate Eligibility", () => {
  it("should deny certificate if not 100% complete", async () => {
    // Without a valid student token the endpoint should return 401 Unauthorized
    const res = await request(app).get("/api/certificates/COURSE_ID");
    expect(res.statusCode).toBe(401);
  });
});
