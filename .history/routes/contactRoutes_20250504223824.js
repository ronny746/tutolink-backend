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

module.exports = router;
