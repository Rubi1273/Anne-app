// server/routes/movies.js
const express = require('express');
const controller = require('../controllers/moviesController');

const router = express.Router();

/**
 * GET /api/movies
 * Optional query parameters:
 *  - limit (default 50)
 *  - offset (default 0)
 */
router.get('/', controller.listMovies);

/**
 * GET /api/movies/:id
 * Returns a single movie by id
 */
router.get('/:id', controller.getMovieById);

module.exports = router;
