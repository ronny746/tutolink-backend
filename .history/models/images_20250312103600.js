const mongoose = require("mongoose");

const SliderSchema = new mongoose.Schema({
    
    imageUrl: { type: String, required: true }, // Image URL for slider
    redirectUrl: { type: String, required: false }, // Optional: URL to redirect when clicked
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Image", SliderSchema);
