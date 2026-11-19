require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// -------------------------
// Middleware
// -------------------------
app.use(cors());
app.use(express.json());

// -------------------------
// Root Route
// -------------------------
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Task Management API is running successfully",
  });
});

// -------------------------
// MongoDB URI
// -------------------------
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is missing.");
  process.exit(1);
}

// -------------------------
// Safe MongoDB URI Check
// Password will NOT be printed
// -------------------------
try {
  const uriAfterProtocol = MONGODB_URI.split("://")[1];

  if (!uriAfterProtocol) {
    throw new Error("Invalid MongoDB URI");
  }

  const mongoUsername = uriAfterProtocol.split(":")[0];

  console.log("✅ MongoDB URI found");
  console.log("MongoDB username:", mongoUsername);
} catch (error) {
  console.error("❌ Invalid MongoDB URI format.");
  process.exit(1);
}

// -------------------------
// Task Schema
// -------------------------
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Ongoing", "Completed"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model("Task", taskSchema);

// -------------------------
// GET - Fetch All Tasks
// -------------------------
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({
      createdAt: -1,
    });

    res.status(200).json(tasks);
  } catch (err) {
    console.error("Fetch error:", err);

    res.status(500).json({
      message: "Could not fetch tasks.",
    });
  }
});

// -------------------------
// POST - Create Task
// -------------------------
app.post("/tasks", async (req, res) => {
  try {
    const { title } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required.",
      });
    }

    const newTask = new Task({
      title: title.trim(),
      status: "Pending",
    });

    const savedTask = await newTask.save();

    res.status(201).json(savedTask);
  } catch (err) {
    console.error("Create error:", err);

    res.status(500).json({
      message: "Could not create task.",
    });
  }
});

// -------------------------
// PATCH - Update Task Status
// -------------------------
app.patch("/tasks/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "Pending",
      "Ongoing",
      "Completed",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid task status.",
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedTask) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    console.error("Update error:", err);

    res.status(500).json({
      message: "Could not update task.",
    });
  }
});

// -------------------------
// DELETE - Delete Task
// -------------------------
app.delete("/tasks/:id", async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(
      req.params.id
    );

    if (!deletedTask) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    res.status(200).json({
      message: "Task deleted successfully.",
    });
  } catch (err) {
    console.error("Delete error:", err);

    res.status(500).json({
      message: "Could not delete task.",
    });
  }
});

// -------------------------
// MongoDB Connection
// + Start Server
// -------------------------
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Atlas connected successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);

      console.log(
        `🌐 Local API: http://localhost:${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });