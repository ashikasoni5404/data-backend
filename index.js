require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// ✅ Add these middlewares at the top
app.use(cors());
app.use(express.json()); // <-- THIS IS REQUIRED
app.use(express.urlencoded({ extended: true }));


// DB Connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Import service routes
const serviceRoutes = require('./routes/services');
app.use('/api/services', serviceRoutes);
const contactRoutes = require('./routes/contact');
app.use('/api/contact', contactRoutes);

const blogRoutes = require('./routes/blog');
app.use('/api/blog', blogRoutes);

const userRoutes = require('./routes/auth');
app.use('/api/auth', userRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
