import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import LoginForm from "./LoginForm";
import PasswordResetForm from "./PasswordResetForm";
import OTPForm from "./OTPForm";
import NewPasswordForm from "./NewPasswordForm";

import useAuth from "../../hooks/useAuth";

import { sendOtp, verifyOtp, resetPassword } from "../../services/auth.service";

import { toastError, toastSuccess } from "../../utilities/toast";

import {
  saveRememberedEmail,
  getRememberedEmail,
  removeRememberedEmail,
} from "../../utilities/tokenStorage";

const AUTH_STEPS = {
  LOGIN: "login",
  PASSWORD_RESET: "passwordReset",
  OTP: "otp",
  NEW_PASSWORD: "newPassword",
};

const LoginPage = () => {
  const navigate = useNavigate();

  const { loginUser, isAuthenticated, loading: authLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(AUTH_STEPS.LOGIN);

  const [loading, setLoading] = useState(false);

  const [resendLoading, setResendLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    email: getRememberedEmail(),
    password: "",
    rememberMe: !!getRememberedEmail(),
  });

  const [email, setEmail] = useState("");

  const [verifiedOtp, setVerifiedOtp] = useState("");

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [loginError, setLoginError] = useState("");

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLoginChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (loginError) {
      setLoginError("");
    }

    setLoginData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    setLoginError("");

    try {
      setLoading(true);

      await loginUser({
        email: loginData.email,
        password: loginData.password,
      });

      if (loginData.rememberMe) {
        saveRememberedEmail(loginData.email);
      } else {
        removeRememberedEmail();
      }

      toastSuccess("Login successful", "Welcome back!");

      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message || "Invalid email or password.";

      setLoginError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);

      await sendOtp(email);

      toastSuccess(
        "OTP Sent",
        "An OTP has been sent to your email address.",
      );

      setCurrentStep(AUTH_STEPS.OTP);
    } catch (error) {
      toastError(
        "Failed to send OTP",
        error?.response?.data?.message || "Failed to send OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (otp) => {
    try {
      setLoading(true);

      await verifyOtp({
        email,
        otp,
      });

      setVerifiedOtp(otp);

      toastSuccess("OTP Verified", "Your OTP has been verified successfully.");

      setCurrentStep(AUTH_STEPS.NEW_PASSWORD);
    } catch (error) {
      toastError(
        "OTP Verification Failed",
        error?.response?.data?.message || "The OTP entered is invalid or has expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResendLoading(true);

      await sendOtp(email);

      toastSuccess(
        "OTP Resent",
        "A new OTP has been sent to your email address.",
      );

      return true;
    } catch (error) {
      toastError(
        "OTP Resend Failed",
        error?.response?.data?.message || "A new OTP could not be sent. Please try again.",
      );

      return false;
    } finally {
      setResendLoading(false);
    }
  };

  const handleNewPasswordSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);

      await resetPassword({
        email,
        otp: verifiedOtp,
        newPassword: passwordData.newPassword,
      });

      toastSuccess(
        "Password Updated",
        "Please log in with your new password.",
      );

      setPasswordData({
        newPassword: "",
        confirmPassword: "",
      });

      setLoginData({
        email: getRememberedEmail() || email,
        password: "",
        rememberMe: !!getRememberedEmail(),
      });

      setVerifiedOtp("");
      setEmail("");
      setLoginError("");

      setCurrentStep(AUTH_STEPS.LOGIN);
    } catch (error) {
      toastError(
        "Password Reset Failed",
        error?.response?.data?.message || "Could not reset your password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (currentStep) {
      case AUTH_STEPS.LOGIN:
        return "Sign In";

      case AUTH_STEPS.PASSWORD_RESET:
        return "Forgot Password";

      case AUTH_STEPS.OTP:
        return "OTP Verification";

      case AUTH_STEPS.NEW_PASSWORD:
        return "Reset Password";

      default:
        return "";
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-900">
          {getTitle()}
        </h2>

        {currentStep === AUTH_STEPS.LOGIN && (
          <LoginForm
            formData={loginData}
            loading={loading}
            error={loginError}
            onChange={handleLoginChange}
            onSubmit={handleLoginSubmit}
            onForgotPassword={() => {
              setLoginError("");
              setCurrentStep(AUTH_STEPS.PASSWORD_RESET);
            }}
          />
        )}

        {currentStep === AUTH_STEPS.PASSWORD_RESET && (
          <PasswordResetForm
            email={email}
            loading={loading}
            onChange={handleEmailChange}
            onSubmit={handlePasswordResetSubmit}
          />
        )}

        {currentStep === AUTH_STEPS.OTP && (
          <OTPForm
            loading={loading}
            resendLoading={resendLoading}
            onVerify={handleOTPVerify}
            onResend={handleResendOTP}
          />
        )}

        {currentStep === AUTH_STEPS.NEW_PASSWORD && (
          <NewPasswordForm
            formData={passwordData}
            loading={loading}
            onChange={handlePasswordChange}
            onSubmit={handleNewPasswordSubmit}
          />
        )}
      </div>
    </main>
  );
};

export default LoginPage;
