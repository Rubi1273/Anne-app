// src/pages/MoviesList.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./MoviesList.css";

export default function MoviesList() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/movies?limit=200")
            .then((r) => r.json())
            .then((d) => {
                setMovies(d.data || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load movies", err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="page-container">
            <header className="header">
                <h1>Movies</h1>
            </header>

            {loading ? (
                <div className="loading">Loading…</div>
            ) : (
                <div className="grid">
                    {movies.map((m) => (
                        <article key={m.id || Math.random()} className="card">
                            <h3 className="title">{m.title}</h3>
                            <p className="tagline">{m.tagline || "—"}</p>
                            <p className="rating">Rating: {Number(m.vote_average).toFixed(1)} / 10</p>
                            <Link className="view-link" to={`/movie/${encodeURIComponent(m.id)}`}>
                                View details →
                            </Link>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
