const mongoose = require("mongoose");

// user schema
const InfoSchema = new mongoose.Schema({
  // email field
  about: String,
  email: String,
  phone: String,
  instaLink: String,
  youtubeLink: String,
  linkedInLink: String,
});

// export UserSchema
module.exports = mongoose.model("Info", InfoSchema);
