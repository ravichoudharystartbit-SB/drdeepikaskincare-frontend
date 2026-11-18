
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ScrollToTop from "./component/ScrollToTop";
import ScrollProgress from "./component/ScrollProgress";

import Home from "./pages/Home";
import About from "./pages/About";
import Navbar from "./component/Navbar";
import Footer from "./component/Footer";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import Appointment from "./pages/Appointment";

import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import ForgotPassword from "./admin/ForgotPassword";

import { PrivacyPolicy, TermsAndConditions, RefundPolicy } from "./pages/Policies";

const loadGoogleTranslate = () => {
  if (window.google?.translate) {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: "en,hi,mr,pa,gu,bn,ta,te",
        autoDisplay: false,
      },
      "google_translate_element"
    );

    return;
  }

  window.googleTranslateElementInit = () => {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: "en,hi,mr,pa,gu,bn,ta,te",
        autoDisplay: false,
      },
      "google_translate_element"
    );
  };

  if (!document.querySelector("#google-translate-script")) {
    const script = document.createElement("script");

    script.id = "google-translate-script";
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;

    document.body.appendChild(script);
  }
};

function App() {
useEffect(() => {
  loadGoogleTranslate();
}, []);

  return (
    <BrowserRouter>
<div id="google_translate_element"></div>

      <Navbar />
   <ScrollProgress />
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/about" element={<About />} />

     

        <Route
          path="/pages/contact"
          element={<Contact />}
        />


        <Route path="/services" element={<Services />} />

        <Route
          path="/appointment"
          element={<Appointment />}
        />

        <Route
          path="/pages/admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/admin/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />


<Route path="/privacy-policy" element={<PrivacyPolicy />} />
<Route path="/terms-and-conditions" element={<TermsAndConditions />} />
<Route path="/refund-policy" element={<RefundPolicy />} />



        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>

<ToastContainer
  position="top-right"
  autoClose={2000}
  closeOnClick
  pauseOnHover
  limit={2}
/>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
