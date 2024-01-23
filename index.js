require("dotenv").config();
const express = require("express")
const app = require("./src/app");

const port = process.env.APP_PORT;
app.use(express.json())
app
  .listen(port, () => {
    console.log(`Server is listening on ${port}`);
  })
  .on("error", (err) => {
    console.error("Error:", err.message);
  });
