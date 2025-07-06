const mongoose = require('mongoose');
const slugify = require('slugify'); 

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  image_url: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    unique: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  status: {
    type: Number,
    enum: [0, 1, 2], // 0 = Draft, 1 = Published, 2 = Archived
    default: 0
  }
}, {
  timestamps: true
});

// Auto-generate and ensure unique slug
BlogSchema.pre('validate', async function (next) {
  if (this.title && !this.slug) {
    let newSlug = slugify(this.title, { lower: true, strict: true });
    let slugExists = await mongoose.models.Blog.findOne({ slug: newSlug });

    // If slug already exists, add random suffix
    if (slugExists) {
      newSlug += '-' + Math.random().toString(36).substring(2, 6);
    }

    this.slug = newSlug;
  }
  next();
});

module.exports = mongoose.model('Blog', BlogSchema);
