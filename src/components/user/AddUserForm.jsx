import { useEffect, useState } from "react";
import { User, Mail, Lock } from "lucide-react";
import InputBox from "../common/InputBox";
import Button from "../common/Button";
import { createUser } from "../../services/user.service";
import { getToken } from "../../utilities/tokenStorage";
import { toastError, toastSuccess } from "../../utilities/toast";
import useAuth from "../../hooks/useAuth";
import { ROLE_LABELS } from "../../utilities/constants";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "user",
};

const initialErrors = {
  name: "",
  email: "",
  password: "",
};

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const PASSWORD_RULES = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /\d/,
  special: /[#@$]/,
};

const AddUserForm = ({ onSuccess, onCancel }) => {
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState(initialErrors);
  const [loading, setLoading] = useState(false);

  // Any Admin can assign Admin role
  const canAssignAdmin = currentUser?.role === "admin";

  useEffect(() => {
    setForm(initialForm);
    setErrors(initialErrors);
  }, []);

  const validate = () => {
    const validationErrors = {
      name: "",
      email: "",
      password: "",
    };
    if (!form.name.trim()) {
      validationErrors.name = "Full name is required.";
    }
    if (!form.email.trim()) {
      validationErrors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(form.email)) {
      validationErrors.email = "Enter a valid email address.";
    }
    const password = form.password;
    if (password.length === 0) {
      validationErrors.password = "Password is required.";
    } else if (password.length < 6) {
      validationErrors.password = "Password must be at least 6 characters.";
    } else if (password.length > 20) {
      validationErrors.password = "Password must not exceed 20 characters.";
    } else if (!PASSWORD_RULES.uppercase.test(password)) {
      validationErrors.password =
        "Password must contain at least one uppercase letter.";
    } else if (!PASSWORD_RULES.lowercase.test(password)) {
      validationErrors.password =
        "Password must contain at least one lowercase letter.";
    } else if (!PASSWORD_RULES.number.test(password)) {
      validationErrors.password = "Password must contain at least one number.";
    } else if (!PASSWORD_RULES.special.test(password)) {
      validationErrors.password =
        "Password must contain at least one special character (#, @ or $).";
    }
    setErrors(validationErrors);
    return !Object.values(validationErrors).some(Boolean);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    try {
      setLoading(true);
      const token = getToken();
      await createUser(form, token);
      toastSuccess("User Created", "User registered successfully.");
      setForm(initialForm);
      setErrors(initialErrors);
      onSuccess?.();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Unable to create user.";
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes("email")) {
        setErrors((prev) => ({
          ...prev,
          email: message,
        }));
        return;
      }
      if (lowerMessage.includes("password")) {
        setErrors((prev) => ({
          ...prev,
          password: message,
        }));
        return;
      }
      if (lowerMessage.includes("name")) {
        setErrors((prev) => ({
          ...prev,
          name: message,
        }));
        return;
      }
      toastError("Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputBox
        label="Full Name"
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Enter full name"
        leftIcon={<User size={16} />}
        error={errors.name}
        required
      />
      <InputBox
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Enter email"
        leftIcon={<Mail size={16} />}
        error={errors.email}
        required
      />
      <InputBox
        label="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Enter password"
        leftIcon={<Lock size={16} />}
        error={errors.password}
        required
      />
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Role</label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="user">{ROLE_LABELS.user}</option>
          {canAssignAdmin && <option value="admin">{ROLE_LABELS.admin}</option>}
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          loadingText="Creating..."
        >
          Create User
        </Button>
      </div>
    </form>
  );
};

export default AddUserForm;
