import { Eye, EyeOff, CircleAlert } from "lucide-react";
import { useState } from "react";

const InputBox = ({
  label,
  id,
  name,
  type = "text",
  value,
  placeholder = "",
  onChange,
  onBlur,
  required = false,
  disabled = false,
  error = "",
  leftIcon,
  className = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType =
    type === "password" ? (showPassword ? "text" : "password") : type;

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.target.form;
      if (form) {
        const elements = Array.from(form.elements).filter(
          (el) =>
            !el.disabled && el.offsetParent !== null && el.tagName !== "BUTTON",
        );
        const index = elements.indexOf(e.target);
        if (index > -1 && index < elements.length - 1) {
          elements[index + 1].focus();
        }
      }
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id || name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          id={id || name}
          name={name}
          type={inputType}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
          className={`
            w-full rounded-lg border bg-white py-2.5 text-sm text-gray-900 outline-none
            transition-all duration-200 placeholder:text-gray-400
            ${leftIcon ? "pl-11" : "pl-4"}
            ${type === "password" ? "pr-11" : error ? "pr-10" : "pr-4"}
            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            }
            disabled:bg-gray-100 disabled:cursor-not-allowed
          `}
          {...props}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {type !== "password" && error && (
          <CircleAlert
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500"
          />
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-500">
          <CircleAlert size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default InputBox;
