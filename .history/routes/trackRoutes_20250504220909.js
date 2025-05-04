// routes/trackRoutes.js
const express = require("express");
const router = express.Router();
const Track = require("../models/Track");

router.post("/visit", async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    await Track.create({
      ipAddress: ip,
      userAgent: req.headers["user-agent"],
      visitedAt: new Date()
    });

    res.status(200).json({ message: "Visit logged" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
