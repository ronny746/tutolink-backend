const express = require("express");
const router = express.Router();

const { createCategory, getCategories, deleteCategory} = require("../controllers/categoryController");

router.post("/create",upload.single("image"), createCategory);
router.get("/", getCategories);
router.delete("/delete", deleteCategory);
module.exports = router;