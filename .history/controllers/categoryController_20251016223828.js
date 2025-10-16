const Category = require("../models/category");
const { bucket } = require("../config/firebase");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({
      success: true,
      message: "Category fetched successfully",
      categories,
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories", details: error.message });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { title, description, color1, color2 } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    if (!title || !description) return res.status(400).json({ error: "Title and description are required" });

    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, "../uploads/categories");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Generate unique filename and move file
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    if (file.path) {
      fs.renameSync(file.path, filepath);
    } else if (file.buffer) {
      fs.writeFileSync(filepath, file.buffer);
    } else {
      return res.status(400).json({ error: "File data is missing" });
    }

    // Generate public URL
    const iconUrl = `${req.protocol}://${req.get("host")}/uploads/categories/${filename}`;

    // Check if category already exists
    const existing = await Category.findOne({ title });
    if (existing) return res.status(400).json({ error: "Category already exists" });

    const category = new Category({ title, description, color1, color2, icon: iconUrl });
    await category.save();

    res.status(201).json({ message: "Category created successfully", category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creating category", details: err.message });
  }
};
// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.query;

    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) return res.status(404).json({ error: "Category not found" });

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting category", details: error.message });
  }
};
