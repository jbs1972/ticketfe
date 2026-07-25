import { useState } from "react";

import Modal from "../common/Modal";

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

const AuthModal = ({ open, onClose }) => {
  const { loginUser } = useAuth();

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

  const handleLoginChange = (event) => {
    const { name, value, type, checked } = event.target;

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

      onClose?.();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Invalid email or password.";

      setLoginError(message);

      toastError(
        "Login failed",
        error?.response?.data?.message || "Invalid email or password.",
      );
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
        "OTP sent successfully.",
        "Please check your email for the OTP.",
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
      toastSuccess("OTP verified successfully.");

      setCurrentStep(AUTH_STEPS.NEW_PASSWORD);
    } catch (error) {
      toastError(error?.response?.data?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResendLoading(true);

      await sendOtp(email);

      toastSuccess(
        "OTP sent successfully.",
        "Please check your email for the OTP.",
      );

      return true;
    } catch (error) {
      toastError(
        "Failed to send OTP",
        error?.response?.data?.message || "Failed to resend OTP.",
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
        "Password Updated.",
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

      setCurrentStep(AUTH_STEPS.LOGIN);
    } catch (error) {
      toastError(error?.response?.data?.message || "Password reset failed.");
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

  const handleClose = () => {
    setCurrentStep(AUTH_STEPS.LOGIN);

    setEmail("");
    setVerifiedOtp("");

    setPasswordData({
      newPassword: "",
      confirmPassword: "",
    });

    onClose?.();
  };

  return (
    <Modal open={open} onClose={handleClose} title={getTitle()} size="md">
      {currentStep === AUTH_STEPS.LOGIN && (
        <LoginForm
          formData={loginData}
          loading={loading}
          error={loginError}
          onChange={handleLoginChange}
          onSubmit={handleLoginSubmit}
          onForgotPassword={() => setCurrentStep(AUTH_STEPS.PASSWORD_RESET)}
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
    </Modal>
  );
};

export default AuthModal;
