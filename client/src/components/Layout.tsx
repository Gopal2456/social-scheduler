import { useState } from "react";

import Sidebar from "./Sidebar";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import { MenuIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/accounts": "Social Accounts",
  "/schedule": "Post Scheduler",
  "/ai-composer": "AI Composer",
};

const Layout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  const location = useLocation();

  const title = pageTitles[location.pathname] || "Social Media Dashboard";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="size-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent"/>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* top bar */}
        <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-2 sm:px-6 lg:px-8">
          <button
            className="text-slate-500 py-3 focus:outline-none md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={
              isMobileMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={isMobileMenuOpen}
          >
            <MenuIcon className="h-6 w-6" />
          </button>

          <div>
            <h1 className="text-lg text-slate-800">{title}</h1>

            <p className="text-sm hidden sm:block text-slate-500">
              Manage and automate your social media posts
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 xl:p-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
