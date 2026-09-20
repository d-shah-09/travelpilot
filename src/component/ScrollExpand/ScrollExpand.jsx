import { useCallback, useEffect, useRef } from "react";
import "./ScrollExpand.css";

const clamp = (value, min, max) =>
  value < min ? min : value > max ? max : value;

const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0 || 1e-6), 0, 1);

  return t * t * (3 - 2 * t);
};

function ScrollExpand({
  src = "",
  mediaType = "image",
  poster = "",
  alt = "",
  title = "",
  scrollHint = "",
  startWidth = 42,
  startHeight = 58,
  startRadius = 24,
  endRadius = 0,
  mediaZoom = 1.35,
  scrollDistance = 1.2,
  holdDistance = 0.35,
  smoothing = 0.1,
  overlayScrim = 0.45,
  useWindowScroll = false,
  enabled = true,
  children,
  secondaryContent = null,
  className = "",
  style,
  ...rest
}) {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const frameRef = useRef(null);
  const mediaRef = useRef(null);
  const titleRef = useRef(null);
  const overlayRef = useRef(null);
  const secondaryRef = useRef(null);
  const scrimRef = useRef(null);
  const hintRef = useRef(null);
  const propsRef = useRef({});

  propsRef.current = {
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    useWindowScroll,
    enabled,
  };

  const applyProgress = useCallback((expandProgress, holdProgress) => {
    const frame = frameRef.current;
    const media = mediaRef.current;

    if (!frame || !media) return;

    const config = propsRef.current;

    const expandEase = smoothstep(0, 1, expandProgress);

    const width = config.startWidth + (100 - config.startWidth) * expandEase;

    const height = config.startHeight + (100 - config.startHeight) * expandEase;

    const insetX = Math.max(0, (100 - width) / 2);
    const insetY = Math.max(0, (100 - height) / 2);

    const radius =
      config.startRadius + (config.endRadius - config.startRadius) * expandEase;

    frame.style.clipPath = `inset(${insetY}% ${insetX}% ${insetY}% ${insetX}% round ${radius}px)`;

    media.style.transform = `scale(${config.mediaZoom + (1 - config.mediaZoom) * expandEase})`;

    const secondaryIn = smoothstep(0.1, 0.34, holdProgress);

    if (scrimRef.current) {
      const extraScrim = secondaryIn * 0.1;
      scrimRef.current.style.opacity = String(
        clamp(config.overlayScrim * expandEase + extraScrim, 0, 0.78),
      );
    }

    if (titleRef.current) {
      const titleOut = smoothstep(0.4, 0.88, expandProgress);

      titleRef.current.style.opacity = String(1 - titleOut);

      titleRef.current.style.transform = `translate3d(0, ${-28 * titleOut}px, 0) scale(${1 + 0.06 * titleOut})`;
    }

    if (hintRef.current) {
      const hintGone = smoothstep(0, 0.12, expandProgress);

      hintRef.current.style.opacity = String(1 - hintGone);

      hintRef.current.style.transform = `translate3d(0, ${8 * hintGone}px, 0)`;
    }

    if (overlayRef.current) {
      const heroIn = smoothstep(0.68, 1, expandProgress);
      const heroOut = smoothstep(0.04, 0.28, holdProgress);
      const heroOpacity = heroIn * (1 - heroOut);

      overlayRef.current.style.opacity = String(heroOpacity);

      overlayRef.current.style.transform = `translate3d(0, ${
        18 * (1 - heroIn) - 18 * heroOut
      }px, 0)`;

      overlayRef.current.style.pointerEvents =
        heroOpacity > 0.7 ? "auto" : "none";
    }

    if (secondaryRef.current) {
      secondaryRef.current.style.opacity = String(secondaryIn);

      secondaryRef.current.style.transform = `translate3d(0, ${20 * (1 - secondaryIn)}px, 0)`;

      secondaryRef.current.style.pointerEvents =
        secondaryIn > 0.72 ? "auto" : "none";
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;

    if (!root || !track || !stage) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;

    let currentExpand = 0;
    let currentHold = 0;

    let targetExpand = 0;
    let targetHold = 0;

    let stageHeight = 0;
    let running = false;

    const measure = () => {
      const config = propsRef.current;

      stageHeight = config.useWindowScroll
        ? window.innerHeight
        : root.clientHeight;

      if (stageHeight <= 0) return;

      stage.style.height = `${stageHeight}px`;

      track.style.height = `${
        stageHeight *
        (1 +
          Math.max(0, config.scrollDistance) +
          Math.max(0, config.holdDistance))
      }px`;

      const width = root.clientWidth || stageHeight;

      stage.style.setProperty(
        "--se-title-size",
        `${clamp(width * 0.075, 20, 84)}px`,
      );
    };

    const readProgress = () => {
      const config = propsRef.current;

      if (!config.enabled) {
        return {
          expand: 1,
          hold: secondaryContent ? 1 : 0,
        };
      }

      const expansionSpan = stageHeight * Math.max(0.01, config.scrollDistance);

      const holdSpan = stageHeight * Math.max(0, config.holdDistance);

      const rawScroll = config.useWindowScroll
        ? -track.getBoundingClientRect().top
        : root.scrollTop;

      const expand = clamp(rawScroll / expansionSpan, 0, 1);

      const hold =
        holdSpan > 0 ? clamp((rawScroll - expansionSpan) / holdSpan, 0, 1) : 0;

      return {
        expand,
        hold,
      };
    };

    const tick = () => {
      const config = propsRef.current;

      const smoothingFactor =
        config.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * config.smoothing));

      currentExpand += (targetExpand - currentExpand) * smoothingFactor;

      currentHold += (targetHold - currentHold) * smoothingFactor;

      const expandDone = Math.abs(targetExpand - currentExpand) < 0.0004;

      const holdDone = Math.abs(targetHold - currentHold) < 0.0004;

      if (expandDone) currentExpand = targetExpand;
      if (holdDone) currentHold = targetHold;

      applyProgress(currentExpand, currentHold);

      if (expandDone && holdDone) {
        running = false;
        raf = 0;
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (running) return;

      running = true;

      if (!raf) {
        raf = requestAnimationFrame(tick);
      }
    };

    const updateTargets = () => {
      const next = readProgress();

      targetExpand = next.expand;
      targetHold = next.hold;

      if (propsRef.current.smoothing <= 0 || reduceMotion) {
        currentExpand = targetExpand;
        currentHold = targetHold;

        applyProgress(currentExpand, currentHold);

        return;
      }

      kick();
    };

    const onResize = () => {
      measure();

      const next = readProgress();

      targetExpand = next.expand;
      targetHold = next.hold;

      currentExpand = targetExpand;
      currentHold = targetHold;

      applyProgress(currentExpand, currentHold);
    };

    measure();

    const initial = readProgress();

    currentExpand = initial.expand;
    currentHold = initial.hold;

    targetExpand = initial.expand;
    targetHold = initial.hold;

    applyProgress(currentExpand, currentHold);

    const scroller = useWindowScroll ? window : root;

    scroller.addEventListener("scroll", updateTargets, { passive: true });

    window.addEventListener("resize", onResize);

    const resizeObserver = new ResizeObserver(onResize);

    resizeObserver.observe(root);

    return () => {
      if (raf) {
        cancelAnimationFrame(raf);
      }

      scroller.removeEventListener("scroll", updateTargets);

      window.removeEventListener("resize", onResize);

      resizeObserver.disconnect();
    };
  }, [applyProgress, secondaryContent, useWindowScroll]);

  const media =
    mediaType === "video" ? (
      <video
        ref={mediaRef}
        className="scroll-expand__media"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
      />
    ) : (
      <img
        ref={mediaRef}
        className="scroll-expand__media"
        src={src}
        alt={alt}
        draggable={false}
      />
    );

  return (
    <div
      ref={rootRef}
      className={`scroll-expand ${
        useWindowScroll ? "" : "scroll-expand--scroller"
      } ${className}`.trim()}
      style={style}
      {...rest}
    >
      <div ref={trackRef} className="scroll-expand__track">
        <div ref={stageRef} className="scroll-expand__stage">
          <div ref={frameRef} className="scroll-expand__frame">
            {media}

            <div ref={scrimRef} className="scroll-expand__scrim" />

            {children ? (
              <div ref={overlayRef} className="scroll-expand__overlay">
                {children}
              </div>
            ) : null}

            {secondaryContent ? (
              <div ref={secondaryRef} className="scroll-expand__secondary">
                {secondaryContent}
              </div>
            ) : null}
          </div>

          {title ? (
            <div ref={titleRef} className="scroll-expand__title">
              {title}
            </div>
          ) : null}

          {scrollHint ? (
            <div ref={hintRef} className="scroll-expand__hint">
              {scrollHint}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ScrollExpand;
