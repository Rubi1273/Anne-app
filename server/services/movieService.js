// server/services/movieService.js
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

const DATA_PATH = path.join(__dirname, '..', 'movies_metadata.json'); // adjust if file lives elsewhere

// internal cache
let movies = [];
let loadPromise = null;

function normalizeMoviesArray(raw) {
    if (Array.isArray(raw)) return raw;
    // if file is an object keyed by id, convert to array
    return Object.values(raw);
}

async function loadMovies() {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
        try {
            const raw = await fs.readFile(DATA_PATH, 'utf8');
            const parsed = JSON.parse(raw);
            movies = normalizeMoviesArray(parsed);
            logger.info(`Loaded ${movies.length} movies from ${DATA_PATH}`);
            return movies;
        } catch (err) {
            logger.error('Failed to load movies file', err);
            throw err;
        }
    })();
    return loadPromise;
}

function extractId(m) {
    // Try a variety of id fields the dataset may use
    return m.id ?? m.movieId ?? m._id ?? m.imdb_id ?? m.imdbId ?? null;
}

/**
 * Get a list of movies (lightweight objects for list view)
 * options: {limit, offset}
 */
async function getAll({ limit = 50, offset = 0 } = {}) {
    await loadMovies();
    const slice = movies.slice(offset, offset + limit).map((m) => ({
        id: extractId(m),
        title: m.title ?? m.original_title ?? '',
        tagline: m.tagline ?? '',
        vote_average: normalizeVote(m.vote_average ?? m.vote ?? m.voteAverage ?? 0),
    }));
    return {
        total: movies.length,
        data: slice,
    };
}

/**
 * Get a single movie by id (returns full movie object with added id and normalized vote_average)
 */
async function getById(id) {
    await loadMovies();
    const sid = String(id);
    const found = movies.find((m) => {
        const mid = extractId(m);
        if (mid && String(mid) === sid) return true;
        // fallback: if id equals title (not ideal but helpful for some datasets)
        if ((m.title || '').toLowerCase() === sid.toLowerCase()) return true;
        return false;
    });
    if (!found) return null;

    const result = { ...found, id: extractId(found), vote_average: normalizeVote(found.vote_average ?? found.vote ?? 0) };
    return result;
}

function normalizeVote(v) {
    const n = Number(v) || 0;
    if (n > 10) return +(n / 10).toFixed(1);
    return +n.toFixed(1);
}

module.exports = {
    loadMovies,
    getAll,
    getById,
};
