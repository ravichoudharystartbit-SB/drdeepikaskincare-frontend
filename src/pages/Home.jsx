import "../css/Home.css";
import { ClinicStatusBanner } from "../component/ClinicStatus";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import homeimage1 from "../assets/homeimage1.png";
import after from "../assets/after.png";
import before from "../assets/before.png";

import GstCard from "../component/GstCard";
import homeimage11 from "../assets/homeimage11.webp";
import homeimage14 from "../assets/homeimage14.png";
import homeimage15 from "../assets/homeimage15.png";
import homeimage16 from "../assets/homeimage16.png";
import homeimage17 from "../assets/homeimage17.png";

import babitaAvatar from "../assets/babita_avatar.jpg";
import yogeshAvatar from "../assets/yogesh_avatar.jpg";
import nikkiAvatar from "../assets/nikki_avatar.jpg";
import sandeepAvatar from "../assets/sandeep_avatar.jpg";
import greetAvatar from "../assets/greet_avatar.jpg";
import shailendraAvatar from "../assets/shailendra_avatar.jpg";
import hitenAvatar from "../assets/hiten_avatar.jpg";
import mukeshAvatar from "../assets/mukesh_avatar.jpg";

import hydra from "../assets/hydra.png";
import peel from "../assets/peel.png";
import lesar from "../assets/lesar.png";
import prp from "../assets/prp.png";
import gfc from "../assets/gfc.png";
import Mesotherapy from "../assets/Mesotherapy.png";
import google from "../assets/google.png";
import insta from "../assets/insta.png";
import youtube from "../assets/youtube.png";
import facebook  from "../assets/facebook.png";

import { SkinArt, HairArt, LaserArt, SkincareArt, GenuineArt } from "../component/FeatureArt";

const features = [
  { Art: SkinArt, lines: ["Skin", "treatments"], to: "/services?category=Skin" },
  { Art: HairArt, lines: ["Hair", "treatments"], to: "/services?category=Hair" },
  { Art: LaserArt, lines: ["Laser", "treatments"], to: "/services?category=Laser" },
  { Art: SkincareArt, lines: ["Top-quality", "skincare"] },
  { Art: GenuineArt, lines: ["Genuine", "products"] },
];

