// const express = require('express');
// const router = express.Router();
// const multer = require('multer');

// const storage = multer.memoryStorage();
// const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only images allowed'));
//     }
//   }
// });

// // Correct usage of .single()
// router.post('/add-category', upload.single('image'), (req, res) => {
//   console.log(req.file); // your uploaded file
//   res.send('File uploaded successfully');
// });

// module.exports = router;
