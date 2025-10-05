const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  name: String,
  description: String,
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" }
});

module.exports = mongoose.model("Service", serviceSchema);
