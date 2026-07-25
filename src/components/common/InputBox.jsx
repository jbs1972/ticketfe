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

  return (
    <div className={`space-y-1 ${className}`}>
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
          <div
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-gray-400
            "
          >
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
          disabled={disabled}
          required={required}
          className={`
            w-full
            rounded-lg
            border
            bg-white
            py-2.5
            text-gray-800
            outline-none
            transition-all
            duration-200

            ${leftIcon ? "pl-11" : "pl-4"}

            ${type === "password" ? "pr-11" : error ? "pr-10" : "pr-4"}

            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            }

            disabled:bg-gray-100
            disabled:cursor-not-allowed
          `}
          {...props}
        />

        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              text-gray-500
            "
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}

        {type !== "password" && error && (
          <CircleAlert
            size={18}
            className="
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              text-red-500
            "
          />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <CircleAlert size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default InputBox;
