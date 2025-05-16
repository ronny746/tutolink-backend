const express = require("express");
const router = express.Router();
const { createCategory, getCategories, deleteCategory} = require("../controllers/categoryControlle");

router.post("/create", createCategory);
router.get("/", getCategories);
router.delete("/delete", deleteCategory);
module.exports = router;