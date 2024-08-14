const express = require("express");

require("dotenv").config();

const { sequelize } = require("./models");

const cors = require("cors");
const principalRoute = require("./controllers/principalRoute");
const teacherRoute = require("./controllers/teacherRoute");
const studentRoute = require("./controllers/studentRoute");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/principal", principalRoute);
app.use("/api/teacher", teacherRoute);
app.use("/api/students", studentRoute);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    await sequelize.sync({
      force: false,
      alter: false,
      hooks: false,
      indexes: false,
    });
    app.listen(3001, () => {
      console.log("Server is running on port 3001");
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

startServer();
