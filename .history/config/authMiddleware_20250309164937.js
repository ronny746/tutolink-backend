const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
      req.user = null; // Allow guest users
      return next();
  }

  try {
      const decoded = jwt.verify(token, 'tutolink');
      req.user = decoded; // Store decoded token data in req.user
      next();
  } catch (error) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};
