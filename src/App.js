// src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import MoviesList from "./pages/MoviesList";
import MovieDetail from "./pages/MovieDetail";
import "./App.css";

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={MoviesList} />
        <Route path="/movie/:id" component={MovieDetail} />
      </Switch>
    </Router>
  );
}

export default App;
