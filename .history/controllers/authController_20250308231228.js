const admin = require("../config/firebase");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Google Login API (Sign In / Sign Up)
exports.googleLogin = async (req, res) => {
  const { token } = req.body;

  // try {
  //   const decodedToken = await admin.auth().verifyIdToken(token);
  //   const { uid, name, email } = decodedToken;

  //   let user = await User.findOne({ googleId: uid });

  //   if (!user) {
  //     user = await User.create({ name, email, googleId: uid });
  //   }

  //   const jwtToken = jwt.sign({ id: user._id }, "tutolink", { expiresIn: "7d" });

  //   res.json({ token: jwtToken, user });
  // } catch (error) {
  //   res.status(400).json({ message: "Invalid Token", error });
  // }
};


// Get User by ID
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId); // Token se user ID extract ho rahi hai
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};


// Update User
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    // Find user by ID
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete user from Firebase
    await admin.auth().deleteUser(user.googleId);

    // Delete user from MongoDB
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted successfully from Firebase & MongoDB" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find(); // Sabhi users la raha hai

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
