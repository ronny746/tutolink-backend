const admin = require("firebase-admin");
const serviceAccount = require("../config/firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
  storageBucket: "tutolink-1a710.firebasestorage.app"
});

module.exports = admin;
