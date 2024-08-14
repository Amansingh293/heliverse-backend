const Sequelize = require("sequelize");
const sequelize = require("../config/database"); // Path to your Sequelize instance

// Import models
const User = require("./Users");
const Classroom = require("./Classroom");
const Timetable = require("./Timetable");
const Subject = require("./Subject");
const ClassroomSchedule = require("./ClassroomSchedule");
const Users = require("./Users");

Classroom.hasMany(Timetable, {
  foreignKey: "classroomId",
  onDelete: "CASCADE",
});
Timetable.belongsTo(Classroom, {
  foreignKey: "classroomId",
  onDelete: "CASCADE",
});

Classroom.hasMany(ClassroomSchedule, {
  foreignKey: "classroomId",
  onDelete: "CASCADE",
});

User.hasMany(Classroom, {
  foreignKey: "teacherId",
  onDelete: "SET NULL",
});
Classroom.belongsTo(User, {
  foreignKey: "teacherId",
  onDelete: "SET NULL",
});

Classroom.hasMany(Users, {
  foreignKey: "classroomId",
  onDelete: "SET NULL",
});
Users.belongsTo(Classroom, {
  foreignKey: "classroomId",
  onDelete: "SET NULL",
});

module.exports = {
  sequelize,
  User,
  Classroom,
  Timetable,
  Subject,
};
