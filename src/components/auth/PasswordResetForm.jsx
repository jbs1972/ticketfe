import { Mail, Send } from "lucide-react";

import Button from "../common/Button";
import InputBox from "../common/InputBox";

const PasswordResetForm = ({ email, loading, onChange, onSubmit }) => {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <InputBox
        label="Email Address"
        type="email"
        name="email"
        value={email}
        onChange={onChange}
        leftIcon={<Mail size={18} />}
        placeholder="Enter your registered email"
        required
      />

      <Button
        type="submit"
        loading={loading}
        loadingText="Sending..."
        fullWidth
        leftIcon={<Send size={18} />}
      >
        Send OTP
      </Button>
    </form>
  );
};

export default PasswordResetForm;
