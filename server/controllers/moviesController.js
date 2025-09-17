// server/controllers/moviesController.js
const movieService = require('../services/movieService');

const DEFAULT_LIMIT = 50;

async function listMovies(req, res, next) {
    try {
        const limit = Math.min(200, Number(req.query.limit) || DEFAULT_LIMIT);
        const offset = Math.max(0, Number(req.query.offset) || 0);

        const { total, data } = await movieService.getAll({ limit, offset });

        res.json({ total, count: data.length, data });
    } catch (err) {
        next(err);
    }
}

async function getMovieById(req, res, next) {
    try {
        const { id } = req.params;
        const movie = await movieService.getById(id);
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.json(movie);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    listMovies,
    getMovieById,
};
