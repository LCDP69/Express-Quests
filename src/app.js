const express = require("express");

const app = express();

app.use(express.json());

const movieControllers = require("./controllers/movieControllers");

const usersControllers = require("./controllers/usersControllers");

const { hashPassword } = require("../auth");

app.get("/api/movies", movieControllers.getMovies);
app.get("/api/movies/:id", movieControllers.getMovieById);
app.get("/api/users", usersControllers.getUsers);
app.get("/api/users/:id", usersControllers.getUsersById);

app.post("/api/movies", movieControllers.postMovie);
app.post("/api/users", usersControllers.postUsers);

app.put("/api/movies/:id", movieControllers.updateMovie);
app.put("/api/users/:id", usersControllers.updateUsers);

app.delete("/api/movies/:id", movieControllers.deleteMovie);
app.delete("/api/users/:id", usersControllers.deleteUsers);

app.post("/api/users", hashPassword, usersControllers.postUsers);

module.exports = app;
