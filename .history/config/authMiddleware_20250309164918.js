const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  // const token = req.header("Authorization")?.replace("Bearer ", "");

  // if (!token) {
  //   return res.status(401).json({ message: "Access Denied. No token provided." });
  // }

  // try {
  //   const decoded = jwt.verify(token, "tutolink"); // Verify token
  //   req.userId = decoded.id; // Set userId in request
  //   next();
  // } catch (error) {
  //   res.status(401).json({ message: "Invalid Token" });
  // }
};
