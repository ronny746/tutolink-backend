// routes/trackRoutes.js
const express = require("express");
const router = express.Router();
const Track = require("../models/Track");

router.post("/visit", async (req, res) => {
    try {
      const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(',')[0].trim();
  
      const geoRes = await axios.get(`http://ip-api.com/json/${ip}`);
      const geoData = geoRes.data;
  
      await Track.create({
        ipAddress: ip,
        userAgent: req.headers["user-agent"],
        visitedAt: new Date(),
        country: geoData.country,
        countryCode: geoData.countryCode,
        region: geoData.regionName,
        city: geoData.city
      });
  
      res.status(200).json({ message: "Visit logged" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  });
  
router.get("/visits", async (req, res) => {
    try {
      const visits = await Track.find().sort({ visitedAt: -1 });
      res.status(200).json(visits);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

module.exports = router;
