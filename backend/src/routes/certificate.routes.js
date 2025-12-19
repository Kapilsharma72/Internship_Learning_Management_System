const router = require("express").Router();
const auth = require("../middleware/auth");
const rbac = require("../middleware/rbac");
const certCtrl = require("../controllers/certificate.controller");

router.get(
  "/:courseId",
  auth,
  rbac("student"),
  certCtrl.downloadCertificate
);

module.exports = router;
