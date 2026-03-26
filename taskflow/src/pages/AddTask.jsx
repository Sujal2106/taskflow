import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { createTask, updateTask } from "../api/tasks";

const CATEGORIES = ["Work", "Personal", "Study", "Health", "Shopping", "Other"];

const AddTask = ({ setTasks, tasks = [], addToast, isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    text: "",
    category: "Work",
    priority: "medium",
    dueDate: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false); // prevent double submit

  // Pre-fill form when editing
  useEffect(() => {
    if (isEdit && id && tasks.length) {
      const task = tasks.find((t) => t._id === id); // MongoDB uses _id
      if (task) {
        setForm({
          text: task.text || "",
          category: task.category || "Work",
          priority: task.priority || "medium",
          dueDate: task.dueDate || "",
          notes: task.notes || "",
        });
      }
    }
  }, [isEdit, id, tasks]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name])
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.text.trim()) e.text = "Task title is required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }

    setSubmitting(true); // show loading state on button

    try {
      if (isEdit) {
        // PUT /api/tasks/:id — update in MongoDB
        const res = await updateTask(id, {
          ...form,
          text: form.text.trim(),
          notes: form.notes.trim(),
        });

        // Update local state so UI reflects change immediately
        setTasks((prev) =>
          prev.map((t) => (t._id === id ? res.data : t))
        );
        addToast("Task updated!", "success");

      } else {
        // POST /api/tasks — save to MongoDB
        const res = await createTask({
          ...form,
          text: form.text.trim(),
          notes: form.notes.trim(),
        });

        // Add the saved task (with _id) to local state
        setTasks((prev) => [res.data, ...prev]);
        addToast("✓ Task added successfully!", "success");
      }

      navigate("/");

    } catch (err) {
      // Show the error from the server as a toast
      addToast(err.message || "Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white dark:bg-neutral-800/60 dark:text-neutral-100 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-all duration-200 ${
      errors[field]
        ? "border-red-400 dark:border-red-500"
        : "border-neutral-200 dark:border-neutral-700"
    }`;

  return (
    <div className="max-w-lg mx-auto px-4 pt-10 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-8 shadow-sm"
      >
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            {isEdit ? "Edit task" : "New task"}
          </h1>
          <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
            {isEdit
              ? "Update the details below."
              : "Fill in the details to create your task."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="text"
              value={form.text}
              onChange={handleChange}
              placeholder="What needs to be done?"
              autoFocus
              className={inputClass("text")}
            />
            {errors.text && (
              <p className="mt-1.5 text-xs text-red-400">{errors.text}</p>
            )}
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className={inputClass()}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className={inputClass()}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
              Due date{" "}
              <span className="text-neutral-400 font-normal normal-case">
                (optional)
              </span>
            </label>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              className={inputClass()}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
              Notes{" "}
              <span className="text-neutral-400 font-normal normal-case">
                (optional)
              </span>
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any extra details..."
              rows={3}
              className={`${inputClass()} resize-none`}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-all duration-200 shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {isEdit ? "Saving..." : "Adding..."}
                </>
              ) : (
                isEdit ? "Save changes" : "Add task"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddTask;
