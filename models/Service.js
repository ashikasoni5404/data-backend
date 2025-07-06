const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    enum: [0, 1], // 0 = inactive, 1 = active
    default: 1
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', ServiceSchema);
