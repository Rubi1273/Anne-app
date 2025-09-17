// src/pages/MovieDetail.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function MovieDetail({ match }) {
    const id = match.params.id;
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/movies/${encodeURIComponent(id)}`)
            .then((r) => {
                if (!r.ok) throw new Error("Not found");
                return r.json();
            })
            .then((m) => {
                setMovie(m);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load movie", err);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div style={{ padding: 20 }}>Loading…</div>;
    if (!movie) return <div style={{ padding: 20 }}>Movie not found</div>;

    const releaseDate = movie.release_date || movie.release || movie.releaseDate || null;
    const localizedDate = releaseDate ? new Date(releaseDate).toLocaleDateString() : "—";

    let runtime = movie.runtime ?? movie.duration ?? null;
    if (runtime && runtime > 1000) runtime = Math.round(runtime / 60);

    return (
        <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto" }}>
            <Link to="/">← Back to list</Link>
            <h1 style={{ marginTop: 12 }}>{movie.title || movie.original_title || "Untitled"}</h1>
            <p style={{ fontStyle: "italic" }}>{movie.tagline || "—"}</p>
            <p><strong>Release date:</strong> {localizedDate}</p>
            <p><strong>Runtime:</strong> {runtime ? `${runtime} minutes` : "—"}</p>
            <p><strong>Rating:</strong> {Number(movie.vote_average ?? 0).toFixed(1)} / 10</p>

            <h3>All fields</h3>
            <pre style={{ whiteSpace: "pre-wrap", maxWidth: "100%" }}>
                {JSON.stringify(movie, null, 2)}
            </pre>
        </div>
    );
}
