// controllers/adminController.js
const Admin = require("../models/admin");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.loginAdmin = async (req, res) => {
  try {
    const { adminId, password } = req.body;

    const admin = await Admin.findOne({ adminId });
    if (!admin) {
      return res.status(401).json({ message: "Invalid Admin ID or Password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Admin ID or Password" });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        adminId: admin.adminId,
        role: admin.role,
      },
      "tutolink",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        adminId: admin.adminId,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized: Admins only" });
    }

    const admins = await Admin.find({}, "-password"); // exclude password
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { adminId, name, password } = req.body;

    // Check if this is the first admin
    const adminCount = await Admin.countDocuments();

    if (adminCount > 0) {
      // Token-based protection for all subsequent admin creations
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can create new admins.' });
      }
    }

    // Check if adminId is already used
    const existingAdmin = await Admin.findOne({ adminId });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin ID already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      adminId,
      name,
      password: hashedPassword,
      role: 'admin'
    });

    await newAdmin.save();

    res.status(201).json({ message: 'Admin created successfully', adminId: newAdmin.adminId });
  } catch (error) {
    console.error('Create Admin Error:', error);
    res.status(500).json({ message: 'Server error while creating admin' });
  }
};

exports.editAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, password } = req.body;

    // 👇 Safely access req.user (decoded from token by middleware)
    const requester = req.user;

    // 🔒 Only allow if requester is an admin
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update admin details.' });
    }

    const admin = await Admin.findOne({ adminId });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    // Update fields if provided
    if (name) {
      admin.name = name;
    }

    if (password) {
      admin.password = await bcrypt.hash(password, 10);
    }

    await admin.save();

    res.status(200).json({
      message: 'Admin updated successfully',
      admin: {
        adminId: admin.adminId,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('editAdmin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Admin
exports.deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    // 👤 Get requester from token
    const requester = req.user;

    // 🛑 Only allow if requester is admin
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete an admin.' });
    }

    // 🛑 Optional: Prevent deleting self
    if (requester.adminId === adminId) {
      return res.status(400).json({ message: 'Admins cannot delete themselves.' });
    }

    const deletedAdmin = await Admin.findOneAndDelete({ adminId });

    if (!deletedAdmin) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    res.status(200).json({ message: `Admin ${adminId} deleted successfully.` });
  } catch (error) {
    console.error('deleteAdmin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
