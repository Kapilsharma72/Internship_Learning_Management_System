const request = require("supertest");
const app = require("../server");

describe("Authentication & RBAC", () => {
  it("should block access without token", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.statusCode).toBe(401);
  });

  it("should block non-admin access", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", "Bearer invalidtoken");
    expect(res.statusCode).toBe(401);
  });
});
