const admin = require("../config/firebase");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    // Verify Firebase Token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, name, email } = decodedToken;

    // Check if user exists
    let user = await User.findOne({ googleId: uid });

    if (!user) {
      user = await User.create({ name, email, googleId: uid });
    }

    // Generate JWT Token
    const jwtToken = jwt.sign({ id: user._id }, "secretkey", { expiresIn: "7d" });

    res.json({ token: jwtToken, user });
  } catch (error) {
    res.status(400).json({ message: "Invalid Token", error });
  }
};
