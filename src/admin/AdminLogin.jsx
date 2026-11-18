import "../css/Adminlogin.css"




import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const changeHandler = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const loginHandler = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch(
`${import.meta.env.VITE_API_URL}/api/auth/login`,        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.message || "Login failed"
        );
        return;
      }

      localStorage.setItem(
        "adminToken",
        data.token
      );

      localStorage.setItem(
        "admin",
        JSON.stringify(data.admin)
      );

      toast.success("Login successful");

      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 800);

    } catch (error) {
      console.error(error);

      toast.error("Unable to login");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">

      <div className="admin-login-box">

        <div className="admin-login-header">

          <span>
            DOCTOR PANEL
          </span>

          <h1>
            Welcome Back
          </h1>

          <p>
            Login to manage appointments and clinic timings.
          </p>

        </div>

        <form onSubmit={loginHandler}>

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={changeHandler}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={changeHandler}
            required
          />
        <a
  href="/admin/forgot-password"
  className="forgot-password-link"
>
  Forgot Password?
</a>
          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "LOGIN..."
              : "LOGIN"}
          </button>

        </form>

      </div>

    </div>
  );
};

export default AdminLogin;