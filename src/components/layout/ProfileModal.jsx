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
      title=""
      closeOnOutside={true}
      showCloseButton={false}
      bodyClassName="p-0"
    >
      <div className="overflow-hidden rounded-t-2xl">
        {/* Banner */}
        <div
          className={`flex h-28 items-center justify-center ${colors.banner}`}
        >
          <div
            className={`mt-14 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white text-3xl font-bold text-white ${colors.avatar}`}
          >
            {initials}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pt-16 pb-8">
          <h2 className="text-center text-2xl font-bold">{user.name}</h2>

          <div className="mt-8 space-y-5">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <Mail size={20} className="text-green-600" />
              </div>

              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-100 p-3">
                <Shield size={20} className="text-purple-600" />
              </div>

              <div>
                <p className="text-xs text-gray-500">Role</p>

                <p className={`font-medium ${colors.text}`}>
                  {ROLE_LABELS[user.role] || "Member"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
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
