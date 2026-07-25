import { useEffect, useState } from "react";

import { APP_LOGO_URL } from "./utilities/constants";

import AuthModal from "./components/auth/AuthModal";
import UserDropdown from "./components/layout/UserDropdown";

import useAuth from "./hooks/useAuth";
import ConfirmDialog from "./components/common/ConfirmDialog";
import { toastSuccess } from "./utilities/toast";

const Header = () => {
  const { user, isAuthenticated, loading, logoutUser } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsAuthModalOpen(!isAuthenticated);
    }
  }, [loading, isAuthenticated]);

  const handleLogout = () => {
    setIsLogoutDialogOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLogoutDialogOpen(false);

    await logoutUser();

    toastSuccess("Logged Out", "You have been logged out successfully.");

    setIsAuthModalOpen(true);
  };

  return (
    <>
      <header className="mx-3 mt-3 rounded-xl bg-gray-100 px-8 py-3">
        <div className="flex items-center justify-between">
          <img
            src={APP_LOGO_URL}
            alt="TaskFlow Logo"
            className="h-12 w-12 rounded-full"
          />

          <h1 className="text-2xl font-serif font-bold text-black">TaskFlow</h1>

          {isAuthenticated ? (
            <UserDropdown
              username={user?.name}
              role={user?.isAdmin ? "Administrator" : "User"}
              onProfile={() => {
                console.log("Profile");
              }}
              onLogout={handleLogout}
            />
          ) : (
            <div className="w-12" />
          )}
        </div>
      </header>

      <AuthModal
        open={isAuthModalOpen}
        onClose={() => {
          if (isAuthenticated) {
            setIsAuthModalOpen(false);
          }
        }}
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
