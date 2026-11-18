import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";

function ScrollProgress() {
  const barRef = useRef(null);
  const { pathname } = useLocation();

  // Admin panel me progress bar nahi chahiye
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;

    let ticking = false;

    const update = () => {
      const el = document.scrollingElement || document.documentElement;

      const maxScroll = el.scrollHeight - el.clientHeight;
      const progress =
        maxScroll > 0 ? Math.min(Math.max(el.scrollTop / maxScroll, 0), 1) : 0;

      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${progress})`;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    // images / videos load hone se page lamba hota hai, tab bhi sahi rahe
    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(onScroll);
      observer.observe(document.body);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (observer) observer.disconnect();
    };
  }, [isAdmin, pathname]);

  if (isAdmin) return null;

  // body me render hota hai, isliye navbar ya kisi parent ke peeche nahi chhupta
  return createPortal(
    <div className="scroll-progress" aria-hidden="true">
      <div className="scroll-progress__bar" ref={barRef} />
    </div>,
    document.body
  );
}

export default ScrollProgress;