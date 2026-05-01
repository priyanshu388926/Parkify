const mongoose = require("mongoose");
const SlotSchema = new mongoose.Schema({
  slotId: { type: Number, unique: true, required: true },
  status: { type: String, enum: ["available", "reserved"], default: "available" },
  user: String,
  txHash: String,
  expiresAt: Date,
});
module.exports = mongoose.model("Slot", SlotSchema);
