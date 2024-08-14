const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Users = sequelize.define(
  "Users",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("PRINCIPAL", "TEACHER", "STUDENT"),
      allowNull: false,
    },
    classroomId: {
      type: DataTypes.INTEGER,
      references: {
        model: "Classrooms",
        key: "id",
      },
    }
  
  },
  {
    timestamps: true,
  }
);

module.exports = Users;
