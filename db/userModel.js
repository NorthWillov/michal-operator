const mongoose = require("mongoose");

// user schema
const UserSchema = new mongoose.Schema({
  // email field
  name: {
    type: String,
    required: [true, "Please provide you name!"],
    unique: [true, "Name Exist"],
  },

  //   password field
  password: {
    type: String,
    required: [true, "Please provide a password!"],
    unique: false,
  },
});

// export UserSchema
module.exports = mongoose.model("User", UserSchema);
