const router = require("express").Router();
const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");
const studentCtrl = require("../controllers/student.controller");

router.use(auth, rbac("student"));

router.post("/progress/:chapterId/complete", studentCtrl.completeChapter);
router.get("/progress/my", studentCtrl.getMyProgress);
router.get("/courses/:courseId/chapters", studentCtrl.getCourseChapters);

module.exports = router;
