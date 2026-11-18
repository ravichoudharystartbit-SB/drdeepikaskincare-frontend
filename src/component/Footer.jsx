import "../css/Footer.css"

import React from "react";
import { NavLink } from "react-router-dom";
import logo from "../assets/dr-deepika-logo-cropped.png";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Brand */}
        <div className="footer-brand">
          <div className="logo2">
            <img src={logo} alt="Dr Deepika Skin & Hair Clinic" />
          </div>

          <p className="brand-text">
            Personalized skin & hair care with
            <br />
            advanced treatments, expert guidance, and
            <br />
            care you can trust
          </p>

          <div className="contact-item">
            <span className="contact-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 2.5a7 7 0 0 0-7 7c0 5.2 7 12 7 12s7-6.8 7-12a7 7 0 0 0-7-7Z" />
                <circle cx="12" cy="9.5" r="2.2" />
              </svg>
            </span>

            <span style={{ letterSpacing: "0.5px", lineHeight: "1.5" }}>
              D-1, Pawanpuri, Main Market, Nagnechi Ji
              <br />
              Scheme, Bikaner, Rajasthan 334003
            </span>
          </div>

          <div className="contact-item">
            <span className="contact-icon">
              <svg viewBox="0 0 24 24">
                <path d="M6.6 2.8l3.1 3.1-2 2a13.5 13.5 0 0 0 8.4 8.4l2-2 3.1 3.1-1.8 1.8c-.7.7-1.7 1-2.7.7C9.9 17.9 6.1 14.1 4.1 7.3c-.3-1 .1-2 .7-2.7l1.8-1.8Z" />
              </svg>
            </span>

            <span>+91 9950461493</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-column">
          <h3>Quick links</h3>

          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "footer-link active" : "footer-link"
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive ? "footer-link active" : "footer-link"
            }
          >
            About Us
          </NavLink>

          <NavLink
            to="/services"
            className={({ isActive }) =>
              isActive ? "footer-link active" : "footer-link"
            }
          >
            Services
          </NavLink>

          <NavLink
            to="/appointment"
            className={({ isActive }) =>
              isActive ? "footer-link active" : "footer-link"
            }
          >
            Appointment
          </NavLink>
           <NavLink
            to="/pages/contact"
            className={({ isActive }) =>
              isActive ? "footer-link active" : "footer-link"
            }
          >
            Contact
          </NavLink>
        </div>

      {/* Helpful Links */}
<div className="footer-column">
  <h3>Helpful links</h3>

  <NavLink
    to="/appointment"
    className={({ isActive }) =>
      isActive ? "footer-link active" : "footer-link"
    }
  >
    Book Appointment
  </NavLink>

  <NavLink
    to="/contact"
    className={({ isActive }) =>
      isActive ? "footer-link active" : "footer-link"
    }
  >
    Contact Us
  </NavLink>

  <a
    href="https://www.youtube.com/@dr_deepika.skincare"
    target="_blank"
    rel="noopener noreferrer"
    className="footer-link"
  >
    YouTube
  </a>

  <a
    href="https://www.instagram.com/dr_deepika.skincare"
    target="_blank"
    rel="noopener noreferrer"
    className="footer-link"
  >
    Instagram
  </a>

  <a
    href="https://www.facebook.com/drdeepikasinghbikaner/"
    target="_blank"
    rel="noopener noreferrer"
    className="footer-link"
  >
    Facebook
  </a>
</div>

        {/* Timing */}
        <div className="footer-column footer-hours">
          <h3>Clinic Hours</h3>

          <div className="clinic-time-row">
            <span className="clinic-day">Monday - Saturday :</span>

            <div className="clinic-timings">
              <div>
                <span className="clock-icon">◉</span>
                <span>10:30 AM - 1:00 PM</span>
              </div>

              <div>
                <span className="clock-icon">◉</span>
                <span>3:00 PM - 7:30 PM</span>
              </div>
            </div>
          </div>

          <div className="clinic-time-row">
            <span className="clinic-day">Sunday :</span>

            <div className="clinic-timings">
              <div>
                <span className="clock-icon">◉</span>
                <span>10:30 AM - 1:00 PM</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Footer */}
      <div className="footer-bottom">

        <div className="copyright">
          <p>
            © 2026 Dr. Deepika Skin & Hair Clinic. All rights reserved.
          </p>
<p className="footer-policy">
  <NavLink to="/privacy-policy" className="footer-link">Privacy Policy</NavLink>
  {" | "}
  <NavLink to="/terms-and-conditions" className="footer-link">Terms &amp; Conditions</NavLink>
  {" | "}
  <NavLink to="/refund-policy" className="footer-link">Refund &amp; Cancellation Policy</NavLink>
</p>
        </div>

        {/* Social Icons */}
        <div className="social-icons">

          {/* Instagram */}
          <a
            href="https://www.instagram.com/dr_deepika.skincare?igsi=bXdhY2ltanhtM296&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            title="Instagram"
          >
            <svg viewBox="0 0 24 24">
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="12"
                r="4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle
                cx="17.5"
                cy="6.5"
                r="1.2"
                fill="currentColor"
              />
            </svg>
          </a>

          {/* Facebook */}
          <a
            href="https://www.facebook.com/drdeepikasinghbikaner/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            title="Facebook"
          >
            <svg viewBox="0 0 24 24">
              <path
                d="M14 21v-8h2.7l.4-3H14V8.1c0-.9.3-1.5 1.6-1.5h1.7V4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.3-3.8 3.9V10H9v3h2.3v8H14Z"
                fill="currentColor"
              />
            </svg>
          </a>

          {/* Google Maps */}
          <a
            href="https://share.google/BP9rV5C6MPijIotRq"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Google Maps"
            title="Google Maps"
          >
            <svg viewBox="0 0 24 24">
              <path
                d="M12 21s7-6.1 7-12A7 7 0 1 0 5 9c0 5.9 7 12 7 12Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="9"
                r="2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </a>

          {/* YouTube */}
          <a
            href="https://www.youtube.com/@dr_deepika.skincare"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            title="YouTube"
          >
            <svg viewBox="0 0 24 24">
              <path
                d="M21.5 7.2c-.2-.9-.9-1.6-1.8-1.8C18.1 5 12 5 12 5s-6.1 0-7.7.4c-.9.2-1.6.9-1.8 1.8C2.1 8.8 2.1 12 2.1 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8C5.9 19 12 19 12 19s6.1 0 7.7-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M10 9v6l5-3-5-3Z"
                fill="currentColor"
              />
            </svg>
          </a>

        </div>

      </div>
    </footer>
  );
};

export default Footer;