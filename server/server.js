// server/server.js
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const MOVIES_PATH = path.join(__dirname, "movies_metadata.json");

let movies = [];
try {
  const raw = fs.readFileSync(MOVIES_PATH, "utf8");
  movies = JSON.parse(raw);
  // Ensure array
  if (!Array.isArray(movies)) {
    console.warn("movies_metadata.json did not parse to an array; converting...");
    movies = Object.values(movies);
  }
} catch (err) {
  console.error("Failed to load movies data:", err);
}

// Helper: get an id value for each movie (attempt multiple common fields)
function movieIdFor(movie) {
  return movie.id ?? movie.movieId ?? movie._id ?? movie.imdb_id ?? movie.imdbId ?? null;
}

function findMovieById(id) {
  if (!id) return null;
  const sid = String(id);
  return movies.find(m => {
    const mid = movieIdFor(m);
    if (mid && String(mid) === sid) return true;
    // try title-based fallback (not ideal) - won't be used usually
    if (String(m.title || m.original_title || "").toLowerCase() === sid.toLowerCase()) return true;
    return false;
  });
}

// Simple normalization for vote_average (attempt to get 0-10 scale)
function normalizedVoteAverage(m) {
  const v = Number(m.vote_average ?? m.voteAverage ?? m.vote ?? 0) || 0;
  // If dataset uses 0-100 scale, scale to 0-10 if value > 10
  if (v > 10) return +(v / 10).toFixed(1);
  return +v.toFixed(1);
}

// Test route
app.get("/api/ping", (req, res) => res.send("pong!"));

// GET /api/movies?limit=&offset=
app.get("/api/movies", (req, res) => {
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 50);
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const slice = movies.slice(offset, offset + limit).map(m => {
    return {
      id: movieIdFor(m),
      title: m.title ?? m.original_title ?? "",
      tagline: m.tagline ?? "",
      vote_average: normalizedVoteAverage(m)
    };
  });
  res.json({
    total: movies.length,
    count: slice.length,
    data: slice
  });
});

// GET /api/movies/:id
app.get("/api/movies/:id", (req, res) => {
  const movie = findMovieById(req.params.id);
  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }

  // Add normalized fields for convenience
  const full = Object.assign({}, movie, {
    id: movieIdFor(movie),
    vote_average: normalizedVoteAverage(movie)
  });

  res.json(full);
});

// Production static serving
let port;
if (process.env.NODE_ENV === "production") {
  port = process.env.PORT || 3000;
  app.use(express.static(path.join(__dirname, "../build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../build", "index.html"));
  });
} else {
  port = 3001;
}

const listener = app.listen(port, () => {
  console.log("Express server listening on port", listener.address().port);
});
