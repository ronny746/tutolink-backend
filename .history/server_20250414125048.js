// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// require("dotenv").config();

// const authRoutes = require("./routes/authRoutes");
// const subjectRoutes = require("./routes/subjectRoutes");
// const contentRoutes = require("./routes/contentRoutes");
// const quizRoutes = require("./routes/quizRoutes");
// const onboardingRoutes = require("./routes/onboardingRoutes");
// const notificationRoutes = require("./routes/notification");
// const battleRoutes = require("./routes/battleRoutes");
// const dailyCheckInRoutes = require("./routes/dailyCheckInRoutes");

// require("./sockets/scheduler");

// const app = express();
// app.use(express.json());
// app.use(cors());
// app.use("/uploads", express.static("uploads"));



// mongoose.connect("mongodb://127.0.0.1:27017/tutolink", { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("MongoDB connected"))
//   .catch(err => console.error(err));

// app.use("/api/auth", authRoutes);
// app.use("/api/subjects", subjectRoutes);
// app.use("/api/content", contentRoutes);
// app.use("/api/quizzes", quizRoutes);
// app.use("/api/onboarding", onboardingRoutes);
// app.use("/api/notification", notificationRoutes);
// app.use("/api/battle", battleRoutes);
// app.use("/api/dailyCheckIn", dailyCheckInRoutes);


// app.listen(3000, () => console.log("Server running on port 3000"));


const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Route to fetch dashboard data
app.get("/dashboard-data", async (req, res) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjcxOSIsInJvbGUiOiI0IiwidGltZXN0YW1wIjoxNzQ0NTk4NzMxLCJzdGF0dXMiOjF9.ki07P0eEPdoFhiUf-ks8HwMpI_VDJXj1jNeOAVn7ThA'
  };

  try {
    const response = await axios.get(
      'https://injectsolar.com/inject-solar-angular/inject_solar_server/normal/Normal/getDashboardData',
      { headers }
    );
    res.json(response.data);
  } catch (error) {
    console.error("❌ API Call Failed:", error.message);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
