import { ROLE_LABELS } from "./utilities/constants";
import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { APP_LOGO_URL } from "./utilities/constants";

import UserDropdown from "./components/layout/UserDropdown";
import ProfileModal from "./components/layout/ProfileModal";
import ConfirmDialog from "./components/common/ConfirmDialog";

import useAuth from "./hooks/useAuth";
import { toastSuccess } from "./utilities/toast";
import EnvBadge from "./components/common/EnvBadge";

const PUBLIC_ROUTES = ["/login"];

const Header = () => {
  const { user, isAuthenticated, logoutUser } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

  const handleLogout = () => {
    setIsLogoutDialogOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLogoutDialogOpen(false);

    await logoutUser();

    toastSuccess("Logged Out", "You have been logged out successfully.");

    navigate("/login", { replace: true });
  };

  const navClass = ({ isActive }) =>
    `relative px-3 py-2 text-base font-medium transition-colors duration-200 ${
      isActive ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
    }`;

  return (
    <>
      <header className="sticky top-3 z-40 mx-3 mt-3 rounded-xl bg-gray-100 px-8 py-3">
        {isPublicRoute ? (
          <div className="flex items-center justify-between">
            <img
              src={APP_LOGO_URL}
              alt="TaskFlow Logo"
              className="h-12 w-12 rounded-full"
            />

            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-serif font-bold text-black">
                TaskFlow
              </h1>
              <EnvBadge />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={APP_LOGO_URL}
                alt="TaskFlow Logo"
                className="h-12 w-12 rounded-full"
              />

              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-serif font-bold text-black">
                  TaskFlow
                </h1>
                <EnvBadge />
              </div>
            </div>

            {isAuthenticated && (
              <>
                <nav className="flex items-center gap-8">
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

                  {user?.role === "admin" && (
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

                  {user?.role === "admin" && (
                    <NavLink to="/configure" className={navClass}>
                      {({ isActive }) => (
                        <span
                          className={`border-b-2 pb-1 ${
                            isActive ? "border-blue-600" : "border-transparent"
                          }`}
                        >
                          Configure
                        </span>
                      )}
                    </NavLink>
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
