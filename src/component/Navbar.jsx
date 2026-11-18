import "../css/Navbar.css";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import logo from "../assets/dr-deepika-logo-cropped.png";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
    setPagesOpen(false);
    setLanguageOpen(false);
    window.scrollTo(0, 0);
  };

  const changeLanguage = (language) => {
    let attempts = 0;

    const tryTranslate = () => {
      const select = document.querySelector(".goog-te-combo");

      if (select) {
        select.value = language;

        select.dispatchEvent(
          new Event("change", {
            bubbles: true,
          })
        );

        setLanguageOpen(false);
        return;
      }

      attempts++;

      if (attempts < 20) {
        setTimeout(tryTranslate, 300);
      } else {
        console.error(`Failed to find Google Translate select element after ${attempts} attempts.`);
      }
    };

    tryTranslate();
  };

  return (
    <header className="navbar">
      <div className="navbar-container">

        <NavLink
          to="/"
          className="logo"
          onClick={closeMenu}
        >
          <img
            src={logo}
            alt="Dr Deepika Skin & Hair Clinic"
          />
        </NavLink>

        <div className="language-dropdown notranslate" translate="no">

          <button
  className="language-button notranslate"
  translate="no"
  onClick={() => setLanguageOpen(!languageOpen)}
>
            🌐 English
            <span
              className={`language-arrow ${
                languageOpen ? "open" : ""
              }`}
            ></span>
          </button>

          {languageOpen && (
            <div className="language-menu notranslate" translate="no">

              <button onClick={() => changeLanguage("en")}>
                English
              </button>

              <button onClick={() => changeLanguage("hi")}>
                हिन्दी
              </button>

              <button onClick={() => changeLanguage("mr")}>
                मराठी
              </button>

              <button onClick={() => changeLanguage("pa")}>
                ਪੰਜਾਬੀ
              </button>

              <button onClick={() => changeLanguage("gu")}>
                ગુજરાતી
              </button>

              <button onClick={() => changeLanguage("bn")}>
                বাংলা
              </button>

              <button onClick={() => changeLanguage("ta")}>
                தமிழ்
              </button>

              <button onClick={() => changeLanguage("te")}>
                తెలుగు
              </button>

            </div>
          )}

        </div>

        <button
          className={`menu-toggle ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`nav-menu ${menuOpen ? "show" : ""}`}>

          <NavLink
            to="/"
            end
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            HOME
          </NavLink>
             <NavLink
            to="/services"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            SERVICES
          </NavLink>
    <NavLink
                to="/pages/contact"
                onClick={closeMenu}
                className={({ isActive }) =>
                  isActive ? "active" : ""
                }
              >
                CONTACT
              </NavLink>
       

          <div
            className={`pages-dropdown ${
              pagesOpen ? "open" : ""
            }`}
          >
            <button
              className="pages-main-link"
              onClick={() => setPagesOpen(!pagesOpen)}
            >
              PAGES
              <span className="pages-arrow"></span>
            </button>

            <div className="pages-menu">

             
          

              <NavLink
                to="/appointment"
                onClick={closeMenu}
                className={({ isActive }) =>
                  isActive ? "active" : ""
                }
              >
                 CONSULTATION
              </NavLink>

              <NavLink
                to="/pages/admin/login"
                onClick={closeMenu}
                className={({ isActive }) =>
                  isActive ? "active" : ""
                }
              >
                ADMIN LOGIN
              </NavLink>

            </div>
          </div>

          <NavLink
            to="/about"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            ABOUT US
          </NavLink>

         

          <NavLink
            to="/appointment"
            className={({ isActive }) =>
              `mobile-contact ${isActive ? "active" : ""}`
            }
            onClick={closeMenu}
          >
            Appointment
          </NavLink>

        </nav>

        <NavLink
          to="/appointment"
          className={({ isActive }) =>
            `contact-btn ${isActive ? "active" : ""}`
          }
          onClick={closeMenu}
        >
          Consultation ➜ 
        </NavLink>

      </div>
    </header>
  );
}

export default Navbar;