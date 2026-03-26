// models/Task.js
// A "Model" tells MongoDB what shape your data has.
// Think of it like a blueprint for every task stored in the database.

const mongoose = require("mongoose");

// Schema = the structure/shape of one task document
const taskSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Task title is required"], // validation
      trim: true, // removes extra spaces
    },
    completed: {
      type: Boolean,
      default: false, // new tasks start as not completed
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"], // only these 3 values allowed
      default: "medium",
    },
    category: {
      type: String,
      default: "Work",
    },
    dueDate: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    // timestamps: true automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// Export the model so routes/tasks.js can use it
// "Task" becomes the collection name "tasks" in MongoDB
module.exports = mongoose.model("Task", taskSchema);