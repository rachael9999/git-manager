const express = require('express');
const cors = require('cors');
const app = express();
const { logger } = require('./utils/logger/winstonConfig');
const repositoryRoutes = require('./routes/repositories');
const userRoutes = require('./routes/user');

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://frontend:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/repositories', repositoryRoutes);
app.use('/user', userRoutes);

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
});