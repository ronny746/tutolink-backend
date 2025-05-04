const express = require("express");
const router = express.Router();
const ContactRequest = require("../models/ContactRequest");

router.post("/request", async (req, res) => {
  try {
    const { name, email, mobile, address, service, about } = req.body;

    if (!name || !email || !mobile || !address || !service || !about) {
      return res.status(400).json({ error: "All fields are required" });
    }

    await ContactRequest.create({
      name,
      email,
      mobile,
      address,
      service,
      about
    });

    res.status(200).json({ message: "Your request has been received!" });
  } catch (err) {
    console.error("Contact request error:", err);
    res.status(500).json({ error: "Server error, please try again later." });
  }
});

router.get("/requests", async (req, res) => {
    try {
      const requests = await ContactRequest.find().sort({ createdAt: -1 }); // Sort by latest submission
      res.status(200).json(requests);
    } catch (err) {
      console.error("Error fetching contact requests:", err);
      res.status(500).json({ error: "Failed to fetch contact requests" });
    }
  });

module.exports = router;
