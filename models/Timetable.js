const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Adjust the path as needed

const Timetable = sequelize.define(
  "Timetable",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    subjectName: {
      type: DataTypes.STRING,
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
    dayOfWeek: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teacherId: {
      type: DataTypes.INTEGER,
      references: {
        model: "Users",
        key: "id",
      },
      allowNull: false,
    },
    classroomId: {
      type: DataTypes.INTEGER,
      references: {
        model: "Classrooms",
        key: "id",
      },
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Timetable;
