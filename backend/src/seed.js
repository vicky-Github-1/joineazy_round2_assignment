require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const Course = require("./models/Course");
const Assignment = require("./models/Assignment");
const Submission = require("./models/Submission");
const Group = require("./models/Group");

const seed = async () => {
  await connectDB();

  await Promise.all([
    Submission.deleteMany({}),
    Group.deleteMany({}),
    Assignment.deleteMany({}),
    Course.deleteMany({}),
    User.deleteMany({}),
  ]);

  const pass = await bcrypt.hash("password123", 10);

  const [prof, student1, student2, student3] = await User.create([
    {
      name: "Dr. Maya Sharma",
      email: "prof@example.com",
      password: pass,
      role: "professor",
    },
    {
      name: "Aarav Singh",
      email: "student1@example.com",
      password: pass,
      role: "student",
    },
    {
      name: "Anaya Verma",
      email: "student2@example.com",
      password: pass,
      role: "student",
    },
    {
      name: "Kabir Mehta",
      email: "student3@example.com",
      password: pass,
      role: "student",
    },
  ]);

  const course = await Course.create({
    title: "Full Stack Engineering",
    code: "FSE-2026",
    professor: prof._id,
    students: [student1._id, student2._id, student3._id],
  });

  prof.teachingCourses = [course._id];
  student1.enrolledCourses = [course._id];
  student2.enrolledCourses = [course._id];
  student3.enrolledCourses = [course._id];

  await Promise.all([
    prof.save(),
    student1.save(),
    student2.save(),
    student3.save(),
  ]);

  const individualAssignment = await Assignment.create({
    course: course._id,
    createdBy: prof._id,
    title: "UI Revamp Task",
    description: "Design a modern dashboard and submit screenshot pack.",
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    submissionType: "individual",
  });

  const groupAssignment = await Assignment.create({
    course: course._id,
    createdBy: prof._id,
    title: "System Design Report",
    description: "Submit a group architecture report and API mapping.",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    submissionType: "group",
  });

  course.assignments = [individualAssignment._id, groupAssignment._id];
  await course.save();

  await Submission.create([
    { assignment: individualAssignment._id, student: student1._id },
    { assignment: individualAssignment._id, student: student2._id },
    { assignment: individualAssignment._id, student: student3._id },
  ]);

  const group = await Group.create({
    course: course._id,
    assignment: groupAssignment._id,
    leader: student1._id,
    members: [student1._id, student2._id, student3._id],
  });

  await Submission.create([
    {
      assignment: groupAssignment._id,
      student: student1._id,
      group: group._id,
    },
    {
      assignment: groupAssignment._id,
      student: student2._id,
      group: group._id,
    },
    {
      assignment: groupAssignment._id,
      student: student3._id,
      group: group._id,
    },
  ]);

  console.log("Seed complete");
  console.log("Professor: prof@example.com / password123");
  console.log("Student: student1@example.com / password123");
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
