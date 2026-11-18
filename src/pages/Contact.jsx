import "../css/Contact.css"
import React, { useState } from "react";

import two from "../assets/two.png";
import three from "../assets/three.png";
import four from "../assets/four.png";

import { toast } from "react-toastify";

function Contact() {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };


  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setLoading(true);

    const response = await fetch(
`${import.meta.env.VITE_API_URL}/api/contact/message`,      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(formData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast.error(
        data.message || "Unable to send message"
      );

      return;
    }

    toast.success("Message sent successfully!");

    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });

  } catch (error) {

    console.error(error);

    toast.error("Server error");

  } finally {

    setLoading(false);

  }
};
  return (
    <>

      {/* ======================================================
          CONTACT HERO
      ====================================================== */}

      <section className="deepika-contact-hero">

        {/* Decorative leaf */}

        <div className="deepika-contact-leaf">
          <span></span>
          <span></span>
        </div>


        {/* Left Content */}

        <div className="deepika-contact-content">

          <p className="deepika-contact-label">
            CONTACT US
          </p>

          <h1>
            Get in touch
          </h1>

          <p className="deepika-contact-description">
            We value your feedback and inquiries. Whether
            <br />
            you have questions about our services.
          </p>

        </div>


        {/* Right Image */}

        <div className="deepika-contact-image">

          <div className="deepika-contact-image-glow"></div>

          <img
            src={two}
            alt="Skin and hair clinic team"
          />

        </div>


        {/* Bottom Decorative Lines */}

        <div className="deepika-contact-lines">

          <span></span>
          <span></span>
          <span></span>

        </div>

      </section>


      <br />
      <br />
      <br />
      <br />


      {/* ======================================================
          CONTACT FORM SECTION
      ====================================================== */}

      <section className="deepika-contact-form-section">


        {/* LEFT SIDE */}

        <div className="deepika-contact-form-left">

          <h2>
            We’d love to hear
            <br />
            from You!
          </h2>

          <p className="deepika-contact-form-text">
            We’re here to assist you with inquiries or concerns.
            <br />
            Your feedback is essential to our growth!
          </p>


          {/* FORM */}

          <form
            className="deepika-contact-form"
            onSubmit={handleSubmit}
          >


            {/* NAME + EMAIL */}

            <div className="deepika-form-row">

              <div className="deepika-input-box">

                <input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="deepika-input-box">

                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

              </div>

            </div>


            {/* PHONE + SUBJECT */}

            <div className="deepika-form-row">

              <div className="deepika-input-box">

                <input
                  type="text"
                  name="phone"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="deepika-input-box">

                <input
                  type="text"
                  name="subject"
                  placeholder="Your subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />

              </div>

            </div>


            {/* MESSAGE */}

            <div className="deepika-message-box">

              <textarea
                name="message"
                placeholder="Your message"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>

            </div>


            {/* SEND BUTTON */}

            <button
              type="submit"
              className="deepika-send-button"
              disabled={loading}
            >

              {loading
                ? "SENDING..."
                : "SEND MESSAGE"}

              <span>
                →
              </span>

            </button>

          </form>

        </div>


        {/* ======================================================
            RIGHT SIDE IMAGES
        ====================================================== */}

        <div className="deepika-contact-form-right">


          <div className="deepika-contact-image-one">

            <img
              src={three}
              alt="Beauty treatment"
            />

          </div>


          <div className="deepika-contact-image-two">

            <img
              src={four}
              alt="Skincare beauty"
            />

          </div>

        </div>

      </section>


      {/* ======================================================
          CONTACT INFORMATION
      ====================================================== */}

           <section className="deepika-contact-info-section">

        {/* Contact Information */}

        <div className="deepika-contact-info-card deepika-card-yellow">

          <h3>
            Contact information
          </h3>

                   <p className="deepika-info-row">
            <span className="deepika-info-label">Phone:</span>
            <a
              className="deepika-contact-plain-link"
              href="tel:+919950461493"
            >
              +91 9950461493
            </a>
          </p>

          <p className="deepika-info-row">
            <span className="deepika-info-label">Email:</span>
            <a
              className="deepika-contact-plain-link"
              href="mailto:drdeepikaskincare@gmail.com"
            >
              drdeepikaskincare@gmail.com
            </a>
          </p>

          <p className="deepika-info-row">
            <span className="deepika-info-label">Address:</span>
            D-1, Pawanpuri,
            <br />
            Main Market, Nagnechi Ji Scheme, Bikaner, Rajasthan 334003
          </p>

        </div>


        {/* Opening Hours */}

        <div className="deepika-contact-info-card deepika-card-pink">

          <h3>
            Opening hours
          </h3>

                   <ul>

            <li>
              Monday – Saturday:
              <br />
              <span className="deepika-hours-time">
                9:00 AM – 8:00 PM
              </span>
            </li>

            <li>
              Sunday:
              <br />
              <span className="deepika-hours-time">
                9:00 AM – 3:00 PM
              </span>
            </li>

          </ul>

        </div>


        {/* Follow Us */}

        <div className="deepika-contact-info-card deepika-card-green">

          <h3>
            Follow us:
          </h3>

                   <ul>

            <li>
              <span className="deepika-info-label">Instagram:</span>
              <a
                style={{ color: "#414142" }}
                href="https://www.instagram.com/dr_deepika.skincare/"
                target="_blank"
                rel="noopener noreferrer"
              >
                @dr_deepika.skincare
              </a>
            </li>

            <li>
              <span className="deepika-info-label">Facebook:</span>
              <a
                style={{ color: "#414142" }}
                href="https://www.facebook.com/drdeepikasinghbikaner/"
                target="_blank"
                rel="noopener noreferrer"
              >
                facebook.com/drdeepikasinghbikaner/
              </a>
            </li>

          </ul>

        </div>

      </section>


      <br />
      <br />
      <br />
      <br />
      <br />


      {/* ======================================================
          LOCATION SECTION
      ====================================================== */}

      <section className="contact-location-section">

        <div className="contact-location-container">


          {/* LEFT CONTENT */}

          <div className="contact-location-content">

            <p className="location-label">
              FIND US
            </p>

            <h2>
              Visit Our <span>Clinic</span>
            </h2>

            <p className="location-description">
              We are here to help you take care of your skin and hair.
              Visit us at our clinic for personalized consultation and treatments.
            </p>


            <div className="location-info">

              <div className="location-icon">
                📍
              </div>

              <div>

                <h4>
                  Our Location
                </h4>

                <p>
                  Dr. Deepika Skin & Hair Clinic
                  <br />
                  Bikaner, Rajasthan, India
                </p>

              </div>

            </div>


            <a
              href="https://share.google/BP9rV5C6MPijIotRq"
              target="_blank"
              rel="noopener noreferrer"
              className="location-button"
            >
              GET DIRECTIONS →
            </a>

          </div>


          {/* RIGHT MAP */}

          <div className="contact-location-map">

            <iframe
              src="https://www.google.com/maps?q=Dr+Deepika+Skin+%26+Hair+Clinic,+Bikaner&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Dr. Deepika Skin & Hair Clinic Location"
            ></iframe>

          </div>

        </div>

      </section>

    </>
  );
}

export default Contact;