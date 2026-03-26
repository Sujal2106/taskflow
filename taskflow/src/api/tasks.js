// src/api/tasks.js
// This file is the bridge between your React app and your Express backend.
// Instead of calling fetch() everywhere, we keep all API calls here.
// This makes it easy to change the URL or add auth later in one place.

const BASE_URL = "http://localhost:5000/api/tasks";

// Helper: handles fetch + error checking in one place
async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await response.json();

  // If the server returned an error status, throw it so we can catch it
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

// ─── API functions ────────────────────────────────────────────────────────────

// Fetch all tasks from MongoDB
export const fetchTasks = () => request(BASE_URL);

// Create a new task
// taskData = { text, category, priority, dueDate, notes }
export const createTask = (taskData) =>
  request(BASE_URL, {
    method: "POST",
    body: JSON.stringify(taskData),
  });

// Update an existing task by its MongoDB _id
// updates = any fields you want to change e.g. { completed: true }
export const updateTask = (id, updates) =>
  request(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });

// Delete a task by its MongoDB _id
export const deleteTask = (id) =>
  request(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });