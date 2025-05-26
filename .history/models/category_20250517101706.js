const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Academic Learning"
  description: { type: String, required: true }, // e.g., "Find study materials..."
  color1: { type: [String], required: true }, 
  color2: { type: [String], required: true }, 
  icon: { type: String, required: true }, // e.g., "assets/images/ler1.png"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Category", CategorySchema);
