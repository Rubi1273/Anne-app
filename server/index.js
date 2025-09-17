// server/index.js
/**
 * Minimal, production-friendly Express server for the Movies assignment.
 *
 * Routes:
 *  - GET /api/ping
 *  - GET /api/movies?limit=50&offset=0
 *  - GET /api/movies/:id
 *
 * Data file: server/movies_metadata.json
 *
 * Usage:
 *  - npm install express cors
 *  - node server/index.js
 */

const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const MOVIES_FILE = path.join(__dirname, 'movies_metadata.json');
const PORT = Number(process.env.PORT) || 3001;

// In-memory cache
let movies = [];
let moviesLoaded = false;

/**
 * Load and cache movies metadata.
 * This function is safe to call multiple times; it caches the result.
 */
async function loadMovies() {
    if (moviesLoaded) return movies;
    try {
        const raw = await fs.readFile(MOVIES_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        movies = Array.isArray(parsed) ? parsed : Object.values(parsed);
        moviesLoaded = true;
        console.info(`Loaded ${movies.length} movies from ${MOVIES_FILE}`);
        return movies;
    } catch (err) {
        console.error(`Failed to load movies file at ${MOVIES_FILE}:`, err.message || err);
        movies = [];
        moviesLoaded = true; // avoid retry storm; keep empty array
        return movies;
    }
}

/** Helper: try multiple common id fields for a movie record */
function extractId(movie) {
    if (!movie || typeof movie !== 'object') return null;
    return (
        movie.id ??
        movie.movieId ??
        movie._id ??
        movie.imdb_id ??
        movie.imdbId ??
        movie.tmdb_id ??
        null
    );
}

/** Helper: normalize vote average to 0-10 scale and one decimal */
function normalizeVote(v) {
    const n = Number(v) || 0;
    if (n > 10) return +(n / 10).toFixed(1);
    return +n.toFixed(1);
}

/** Health check */
app.get('/api/ping', (req, res) => {
    res.send('pong');
});

/**
 * GET /api/movies
 * Query:
 *  - limit (number, default 50, max 200)
 *  - offset (number, default 0)
 *
 * Response:
 *  {
 *    total: <total number in dataset>,
 *    count: <returned count>,
 *    data: [ { id, title, tagline, vote_average }, ... ]
 *  }
 */
app.get('/api/movies', async (req, res) => {
    try {
        await loadMovies();
        const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
        const offset = Math.max(0, Number(req.query.offset) || 0);

        const slice = movies.slice(offset, offset + limit).map((m) => ({
            id: extractId(m),
            title: m.title ?? m.original_title ?? '',
            tagline: m.tagline ?? '',
            vote_average: normalizeVote(m.vote_average ?? m.vote ?? m.voteAverage ?? 0),
        }));

        res.json({
            total: movies.length,
            count: slice.length,
            data: slice,
        });
    } catch (err) {
        console.error('Error in GET /api/movies:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/movies/:id
 * Returns full movie object with normalized id and vote_average
 */
app.get('/api/movies/:id', async (req, res) => {
    try {
        await loadMovies();
        const idParam = String(req.params.id);

        const found = movies.find((m) => {
            const mid = extractId(m);
            if (mid && String(mid) === idParam) return true;
            // fallback: match title exactly (case-insensitive)
            if ((m.title || '').toLowerCase() === idParam.toLowerCase()) return true;
            return false;
        });

        if (!found) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        // return a shallow copy and add normalized fields
        const result = {
            ...found,
            id: extractId(found),
            vote_average: normalizeVote(found.vote_average ?? found.vote ?? 0),
        };

        res.json(result);
    } catch (err) {
        console.error('Error in GET /api/movies/:id:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/** Serve production build if any (optional) */
const buildPath = path.join(__dirname, '..', 'build');
app.use(express.static(buildPath));
app.get('*', (req, res, next) => {
    // Only serve index.html for non-api requests when in production build mode
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(buildPath, 'index.html'), (err) => {
        if (err) return next();
    });
});

/** Start server */
async function start() {
    await loadMovies(); // attempt to load on startup (non-blocking for later errors)
    const server = app.listen(PORT, () => {
        console.info(`Movies API listening on http://localhost:${PORT}`);
        console.info(' - GET /api/movies');
        console.info(' - GET /api/movies/:id');
    });

    // Graceful shutdown
    const shutdown = (signal) => {
        console.info(`Received ${signal}. Shutting down server...`);
        server.close(() => {
            console.info('Server shutdown complete.');
            process.exit(0);
        });
        // Force exit after 10s
        setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
