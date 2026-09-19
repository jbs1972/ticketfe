import { ROLE_LABELS, APP_LOGO_URL } from "./utilities/constants";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import UserDropdown from "./components/layout/UserDropdown";
import ProfileModal from "./components/layout/ProfileModal";
import ConfirmDialog from "./components/common/ConfirmDialog";
import useAuth from "./hooks/useAuth";
import { toastSuccess, toastMention } from "./utilities/toast";
import EnvBadge from "./components/common/EnvBadge";
import socket from "./services/socket";

const PUBLIC_ROUTES = ["/login"];

const CONFIGURE_ITEMS = [
  { tab: "statuses", label: "Ticket Statuses" },
  { tab: "priorities", label: "Ticket Priority" },
];

const Header = () => {
  const { user, isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [configureOpen, setConfigureOpen] = useState(false);
  const configureRef = useRef(null);

  useEffect(() => {
    const handleMention = ({ ticketCode, commentId, authorName }) => {
      toastMention(
        "You were tagged",
        `${authorName} mentioned you in ticket ${ticketCode}. Click to view.`,
        () => navigate(`/tickets/${ticketCode}#comment-${commentId}`),
      );
    };
    socket.on("comment:mentioned", handleMention);
    return () => socket.off("comment:mentioned", handleMention);
  }, [navigate]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (configureRef.current && !configureRef.current.contains(e.target)) {
        setConfigureOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (location.pathname !== "/configure") setConfigureOpen(false);
  }, [location.pathname]);

  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

  const handleLogout = () => setIsLogoutDialogOpen(true);

  const handleConfirmLogout = async () => {
    setIsLogoutDialogOpen(false);
    await logoutUser();
    toastSuccess("Logged Out", "You have been logged out successfully.");
    navigate("/login", { replace: true });
  };

  const navClass = ({ isActive }) =>
    `relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
      isActive ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
    }`;

  const configureActive = location.pathname === "/configure";

  return (
    <>
      <header className="sticky top-3 z-40 mx-3 mt-3 rounded-xl border border-gray-200/80 bg-gray-100 px-5 py-2.5 shadow-sm">
        {isPublicRoute ? (
          <div className="flex items-center gap-3">
            <img
              src={APP_LOGO_URL}
              alt="TaskFlow Logo"
              className="h-12 w-12 rounded-full"
            />
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-gray-900">
                TaskFlow
              </h1>
              <EnvBadge />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={APP_LOGO_URL}
                alt="TaskFlow Logo"
                className="h-12 w-12 rounded-full"
              />
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl font-bold text-gray-900">
                  TaskFlow
                </h1>
                <EnvBadge />
              </div>
            </div>

            {isAuthenticated && (
              <>
                <nav className="flex items-center gap-6">
                  <NavLink end to="/dashboard" className={navClass}>
                    {({ isActive }) => (
                      <span
                        className={`border-b-2 pb-1 ${
                          isActive ? "border-blue-600" : "border-transparent"
                        }`}
                      >
                        Dashboard
                      </span>
                    )}
                  </NavLink>
                  {user?.role === "superadmin" && (
                    <NavLink to="/companies" className={navClass}>
                      {({ isActive }) => (
                        <span
                          className={`border-b-2 pb-1 ${
                            isActive ? "border-blue-600" : "border-transparent"
                          }`}
                        >
                          Company
                        </span>
                      )}
                    </NavLink>
                  )}
                  {(user?.role === "admin" || user?.role === "superadmin") && (
                    <NavLink to="/users" className={navClass}>
                      {({ isActive }) => (
                        <span
                          className={`border-b-2 pb-1 ${
                            isActive ? "border-blue-600" : "border-transparent"
                          }`}
                        >
                          Users
                        </span>
                      )}
                    </NavLink>
                  )}
                  {(user?.role === "admin" || user?.role === "superadmin") && (
                    <NavLink to="/projects" className={navClass}>
                      {({ isActive }) => (
                        <span
                          className={`border-b-2 pb-1 ${
                            isActive ? "border-blue-600" : "border-transparent"
                          }`}
                        >
                          Project
                        </span>
                      )}
                    </NavLink>
                  )}
                  {(user?.role === "admin" || user?.role === "superadmin") && (
                    <div className="relative" ref={configureRef}>
                      <button
                        type="button"
                        onClick={() => setConfigureOpen((o) => !o)}
                        className={navClass({ isActive: configureActive })}
                      >
                        <span
                          className={`border-b-2 pb-1 ${
                            configureActive
                              ? "border-blue-600"
                              : "border-transparent"
                          }`}
                        >
                          Configure ▾
                        </span>
                      </button>
                      {configureOpen && (
                        <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                          {CONFIGURE_ITEMS.map((item) => (
                            <button
                              key={item.tab}
                              type="button"
                              onClick={() => {
                                setConfigureOpen(false);
                                navigate(`/configure?tab=${item.tab}`);
                              }}
                              className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-blue-600"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <NavLink to="/tickets" className={navClass}>
                    {({ isActive }) => (
                      <span
                        className={`border-b-2 pb-1 ${
                          isActive ? "border-blue-600" : "border-transparent"
                        }`}
                      >
                        Tickets
                      </span>
                    )}
                  </NavLink>
                </nav>
                <UserDropdown
                  username={user?.name}
                  roleLabel={ROLE_LABELS[user?.role] || "Member"}
                  role={user?.role}
                  onProfile={() => setIsProfileOpen(true)}
                  onLogout={handleLogout}
                />
              </>
            )}
          </div>
        )}
      </header>

      <ProfileModal
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <ConfirmDialog
        open={isLogoutDialogOpen}
        title="Logout"
        message="Are you sure you want to logout?"
        type="logout"
        confirmText="Logout"
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />
    </>
  );
};

export default Header;
