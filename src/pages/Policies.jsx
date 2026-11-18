import { Link } from "react-router-dom";
import "../css/Policy.css";

const CLINIC = "Dr. Deepika Skin & Hair Clinic";
const ADDRESS =
  "D-1, Pawanpuri, Main Market, Nagnechi Ji Scheme, Bikaner, Rajasthan 334003";
const PHONE = "+91 9950461493";
const EMAIL = "drdeepikaskincare@gmail.com";
const UPDATED = "27 October 2026";

const PolicyLayout = ({ title, intro, children }) => (
  <main className="policy-page">
    <header className="policy-hero">
      <p className="policy-label">Legal</p>
      <h1 className="policy-title">{title}</h1>
      <p className="policy-updated">Last updated: {UPDATED}</p>
    </header>

    <div className="policy-body">
      {intro && <p className="policy-intro">{intro}</p>}

      {children}

      <nav className="policy-links" aria-label="Policies">
        <Link to="/privacy-policy">Privacy Policy</Link>
        <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
        <Link to="/refund-policy">Refund &amp; Cancellation Policy</Link>
      </nav>
    </div>
  </main>
);

const ContactBlock = () => (
  <ul>
    <li>{CLINIC}</li>
    <li>{ADDRESS}</li>
    <li>Phone: {PHONE}</li>
    <li>
      Email: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
    </li>
  </ul>
);

/* ===================== PRIVACY POLICY ===================== */

export const PrivacyPolicy = () => (
  <PolicyLayout
    title="Privacy Policy"
    intro={`${CLINIC} respects your privacy. This policy explains what information we collect through this website, why we collect it and who we share it with. By using this website and booking an appointment, you agree to this policy.`}
  >
    <section>
      <h2>1. Information we collect</h2>
      <ul>
        <li>
          Appointment details: your name, mobile number, address, doctor,
          consultation type, concern, appointment date and time, and any
          message you write.
        </li>
        <li>
          Contact form details: your name, email address and message.
        </li>
        <li>
          Payment details: payments are processed by Razorpay. We do not see
          or store your card, UPI or bank details. We only receive a payment
          reference and the payment status.
        </li>
      </ul>
    </section>

    <section>
      <h2>2. How we use your information</h2>
      <ul>
        <li>To book, confirm, reschedule or cancel your appointment.</li>
        <li>To verify your mobile number with an OTP.</li>
        <li>
          To send you appointment, payment and refund messages by SMS.
        </li>
        <li>To process payments and refunds.</li>
        <li>To answer your questions sent through the contact form.</li>
      </ul>
      <p>We do not sell your personal information.</p>
    </section>

    <section>
      <h2>3. Who we share it with</h2>
      <p>
        We share information only with the services that help us run the
        website and the clinic: Razorpay for payments, our SMS provider for
        OTPs and messages, and our hosting and database providers. We may also
        share information if the law requires it.
      </p>
    </section>

    <section>
      <h2>4. Security</h2>
      <p>
        We take reasonable steps to protect your information. No method of
        storage or transmission is completely secure, so we cannot promise
        absolute security.
      </p>
    </section>

    <section>
      <h2>5. Your rights</h2>
      <p>
        You can ask us to show, correct or delete the information we hold
        about you, except where we must keep it by law. To do so, contact us
        using the details below.
      </p>
    </section>

    <section>
      <h2>6. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The latest version is
        always on this page.
      </p>
    </section>

    <section>
      <h2>7. Contact us</h2>
      <ContactBlock />
    </section>
  </PolicyLayout>
);

/* ===================== TERMS & CONDITIONS ===================== */

export const TermsAndConditions = () => (
  <PolicyLayout
    title="Terms & Conditions"
    intro={`These terms apply when you use the website of ${CLINIC} and book an appointment through it. By using this website you agree to them.`}
  >
    <section>
      <h2>1. About this website</h2>
      <p>
        This website gives information about our clinic and services and lets
        you book appointments online.
      </p>
    </section>

    <section>
      <h2>2. Medical information</h2>
      <p>
        Content on this website is for general information only and is not a
        substitute for a medical examination or treatment. Results differ from
        person to person. In a medical emergency, do not use this website. Go
        to the nearest hospital.
      </p>
    </section>

    <section>
      <h2>3. Video consultation</h2>
      <p>
        Video consultation is offered only for your convenience. We do not
        promote it as a replacement for an in-person visit. We advise you to
        also get checked by a doctor near you.
      </p>
    </section>

    <section>
      <h2>4. Booking an appointment</h2>
      <ul>
        <li>Please give correct and complete details.</li>
        <li>
          Verify your mobile number with the OTP sent to you. Do not share
          the OTP with anyone.
        </li>
        <li>
          If you are going to be late, please contact us and we can
          reschedule your appointment.
        </li>
      </ul>
    </section>

    <section>
      <h2>5. Fees and payments</h2>
      <p>
        The consultation fee is shown on the booking page before you pay.
        Payments are processed by Razorpay. Fees for treatments or procedures
        are separate and are paid at the clinic.
      </p>
    </section>

    <section>
      <h2>6. Cancellation and refunds</h2>
      <p>
        After booking, you can cancel your appointment and get a full refund
        of the consultation fee. Please read our{" "}
        <Link to="/refund-policy">Refund &amp; Cancellation Policy</Link> for
        details.
      </p>
    </section>

    <section>
      <h2>7. Privacy</h2>
      <p>
        How we handle your information is explained in our{" "}
        <Link to="/privacy-policy">Privacy Policy</Link>.
      </p>
    </section>

    <section>
      <h2>8. Governing law</h2>
      <p>
        These terms are governed by the laws of India. Courts in Bikaner,
        Rajasthan will have jurisdiction over any dispute.
      </p>
    </section>

    <section>
      <h2>9. Contact us</h2>
      <ContactBlock />
    </section>
  </PolicyLayout>
);

/* ===================== REFUND & CANCELLATION ===================== */

export const RefundPolicy = () => (
  <PolicyLayout
    title="Refund & Cancellation Policy"
    intro={`This policy explains how cancellation, rescheduling and refunds work for appointments booked on the ${CLINIC} website.`}
  >
    <section>
      <h2>1. Cancellation</h2>
      <p>
        After booking, you can cancel your appointment and get a full refund
        of the consultation fee you paid. There are no conditions. To cancel,
        please call us on {PHONE}.
      </p>
    </section>

    <section>
      <h2>2. Rescheduling</h2>
      <p>
        If you want to change your appointment or you are going to be late,
        please call us on {PHONE} and we will reschedule it.
      </p>
    </section>

    <section>
      <h2>3. Refund if the clinic cannot see you</h2>
      <p>
        You also get a full refund if the clinic is closed or the doctor is
        unavailable on your appointment date, or if the clinic cancels your
        appointment.
      </p>
    </section>

    <section>
      <h2>4. How the refund is paid</h2>
      <p>
        Refunds are not automatic. Please call us with your Payment ID and
        mobile number, and the clinic will start your refund. You will get an
        SMS when it is started. The amount is sent to the same payment method
        you used to pay, and usually shows in your account within 5 to 7
        working days, depending on your bank.
      </p>
    </section>

    <section>
      <h2>5. Payment problems</h2>
      <p>
        If money was deducted but you did not get a confirmation, please do
        not pay again. Contact us with your Payment ID, date and mobile
        number.
      </p>
      <ContactBlock />
    </section>
  </PolicyLayout>
);