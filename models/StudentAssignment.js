const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user'); // Import User model
const Classroom = require('./Classroom'); // Import Classroom model
const Users = require('./Users');
const Teacher = require('./Teacher');
const Student = require('./Student');

const StudentAssignment = sequelize.define('StudentAssignment', {
  teacherId: {
    type: DataTypes.INTEGER,
    references: {
      model: Teacher,
      key: 'id',
    },
    allowNull: false,
  },
  studentId: {
    type: DataTypes.INTEGER,
    references: {
      model: Student,
      key: 'id',
    },
    allowNull: false,
  },
  classroomId: {
    type: DataTypes.INTEGER,
    references: {
      model: Classroom,
      key: 'id',
    },
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = StudentAssignment;
