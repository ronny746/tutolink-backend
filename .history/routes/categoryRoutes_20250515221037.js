const express = require("express");
const router = express.Router();
const { createCategory, getCategories, deleteCategory} = require("../controllers/");

router.post("/create", createCategory);
router.get("/", getCategories);
router.delete("/delete", deleteCategory);
module.exports = router;