const express = require('express');
const Contact = require('../models/Contact');
const Service = require('../models/Service');
const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, phone, message, service } = req.body;
  const errors = [];

  // Validation
  if (!name || name.trim() === '') errors.push({ path: 'name', msg: 'Name is required' });
  if (!email || email.trim() === '') errors.push({ path: 'email', msg: 'Email is required' });
  if (!phone || phone.trim() === '') errors.push({ path: 'phone', msg: 'Phone is required' });
  if (!message || message.trim() === '') errors.push({ path: 'message', msg: 'Message is required' });
  if (!service) {
    errors.push({ path: 'service', msg: 'Service is required' });
  } else {
    const validService = await Service.findById(service);
    if (!validService) errors.push({ path: 'service', msg: 'Invalid service ID' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: false,
      message: 'Validation failed',
      errors
    });
  }

  try {
    const contact = new Contact({ name, email, phone, message, service });
    await contact.save();

    res.status(201).json({
      status: true,
      message: 'Contact request submitted successfully',
      data: contact
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      errors: [err.message]
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search = '', status, page = 1, limit = 10 } = req.query;
    const query = {};
    // Search by name, email or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    // Filter by status (1 = fulfilled, 2 = pending)
    if (status && [1, 2].includes(parseInt(status))) {
      query.status = parseInt(status);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    // Total count
    const total = await Contact.countDocuments(query);
    // Fetch contacts with pagination and populate service name + id
    const contacts = await Contact.find(query)
      .populate('service', 'name _id')
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      status: true,
      message: "Contacts fetched successfully",
      data: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        contacts
      }
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      errors: [err.message]
    });
  }
});
router.put('/status/:id', async (req, res) => {
  const { status } = req.body || {};

  // Validate status (must be 1 or 2)
  if (![1, 2].includes(status)) {
    return res.status(400).json({
      status: false,
      message: 'Validation failed',
      errors: [{ path: 'status', msg: 'Status must be 1 (fulfilled) or 2 (pending)' }]
    });
  }

  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('service', 'name _id');

    if (!contact) {
      return res.status(404).json({
        status: false,
        message: 'Contact not found'
      });
    }

    res.status(200).json({
      status: true,
      message: 'Contact status updated successfully',
      data: contact
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      errors: [err.message]
    });
  }
});



module.exports = router;
