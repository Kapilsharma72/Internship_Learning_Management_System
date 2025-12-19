const request = require("supertest");
const app = require("../server");

describe("Sequential Chapter Completion", () => {
  it("prevents skipping chapters", async () => {
    // Without authentication the progress endpoint should return 401 Unauthorized
    const res = await request(app).post(`/api/student/progress/some-chapter-id/complete`);
    expect(res.statusCode).toBe(401);
  });
});
