import { useEffect, useRef, useState } from "react";
import { User, LogOut } from "lucide-react";

const UserDropdown = ({
  username = "Admin",
  role = "Administrator",
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

  const avatarColor =
    role.toLowerCase() === "administrator"
      ? "bg-violet-600 hover:bg-violet-700"
      : "bg-blue-600 hover:bg-blue-700";

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => document.removeEventListener("mousedown", handleOutsideClick);
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
      {/* Avatar */}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`
          h-10
          w-10
          rounded-full
          flex
          items-center
          justify-center
          text-sm
          font-semibold
          text-white
          transition-colors
          ${avatarColor}
        `}
      >
        {getInitials(username)}
      </button>

      {/* Dropdown */}

      {open && (
        <div
          className="
            absolute
            right-0
            mt-2
            w-56
            overflow-hidden
            rounded-xl
            border
            border-gray-200
            bg-white
            shadow-lg
            divide-y
            divide-gray-200
            z-50
          "
        >
          {/* User */}

          <div className="px-4 py-3">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {username}
            </h3>

            <p className="text-xs text-gray-500">{role}</p>
          </div>

          {/* Menu */}

          <div className="py-1">
            <button
              type="button"
              onClick={handleProfileClick}
              className="
                flex
                w-full
                items-center
                gap-3
                px-4
                py-2.5
                text-sm
                text-gray-700
                transition-colors
                hover:bg-gray-100
              "
            >
              <User size={18} />

              <span>My Profile</span>
            </button>
          </div>

          {/* Logout */}

          <div className="py-1">
            <button
              type="button"
              onClick={handleLogoutClick}
              className="
                flex
                w-full
                items-center
                gap-3
                px-4
                py-2.5
                text-sm
                text-red-600
                transition-colors
                hover:bg-red-50
              "
            >
              <LogOut size={18} />

              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
