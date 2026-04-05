const express = require("express");
const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const Group = require("../models/Group");
const Submission = require("../models/Submission");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, authorize("professor"), async (req, res, next) => {
  try {
    const { courseId, title, description, deadline, submissionType } = req.body;

    if (!courseId || !title || !description || !deadline) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const course = await Course.findById(courseId);
    if (!course || String(course.professor) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Course not found or not allowed" });
    }

    const assignment = await Assignment.create({
      course: courseId,
      createdBy: req.user._id,
      title,
      description,
      deadline,
      submissionType: submissionType || "individual",
    });

    course.assignments.push(assignment._id);
    await course.save();

    await Promise.all(
      course.students.map((studentId) =>
        Submission.findOneAndUpdate(
          { assignment: assignment._id, student: studentId },
          {
            assignment: assignment._id,
            student: studentId,
            status: "pending",
          },
          { upsert: true },
        ),
      ),
    );

    return res.status(201).json({ assignment });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", protect, authorize("professor"), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate(
      "course",
    );

    if (
      !assignment ||
      String(assignment.course.professor) !== String(req.user._id)
    ) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const updates = ["title", "description", "deadline", "submissionType"];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        assignment[field] = req.body[field];
      }
    });

    await assignment.save();

    return res.json({ assignment });
  } catch (error) {
    return next(error);
  }
});

router.get("/course/:courseId", protect, async (req, res, next) => {
  try {
    const assignments = await Assignment.find({
      course: req.params.courseId,
    }).sort({ createdAt: -1 });
    return res.json({ assignments });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", protect, async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate(
      "course",
      "title code students professor",
    );
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const submissions = await Submission.find({ assignment: assignment._id })
      .populate("student", "name email")
      .populate("acknowledgedBy", "name");

    const groups =
      assignment.submissionType === "group"
        ? await Group.find({ assignment: assignment._id }).populate(
            "leader members",
            "name email",
          )
        : [];

    return res.json({ assignment, submissions, groups });
  } catch (error) {
    return next(error);
  }
});

router.get(
  "/:id/submissions",
  protect,
  authorize("professor"),
  async (req, res, next) => {
    try {
      const { status } = req.query;
      const assignment = await Assignment.findById(req.params.id).populate(
        "course",
        "professor",
      );

      if (
        !assignment ||
        String(assignment.course.professor) !== String(req.user._id)
      ) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const filter = { assignment: assignment._id };
      if (status) {
        filter.status = status;
      }

      const submissions = await Submission.find(filter)
        .populate("student", "name email")
        .populate("acknowledgedBy", "name")
        .sort({ updatedAt: -1 });

      return res.json({ submissions });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/:id/submit",
  protect,
  authorize("student"),
  async (req, res, next) => {
    try {
      const assignment = await Assignment.findById(req.params.id);

      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      let submission = await Submission.findOne({
        assignment: assignment._id,
        student: req.user._id,
      });

      if (!submission) {
        submission = await Submission.create({
          assignment: assignment._id,
          student: req.user._id,
        });
      }

      if (assignment.submissionType === "group") {
        const group = await Group.findOne({
          assignment: assignment._id,
          members: req.user._id,
        });
        if (!group) {
          return res
            .status(400)
            .json({ message: "No group assigned for this assignment" });
        }
        submission.group = group._id;
      }

      submission.status = "submitted";
      submission.submittedAt = new Date();
      await submission.save();

      return res.json({ submission });
    } catch (error) {
      return next(error);
    }
  },
);

router.post(
  "/:id/acknowledge",
  protect,
  authorize("student"),
  async (req, res, next) => {
    try {
      const assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const studentSubmission = await Submission.findOne({
        assignment: assignment._id,
        student: req.user._id,
      });
      if (!studentSubmission) {
        return res
          .status(404)
          .json({ message: "Submission not found for this student" });
      }

      if (assignment.submissionType === "individual") {
        if (studentSubmission.status === "pending") {
          return res
            .status(400)
            .json({ message: "Submit assignment before acknowledgment" });
        }

        studentSubmission.status = "acknowledged";
        studentSubmission.acknowledgedAt = new Date();
        studentSubmission.acknowledgedBy = req.user._id;
        await studentSubmission.save();

        return res.json({
          submission: studentSubmission,
          reflectedForGroup: false,
        });
      }

      const group = await Group.findOne({
        assignment: assignment._id,
        members: req.user._id,
      });
      if (!group) {
        return res
          .status(400)
          .json({ message: "No group found for this assignment" });
      }

      if (String(group.leader) !== String(req.user._id)) {
        return res
          .status(403)
          .json({
            message: "Only group leader can acknowledge group submission",
          });
      }

      const groupSubmissions = await Submission.find({
        assignment: assignment._id,
        group: group._id,
      });
      const anySubmitted = groupSubmissions.some(
        (item) => item.status !== "pending",
      );

      if (!anySubmitted) {
        return res
          .status(400)
          .json({ message: "Group must submit before acknowledgment" });
      }

      await Submission.updateMany(
        { assignment: assignment._id, group: group._id },
        {
          status: "acknowledged",
          acknowledgedAt: new Date(),
          acknowledgedBy: req.user._id,
        },
      );

      const updated = await Submission.find({
        assignment: assignment._id,
        group: group._id,
      });
      return res.json({ submissions: updated, reflectedForGroup: true });
    } catch (error) {
      return next(error);
    }
  },
);

module.exports = router;