function CountUp({ end, suffix = "", duration = 1600 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;

        const startTime = performance.now();

        const tick = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.floor(eased * end));
          if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {value.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}



function Home() {

  const [activeReview, setActiveReview] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const reviews = [
    {
      name: "Babita Chauhan",
      image: babitaAvatar,
      meta: "3 reviews · 3 photos",
      rating: 5,
      date: "8 months ago",
      text:
        "My experience with Dr Deepika skin and hair clinic is wonderful. I was being recommended for Carbon peel laser in combination with fractional laser for my melasma and freckles. The first session was painfree and I didn't had any post laser ..."
    },

    {
      name: "yogesh swami",
      image: yogeshAvatar,
      meta: "Local Guide · 63 reviews · 124 photos",
      localGuide: true,
      rating: 5,
      date: "Edited 2 years ago",
      text:
        "Dr. Deepika Singh is very professional and experienced, and her caring toward her patient is really appreciated. She never put her patient into any excessive treatment. She gave accurate treatment for my skin allergy and also guided ..."
    },

    {
      name: "Nikki jangir",
      image: nikkiAvatar,
      meta: "6 reviews · 6 photos",
      rating: 5,
      date: "a year ago",
      text:
        "I'm currently undergoing laser treatment for facial hair at Dr. Deepika's Skin and Hair Clinic, and the results have been amazing! I've noticed a significant reduction in hair growth, and my skin feels much smoother. I'm really happy with the outcome and highly recommend the clinic for anyone considering laser treatments."
    },

    {
      name: "SANDEEP CHAUDHARY",
      image: sandeepAvatar,
      meta: "Local Guide · 8 reviews · 25 photos",
      localGuide: true,
      rating: 5,
      date: "7 months ago",
      text:
        "Deepika is a very experienced and friendly dermatologist. I visited the clinic for acne treatment and my skin has improved a lot. The staff behavior is also very good and they guide you properly. Totally worth visiting. 5 stars ⭐⭐⭐⭐⭐"
    },

    {
      name: "Greet India",
      image: greetAvatar,
      meta: "1 review",
      rating: 5,
      date: "3 months ago",
      text:
        "Dr Deepika Singh an Expert Dermatologist in Bikaner. Her behaviour is very sweet and friendly. She is an excellent doctor in her field. She is human being as well as polite. May God Bless Her. 100% Excellent Doctor. Thanks A Lot to Dr Deepika Singh.\n\nRegards\n\nAnilkumaar Agarwal\nBikaner"
    },

    {
      name: "Shailendra Singh",
      image: shailendraAvatar,
      meta: "1 review",
      rating: 5,
      date: "a month ago",
      text:
        "I have been patient of dr. Deepika ma'am since 2024. Ma'am's behaviour is very very kind . Ma'am address patient with great patience and advised in very friendly manner which I admire of."
    },

    {
      name: "Hiten Jhakal",
      image: hitenAvatar,
      meta: "3 reviews",
      rating: 5,
      date: "5 months ago",
      text:
        "Had a great experience with Dr. Deepika. She examined everything carefully, explained the issue clearly, and prescribed effective medicines. Very polite and professional. Highly recommended!"
    },

    {
      name: "Mukesh sharma Mukesh sharma",
      image: mukeshAvatar,
      meta: "1 review · 5 photos",
      rating: 5,
      date: "Edited 6 months ago",
      text:
        'My name is Mukesh Kumar, and I am from Bikaner. I contacted Dr. Deepika and started taking the medicine for two months, there has been a lot of improvement in my hair, and I feel that my hair will be perfectly fine very soon."'
    }
  ];


  // =========================
  // REVIEWS AUTO SLIDER
  // =========================

  useEffect(() => {

    if (isPaused) return;

    const interval = setInterval(() => {

      setActiveReview(
        (prev) => (prev + 1) % reviews.length
      );

    }, 2000);

    return () => clearInterval(interval);

  }, [isPaused]);


  // =========================
  // YOUTUBE VIDEOS
  // =========================

  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(0);
  const [visibleVideos, setVisibleVideos] = useState(3);
  const [videoPaused, setVideoPaused] = useState(false);
  const [youtubeLoading, setYoutubeLoading] = useState(true);


  // =========================
  // YOUTUBE URL HELPERS
  // =========================

  const getYoutubeVideoId = (url) => {

    if (!url) return null;

    try {

      const parsedUrl = new URL(url);

      // Normal YouTube URL
      const watchId = parsedUrl.searchParams.get("v");

      if (watchId) {
        return watchId;
      }

      // youtu.be URL
      if (
        parsedUrl.hostname === "youtu.be" ||
        parsedUrl.hostname === "www.youtu.be"
      ) {

        return parsedUrl.pathname
          .replace("/", "")
          .split("/")[0];

      }

      // Shorts URL
      if (parsedUrl.pathname.includes("/shorts/")) {

        return parsedUrl.pathname
          .split("/shorts/")[1]
          .split(/[/?]/)[0];

      }

      // Embed URL
      if (parsedUrl.pathname.includes("/embed/")) {

        return parsedUrl.pathname
          .split("/embed/")[1]
          .split(/[/?]/)[0];

      }

      return null;

    } catch (error) {

      console.error(
        "Invalid YouTube URL:",
        url
      );

      return null;

    }

  };


  const getYoutubeThumbnail = (url) => {

    const videoId = getYoutubeVideoId(url);

    if (!videoId) {
      return "";
    }

    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  };


  const getVideoThumbnailUrl = (thumbnail, link) => {

    if (!thumbnail) {

      return getYoutubeThumbnail(link);

    }


    const cleanThumbnail = String(thumbnail)
      .trim()
      .replace(/\\/g, "/");


    // Already a complete URL
    if (
      /^https?:\/\//i.test(cleanThumbnail) ||
      /^data:image\//i.test(cleanThumbnail)
    ) {

      return cleanThumbnail;

    }


    const apiUrl =
      import.meta.env.VITE_API_URL ||
      "http://localhost:5000";


    const cleanApiUrl =
      apiUrl
        .trim()
        .replace(/\/+$/, "");


    const cleanPath =
      cleanThumbnail
        .replace(/^\.?\//, "")
        .replace(/^\/+/, "");


    return `${cleanApiUrl}/${cleanPath}`;

  };


  // =========================
  // FETCH YOUTUBE VIDEOS
  // =========================

  useEffect(() => {

    const fetchYoutubeVideos = async () => {

      try {

        setYoutubeLoading(true);

        const apiUrl =
          import.meta.env.VITE_API_URL ||
          "http://localhost:5000";

        const cleanApiUrl =
          apiUrl
            .trim()
            .replace(/\/+$/, "");


        const response = await fetch(
          `${cleanApiUrl}/api/youtube`
        );


        if (!response.ok) {

          throw new Error(
            "Failed to fetch YouTube videos"
          );

        }


        const data = await response.json();


        setYoutubeVideos(
          Array.isArray(data) ? data : []
        );


      } catch (error) {

        console.error(
          "YouTube videos fetch error:",
          error
        );

        setYoutubeVideos([]);


      } finally {

        setYoutubeLoading(false);

      }

    };


    fetchYoutubeVideos();

  }, []);


  // =========================
  // RESPONSIVE VIDEOS
  // =========================

  useEffect(() => {

    const updateVisibleVideos = () => {

      if (window.innerWidth <= 650) {

        setVisibleVideos(1);

      } else if (window.innerWidth <= 1000) {

        setVisibleVideos(2);

      } else {

        setVisibleVideos(3);

      }

    };


    updateVisibleVideos();


    window.addEventListener(
      "resize",
      updateVisibleVideos
    );


    return () => {

      window.removeEventListener(
        "resize",
        updateVisibleVideos
      );

    };

  }, []);


  // =========================
  // KEEP SLIDER POSITION VALID
  // =========================

  useEffect(() => {

    const maxStart = Math.max(
      0,
      youtubeVideos.length - visibleVideos
    );


    if (activeVideo > maxStart) {

      setActiveVideo(0);

    }

  }, [
    youtubeVideos.length,
    visibleVideos,
    activeVideo
  ]);


  // =========================
  // AUTO SLIDE
  // =========================

  useEffect(() => {

    if (
      videoPaused ||
      youtubeVideos.length <= visibleVideos
    ) {

      return;

    }


    const maxStart =
      youtubeVideos.length - visibleVideos;


    const interval = setInterval(() => {

      setActiveVideo((prev) => {

        if (prev >= maxStart) {

          return 0;

        }

        return prev + 1;

      });

    }, 2000 );


    return () => clearInterval(interval);

  }, [
    videoPaused,
    visibleVideos,
    youtubeVideos.length
  ]);


  // =========================
  // NEXT VIDEO
  // =========================

  const nextVideo = () => {

    const maxStart = Math.max(
      0,
      youtubeVideos.length - visibleVideos
    );


    setActiveVideo((prev) => {

      if (prev >= maxStart) {

        return 0;

      }

      return prev + 1;

    });

  };


  // =========================
  // PREVIOUS VIDEO
  // =========================

  const previousVideo = () => {

    const maxStart = Math.max(
      0,
      youtubeVideos.length - visibleVideos
    );


    setActiveVideo((prev) => {

      if (prev <= 0) {

        return maxStart;

      }

      return prev - 1;

    });

  };


  return (
    <>
   <div className="notice-wrap">
  <ClinicStatusBanner />
</div>



<section className="hero">
  
  <div className="hero-content">
    <h1>
      Refine your radiant
      <br />
      beauty today!
    </h1>

     <GstCard />
    <p className="hero-text">
      Experience tailored skincare solutions that enhance your natural beauty
      and give you a radiant glow.
    </p>

   <div className="hero-buttons">
 <Link to="/appointment" className="call-btn hero-main-book-btn">
    ☎  BOOK CONSULTATION
    <span>➜ </span>
  </Link>
  <div className="hero-small-buttons">
    <Link to="/pages/contact" className="call-btn">
      <span className="phone-icon">✉</span>
      GET IN TOUCH
      <span>➜ </span>
    </Link>

    <button
      type="button"
      className="call-btn discover-care-btn"
      onClick={() => {
        document
          .querySelector(".home-youtube-section")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }}
    >
      <span className="phone-icon">✦</span>
      DISCOVER OUR CARE
      <span>➜ </span>
    </button>
  </div>

 

</div>
  </div>

  <div className="hero-visual">
    {/* Outer Frame Wrapper */}
    <div className="hero-frame-outer">
      <div className="hero-frame-inner">
        <div className="woman-wrapper">
          <img
            src={homeimage1}
            alt="Skincare specialist"
            className="woman-image"
          />
        </div>
      </div>
      {/* Subtle Sparkle Icon on Bottom Right */}
      <div className="sparkle-star">✦</div>
    </div>
  </div>
</section>


   <section className="features-section">
  {features.map(({ Art, lines, to }) => {
    const content = (
      <>
        <div className="feature-icon">
          <Art />
        </div>
        <p>
          {lines[0]}
          <br />
          {lines[1]}
        </p>
      </>
    );
    return to ? (
      <Link key={lines[0]} to={to} className="feature-item">{content}</Link>
    ) : (
      <div key={lines[0]} className="feature-item">{content}</div>
    );
  })}
</section>

{/* 
      <section className="about-section">

        <div className="about-images">

          <div className="about-image before-image">

            <img
              src={before}
            />

            <span className="image-badge">
              −
            </span>

          </div>


          <div className="about-image after-image">

            <img
              src={after}
            />

            <span className="image-badge">
              ✓
            </span>

          </div>

        </div>


        <div className="about-content">

          <span className="about-label">
            ABOUT US
          </span>

          <h2>
            Our story
          </h2>

          <p className="about-description">
            At Dr. Deepika Skin & Hair Clinic, Bikaner,

            we believe that healthy skin and hair are the foundation

            of confidence. Our journey is driven by a passion for

            providing personalised dermatological care that enhances your natural beauty
            while focusing on long-term skin and hair health.

          </p>


          <div className="about-stats">

            <div className="about-stat">

              <h3>15000+</h3>

              <p>Happy Patients</p>

            </div>

            <div className="about-stat">

              <h3>10+</h3>

              <p>Year experience</p>

            </div>

          </div>

        </div>



      </section> */}

<section className="aboutX">
  <div className="aboutX__inner">
    <span className="aboutX__label">ABOUT US</span>

    <h2 className="aboutX__title">Our story</h2>

    <div className="aboutX__divider">
      <i></i>
      <b>✽</b>
      <i></i>
    </div>

    <p className="aboutX__text">
      At <strong>Dr. Deepika Skin &amp; Hair Clinic, Bikaner</strong>,
      we believe that healthy skin and hair are the foundation of
      confidence. Our journey is driven by a passion for providing
      personalised dermatological care that enhances your natural
      beauty while focusing on long-term skin and hair health.
    </p>

    <div className="aboutX__stats">
      <div className="aboutX__stat">
        <div className="aboutX__icon">♡</div>
        <h3>
          <CountUp end={15000} suffix="+" />
        </h3>
        <p>Happy Patients</p>
      </div>

      <div className="aboutX__stat">
        <div className="aboutX__icon">★</div>
        <h3>
          <CountUp end={10} suffix="+" />
        </h3>
        <p>Years Experience</p>
      </div>

      <div className="aboutX__stat">
        <div className="aboutX__icon">✚</div>
        <h3>
          <CountUp end={40} suffix="+" />
        </h3>
        <p>Treatments</p>
      </div>
    </div>
  </div>
</section>


      <section className="beauty-services-section">

        <div className="beauty-leaf beauty-leaf-left"></div>
        <div className="beauty-leaf beauty-leaf-right"></div>

        <div className="beauty-services-heading">

          <span>
            SKIN & HAIR CARE
          </span>

          <h2>
            Advanced Care For Your
            <br />
            Skin & Hair
          </h2>

          <p>
            Personalized dermatology treatments for healthier skin,
            <br />
            stronger hair and confident results.
          </p>

        </div>

<div className="beauty-services-grid">

  {/* HYDRAFACIAL */}
  <a
    href="https://www.youtube.com/@dr_deepika.skincare/search?query=HydraFacial"
    target="_blank"
    rel="noopener noreferrer"
    className="beauty-service-card"
    aria-label="Watch HydraFacial video"
  >
    <div className="beauty-service-image">
      <img
        src={hydra}
        alt="HydraFacial Treatment"
      />
    </div>

    <div className="beauty-service-title">
      <span>HydraFacial</span>
      <b>→</b>
    </div>
  </a>


  {/* CHEMICAL PEELS */}
  <a
    href="https://www.youtube.com/@dr_deepika.skincare/search?query=Chemical%20Peel"
    target="_blank"
    rel="noopener noreferrer"
    className="beauty-service-card"
    aria-label="Watch Chemical Peel video"
  >
    <div className="beauty-service-image">
      <img
        src={peel}
        alt="Chemical Peel Treatment"
      />
    </div>

    <div className="beauty-service-title">
      <span>Chemical Peels</span>
      <b>→</b>
    </div>
  </a>


  {/* LASER */}
  <a
    href="https://www.youtube.com/@dr_deepika.skincare/search?query=Laser%20Treatment"
    target="_blank"
    rel="noopener noreferrer"
    className="beauty-service-card"
    aria-label="Watch Laser Treatment video"
  >
    <div className="beauty-service-image">
      <img
        src={lesar}
        alt="Laser Skin Treatment"
      />
    </div>

    <div className="beauty-service-title">
      <span>Laser Treatments</span>
      <b>→</b>
    </div>
  </a>


  {/* PRP */}
  <a
    href="https://www.youtube.com/@dr_deepika.skincare/search?query=PRP"
    target="_blank"
    rel="noopener noreferrer"
    className="beauty-service-card"
    aria-label="Watch PRP Hair Treatment video"
  >
    <div className="beauty-service-image">
      <img
        src={prp}
        alt="PRP Hair Treatment"
      />
    </div>

    <div className="beauty-service-title">
      <span>PRP Hair Treatment</span>
      <b>→</b>
    </div>
  </a>


  {/* GFC */}
  <a
    href="https://www.youtube.com/@dr_deepika.skincare/search?query=GFC"
    target="_blank"
    rel="noopener noreferrer"
    className="beauty-service-card"
    aria-label="Watch GFC Hair Treatment video"
  >
    <div className="beauty-service-image">
      <img
        src={gfc}
        alt="GFC Hair Treatment"
      />
    </div>

    <div className="beauty-service-title">
      <span>GFC Hair Treatment</span>
      <b>→</b>
    </div>
  </a>


  {/* HAIR MESOTHERAPY */}
  <a
    href="https://www.youtube.com/@dr_deepika.skincare/search?query=Mesotherapy"
    target="_blank"
    rel="noopener noreferrer"
    className="beauty-service-card"
    aria-label="Watch Hair Mesotherapy video"
  >
    <div className="beauty-service-image">
      <img
        src={Mesotherapy}
        alt="Hair Mesotherapy Treatment"
      />
    </div>

    <div className="beauty-service-title">
      <span>Hair Mesotherapy</span>
      <b>→</b>
    </div>
  </a>

</div>


        <div className="beauty-services-button">

          <a
            href="https://www.youtube.com/@dr_deepika.skincare/videos"
            target="_blank"
            rel="noopener noreferrer"
          >

            <svg
              className="youtube-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >

              <path
                d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8Z"
                fill="currentColor"
              />

              <path
                d="M9.6 15.8 15.8 12 9.6 8.2v7.6Z"
                fill="#fff"
              />

            </svg>

            <span className="youtube-text">
              WATCH OUR VIDEOS
            </span>

            <span className="youtube-arrow">
              →
            </span>

          </a>

        </div>

      </section>


      <section className="how-work-section">

        <div className="how-work-content">

          <span className="how-work-label">
            HOW WE WORK
          </span>

          <h2>
            Enhance your beauty
          </h2>

          <p className="how-work-description">
            Reveal your natural glow with expert beauty treatments
            designed to enhance your confidence.
          </p>

          <div className="how-work-list">

            <div className="how-work-item">
              <span className="work-check">
                ✓
              </span>
              <span>
                Book an appointment
              </span>
            </div>

            <div className="how-work-item">
              <span className="work-check">
                ✓
              </span>
              <span>
                Get your schedule
              </span>
            </div>

            <div className="how-work-item">
              <span className="work-check">
                ✓
              </span>
              <span>
                Meet with our expert
              </span>
            </div>

            <div className="how-work-item">
              <span className="work-check">
                ✓
              </span>
              <span>
                Your skin feels new
              </span>
            </div>

          </div>

          <Link to="/appointment">

            <button className="how-work-button">
              GET STARTED
            </button>

          </Link>

        </div>


        <div className="how-work-visual">

          <div className="work-circle circle-one"></div>
          <div className="work-circle circle-two"></div>
          <div className="work-circle circle-three"></div>

          <div className="work-image work-image-left">

            <img
              src={homeimage11}
              alt="Beauty treatment"
            />

          </div>

          <div className="work-image work-image-right">

            <img
              src={homeimage11}
              alt="Natural beauty"
            />

          </div>

          <div className="work-vertical-text">
            Celebrate Your Unique Beauty
          </div>

        </div>

      </section>


      <section className="love-hearing">

        <div className="love-hearing-content">

          <h2>
            Love hearing from you
          </h2>

          <p>
            We value every opinion and look forward to
            <br />
            hearing from you!
          </p>

        </div>

      </section>


      {/* =========================
          EXISTING REVIEWS
          ========================= */}

      <section className="testimonials-section">

        <div className="testimonials-container">

          <div className="reviews-layout">


            {/* LEFT SIDE - HEADING */}

            <div className="testimonials-heading">

              <div className="google-reviews-title">

                <img
                  src={google}
                  alt="Google"
                />

                <span>
                  GOOGLE REVIEWS
                </span>

              </div>

              <h2>
                What Our
                <br />
                Patients Say
              </h2>

              <p>
                Trusted care, personalized treatments and
                <br />
                experiences shared by our patients.
              </p>

            </div>


            {/* RIGHT SIDE - REVIEWS */}

            <div className="reviews-carousel-area">

              <div className="reviews-slider">

                {reviews.map((review, index) => {

                  const total = reviews.length;

                  let position =
                    index - activeReview;

                  if (position > total / 2) {
                    position -= total;
                  }

                  if (position < -total / 2) {
                    position += total;
                  }

                  let cardClass = "review-card";

                  if (position === 0) {

                    cardClass += " active";

                  } else if (position === -1) {

                    cardClass += " prev";

                  } else if (position === 1) {

                    cardClass += " next";

                  } else if (position < 0) {

                    cardClass += " hidden-left";

                  } else {

                    cardClass += " hidden-right";

                  }


                  return (

                    <div
                      className={cardClass}
                      key={`${review.name}-${index}`}
                      onMouseEnter={() =>
                        setIsPaused(true)
                      }
                      onMouseLeave={() =>
                        setIsPaused(false)
                      }
                      onClick={() =>
                        window.open(
                          "https://www.google.com/maps/place/?q=place_id:ChIJW6EPw0bnPzkRZRF5eeqeuqY",
                          "_blank"
                        )
                      }
                    >


                      {/* PROFILE */}

                      <div className="review-card-top">

                        <img
                          src={review.image}
                          alt={review.name}
                        />

                        <div>

                          <h3>
                            {review.name}
                          </h3>

                          <span>
                            {review.localGuide &&
                              "Local Guide"}
                            {review.localGuide &&
                              " · "}
                            {review.meta.replace(
                              "Local Guide · ",
                              ""
                            )}
                          </span>

                        </div>


                        <div className="google-g">

                          <img
                            src={google}
                            alt="Google"
                          />

                        </div>

                      </div>


                      {/* RATING */}

                      <div className="review-rating-row">

                        <div className="review-stars">
                          ★★★★★
                        </div>

                        <span className="review-date">
                          {review.date}
                        </span>

                      </div>


                      {/* REVIEW */}

                      <p className="review-text">
                        {review.text}
                      </p>


                      {/* FOOTER */}

                      <div className="review-google-footer">
                        Google Review
                      </div>

                    </div>

                  );

                })}

              </div>


              {/* DOTS */}

              <div className="reviews-dots">

                {reviews.map((_, index) => (

                  <button
                    key={index}
                    type="button"
                    aria-label={`Go to review ${index + 1}`}
                    className={
                      activeReview === index
                        ? "review-dot active"
                        : "review-dot"
                    }
                    onClick={() =>
                      setActiveReview(index)
                    }
                  />

                ))}

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =========================
          DYNAMIC YOUTUBE VIDEO SECTION
          ========================= */}

      <section className="home-youtube-section">

        <div className="home-youtube-container">

          <div className="home-youtube-heading">

            <span>
              OUR YOUTUBE
            </span>

            <h2>
              Watch & <em>Discover</em>
            </h2>

            <p>
              Expert skin, hair and aesthetic care from our clinic.
            </p>

          </div>


          {youtubeLoading ? (

            <div className="home-youtube-loading">
              Loading videos...
            </div>

          ) : youtubeVideos.length === 0 ? (

            <div className="home-youtube-empty">

              <span>
                ▶
              </span>

              <p>
                Our latest videos will appear here.
              </p>

            </div>

          ) : (

            <div
              className="home-youtube-carousel"
              onMouseEnter={() =>
                setVideoPaused(true)
              }
              onMouseLeave={() =>
                setVideoPaused(false)
              }
            >


              {/* PREVIOUS */}

              {youtubeVideos.length > 1 && (

                <button
                  type="button"
                  className="home-youtube-arrow home-youtube-prev"
                  onClick={previousVideo}
                  aria-label="Previous video"
                >
                  ‹
                </button>

              )}


              {/* VIDEO WINDOW */}

              <div className="home-youtube-window">

                <div
                  className="home-youtube-track"
                  style={{
                    transform: `translateX(calc(
                      50% -
                      ${activeVideo * (100 / visibleVideos)}% -
                      ${50 / visibleVideos}%
                    ))`,
                  }}
                >

                  {youtubeVideos.map(
                    (video, index) => {

                      const thumbnailUrl =
                        getVideoThumbnailUrl(
                          video.thumbnail,
                          video.link
                        );


                      return (

                        <div
                          className={
                            index === activeVideo
                              ? "home-youtube-slide active"
                              : "home-youtube-slide"
                          }
                          key={
                            video._id || index
                          }
                        >

                          <a
                            href={video.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="home-youtube-card"
                          >

                            <div className="home-youtube-thumbnail">

                              <img
                                src={thumbnailUrl}
                                alt={video.title || "YouTube video"}
                                loading={
                                  Math.abs(
                                    index - activeVideo
                                  ) <= visibleVideos
                                    ? "eager"
                                    : "lazy"
                                }
                                decoding="async"

                                onError={(event) => {

                                  const image =
                                    event.currentTarget;


                                  // Prevent infinite fallback loop
                                  if (
                                    image.dataset.fallbackApplied ===
                                    "true"
                                  ) {

                                    return;

                                  }


                                  const fallbackThumbnail =
                                    getYoutubeThumbnail(
                                      video.link
                                    );


                                  if (
                                    fallbackThumbnail &&
                                    image.src !==
                                      fallbackThumbnail
                                  ) {

                                    image.dataset.fallbackApplied =
                                      "true";

                                    image.src =
                                      fallbackThumbnail;

                                  }

                                }}

                              />


                              <span className="home-youtube-play">
                                ▶
                              </span>

                            </div>


                            {/* ACTIVE VIDEO CONTENT */}

                            {index === activeVideo && (

                              <div className="home-youtube-title">

                                <span>
                                  {video.category ||
                                    "SKIN & HAIR"}
                                </span>

                                <h3>
                                  {video.title}
                                </h3>

                              </div>

                            )}

                          </a>

                        </div>

                      );

                    }
                  )}

                </div>

              </div>


              {/* NEXT */}

              {youtubeVideos.length > 1 && (

                <button
                  type="button"
                  className="home-youtube-arrow home-youtube-next"
                  onClick={nextVideo}
                  aria-label="Next video"
                >
                  ›
                </button>

              )}

            </div>

          )}


          {/* VIEW ALL */}

          <a
            href="https://www.youtube.com/@dr_deepika.skincare/videos"
            target="_blank"
            rel="noopener noreferrer"
            className="home-youtube-channel"
          >

            View all videos

            <span>
              ↗
            </span>

          </a>

        </div>

      </section>


      <section className="social-media-section">

        <div className="social-media-container">

          <div className="social-media-heading">

            <span>
              STAY CONNECTED
            </span>

            <h2>
              Connect With Dr. Deepika
            </h2>

            <p>
              Follow our clinic for expert skincare advice, treatment updates,
              <br />
              helpful videos and real patient experiences.
            </p>

          </div>


          <div className="social-media-grid">


            {/* INSTAGRAM */}

            <a
              href="https://www.instagram.com/dr_deepika.skincare"
              target="_blank"
              rel="noopener noreferrer"
              className="social-media-card instagram-card"
            >

              <div className="social-card-top">

                <div className="social-card-icon instagram-icon">

                  <img
                    src={insta}
                    alt="Instagram"
                  />

                </div>

                <span className="social-platform">
                  INSTAGRAM
                </span>

              </div>


              <div className="social-card-content">

                <h3>
                  @dr_deepika.skincare
                </h3>

                <p>
                  Explore skincare tips, treatment insights,
                  clinic moments and helpful skin & hair care updates.
                </p>

              </div>


              <div className="social-card-bottom">

                <span>
                  FOLLOW US
                </span>

                <span className="social-arrow">
                  ↗
                </span>

              </div>

            </a>


            {/* YOUTUBE */}

            <a
              href="https://www.youtube.com/@dr_deepika.skincare"
              target="_blank"
              rel="noopener noreferrer"
              className="social-media-card youtube-card"
            >

              <div className="social-card-top">

                <div className="social-card-icon youtube-icon">

                  <img
                    src={youtube}
                    alt="YouTube"
                  />

                </div>

                <span className="social-platform">
                  YOUTUBE
                </span>

              </div>


              <div className="social-card-content">

                <h3>
                  Dr. Deepika Skin & Hair
                </h3>

                <p>
                  Watch informative dermatology videos,
                  treatment explanations and practical skincare advice.
                </p>

              </div>


              <div className="social-card-bottom">

                <span>
                  WATCH VIDEOS
                </span>

                <span className="social-arrow">
                  ↗
                </span>

              </div>

            </a>


            {/* FACEBOOK */}

            <a
              href="https://www.facebook.com/drdeepikasinghbikaner/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-media-card facebook-card"
            >

              <div className="social-card-top">

                <div className="social-card-icon facebook-icon">

                  <img
                    src={facebook}
                    alt="Facebook"
                  />

                </div>

                <span className="social-platform">
                  FACEBOOK
                </span>

              </div>


              <div className="social-card-content">

                <h3>
                  Dr Deepika Skin & Hair Clinic
                </h3>

                <p>
                  Stay updated with clinic announcements,
                  treatment information and dermatology updates.
                </p>

              </div>


              <div className="social-card-bottom">

                <span>
                  FOLLOW PAGE
                </span>

                <span className="social-arrow">
                  ↗
                </span>

              </div>

            </a>


            {/* GOOGLE */}

            <a
              href="https://maps.app.goo.gl/mm9pwei4yjhER6DX7"
              target="_blank"
              rel="noopener noreferrer"
              className="social-media-card google-card"
            >

              <div className="social-card-top">

                <div className="social-card-icon google-icon">

                  <img
                    src={google}
                    alt="Google Maps"
                  />

                </div>

                <span className="social-platform">
                  GOOGLE MAPS
                </span>

              </div>


              <div className="social-card-content">

                <h3>
                  Find Our Clinic
                </h3>

                <p>
                  Get directions to Dr. Deepika Skin & Hair Clinic
                  and easily find our clinic location on Google Maps.
                </p>

              </div>


              <div className="social-card-bottom">

                <span>
                  VIEW LOCATION
                </span>

                <span className="social-arrow">
                  ↗
                </span>

              </div>

            </a>

          </div>


          <div className="social-follow-text">

            <span>
              Expert Care · Trusted Guidance · Better Skin
            </span>

          </div>

        </div>

      </section>


      <section className="package-section">

        <div className="package-left">

          <span className="package-small-title">
            PACKAGE FOR YOU
          </span>

          <h2>
            Choose the perfect
            <br />
            package for You
          </h2>

          <p>
            Glowvie offers a range of beauty and
            <br />
            skincare packages designed to suit your
            <br />
            unique needs.
          </p>

          <Link to="/pages/contact">

            <button className="package-btn">
              <span>
                ⌕
              </span>
              BOOK A CALL
            </button>

          </Link>

        </div>


        <div className="package-images">

          <div className="package-image package-image-one">

            <img
              src={homeimage14}
              alt="Skincare treatment"
            />

          </div>


          <div className="package-image package-image-two">

            <img
              src={homeimage15}
              alt="Beauty skincare"
            />

          </div>

        </div>

      </section>


      <section className="faq-section">

        <div className="faq-container">

          <div className="faq-content">

            <div className="faq-label">
              FAQ
            </div>

            <h2 className="faq-title">
              Popular question
            </h2>

            <p className="faq-description">
              Find answers to common inquiries about our
              <br />
              services and treatments.
            </p>


            <div className="faq-list">


              <details
                className="faq-item"
                name="faq"
              >

                <summary className="faq-question">

                  <span>
                    What types of skincare treatments do you offer?
                  </span>

                  <b>
                    +
                  </b>

                </summary>


                <div className="faq-answer">

                  <p>
                    We offer personalized facials, deep cleansing,
                    hydration treatments, brightening treatments,
                    and other skincare services designed according
                    to your skin needs.
                  </p>

                </div>

              </details>


              <details
                className="faq-item"
                name="faq"
              >

                <summary className="faq-question">

                  <span>
                    Are your products suitable for sensitive skin?
                  </span>

                  <b>
                    +
                  </b>

                </summary>


                <div className="faq-answer">

                  <p>
                    Yes, our products are carefully selected to be
                    gentle on the skin and suitable for different
                    skin types, including sensitive skin.
                  </p>

                </div>

              </details>


              <details
                className="faq-item"
                name="faq"
              >

                <summary className="faq-question">

                  <span>
                    How can i book an appointment?
                  </span>

                  <b>
                    +
                  </b>

                </summary>


                <div className="faq-answer">

                  <p>
                    You can easily book an appointment by contacting
                    our team through phone or by using the booking
                    option available on our website.
                  </p>

                </div>

              </details>


              <details
                className="faq-item"
                name="faq"
              >

                <summary className="faq-question">

                  <span>
                    What should i expect during my first visit?
                  </span>

                  <b>
                    +
                  </b>

                </summary>


                <div className="faq-answer">

                  <p>
                    During your first visit, our skincare specialist
                    will understand your skin concerns and recommend
                    a treatment that best suits your needs.
                  </p>

                </div>

              </details>

            </div>

          </div>


          <div className="faq-visual">

            <div className="faq-image-circle">

              <img
                src={homeimage16}
                alt="Skincare consultation"
              />

            </div>


            <div className="faq-consultation">

              <div className="faq-phone-icon">
                ✦
              </div>

              <div className="faq-consultation-text">

                <strong>
                  Begin your skin and hair consultation
                </strong>

                <span>
                  +91 9950461493
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>


      <section className="booking-section">

        <div className="booking-image">

          <img
            src={homeimage17}
            alt="Beauty treatment appointment"
          />

        </div>


        <div className="booking-content">

          <div className="booking-leaf">

            <span className="booking-leaf-one"></span>
            <span className="booking-leaf-two"></span>
            <span className="booking-leaf-three"></span>
            <span className="booking-leaf-stem"></span>

          </div>


          <div className="booking-inner">

            <div className="booking-label">
              APPOINTMENT
            </div>

            <h2>
              Book your experience
            </h2>

            <p>
              Our expert team is ready to help you achieve radiant,
              <br />
              healthy skin with treatments tailored just for you.
            </p>

            <Link
              to="/pages/contact"
              className="package-btn"
            >
              <span>
                ↗
              </span>
              BOOK A CALL
            </Link>

          </div>

        </div>

      </section>

    </>

  );

}


export default Home;