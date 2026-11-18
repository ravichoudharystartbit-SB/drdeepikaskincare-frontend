import "../css/Services.css";

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

function Services() {
  const [searchParams] = useSearchParams();

  const categoryFromUrl = searchParams.get("category");
  const [active, setActive] = useState(
    categoryFromUrl || "All"
  );
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/services`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch services");
        }

        const data = await response.json();

        setServices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Services fetch error:", error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const categoryOrder = [
    "Laser",
    "Hair",
    "Skin",
    "RF",
    "Diagnosis",
    "Surgery",
    "Other",
  ];

  const sortedServices = [...services].sort((a, b) => {
    const categoryA = categoryOrder.indexOf(a.category);
    const categoryB = categoryOrder.indexOf(b.category);

    const safeCategoryA =
      categoryA === -1 ? 999 : categoryA;

    const safeCategoryB =
      categoryB === -1 ? 999 : categoryB;

    if (safeCategoryA !== safeCategoryB) {
      return safeCategoryA - safeCategoryB;
    }

    return (a.name || "").localeCompare(
      b.name || ""
    );
  });

  const filteredServices =
    active === "All"
      ? sortedServices
      : sortedServices
          .filter(
            (service) =>
              service.category === active
          )
          .sort((a, b) =>
            (a.name || "").localeCompare(
              b.name || ""
            )
          );

  const categories = [
    "All",
    "Skin",
    "Hair",
    "Laser",
    "RF",
    "Diagnosis",
    "Surgery",
    "Other",
  ];

  // Amount tabhi dikhega jab admin ne dala ho (0 / empty = hide)
  const hasAmount = (service) =>
    service.amount !== undefined &&
    service.amount !== null &&
    service.amount !== "" &&
    Number(service.amount) > 0;

  const formatAmount = (amount) =>
    Number(amount).toLocaleString("en-IN");
 const GST_RATE = 0.05;

  const getPriceInfo = (service) => {
    const base = Number(service.amount);
    const hasGst = Boolean(service.gstIncluded);
    const gst = hasGst
      ? Math.round(base * GST_RATE * 100) / 100
      : 0;
    const total = Math.round((base + gst) * 100) / 100;

    return { base, gst, total, hasGst };
  };
  return (
    <section className="services-section">
      <div className="services-heading">
        <span>OUR SERVICES</span>

        <h1>
          Advanced Care For Your
          <br />
          Skin & Hair
        </h1>

        <p>
          Discover personalized dermatology and
          aesthetic treatments designed around your
          unique skin and hair needs.
        </p>
      </div>

      <div className="services-filter">
        {categories.map((category) => (
          <button
            key={category}
            className={
              active === category
                ? "active"
                : ""
            }
            onClick={() =>
              setActive(category)
            }
          >
            {category}
          </button>
        ))}
      </div>

      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "50px 20px",
          }}
        >
          <p>Loading services...</p>
        </div>
      )}

      {!loading &&
        filteredServices.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "50px 20px",
            }}
          >
            <p>
              No services available at the
              moment.
            </p>
          </div>
        )}

      {!loading &&
        filteredServices.length > 0 && (
          <div className="services-grid">
            {filteredServices.map(
              (service, index) => (
                <article
                  className="service-card"
                  key={service._id}
                >
                  <div className="service-card-image-space">
                    {service.image && (
                      <img
                        src={
                          service.image.startsWith(
                            "http"
                          )
                            ? service.image
                            : `${import.meta.env.VITE_API_URL}${service.image}`
                        }
                        alt={service.name}
                        style={{
                          width: "100%",
                          height: "180px",
                          objectFit: "cover",
                          display: "block",
                        }}
                        onError={(e) => {}}
                      />
                    )}
                  </div>

                  <div className="service-number">
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <span>
                    {service.category}
                  </span>

                  <h3>
                    {service.name}
                  </h3>

                  <p>
                    {service.description}
                  </p>

                 {hasAmount(service) &&
  (() => {
    const info = getPriceInfo(service);

    return (
      <div className="service-price">
        <strong>₹{formatAmount(info.total)}</strong>

        {info.hasGst && (
          <small className="gst-badge">+5% GST</small>
        )}

        {info.hasGst && (
          <em className="gst-breakup">
            ₹{formatAmount(info.base)} + ₹
            {formatAmount(info.gst)} GST
          </em>
        )}
      </div>
    );
  })()}

                  <Link
                    to={`/appointment?service=${encodeURIComponent(
                      service.name
                    )}`}
                  >
                    BOOK CONSULTATION
                  </Link>
                </article>
              )
            )}
          </div>
        )}
    </section>
  );
}

export default Services;