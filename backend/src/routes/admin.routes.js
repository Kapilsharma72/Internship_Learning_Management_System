const router = require("express").Router();
const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");
const adminCtrl = require("../controllers/admin.controller");

router.use(auth, rbac("admin"));

router.get("/users", adminCtrl.getAllUsers);
router.put("/users/:id/approve-mentor", adminCtrl.approveMentor);
router.delete("/users/:id", adminCtrl.deleteUser);
router.post("/mentors/:mentorId/allocate-student", adminCtrl.allocateStudentToMentor);
router.get("/analytics", adminCtrl.getAnalytics);

module.exports = router;
