const router = require("express").Router();
const { register, login, registerMentor, bootstrapAdmin } = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/register-mentor", registerMentor);
router.post("/bootstrap-admin", bootstrapAdmin);

module.exports = router;
