import {
  LayoutDashboardIcon,
  UsersIcon,
  CalendarDaysIcon,
  Wand2Icon,
  LogOutIcon,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const Sidebar = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const { logout, user } = {
    logout: () => {
      window.location.href = "/";
    },
    user: { name: "Gopal Mahajan", email: "gopalmahajan3392@gmail.com" },
  };

  const location = useLocation();

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboardIcon, path: "/dashboard" },
    { name: "Accounts", icon: UsersIcon, path: "/accounts" },
    { name: "Scheduler", icon: CalendarDaysIcon, path: "/schedule" },
    { name: "AI Composer", icon: Wand2Icon, path: "/ai-composer" },
  ];
  return (
    <div
      className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-white border-r border-slate-200 md:static md:inset-auto md:translate-x-0 transition-transform duration-300 ease-in-out transform ${
        isOpen
          ? "translate-x-0"
          : "-translate-x-full invisible pointer-events-none md:visible md:pointer-events-auto"
      }`}
    >
      {/* logo */}
      <div className="p-6 pb-4">
        <div className="text-xl tracking-tight text-slate-800 flex items-center gap-1.5 ">
          <img src="/logo.svg" alt="Logo" className="h-6 w-auto" />
          <span className="">Social Scheduler</span>
        </div>
      </div>

      {/* nav section label */}
      <div className="px-6 py-2 text-xs uppercase tracking-wider text-slate-400">
        Menu
      </div>

      {/* nav Links */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/dashboard"}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-150 border ${
                isActive
                  ? "bg-rose-50 text-rose-500 border-rose-100"
                  : "text-slate-500 hover:bg-slate-50 border-transparent hover:text-slate-700"
              }`}
            >
              <item.icon
                className={`size-4.5 shrink-0 ${isActive ? "text-red-500" : "text-slate-500"}`}
              />
              {item.name}
              {isActive && (
                <span className="ml-auto w-[5px] h-5 rounded-full bg-red-500" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* user footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="size-8 rounded-full bg-linear-to-br from-red-400 to-pink-400 flex items-center justify-center text-white text-sm font-medium shrink-0">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm text-slate-800 truncate">{user.name}</div>
            <div className="text-xs text-slate-400 truncate">{user.email}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-1 flex items-center gap-2 px-3 py-2 w-full rounded text-sm text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all duration-150"
        >
          <LogOutIcon className="size-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
