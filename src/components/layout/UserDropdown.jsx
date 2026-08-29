import { useEffect, useRef, useState } from "react";
import { User, LogOut } from "lucide-react";
import { ROLE_COLORS } from "../../utilities/constants";

const UserDropdown = ({
  username = "Admin",
  roleLabel = "Member",
  role = "user",
  onProfile,
  onLogout,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const getInitials = (name = "") => {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
  };

  const avatarColor = (ROLE_COLORS[role] || ROLE_COLORS.user).avatar;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleProfileClick = () => {
    setOpen(false);
    onProfile?.();
  };

  const handleLogoutClick = () => {
    setOpen(false);
    onLogout?.();
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white transition-colors ${avatarColor}`}
      >
        {getInitials(username)}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="px-4 py-2.5">
            <h3 className="truncate text-sm font-semibold text-gray-900">
              {username}
            </h3>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
          <div className="py-1">
            <button
              type="button"
              onClick={handleProfileClick}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
            >
              <User size={16} />
              <span>My Profile</span>
            </button>
          </div>
          <div className="py-1">
            <button
              type="button"
              onClick={handleLogoutClick}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
