const admin = require("firebase-admin");
const serviceAccount = require("../config/firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tutolink-1a710-default-rtdb.firebaseio.com/",
  storageBucket: "gs://news-admin-997b0.appspot.com"
});
const bucket = admin.storage().bucket();
const db = admin.database();

module.exports = { bucket, db };

