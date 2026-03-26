import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { updateTask, deleteTask } from "../api/tasks";

const PRIORITY_CONFIG = {
  high: {
    label: "High",
    badge: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  },
  medium: {
    label: "Medium",
    badge: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  low: {
    label: "Low",
    badge: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function getDueInfo(dueDate) {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const diff = Math.ceil((due - today) / 86400000);
  if (diff < 0) return { label: `Overdue ${Math.abs(diff)}d`, urgent: true };
  if (diff === 0) return { label: "Due today", urgent: true };
  if (diff === 1) return { label: "Due tomorrow", urgent: false };
  return {
    label: due.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    urgent: false,
  };
}

// Loading skeleton shown while tasks are being fetched
const Skeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
      />
    ))}
  </div>
);

const EmptyState = ({ hasFilters }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-24 px-4 text-center"
  >
    <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-5">
      {hasFilters ? (
        <svg className="w-7 h-7 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.65 16.65 7.5 7.5 0 0016.65 16.65z" />
        </svg>
      ) : (
        <svg className="w-7 h-7 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )}
    </div>
    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
      {hasFilters ? "No tasks match your filters" : "No tasks yet"}
    </p>
    <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-1">
      {hasFilters
        ? "Try adjusting your search or filters"
        : "Add your first task to get started"}
    </p>
  </motion.div>
);

const Dashboard = ({ tasks, setTasks, addToast, loading }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterPri, setFilterPri] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState(null);
  const dragId = useRef(null);
  const dragOverId = useRef(null);

  // Toggle complete — calls PUT /api/tasks/:id
  const handleToggle = async (task) => {
    const newCompleted = !task.completed;

    // Optimistic update: update UI immediately, then confirm with server
    setTasks((prev) =>
      prev.map((t) =>
        t._id === task._id ? { ...t, completed: newCompleted } : t
      )
    );

    try {
      await updateTask(task._id, { completed: newCompleted });
      addToast(
        newCompleted ? "Task completed!" : "Marked incomplete",
        "success"
      );
    } catch (err) {
      // Revert if API call fails
      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id ? { ...t, completed: task.completed } : t
        )
      );
      addToast("Failed to update task", "error");
    }
  };

  // Delete — calls DELETE /api/tasks/:id
  const handleDelete = async (id) => {
    // Optimistic update: remove from UI immediately
    const prev = tasks;
    setTasks((p) => p.filter((t) => t._id !== id));

    try {
      await deleteTask(id);
      addToast("Task deleted", "delete");
    } catch (err) {
      setTasks(prev); // revert
      addToast("Failed to delete task", "error");
    }
  };

  const handleDragStart = (id) => { dragId.current = id; };
  const handleDragOver = (e, id) => { e.preventDefault(); dragOverId.current = id; };
  const handleDrop = () => {
    if (!dragId.current || dragId.current === dragOverId.current) return;
    setTasks((prev) => {
      const arr = [...prev];
      const from = arr.findIndex((t) => t._id === dragId.current);
      const to = arr.findIndex((t) => t._id === dragOverId.current);
      if (from < 0 || to < 0) return prev;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
    dragId.current = null;
    dragOverId.current = null;
  };

  const categories = [...new Set(tasks.map((t) => t.category).filter(Boolean))];

  let filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    return (
      (!q ||
        (t.text || "").toLowerCase().includes(q) ||
        (t.notes || "").toLowerCase().includes(q)) &&
      (!filterCat || t.category === filterCat) &&
      (!filterPri || t.priority === filterPri)
    );
  });

  if (sortBy === "priority") {
    filtered = [...filtered].sort(
      (a, b) =>
        (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
    );
  } else if (sortBy === "due") {
    filtered = [...filtered].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }

  const pending = filtered.filter((t) => !t.completed);
  const completed = filtered.filter((t) => t.completed);
  const hasFilters = !!search || !!filterCat || !!filterPri;

  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const highPriority = tasks.filter((t) => t.priority === "high" && !t.completed).length;
  const overdueCount = tasks.filter((t) => {
    if (!t.dueDate || t.completed) return false;
    return new Date(t.dueDate) < new Date().setHours(0, 0, 0, 0);
  }).length;

  const selectClass =
    "px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-900 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-all duration-200";

  const TaskCard = ({ task, index }) => {
    const due = getDueInfo(task.dueDate);
    const pri = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
    const isExpanded = expandedId === task._id;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -4 }}
        transition={{ duration: 0.22, delay: index * 0.03 }}
        draggable
        onDragStart={() => handleDragStart(task._id)}
        onDragOver={(e) => handleDragOver(e, task._id)}
        onDrop={handleDrop}
        className={`group bg-white dark:bg-neutral-900 border rounded-2xl px-5 py-4 transition-all duration-200 cursor-grab active:cursor-grabbing active:opacity-60 ${
          task.completed
            ? "border-neutral-100 dark:border-neutral-800/60 opacity-55"
            : "border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={() => handleToggle(task)}
            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
              task.completed
                ? "bg-neutral-900 dark:bg-neutral-100 border-neutral-900 dark:border-neutral-100"
                : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-500"
            }`}
          >
            <AnimatePresence>
              {task.completed && (
                <motion.svg
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="w-2.5 h-2.5 text-white dark:text-neutral-900"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </AnimatePresence>
          </button>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium leading-snug transition-all duration-200 ${
                task.completed
                  ? "line-through text-neutral-400 dark:text-neutral-600"
                  : "text-neutral-800 dark:text-neutral-100"
              }`}
            >
              {task.text}
            </p>

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {task.category && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                  {task.category}
                </span>
              )}
              {task.priority && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pri.badge}`}>
                  {pri.label}
                </span>
              )}
              {due && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    due.urgent
                      ? "border-red-200 text-red-500 dark:border-red-800 dark:text-red-400"
                      : "border-neutral-200 text-neutral-400 dark:border-neutral-700 dark:text-neutral-500"
                  }`}
                >
                  {due.label}
                </span>
              )}
              {task.notes && (
                <button
                  onClick={() => setExpandedId(isExpanded ? null : task._id)}
                  className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors underline underline-offset-2"
                >
                  {isExpanded ? "Hide notes" : "Notes"}
                </button>
              )}
            </div>

            <AnimatePresence>
              {isExpanded && task.notes && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2.5 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded-xl px-3 py-2.5 leading-relaxed overflow-hidden"
                >
                  {task.notes}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
            <button
              onClick={() => navigate(`/edit/${task._id}`)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-all duration-150"
              title="Edit"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(task._id)}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-all duration-150"
              title="Delete"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-24">
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-4 gap-3 mb-8"
      >
        {[
          { label: "Total", value: totalTasks },
          { label: "Done", value: completedCount },
          { label: "High", value: highPriority },
          { label: "Overdue", value: overdueCount },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-4 text-center"
          >
            <p className={`text-2xl font-semibold ${
              s.label === "Overdue" && s.value > 0
                ? "text-red-500"
                : "text-neutral-900 dark:text-neutral-100"
            }`}>
              {s.value}
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-0.5">
              {s.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="flex flex-wrap gap-2 mb-5"
      >
        <div className="relative flex-1 min-w-[160px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.65 16.65 7.5 7.5 0 0016.65 16.65z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm bg-white dark:bg-neutral-900 dark:text-neutral-200 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-all duration-200"
          />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className={selectClass}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterPri} onChange={(e) => setFilterPri(e.target.value)} className={selectClass}>
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectClass}>
          <option value="newest">Newest</option>
          <option value="priority">Priority</option>
          <option value="due">Due date</option>
        </select>
      </motion.div>

      {/* Task list or loading */}
      {loading ? (
        <Skeleton />
      ) : filtered.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {pending.map((task, i) => (
              <TaskCard key={task._id} task={task} index={i} />
            ))}
          </AnimatePresence>

          {completed.length > 0 && (
            <>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs font-medium text-neutral-400 dark:text-neutral-600 uppercase tracking-widest pt-5 pb-1"
              >
                Completed · {completed.length}
              </motion.p>
              <AnimatePresence mode="popLayout">
                {completed.map((task, i) => (
                  <TaskCard key={task._id} task={task} index={i} />
                ))}
              </AnimatePresence>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
