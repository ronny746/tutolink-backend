const Category = require("../models/category");
const { bucket } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");
// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories", details: error.message });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { title, description, color1 } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const fileId = uuidv4();
    const fileUpload = bucket.file(`cources/${fileId}-${file.originalname}`);
    await fileUpload.save(file.buffer, { contentType: file.mimetype });

    const [icon] = await fileUpload.getSignedUrl({ action: "read", expires: "01-01-2030" });


    // Check if category already exists
    const existing = await Category.findOne({ title });
    if (existing) return res.status(400).json({ error: "Category already exists" });

    const category = new Category({ title, description, color, icon });
    await category.save();

    res.status(201).json({ message: "Category created", category });
  } catch (error) {
    res.status(500).json({ error: "Error creating category", details: error.message });
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
