import { useMemo, useState } from "react";
import { LockKeyhole, KeyRound } from "lucide-react";
import Button from "../common/Button";
import InputBox from "../common/InputBox";
import { handleEnterNavigation } from "../../utilities/ticketHelpers";

const PASSWORD_RULES = {
  minLength: 6,
  maxLength: 20,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /\d/,
  special: /[#@$]/,
};

const NewPasswordForm = ({ formData, loading = false, onChange, onSubmit }) => {
  const [touched, setTouched] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  const errors = useMemo(() => {
    const validationErrors = {};
    const password = formData.newPassword?.trim() || "";
    if (password.length === 0) {
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
    const confirmPassword = formData.confirmPassword?.trim() || "";
    if (confirmPassword.length === 0) {
      validationErrors.confirmPassword = "Confirm password is required.";
    } else if (confirmPassword !== password) {
      validationErrors.confirmPassword = "Passwords do not match.";
    }
    return validationErrors;
  }, [formData]);

  const isFormValid = Object.keys(errors).length === 0;

  const handleInputChange = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    onChange(event);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched({
      newPassword: true,
      confirmPassword: true,
    });
    if (!isFormValid) {
      return;
    }
    onSubmit(event);
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="space-y-5"
      onKeyDown={handleEnterNavigation}
    >
      <div className="text-center">
        <KeyRound size={40} className="mx-auto mb-2 text-blue-600" />
        <p className="text-sm text-gray-500">
          Choose a strong password for your account.
        </p>
      </div>
      <InputBox
        label="New Password"
        name="newPassword"
        type="password"
        value={formData.newPassword}
        onChange={handleInputChange}
        leftIcon={<LockKeyhole size={16} />}
        placeholder="Enter new password"
        error={touched.newPassword ? errors.newPassword : ""}
      />
      <InputBox
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleInputChange}
        leftIcon={<LockKeyhole size={16} />}
        placeholder="Confirm new password"
        error={touched.confirmPassword ? errors.confirmPassword : ""}
      />
      <Button
        type="submit"
        fullWidth
        loading={loading}
        loadingText="Updating..."
      >
        Update Password
      </Button>
    </form>
  );
};

export default NewPasswordForm;
