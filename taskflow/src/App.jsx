import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import AddTask from "./pages/AddTask";
import Toast from "./components/Toast";
import { fetchTasks } from "./api/tasks";

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true); // show spinner while fetching

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("taskflow-dark") === "true";
  });

  const [toasts, setToasts] = useState([]);

  // Load tasks from MongoDB when app starts
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const res = await fetchTasks();
        setTasks(res.data); // res.data is the array from our API
      } catch (err) {
        addToast("Failed to load tasks. Is the server running?", "error");
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, []); // empty [] = run once on mount

  // Dark mode
  useEffect(() => {
    localStorage.setItem("taskflow-dark", darkMode);
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3000
    );
  };

  const removeToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <BrowserRouter>
      <div className={darkMode ? "dark" : ""}>
        <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0f0f0e] transition-colors duration-300">
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  tasks={tasks}
                  setTasks={setTasks}
                  addToast={addToast}
                  loading={loading}
                />
              }
            />
            <Route
              path="/add"
              element={<AddTask setTasks={setTasks} addToast={addToast} />}
            />
            <Route
              path="/edit/:id"
              element={
                <AddTask
                  setTasks={setTasks}
                  tasks={tasks}
                  addToast={addToast}
                  isEdit
                />
              }
            />
          </Routes>
          <Toast toasts={toasts} removeToast={removeToast} />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
