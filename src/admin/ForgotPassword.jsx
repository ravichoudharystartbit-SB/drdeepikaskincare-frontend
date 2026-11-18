import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);


  const sendOTP = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Unable to send OTP");
        return;
      }

      toast.success("OTP sent to your email");

      setStep(2);
    } catch (error) {
      console.error("SEND OTP ERROR:", error);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };


  const verifyOTP = async (e) => {
    e.preventDefault();

    if (!otp) {
      toast.error("Please enter OTP");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/verify-forgot-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Invalid OTP");
        return;
      }

      toast.success("OTP verified successfully");

      setStep(3);
    } catch (error) {
      console.error("VERIFY OTP ERROR:", error);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill both password fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Unable to reset password");
        return;
      }

      toast.success("Password reset successfully");

      setTimeout(() => {
        navigate("/admin/login");
      }, 1000);
    } catch (error) {
      console.error("RESET PASSWORD ERROR:", error);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">

      <div className="forgot-password-card">

        <div className="forgot-password-header">

          <h1>
            Forgot Password
          </h1>

          <p>
            Reset your admin account password
          </p>

        </div>


        {/* ==================================================
            STEP 1 - EMAIL
        ================================================== */}

        {step === 1 && (
          <form onSubmit={sendOTP}>

            <label>
              Admin Email
            </label>

            <input
              type="email"
              placeholder="Enter your admin email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Sending..."
                : "Send OTP"}
            </button>

          </form>
        )}


        {/* ==================================================
            STEP 2 - OTP
        ================================================== */}

        {step === 2 && (
          <form onSubmit={verifyOTP}>

            <label>
              Enter OTP
            </label>

            <input
              type="text"
              placeholder="Enter 6 digit OTP"
              value={otp}
              maxLength="6"
              onChange={(e) =>
                setOtp(
                  e.target.value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
              required
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Verifying..."
                : "Verify OTP"}
            </button>

            <button
              type="button"
              className="back-btn"
              onClick={() => setStep(1)}
            >
              Change Email
            </button>

          </form>
        )}


        {/* ==================================================
            STEP 3 - NEW PASSWORD
        ================================================== */}

        {step === 3 && (
          <form onSubmit={resetPassword}>

            <label>
              New Password
            </label>

            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
              required
            />

            <label>
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              required
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Updating..."
                : "Reset Password"}
            </button>

          </form>
        )}


        <button
          type="button"
          className="login-link-btn"
          onClick={() =>
            navigate("/admin/login")
          }
        >
          Back to Admin Login
        </button>

      </div>

    </div>
  );
};

export default ForgotPassword;