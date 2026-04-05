const express = require("express");
const Course = require("../models/Course");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/my", protect, async (req, res, next) => {
  try {
    const match =
      req.user.role === "student"
        ? { students: req.user._id }
        : { professor: req.user._id };

    const courses = await Course.find(match)
      .populate({ path: "assignments", options: { sort: { createdAt: -1 } } })
      .sort({ createdAt: -1 });

    if (req.user.role === "professor") {
      const analytics = await Promise.all(
        courses.map(async (course) => {
          const assignments = await Assignment.find({
            course: course._id,
          }).select("_id");
          const assignmentIds = assignments.map((item) => item._id);

          const submissionCounts = await Submission.aggregate([
            { $match: { assignment: { $in: assignmentIds } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ]);

          return {
            courseId: course._id,
            studentCount: course.students.length,
            submissionCounts,
          };
        }),
      );

      return res.json({ courses, analytics });
    }

    return res.json({ courses });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
