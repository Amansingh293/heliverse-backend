const express = require("express");
const Users = require("../models/Users");
const moment = require("moment");
const router = express.Router();
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const sequelize = require("../config/database");

const jwt = require("jsonwebtoken");

const {
  principalOnlyAuth,
  teacherOnlyAuth,
} = require("../middleware/Authorization");

const { Classroom, Teacher, Student, User } = require("../models");

const ClassroomSchedule = require("../models/ClassroomSchedule");

router.post(
  "/create-teacher-user",
  principalOnlyAuth,
  async (request, response) => {
    console.log(request.body);
    try {
      const { name, email, password, role, classroom } = request.body;

      const validRoles = ["PRINCIPAL", "TEACHER", "STUDENT"];

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
            role: role.toUpperCase(),
          });
        }
        console.log(newUser);
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
      console.log(err.message);
      response
        .status(500)
        .send({ success: false, message: "Internal Server Error" });
    }
  }
);

router.post("/login", async (request, response) => {
  try {
    const user = await Users.findOne({ where: { email: request.body.email } });
    if (!user) {
      response
        .status(401)
        .send({ success: false, message: "No User Exists !! Please SignUp" });
      return;
    }

    const validPassword = await bcrypt.compare(
      request.body.password,
      user.password
    );

    if (!validPassword) {
      response.status(401).send({
        success: false,
        message: "Invalid Credentails",
      });
      return;
    }

    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET
    );

    response.status(200).send({
      status: true,
      message: "User Logged in",
      data: jwtToken,
      role: user.role,
    });
    return;
  } catch (err) {
    console.log(err.message);
    response.status(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
});

router.post("/create-classroom", principalOnlyAuth, async (req, res) => {
  try {
    // const classroom
    if (
      (await Classroom.findOne({ where: { teacherId: req.body.teacherId } })) !=
      null
    ) {
      return res.status(400).json({
        status: true,
        message: "Teacher to this classroom already allotted",
      });
    }
    let teacherValidation = await Users.findOne({
      where: { id: req.body.teacherId },
    });

    if (teacherValidation.dataValues.role != "TEACHER") {
      return res.status(400).json({
        status: true,
        message: "Teacher with this id doesnot exists !!",
      });
    }
    const newClassroom = await Classroom.create({
      name: req.body.name,
      standard: req.body.standard,
      teacherId: req.body.teacherId,
    });

    for (const schedule of req.body.schedules) {
      let { day, date, startTime, endTime } = schedule;
      day = day.toUpperCase();

      const existingSchedule = await ClassroomSchedule.findOne({
        where: {
          classroomId: newClassroom.id,
          day,
          date: date,
        },
      });

      if (existingSchedule) {
        return res.status(400).json({
          success: false,
          message: `Schedule conflict on ${day} at ${startTime} - ${endTime}`,
        });
      }

      await ClassroomSchedule.create({
        classroomId: newClassroom.id,
        day,
        date,
        startTime,
        endTime,
      });
    }

    res.status(201).json({
      success: true,
      message: "Classroom and schedule created successfully!",
      data: newClassroom,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

router.post(
  "/assign-teacher-to-classroom",
  principalOnlyAuth,
  async (req, res) => {
    try {
      const classroom = await Classroom.findOne({
        where: { id: req.body.id },
      });

      const teacher = await Users.findOne({
        where: { id: req.body.teacherId },
      });

      if (!teacher) {
        return res.status(400).json({
          status: false,
          message: "Teacher Not Found!!",
        });
      }

      classroom.teacherId = req.body.teacherId;

      await classroom.save();

      return res.status(200).json({
        status: true,
        data: classroom,
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Error Assigning teacher!!",
      });
    }
  }
);
// teacher id , student id , classroom id
router.post(
  "/assign-student-to-teacher",
  principalOnlyAuth,
  async (req, res) => {
    try {
      const teacherClassroom = await Classroom.findOne({
        where: { teacherId: req.body.teacherId },
      });

      if (teacherClassroom == null) {
        return res.json({
          status: "false",
          message: "First assign classroom to this teacher",
        });
      }

      const teacherDetails = await Users.findOne({
        where: { id: req.body.teacherId },
      });

      const student = new Student({
        classroomId: teacherClassroom.id,
        userId: req.body.studentId,
        teacherId: teacherDetails.id,
      });

      await student.save();

      const totalStudentToTeacher = await Student.findAll({
        where: { teacherId: req.body.teacherId },
      });

      const allottedStudents = totalStudentToTeacher.map((student) => {
        return student.dataValues;
      });
      // console.log(allottedStudents);
      return res.status(201).json({
        status: "true",
        data: {
          teacherDetails: { ...teacherDetails.dataValues },
          assignedClassroom: { ...teacherClassroom.dataValues },
          studentId: req.body.studentId,
          totalStudentsAlotted: allottedStudents,
        },
      });
    } catch (error) {
      console.log(error.message);
      return res.json({ status: false, message: "Internal Server Error" });
    }
  }
);

router.get(
  "/get-all-teachers-available",
  principalOnlyAuth,
  async (req, res) => {
    try {
      const teachers = await Users.findAll({
        attributes: { exclude: ["password"] },
        where: {
          role: "TEACHER",
        },
      });

      let classrooms = await Classroom.findAll();

      classrooms = classrooms.map(
        (classroom) => classroom.dataValues.teacherId
      );

      const availableTeachers = teachers.filter(
        (teacher) => !classrooms.includes(teacher.dataValues.id)
      );

      // console.log(availableTeachers);
      return res
        .status(200)
        .json({ data: availableTeachers, message: "success" });
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error!!" });
    }
  }
);

router.get("/get-all-teachers", principalOnlyAuth, async (req, res) => {
  try {
    const teachers = await Users.findAll({
      attributes: { exclude: ["password"] },
      where: {
        role: "TEACHER",
      },
    });

    return res.status(200).json({ data: teachers, message: "success" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error!!" });
  }
});

router.get("/get-all-students", principalOnlyAuth, async (req, res) => {
  try {
    const students = await Users.findAll({
      attributes: { exclude: ["password"] },
      where: {
        role: "STUDENT",
      },
    });
    return res.status(200).json({ data: students, message: "success" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error!!" });
  }
});

router.patch("/edit-user", principalOnlyAuth, async (req, res) => {
  try {
    const { id, email, name } = req.body;

    // Find the user by primary key (ID)
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

router.get("/get-all-classrooms", principalOnlyAuth, async (req, res) => {
  try {
    const classrooms = await Classroom.findAll();

    const availableClassrooms = classrooms.map((classroom) => {
      return classroom.dataValues;
    });

    for (let i = 0; i < availableClassrooms.length; i++) {
      const classroomSchedule = await ClassroomSchedule.findAll({
        where: { classroomId: availableClassrooms[i].id },
      });
      // console.log(availableClassrooms[i], classroomSchedule.dataValues);
      const schedules = classroomSchedule.map((classroomSch) => {
        return classroomSch.dataValues;
      });
      availableClassrooms[i].availableSchedules = schedules;
    }
    return res.status(200).json({
      status: false,
      data: availableClassrooms,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error",
    });
  }
});

router.delete("/delete-user", principalOnlyAuth, async (req, res) => {
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
    console.log(error.message);
    return res.status(500).json({
      status: false,
      message: "Error deleting user",
    });
  }
});
module.exports = router;
