// routes/trackRoutes.js

const express = require("express");
const axios = require("axios");
const router = express.Router();
const Track = require("../models/Track");

router.post("/visit", async (req, res) => {
    try {
      const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(',')[0].trim();
  
      const geoRes = await axios.get(`http://ip-api.com/json`);
      const geo = geoRes.data;
  
      await Track.create({
        ipAddress: geo.query,
        userAgent: req.headers["user-agent"],
        visitedAt: new Date(),
        country: geo.country,
        countryCode: geo.countryCode,
        region: geo.region,
        regionName: geo.regionName,
        city: geo.city,
        zip: geo.zip,
        lat: geo.lat,
        lon: geo.lon,
        timezone: geo.timezone,
        isp: geo.isp,
        org: geo.org,
        as: geo.as
      });
  
      res.status(200).json({ message: "Visit logged successfully" });
    } catch (err) {
      console.error("Tracking error:", err);
      res.status(500).json({ error: "Tracking failed" });
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
