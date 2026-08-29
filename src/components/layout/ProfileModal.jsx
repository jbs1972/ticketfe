import { Mail, Shield } from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import useAuth from "../../hooks/useAuth";
import { ROLE_LABELS, ROLE_COLORS } from "../../utilities/constants";

const ProfileModal = ({ open, onClose }) => {
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const colors = ROLE_COLORS[user.role] || ROLE_COLORS.user;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      showCloseButton={false}
      bodyClassName="p-0"
    >
      <div className="overflow-hidden">
        {/* Banner */}
        <div
          className={`flex h-20 items-center justify-center ${colors.banner}`}
        >
          <div
            className={`mt-8 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white text-xl font-bold text-white ${colors.avatar}`}
          >
            {initials}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-10">
          <h2 className="text-center text-lg font-bold text-gray-900">
            {user.name}
          </h2>
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Mail size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gray-100 p-2">
                <Shield size={16} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className={`text-sm font-medium ${colors.text}`}>
                  {ROLE_LABELS[user.role] || "Member"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileModal;
