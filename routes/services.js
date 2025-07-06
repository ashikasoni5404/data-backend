const express = require('express');
const router = express.Router();
const Service = require('../models/Service.js');
const Blog = require('../models/Blog');

// @route   POST /api/services
// @desc    Create a new service
router.post('/', async (req, res) => {
  const errors = [];
  const { name, description, status } = req.body;

  // Validation
  if (!name || name.trim() === '') {
    errors.push({ path: 'name', msg: 'Name is required' });
  }

  if (!description || description.trim() === '') {
    errors.push({ path: 'description', msg: 'Description is required' });
  }

  if (status !== 0 && status !== 1) {
    errors.push({ path: 'status', msg: 'Status must be 0 (inactive) or 1 (active)' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: false,
      message: "Validation failed",
      errors
    });
  }

  // Save to DB
  try {
    const service = new Service({ name, description, status });
    await service.save();

    res.status(201).json({
      status: true,
      message: "Service created successfully",
      data: service
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      errors: [{ path: 'server', msg: err.message }]
    });
  }
});


// @route   GET /api/services
// @desc    Get all services
router.get('/', async (req, res) => {
  try {
    const services = await Service.find();

    res.status(200).json({
      status: true,
      message: "Services fetched successfully",
      data: services
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Error in fetching services",
      errors: [err.message] // 👈 cleaner, no need for path
    });
  }
});


// 👇 static route should be BEFORE the dynamic route
// 👇 static route should be BEFORE the dynamic route
router.get('/with-blogs', async (req, res) => {
  try {
    const servicesWithBlogs = await Service.aggregate([
      { $match: { status: 1 } }, // Only active services
      {
        $lookup: {
          from: 'blogs',
          let: { serviceId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$service', '$$serviceId'] },
                    { $eq: ['$status', 1] } // Only published blogs
                  ]
                }
              }
            }
          ],
          as: 'blogs'
        }
      },
      {
        $addFields: {
          blogCount: { $size: '$blogs' }
        }
      },
      {
        $match: { blogCount: { $gt: 0 } } // At least 1 published blog
      },
      {
        $project: {
          name: 1 // Only return the service name
        }
      }
    ]);

    res.status(200).json({
      status: true,
      message: "Filtered services fetched successfully",
      data: servicesWithBlogs
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Error in fetching filtered services",
      errors: [err.message]
    });
  }
});

// @route   GET /api/blogs/by-service/:serviceId
// @desc    Get all published blogs for a specific service
router.get('/by-service/:serviceId', async (req, res) => {
  const { serviceId } = req.params;

  try {
    const blogs = await Blog.find({
      service: serviceId,
      status: 1, // only published
    }).populate('service', 'name'); // Optional: populate service name

    res.status(200).json({
      status: true,
      message: 'Published blogs fetched successfully',
      data: blogs,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: 'Failed to fetch blogs',
      errors: [err.message],
    });
  }
});




// @route   GET /api/services/:id
// @desc    Get a single service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        status: false,
        message: "Service not found"
      });
    }

    res.status(200).json({
      status: true,
      message: "Service fetched successfully",
      data: service
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      errors: [err.message]
    });
  }
});


// @route   PUT /api/services/:id
// @desc    Update a service
router.put('/:id', async (req, res) => {
  const { name, description, status } = req.body;
  const errors = [];

  // Validation
  if (!name || name.trim() === '') {
    errors.push({ path: 'name', msg: 'Name is required' });
  }

  if (!description || description.trim() === '') {
    errors.push({ path: 'description', msg: 'Description is required' });
  }

  if (status !== 0 && status !== 1) {
    errors.push({ path: 'status', msg: 'Status must be 0 (inactive) or 1 (active)' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: false,
      message: "Validation failed",
      errors
    });
  }

  // Proceed to update
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { name, description, status },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({
        status: false,
        message: "Service not found"
      });
    }

    res.status(200).json({
      status: true,
      message: "Service updated successfully",
      data: service
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      errors: [err.message]
    });
  }
});

// @route   DELETE /api/services/:id
// @desc    Delete a service
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
