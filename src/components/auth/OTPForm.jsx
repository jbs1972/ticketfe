import { useEffect, useRef, useState } from "react";
import { ShieldCheck, RotateCw } from "lucide-react";

import Button from "../common/Button";

const OTPForm = ({
  otpLength = 6,
  loading = false,
  resendLoading = false,
  onVerify,
  onResend,
}) => {
  const [otp, setOtp] = useState(Array(otpLength).fill(""));
  const [countdown, setCountdown] = useState(30);

  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown === 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (value && index < otpLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < otpLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, otpLength)
      .split("");

    const updatedOtp = Array(otpLength).fill("");

    pasted.forEach((digit, index) => {
      updatedOtp[index] = digit;
    });

    setOtp(updatedOtp);

    inputRefs.current[Math.min(pasted.length, otpLength - 1)]?.focus();
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onVerify?.(otp.join(""));
  };

  const handleResend = async () => {
    if (countdown !== 0 || resendLoading) return;

    const success = await onResend?.();

    if (!success) return;

    setOtp(Array(otpLength).fill(""));
    setCountdown(30);

    inputRefs.current[0]?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <ShieldCheck size={52} className="mx-auto mb-3 text-blue-600" />

        <h2 className="text-xl font-semibold">OTP Verification</h2>

        <p className="mt-2 text-sm text-gray-500">
          Enter the verification code sent to your email.
        </p>
      </div>

      <div
        className="flex items-center justify-between gap-2"
        onPaste={handlePaste}
      >
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(element) => (inputRefs.current[index] = element)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(event) => handleChange(event.target.value, index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className="
              h-12
              w-12
              flex-shrink-0
              rounded-lg
              border
            border-gray-300
              text-center
              text-lg
              font-semibold
              outline-none
              transition
            focus:border-blue-500
              focus:ring-2
            focus:ring-blue-200
            "
          />
        ))}
      </div>

      <Button
        type="submit"
        fullWidth
        loading={loading}
        loadingText="Verifying..."
        disabled={!otp.every(Boolean)}
      >
        Verify OTP
      </Button>

      <div className="text-center">
        {countdown > 0 ? (
          <p className="text-sm text-gray-500">
            Resend OTP in <span className="font-semibold">{countdown}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="
        inline-flex
        items-center
        gap-2
        text-blue-600
        hover:text-blue-800
        disabled:opacity-60
      "
          >
            <RotateCw
              size={16}
              className={resendLoading ? "animate-spin" : ""}
            />

            {resendLoading ? "Resending..." : "Resend OTP"}
          </button>
        )}
      </div>
    </form>
  );
};

export default OTPForm;
