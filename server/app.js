// server/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const moviesRouter = require('./routes/movies');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(helmet());
app.use(cors()); // As requested, using cors package with default permissive settings
app.use(express.json());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Routes
app.use('/api/movies', moviesRouter);

// Health route
app.get('/api/ping', (req, res) => res.send('pong'));

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});

// Error handler (centralized)
app.use((err, req, res, next) => {
    logger.error('Unhandled error', err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
