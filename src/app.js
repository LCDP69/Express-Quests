const express = require("express");
const app = express();
app.use(express.json());
const movieControllers = require("./controllers/movieControllers");
const usersControllers = require("./controllers/usersControllers");
const { hashPassword, verifyPassword, verifyToken } = require("../auth");
const jwt = require("jsonwebtoken");

// Routes publiques GET
app.get("/api/movies", movieControllers.getMovies);
app.get("/api/movies/:id", movieControllers.getMovieById);
app.get("/api/users", usersControllers.getUsers);
app.get("/api/users/:id", usersControllers.getUsersById);

// Routes publiques POST
app.post("/api/users", hashPassword, usersControllers.postUsers);

// Middleware pour protéger les routes suivantes
app.use(verifyToken);

// Routes protégées POST, PUT et DELETE
app.post("/api/movies", movieControllers.postMovie);
app.post("/api/login", usersControllers.getUserByEmailWithPasswordAndPassToNext, verifyPassword);
app.put("/api/movies/:id", movieControllers.updateMovie);
app.put("/api/users/:id", usersControllers.updateUsers);
app.delete("/api/movies/:id", movieControllers.deleteMovie);
app.delete("/api/users/:id", usersControllers.deleteUsers);

module.exports = app;
