const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const classCourseRoutes = require("./routes/classCourseRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const contentRoutes = require("./routes/contentRoutes");
const quizRoutes = require("./routes/quizRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const notificationRoutes = require("./routes/notification");
const battleRoutes = require("./routes/battleRoutes");
const dailyCheckInRoutes = require("./routes/dailyCheckInRoutes");
const trackRoutes = require("./routes/trackRoutes");
const contactRoutes = require("./routes/contactRoutes");
const settingRoutes = require('./routes/settingRoutes');

const adminDashboardRoutes = require('./routes/admin_dashboard_routes');
const quoteRoutes = require('./routes/quoteRoutes');

require("./sockets/scheduler");


const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



mongoose.connect(
  process.env.MONGO_URL,
  // "mongodb://127.0.0.1:27017/tutolink",
  { useNewUrlParser: true, useUnifiedTopology: true }
)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/classOrCourse", classCourseRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/battle", battleRoutes);
app.use("/api/dailyCheckIn", dailyCheckInRoutes);
app.use("/api/track", trackRoutes);
app.use("/api/contact", contactRoutes);
const aiRoutes = require("./routes/aiRoutes");



app.use('/api/admin', adminDashboardRoutes);
app.use('/api/quotes', quoteRoutes);
app.use("/api", aiRoutes);

app.use('/api/settings', settingRoutes);
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

app.get("/blog", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "blog.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "contact.html"));
});
app.get("/request", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "contact.html"));
});

app.get("/.well-known/assetlinks.json", (req, res) => {
  res.sendFile(path.join(__dirname, ".well-known", "assetlinks.json"));
});
app.listen(process.env.PORT, () => console.log("Server running on port 3000"));


