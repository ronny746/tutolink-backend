const SettingSchema = new mongoose.Schema({
  appName: { type: String, required: true },
  appVersion: { type: String, required: true },
  imageUrl: { type: String, required: true },          // Banner image or splash
  redirectUrl: { type: String },                        // Optional link

  showPopup: { type: Boolean, default: false },         // Show welcome popup or maintenance alert
  popupTitle: { type: String },                         // Popup heading
  popupMessage: { type: String },                       // Message in dialog
  popupImageUrl: { type: String },                      // Optional image for popup

  forceUpdate: { type: Boolean, default: false },       // Force users to update
  minimumVersion: { type: String },                     // Minimum supported version

  isMaintenanceMode: { type: Boolean, default: false }, // App under maintenance?
  maintenanceMessage: { type: String },                 // Maintenance description

  themeColor: { type: String },                         // Primary theme color hex
  bannerType: { type: String, enum: ['info', 'promo', 'alert'], default: 'info' },

  createdAt: { type: Date, default: Date.now }
});
