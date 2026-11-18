import "../css/Gstcard.css";
function GstCard() {
  return (
    <div className="gst-wrap">
      <div className="gst-dark" aria-label="GST information">
        <div className="gst-dark-left">
          <span className="gst-dark-tick">✓</span>
          <span>
            <span className="gst-dark-label">OFFICIALLY REGISTERED</span>
            <span className="gst-dark-title">GST Registered Clinic</span>
          </span>
        </div>

        <div className="gst-dark-right">
          <span className="gst-dark-label">COSMETIC PROCEDURES</span>
          <p>
            All cosmetic procedures are charged at <b>5% GST</b> as per the
            applicable GST regulations of the Government of India.
          </p>
        </div>
      </div>
    </div>
  );
}

export default GstCard;