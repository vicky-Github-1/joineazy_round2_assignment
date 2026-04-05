const express = require("express");
const Assignment = require("../models/Assignment");
const Group = require("../models/Group");
const Course = require("../models/Course");
const Submission = require("../models/Submission");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, authorize("professor"), async (req, res, next) => {
  try {
    const { assignmentId, memberIds, leaderId } = req.body;

    if (!assignmentId || !memberIds || !leaderId) {
      return res
        .status(400)
        .json({ message: "assignmentId, memberIds and leaderId are required" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || assignment.submissionType !== "group") {
      return res.status(400).json({ message: "Invalid group assignment" });
    }

    const course = await Course.findById(assignment.course);
    if (!course || String(course.professor) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You cannot create groups for this assignment" });
    }

    const group = await Group.create({
      assignment: assignment._id,
      course: assignment.course,
      leader: leaderId,
      members: memberIds,
    });

    await Promise.all(
      memberIds.map((studentId) =>
        Submission.findOneAndUpdate(
          { assignment: assignment._id, student: studentId },
          {
            assignment: assignment._id,
            student: studentId,
            group: group._id,
            status: "pending",
          },
          { upsert: true, new: true },
        ),
      ),
    );

    return res.status(201).json({ group });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
