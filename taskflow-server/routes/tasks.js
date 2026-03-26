// routes/tasks.js
// This file defines all your API endpoints (URLs your React app can call).
//
// REST API cheatsheet:
//   GET    /api/tasks        → fetch all tasks
//   POST   /api/tasks        → create a new task
//   PUT    /api/tasks/:id    → update a task (by its id)
//   DELETE /api/tasks/:id    → delete a task (by its id)

const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tasks — Fetch all tasks
// React calls this when the page loads to get all saved tasks
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    // .find({}) = get ALL documents from the tasks collection
    // .sort({ createdAt: -1 }) = newest first
    const tasks = await Task.find({}).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tasks — Create a new task
// React sends task data in the request body, we save it to MongoDB
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    // req.body contains the data React sent (text, category, priority, etc.)
    const { text, category, priority, dueDate, notes } = req.body;

    // Create a new Task document using our schema
    const newTask = new Task({
      text,
      category,
      priority,
      dueDate,
      notes,
      completed: false,
    });

    // .save() writes it to MongoDB
    const savedTask = await newTask.save();

    // Send back the saved task (it now has an _id from MongoDB)
    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: savedTask,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create task",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/tasks/:id — Update a task
// :id is a URL parameter — e.g. /api/tasks/64abc123
// React sends the updated fields in req.body
// ─────────────────────────────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params; // extract the id from the URL

    // findByIdAndUpdate:
    //   1st arg = which document to find
    //   2nd arg = what to update (req.body has the new values)
    //   { new: true } = return the UPDATED document (not the old one)
    //   { runValidators: true } = run schema validation on update too
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update task",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/tasks/:id — Delete a task
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
});

module.exports = router;
