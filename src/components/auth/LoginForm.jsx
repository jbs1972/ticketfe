import {
  User,
  Lock,
  LogIn,
  KeyRound,
  XCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import Button from "../common/Button";
import InputBox from "../common/InputBox";

const LoginForm = ({
  formData,
  loading,
  error,
  inactiveAccount,
  onChange,
  onSubmit,
  onForgotPassword,
  onDismissInactive,
}) => {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {inactiveAccount && (
        <div className="relative flex items-start gap-3 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-3">
          <AlertTriangle
            size={18}
            className="mt-0.5 flex-shrink-0 text-amber-500"
          />
          <div className="pr-5">
            <p className="text-sm font-semibold text-gray-800">
              Account Deactivated
            </p>
            <p className="mt-0.5 text-xs text-gray-600">
              Your account has been frozen. Please contact your administrator
              for assistance.
            </p>
          </div>
          <button
            type="button"
            onClick={onDismissInactive}
            className="absolute right-2 top-2 text-gray-400 transition hover:text-gray-600"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <InputBox
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={onChange}
        leftIcon={<User size={16} />}
        placeholder="Enter your email"
        autoComplete="email"
        required
      />
      <InputBox
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={onChange}
        leftIcon={<Lock size={16} />}
        placeholder="Enter your password"
        autoComplete="current-password"
        required
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={onChange}
            className="h-4 w-4 rounded accent-blue-600"
          />
          Remember Me
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="flex items-center gap-1 text-sm text-blue-600 transition hover:text-blue-800"
        >
          <KeyRound size={14} />
          Forgot Password?
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <XCircle size={16} className="flex-shrink-0 text-red-600" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}
      <Button
        type="submit"
        loading={loading}
        loadingText="Logging in..."
        fullWidth
        leftIcon={<LogIn size={16} />}
      >
        Login
      </Button>
    </form>
  );
};

export default LoginForm;
