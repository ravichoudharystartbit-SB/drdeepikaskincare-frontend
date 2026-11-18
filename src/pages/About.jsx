
import "../css/About.css"

import about1 from "../assets/ABOUT1.png";
import about2 from "../assets/ABOUT2.png";
import about3 from "../assets/ABOUT3.png";
import about4 from "../assets/ABOUT4.png";
import about5 from "../assets/ABOUT5.png";
import about6 from "../assets/ABOUT6.png";
import about7 from "../assets/ABOUT7.png";
import about8 from "../assets/ABOUT8.png";
import about9 from "../assets/ABOUT9.png";
import about10 from "../assets/ABOUT10.png";
import about11 from "../assets/ABOUT11.png";
import about12 from "../assets/ABOUT12.png";


import { Link } from "react-router-dom";
const About = () => {
  return (<>
    <section className="about-section">
      {/* Decorative leaf */}
      <div className="leaf-decoration">
        <span className="leaf leaf-one"></span>
        <span className="leaf leaf-two"></span>
        <span className="leaf leaf-three"></span>
        <span className="leaf-stem"></span>
      </div>

      <div className="about-container">
        {/* Left content */}
        <div className="about-content">
          <span className="about-label">ABOUT US</span>

          <h1>
            Glowvie skin &amp; beauty
          </h1>

          <p>
            Our expert team is dedicated to providing top-quality
            <br className="desktop-break" />
            services that leave you feeling confident, refreshed, and
            <br className="desktop-break" />
            glowing.
          </p>
        </div>

        {/* Right images */}
        <div className="about-images">

          {/* Main image */}
          <div className="image-card image-card-main">
            <img
 src={about1}              alt="Skincare"
            />
          </div>

          {/* Secondary image */}
          <div className="image-card image-card-secondary">
            <img
              src={about2}
              alt="Beauty"
            />
          </div>

          {/* Decorative flower */}
          <div className="flower">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <i></i>
          </div>

          {/* Connecting lines */}
          <div className="connecting-lines">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      {/* Bottom geometric decoration */}
      <div className="bottom-lines">
        <span className="line line-1"></span>
        <span className="line line-2"></span>
        <span className="line line-3"></span>
        <span className="line line-4"></span>
        
      </div>
    </section>



<section className="about-intro">
      <div className="about-intro-container">

        {/* PURPOSE CARD */}
        <div className="purpose-card about-card">
          <div className="purpose-pattern"></div>

          <div className="purpose-content">
            <h2>Our purpose</h2>

            <p>
              We are dedicated to offering the highest level of skincare
              services, focusing on long-term health and beauty.
            </p>
          </div>
        </div>

        {/* MISSION CARD */}
        <div className="mission-card about-card">
          <div className="mission-content">
            <h2>Our mission</h2>

            <p>
              our mission is to empower individuals by enhancing their
              natural beauty through expert skincare treatments.
            </p>
          </div>
        </div>

      </div>
    </section>

<section className="about-gallery">
  <div className="about-gallery-container">

    <div className="gallery-image gallery-left">
      <img
        src={about3}
        alt="Skincare treatment"
      />
    </div>

    <div className="gallery-image gallery-center">
      <img
        src={about4}
        alt="Skincare beauty"
      />
    </div>

    <div className="gallery-image gallery-right">
      <img
        src={about5}
        alt="Facial treatment"
      />
    </div>

  </div>
</section>

<section className="excellence-section">
  <div className="excellence-card">

    <div className="excellence-top">

      <div className="excellence-content">
        <span className="excellence-eyebrow">
          THE GLOWVIE DIFFERENCE
        </span>

        <h2>
          Experience true<br />
          skincare excellence
        </h2>

        <p>
          We set ourselves apart by offering personalized
          treatments that focus on the unique needs of your
          skin.
        </p>

        <p>
          Our commitment to natural, skin-friendly products
          ensures that every treatment promotes both beauty
          and long-term health.
        </p>

      </div>

      <div className="excellence-images">
        <div className="main-face">
          <img
            src={about6}
            alt="Skincare"
          />
        </div>

        <div className="beauty-woman">
          <img
            src={about7}
            alt="Skincare specialist"
          />
        </div>
      </div>

    </div>

    <div className="excellence-divider"></div>

    <div className="values-row">

      <div className="values-title">
        <h3>
  Glowvie <br />
  core values
</h3>
      </div>

      <div className="value-item">

        <div className="value-icon">
          <svg viewBox="0 0 24 24">
            <path d="M7 12c-2 0-4 1.5-4 4v2h18v-2c0-2.5-2-4-4-4h-2l-1-2H10l-1 2H7Z" />
            <circle cx="12" cy="7" r="3" />
          </svg>
        </div>

        <h4>Personalized care</h4>

        <p>
          Tailored treatments designed
          to meet your unique skincare
          needs for radiant, healthy skin.
        </p>

      </div>

      <div className="value-item">

        <div className="value-icon">
          <svg viewBox="0 0 24 24">
            <rect x="5" y="3" width="14" height="18" rx="1" />
            <path d="M8 7h8M8 11h8M8 15h5" />
          </svg>
        </div>

        <h4>Natural products</h4>

        <p>
          We use skin-friendly, eco-
          conscious products that
          promote long-lasting beauty.
        </p>

      </div>

      <div className="value-item">

        <div className="value-icon">
          <svg viewBox="0 0 24 24">
            <path d="M5 17h14M7 17v-3M12 17v-6M17 17v-9" />
            <path d="m7 10 1-2 1 2M12 7l1-2 1 2M17 4l1-2 1 2" />
          </svg>
        </div>

        <h4>Expert techniques</h4>

        <p>
          Advanced methods combined
          with years of experience to
          deliver exceptional care.
        </p>

      </div>

    </div>

  </div>
</section>
<section className="team-section">
  <div className="team-header">
    <span className="team-label">SKINCARE EXPERT</span>
    <h2>Meet our doctor</h2>
    <p>
      Expert care, personal attention, and results
      <br />
      you can trust, all from one dedicated specialist.
    </p>
  </div>

  <div className="doctor-card">
    <div className="doctor-image">
      <img src={about8} alt="Dr. Deepika" />
      <span className="doctor-badge">Skin Specialist</span>
    </div>

    <div className="doctor-info">
      <span className="doctor-eyebrow">FOUNDER &amp; LEAD DOCTOR</span>
      <h3>Dr. Deepika</h3>
      <span className="doctor-role">Dermatologist &amp; Skincare Expert</span>

      <p>
        With years of experience in skincare and aesthetics, Dr. Deepika
        personally guides every treatment plan, focusing on healthy,
        long-lasting and natural-looking results.
      </p>

      <div className="doctor-stats">
        <div>
          <strong>10+</strong>
          <span>Years experience</span>
        </div>
        <div>
          <strong>15000+</strong>
          <span>Happy clients</span>
        </div>
        <div>
          <strong>100%</strong>
          <span>Personalized care</span>
        </div>
      </div>

      <div className="doctor-actions">
        <Link to="/appointment" className="doctor-btn">
          BOOK A CONSULTATION
        </Link>
        <a
          href="https://www.instagram.com/dr_deepika.skincare/?hl=en"
          target="_blank"
          rel="noreferrer"
          className="doctor-link"
        >
          @dr_deepika.skincare
        </a>
      </div>
    </div>
  </div>
</section>
<section className="expert-banner">
  <div className="expert-content">

    <div className="expert-icon">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      
    </div>

    <h2>
      The experts in skincare{" "}
      <a href="https://www.instagram.com/dr_deepika.skincare/?hl=en">@dr_deepika.skincare</a>
    </h2>

  </div>
</section>



{/* last part */}
<br />




<section className="revitalize-section">
  <div className="revitalize-box">

    <div className="revitalize-decoration decoration-left">
      ~ ~ ~ ~
    </div>

    <div className="revitalize-left">
      <img
        src={about11}
        alt="Skincare treatment"
      />
    </div>

    <div className="revitalize-content">
      <h2>
        Ready to revitalize
        <br />
        your skin?
      </h2>

      <p>
        Take the first step toward radiant beauty with
        <br />
        our expert skincare treatments.
      </p>

      <Link to="/pages/contact"  className="excellence-btn">
        
          <span>✆</span>
          BOOK A CALL
      </Link>
    </div>

    <div className="revitalize-right">
      <img
        src={about12}
        alt="Skincare beauty"
      />
    </div>

    <div className="revitalize-decoration decoration-right">
      ~ ~ ~ ~
    </div>

    <div className="revitalize-leaf">
      <span></span>
      <span></span>
      <span></span>
    </div>

  </div>
</section>
    
  </>);
};

export default About;