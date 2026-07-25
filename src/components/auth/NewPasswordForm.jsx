import { useMemo } from "react";
import { LockKeyhole, ShieldCheck, CircleCheck, CircleX } from "lucide-react";

import Button from "../common/Button";
import InputBox from "../common/InputBox";

const PASSWORD_RULES = {
  minLength: 6,
  maxLength: 20,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /\d/,
  special: /[!@#$%^&*(),.?":{}|<>]/,
};

const NewPasswordForm = ({ formData, loading = false, onChange, onSubmit }) => {
  const passwordChecks = useMemo(() => {
    const password = formData.newPassword || "";

    return {
      minLength: password.length >= PASSWORD_RULES.minLength,
      maxLength: password.length <= PASSWORD_RULES.maxLength,
      uppercase: PASSWORD_RULES.uppercase.test(password),
      lowercase: PASSWORD_RULES.lowercase.test(password),
      number: PASSWORD_RULES.number.test(password),
      special: PASSWORD_RULES.special.test(password),
    };
  }, [formData.newPassword]);

  const errors = useMemo(() => {
    const validationErrors = {};

    if (formData.newPassword && !passwordChecks.minLength) {
      validationErrors.newPassword = "New password is required.";
    } else {
      if (!passwordChecks.minLength)
        validationErrors.newPassword =
          "Password must be at least 6 characters.";
      else if (!passwordChecks.maxLength)
        validationErrors.newPassword = "Password cannot exceed 20 characters.";
      else if (!passwordChecks.uppercase)
        validationErrors.newPassword =
          "Password must contain at least one uppercase letter.";
      else if (!passwordChecks.lowercase)
        validationErrors.newPassword =
          "Password must contain at least one lowercase letter.";
      else if (!passwordChecks.number)
        validationErrors.newPassword =
          "Password must contain at least one number.";
      else if (!passwordChecks.special)
        validationErrors.newPassword =
          "Password must contain at least one special character.";
    }

    if (!formData.confirmPassword) {
      validationErrors.confirmPassword = "Confirm password is required.";
    } else if (formData.confirmPassword !== formData.newPassword) {
      validationErrors.confirmPassword = "Passwords do not match.";
    }

    return validationErrors;
  }, [formData, passwordChecks]);

  const isFormValid = Object.keys(errors).length === 0;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!isFormValid) return;

    onSubmit(event);
  };

  const Requirement = ({ passed, text }) => (
    <div
      className={`flex items-center gap-2 text-sm ${
        passed ? "text-green-600" : "text-gray-500"
      }`}
    >
      {passed ? <CircleCheck size={16} /> : <CircleX size={16} />}

      <span>{text}</span>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <ShieldCheck size={52} className="mx-auto mb-3 text-green-600" />

        <h2 className="text-xl font-semibold text-gray-800">
          Create New Password
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Choose a strong password for your account.
        </p>
      </div>

      <InputBox
        label="New Password"
        name="newPassword"
        type="password"
        value={formData.newPassword}
        onChange={onChange}
        leftIcon={<LockKeyhole size={18} />}
        placeholder="Enter new password"
        error={errors.newPassword}
        required
      />

      <InputBox
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={onChange}
        leftIcon={<LockKeyhole size={18} />}
        placeholder="Confirm new password"
        error={errors.confirmPassword}
        required
      />

      <Button type="submit" fullWidth loading={loading} 
      loadingText="Updating..."
      disabled={!isFormValid}>
        Update Password
      </Button>
    </form>
  );
};

export default NewPasswordForm;
