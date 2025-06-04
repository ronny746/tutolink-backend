const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Academic Learning"
  description: { type: String, required: true }, // e.g., "Find study materials..."
  color1: { type: [String], required: true }, // e.g., ["#C9F6CB", "#64CF69"]
   color1: { type: [String], required: true }, // e.g., ["#C9F6CB", "#64CF69"]
  icon: { type: String, required: true }, // e.g., "assets/images/ler1.png"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Category", CategorySchema);
