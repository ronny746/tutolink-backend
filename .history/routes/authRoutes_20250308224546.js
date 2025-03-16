const express = require("express");
const { googleLogin, getUser, updateUser, deleteUser, getAllUsers } = require("../controllers/authController");

const router = express.Router();

router.post("/login/google", googleLogin);
router.get("/:id", getUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.get("/user/", getAllUsers);
module.exports = router;
