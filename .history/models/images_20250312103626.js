const mongoose = require("mongoose");

const SliderSchema = new mongoose.Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true }, // Image URL for slider

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Image", SliderSchema);
