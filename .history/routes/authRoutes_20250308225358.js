const express = require("express");
const { googleLogin, getUser, updateUser, deleteUser, getAllUsers } = require("../controllers/authController");

const router = express.Router();

router.post("/login/google", googleLogin);
router.get("/get-all-user", getAllUsers);
router.get("/:id", getUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);


module.exports = router;
