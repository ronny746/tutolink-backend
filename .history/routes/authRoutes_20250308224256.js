const express = require("express");
const { googleLogin, getUser, updateUser, deleteUser } = require("../controllers/authController");

const router = express.Router();

router.post("/login/google", googleLogin);
router.get("/user/:id", getUser);
router.put("/user/:id", updateUser);
router.delete("/user/:id", deleteUser);
router.get("/user/all", deleteUser);
module.exports = router;
