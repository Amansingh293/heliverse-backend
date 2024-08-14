const express = require("express");
const Users = require("../models/Users");

const router = express.Router();

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

const {
  principalOnlyAuth,
  teacherOnlyAuth,
} = require("../middleware/Authorization");
const { Classroom, Timetable } = require("../models");
const ClassroomSchedule = require("../models/ClassroomSchedule");

router.post("/create-timetable", teacherOnlyAuth, async (req, res) => {
  try {
    console.log(req.body);
    const { subjectName, dayOfWeek, startTime, endTime } = req.body;

    const classroom = await Classroom.findOne({
      where: { teacherId: req.body.teacherId },
    });
    console.log(classroom.id);
    const classroomSchedule = await ClassroomSchedule.findOne({
      where: { day: dayOfWeek, classroomId: classroom.id },
    });

    if (
      !(
        classroomSchedule.dataValues.startTime <= startTime &&
        classroomSchedule.dataValues.endTime >= endTime
      )
    ) {
      return res.status(400).json({
        status: false,
        message: `TimeTable must have values in between startTime and endTime of classroom (${classroomSchedule.dataValues.startTime}) <-> (${classroomSchedule.dataValues.endTime}))`,
      });
    }

    if (classroom.dataValues.teacherId !== req.body.teacherId) {
      return res.status(400).json({
        status: false,
        message: "This classroom does not corresponds to this teacher!!",
      });
    }

    let timeTable = new Timetable({
      classroomId: classroom.id,
      teacherId: req.body.teacherId,
      subjectName: subjectName,
      startTime: startTime,
      endTime: endTime,
      dayOfWeek: dayOfWeek,
    });

    timeTable = await timeTable.save();

    return res.status(201).json({
      status: true,
      data: timeTable,
    });
  } catch (error) {
    //console.log(error.message);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error!!",
    });
  }
});

router.get("/get-classrooms-teacher", teacherOnlyAuth, async (req, res) => {
  try {
    const classrooms = await Classroom.findOne({
      where: { teacherId: req.body.teacherId },
    });
    if (!classrooms) {
      return res.status(400).json({
        status: false,
        message: "error",
      });
    }

    return res.status(200).json({
      status: false,
      data: classrooms,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error",
    });
  }
});

router.post("/create-student", teacherOnlyAuth, async (request, response) => {
  //console.log(request.body);
  try {
    const { name, email, password, role, classroom } = request.body;

    const validRoles = ["STUDENT"];

    if (!validRoles.includes(role.toUpperCase())) {
      return response.status(400).json({ error: "Invalid role" });
    }
    const user = await Users.findOne({ where: { email: email } });

    if (!user) {
      const saltRounds = 10;

      const hashedPassword = await bcrypt.hash(password, saltRounds);

      let newUser;

      if (role.toUpperCase() === "Student".toUpperCase()) {
        newUser = new Users({
          name: name,
          email: email,
          password: hashedPassword,
          role: request.body.role.toUpperCase(),
          classroomId: classroom,
        });
      } else {
        newUser = new Users({
          name: name,
          email: email,
          password: hashedPassword,
          role: request.body.role.toUpperCase(),
        });
      }
      //console.log(newUser);
      newUser = await newUser.save();

      response.status(200).send({
        success: true,
        message: "User Created ! Please Login",
        data: {
          email: email,
          name: name,
          role: role,
          userId: newUser.id,
        },
      });
    } else {
      response
        .status(403)
        .send({ success: false, message: "User Already Exists" });
    }

    return;
  } catch (err) {
    //console.log(err.message);
    response
      .status(500)
      .send({ success: false, message: "Internal Server Error" });
  }
});
router.get("/get-all-students", teacherOnlyAuth, async (req, res) => {
  try {
    const teacher = await Users.findOne({ where: { id: req.body.teacherId } });

    if (teacher == null) {
      return res.status(400).json({
        status: false,
        message: "No Teacher Found!!",
      });
    }

    const classroom = await Classroom.findOne({
      where: { teacherId: req.body.teacherId },
    });
    //console.log(classroom);
    const classroomId = classroom.dataValues.id;

    const students = await Users.findAll({
      where: {
        classroomId: classroomId,
      },
      attributes: { exclude: ["password"] },
    });
    //console.log(students);
    const allStudents = students.map((student) => {
      return student.dataValues;
    });
    //console.log(allStudents);

    return res.status(200).json({
      status: true,
      message: "Success",
      data: { allStudents, classroomName: classroom.dataValues.name },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error!",
    });
  }
});

router.patch("/edit-user", teacherOnlyAuth, async (req, res) => {
  try {
    const { id, email, name } = req.body;

    const user = await Users.findByPk(id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found!",
      });
    }

    if (email) {
      const existingUser = await Users.findOne({
        where: { email, id: { [Op.ne]: id } },
      });

      if (existingUser) {
        return res.status(400).json({
          status: false,
          message: "Email is already in use!",
        });
      }

      user.email = email;
    }
    if (name) user.name = String(name);
    //console.log(user);
    await user.save();

    return res.status(200).json({
      status: true,
      message: "User updated successfully!",
      data: user,
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        status: false,
        message: "Validation error",
        errors: error.errors.map((e) => e.message), // Return validation error messages
      });
    }

    console.error(error.message);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error!",
      error: error.message,
    });
  }
});

router.delete("/delete-user", teacherOnlyAuth, async (req, res) => {
  try {
    const deleted = await Users.destroy({ where: { id: req.query.id } });

    if (deleted) {
      return res.status(200).json({
        status: true,
        message: "Deleted User Successfully!",
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }
  } catch (error) {
    //console.log(error.message);
    return res.status(500).json({
      status: false,
      message: "Error deleting user",
    });
  }
});
module.exports = router;
