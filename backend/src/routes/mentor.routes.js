const router = require("express").Router();
const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");
const mentorCtrl = require("../controllers/mentor.controller");

router.use(auth, rbac("mentor"));

router.post("/courses", mentorCtrl.createCourse);
router.get("/courses/my", mentorCtrl.getMyCourses);
router.put("/courses/:id", mentorCtrl.updateCourse);
router.delete("/courses/:id", mentorCtrl.deleteCourse);
router.post("/courses/:id/chapters", mentorCtrl.addChapter);
router.get("/courses/:id/chapters", mentorCtrl.getCourseChapters);
router.post("/courses/:id/assign", mentorCtrl.assignCourse);
router.get("/courses/:id/progress", mentorCtrl.getCourseProgress);
router.get("/students/my", mentorCtrl.getMyStudents);

module.exports = router;
