const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    status: {
      type: Number,
      enum: [1, 2], // 1 = fulfilled, 2 = pending
      default: 2
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', contactSchema);
