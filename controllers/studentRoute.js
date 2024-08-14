const express = require("express");
const Users = require("../models/Users");

const router = express.Router();

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

const { studentOnlyAuth } = require("../middleware/Authorization");
const { Classroom } = require("../models");

router.get("/all-students", studentOnlyAuth, async (req, res) => {
  try {
    console.log(req.body.studentId);

    const student = await Users.findByPk(req.body.studentId);

    if (!student) {
      return res.status(400).json({
        status: false,
        message: "No Student Found",
      });
    }
    console.log(student.dataValues.classroomId);
    const students = await Users.findAll({
      where: { classroomId: student.dataValues.classroomId },
      attributes:{"exclude": "password"}
    });
    console.log(students);

    if (!students) {
      return res.status(400).json({
        status: false,
        message: "No classrooms Found",
      });
    }

    const allStudents = students.map((classroom) => {
      return classroom.dataValues;
    });

    return res.status(200).json({
      status: false,
      data: allStudents,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "No classrooms Found!!!!!",
    });
  }
});

module.exports = router;
