const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ClassroomSchedule = sequelize.define(
  "ClassroomSchedule",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    classroomId: {
      type: DataTypes.INTEGER,
      references: {
        model: "Classrooms",
        key: "id",
      },
      allowNull: false,
    },
    day: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = ClassroomSchedule;
