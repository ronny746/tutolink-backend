const mongoose = require("mongoose");

const SliderSchema = new mongoose.Schema({
    title: { type: String, required: true },
    categoty: { type: String, required: true },
    imageUrl: { type: String, required: true }, // Image URL for slider
    redirectUrl: { type: String, required: false }, // Optional: URL to redirect when clicked
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Slider", SliderSchema);
