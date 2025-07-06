const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const Service = require('../models/Service');

// @route   POST /api/blogs
// @desc    Create a new blog
router.post('/create', async (req, res) => {

    
  const errors = [];
  const { title, subtitle, description, image_url, service, status } = req.body;

  // Basic validation
  if (!title || title.trim() === '') {
    errors.push({ path: 'title', msg: 'Title is required' });
  }
  if (!description || description.trim() === '') {
    errors.push({ path: 'description', msg: 'Description is required' });
  }
  if (!image_url || image_url.trim() === '') {
    errors.push({ path: 'image_url', msg: 'Image URL is required' });
  }
  if (!service) {
    errors.push({ path: 'service', msg: 'Service ID is required' });
  }

  if (![0, 1, 2].includes(status)) {
    errors.push({ path: 'status', msg: 'Status must be 0 (Draft), 1 (Published), or 2 (Archived)' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: false,
      message: 'Validation failed',
      errors,
    });
  }

  try {
    // Check if service ID is valid
    const serviceExists = await Service.findById(service);
    if (!serviceExists) {
      return res.status(404).json({
        status: false,
        message: 'Service not found',
        errors: [{ path: 'service', msg: 'Invalid Service ID' }],
      });
    }

    const newBlog = new Blog({
      title,
      subtitle,
      description,
      image_url,
      service,
      status,
    });

    await newBlog.save();

    res.status(201).json({
      status: true,
      message: 'Blog created successfully',
      data: newBlog,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      errors: [{ path: 'server', msg: err.message }],
    });
  }
});
// @route   GET /api/blogs
// @desc    Get blogs with search, status filter and pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;

    const query = {};

    // Search filter (on title or subtitle)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter if passed (0, 1, 2)
    if (status !== undefined && [0, 1, 2].includes(Number(status))) {
      query.status = Number(status);
    }

    const total = await Blog.countDocuments(query);

    const blogs = await Blog.find(query)
      .populate('service', 'name') // only include service name
      .sort({ createdAt: -1 })     // newest first
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      status: true,
      message: 'Blogs fetched successfully',
      data: blogs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

// @route   PUT /api/blogs/:id
// @desc    Update a blog by ID
router.put('/:id', async (req, res) => {
  const { title, subtitle, description, image_url, service, status } = req.body;

  const errors = [];
  if (!title || title.trim() === '') errors.push({ path: 'title', msg: 'Title is required' });
  if (!description || description.trim() === '') errors.push({ path: 'description', msg: 'Description is required' });
  if (!image_url || image_url.trim() === '') errors.push({ path: 'image_url', msg: 'Image URL is required' });
  if (!service) errors.push({ path: 'service', msg: 'Service ID is required' });
  if (![0, 1, 2].includes(status)) errors.push({ path: 'status', msg: 'Invalid status' });

  if (errors.length > 0) {
    return res.status(400).json({ status: false, message: 'Validation failed', errors });
  }

  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ status: false, message: 'Blog not found' });
    }

    const serviceExists = await Service.findById(service);
    if (!serviceExists) {
      return res.status(404).json({ status: false, message: 'Invalid Service ID' });
    }

    blog.title = title;
    blog.subtitle = subtitle;
    blog.description = description;
    blog.image_url = image_url;
    blog.service = service;
    blog.status = status;

    await blog.save();

    res.status(200).json({
      status: true,
      message: 'Blog updated successfully',
      data: blog,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      errors: [{ path: 'server', msg: err.message }],
    });
  }
});

// @route   PATCH /api/blogs/:id/status
// @desc    Update only status of a blog
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;

  if (![0, 1, 2].includes(status)) {
    return res.status(400).json({
      status: false,
      message: 'Invalid status value. Must be 0, 1, or 2.',
    });
  }

  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ status: false, message: 'Blog not found' });
    }

    blog.status = status;
    await blog.save();

    res.status(200).json({
      status: true,
      message: 'Blog status updated successfully',
      data: blog,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
})

// @route   GET /api/blogs/:id
// @desc    Get a single blog by ID
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('service', 'name');

    if (!blog) {
      return res.status(404).json({
        status: false,
        message: 'Blog not found',
      });
    }

    res.status(200).json({
      status: true,
      message: 'Blog fetched successfully',
      data: blog,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

// @route   GET /api/blogs/slug/:slug
// @desc    Get a single blog by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug }).populate('service', 'name');

    if (!blog) {
      return res.status(404).json({
        status: false,
        message: 'Blog not found with this slug',
      });
    }

    res.status(200).json({
      status: true,
      message: 'Blog fetched successfully',
      data: blog,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});



module.exports = router;
