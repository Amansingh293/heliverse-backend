const jwt = require("jsonwebtoken");

const principalOnlyAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (decodedToken.role !== "PRINCIPAL") {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
};

const teacherOnlyAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.body.teacherId = decodedToken.id;
    if (decodedToken.role !== "TEACHER") {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (error) {
    console.log(error.message);
    res.status(401).json({ message: "Authentication failed" });
  }
};

const studentOnlyAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.body.studentId = decodedToken.id;

    if (decodedToken.role !== "STUDENT") {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = {
  principalOnlyAuth,
  studentOnlyAuth,
  teacherOnlyAuth,
};
