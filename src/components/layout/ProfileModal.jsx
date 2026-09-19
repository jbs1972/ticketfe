import { useState } from "react";
import { Mail, Shield, Lock } from "lucide-react";
import Modal from "../common/Modal";
import Button from "../common/Button";
import InputBox from "../common/InputBox";
import useAuth from "../../hooks/useAuth";
import { ROLE_LABELS, ROLE_COLORS } from "../../utilities/constants";
import { changeOwnPassword } from "../../services/user.service";
import { getToken } from "../../utilities/tokenStorage";
import { toastSuccess, toastError } from "../../utilities/toast";

const PASSWORD_RULES = {
  minLength: 6,
  maxLength: 20,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /\d/,
  special: /[#@$]/,
};

const ProfileModal = ({ open, onClose }) => {
  const { user } = useAuth();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const colors = ROLE_COLORS[user.role] || ROLE_COLORS.user;

  const resetPasswordForm = () => {
    setShowChangePassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleClose = () => {
    resetPasswordForm();
    onClose();
  };

  const validatePasswordChange = () => {
    const validationErrors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    if (!currentPassword.trim()) {
      validationErrors.currentPassword = "Current password is required.";
    }

    const password = newPassword.trim();

    if (!password) {
      validationErrors.newPassword = "New password is required.";
    } else if (password.length < PASSWORD_RULES.minLength) {
      validationErrors.newPassword = "Password must be at least 6 characters.";
    } else if (password.length > PASSWORD_RULES.maxLength) {
      validationErrors.newPassword = "Password must not exceed 20 characters.";
    } else if (!PASSWORD_RULES.uppercase.test(password)) {
      validationErrors.newPassword =
        "Password must contain at least one uppercase letter.";
    } else if (!PASSWORD_RULES.lowercase.test(password)) {
      validationErrors.newPassword =
        "Password must contain at least one lowercase letter.";
    } else if (!PASSWORD_RULES.number.test(password)) {
      validationErrors.newPassword =
        "Password must contain at least one number.";
    } else if (!PASSWORD_RULES.special.test(password)) {
      validationErrors.newPassword =
        "Password must contain at least one special character (#, @ or $).";
    }

    if (!confirmPassword.trim()) {
      validationErrors.confirmPassword = "Confirm password is required.";
    } else if (confirmPassword.trim() !== password) {
      validationErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(validationErrors);
    return !Object.values(validationErrors).some(Boolean);
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!validatePasswordChange()) {
      return;
    }

    try {
      setLoading(true);
      await changeOwnPassword(currentPassword, newPassword, getToken());
      toastSuccess("Password Updated", "Your password has been changed.");
      resetPasswordForm();
    } catch (error) {
      toastError(
        "Password Update Failed",
        error?.response?.data?.message || "Failed to change password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
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

          <div className="mt-6 border-t border-gray-200 pt-4">
            {!showChangePassword ? (
              <Button
                type="button"
                variant="secondary"
                fullWidth
                leftIcon={<Lock size={16} />}
                onClick={() => setShowChangePassword(true)}
              >
                Change Password
              </Button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <InputBox
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                    setErrors((prev) => ({ ...prev, currentPassword: "" }));
                  }}
                  placeholder="Enter current password"
                  error={errors.currentPassword}
                  required
                />

                <InputBox
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setErrors((prev) => ({ ...prev, newPassword: "" }));
                  }}
                  placeholder="Enter new password"
                  error={errors.newPassword}
                  required
                />

                <InputBox
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                  placeholder="Confirm new password"
                  error={errors.confirmPassword}
                  required
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={resetPasswordForm}
                    disabled={loading}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={loading}
                    loadingText="Updating..."
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileModal;
