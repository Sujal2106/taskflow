import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const Navbar = ({ darkMode, setDarkMode }) => {
  const location = useLocation();

  const linkClass = (path) =>
    `text-sm px-3 py-1.5 rounded-lg transition-all duration-200 ${
      location.pathname === path
        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium"
        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
    }`;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-[#fafaf9]/80 dark:bg-[#0f0f0e]/80 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-800/60"
    >
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-neutral-900 dark:bg-white rounded-md flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white dark:text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
            TaskFlow
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/" className={linkClass("/")}>Home</Link>
          <Link to="/add" className={linkClass("/add")}>Add Task</Link>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="ml-2 w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200 text-sm"
            title="Toggle dark mode"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
