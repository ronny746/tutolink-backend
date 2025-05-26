const express = require("express");
const router = express.Router();
const upload = require("../config/widdlware");
const { createCategory, getCategories, deleteCategory} = require("../controllers/categoryController");

router.post("/create",upload.single("file") createCategory);
router.get("/", getCategories);
router.delete("/delete", deleteCategory);
module.exports = router;