import ScrollExpand from "./component/ScrollExpand/ScrollExpand";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import earthSpaceBg from "./assets/earth-space-bg.png";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5001" : "")
).replace(/\/$/, "");

function ImageStreamHero({ images, cardCount = 10, speed = 22 }) {
  if (!images?.length) return null;

  const cards = Array.from({ length: cardCount }, (_, index) => ({
    ...images[index % images.length],
    streamIndex: index,
  }));

  return (
    <div className="tp2-image-stream" aria-hidden="true">
      <div className="tp2-image-stream-glow" />

      <div className="tp2-image-stream-lane tp2-image-stream-left">
        {cards.map((image, index) => (
          <div
            className="tp2-stream-card"
            key={`left-${image.src}-${index}`}
            style={{
              backgroundImage: `url("${image.src}")`,
              animationDuration: `${speed}s`,
              animationDelay: `${-((index / cardCount) * speed)}s`,
            }}
          >
            <span>{image.alt}</span>
          </div>
        ))}
      </div>

      <div className="tp2-image-stream-lane tp2-image-stream-right">
        {cards.map((_, index) => {
          const image = images[(index + 3) % images.length];

          return (
            <div
              className="tp2-stream-card"
              key={`right-${image.src}-${index}`}
              style={{
                backgroundImage: `url("${image.src}")`,
                animationDuration: `${speed}s`,
                animationDelay: `${-((index / cardCount) * speed)}s`,
              }}
            >
              <span>{image.alt}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TestimonialsColumn({
  testimonials,
  duration = 18,
  reverse = false,
  className = "",
}) {
  if (!testimonials?.length) return null;

  const renderSet = (copyIndex) => (
    <div className="tp2-testimonial-set" key={`set-${copyIndex}`}>
      {testimonials.map((testimonial, index) => (
        <article
          className="tp2-testimonial-card"
          key={`${copyIndex}-${testimonial.name}-${index}`}
        >
          <blockquote>“{testimonial.quote}”</blockquote>

          <div className="tp2-testimonial-person">
            <span>{testimonial.avatar}</span>

            <div>
              <strong>{testimonial.name}</strong>
              <small>{testimonial.trip}</small>
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  return (
    <div className={`tp2-testimonials-column ${className}`.trim()}>
      <div
        className={`tp2-testimonials-track ${reverse ? "reverse" : ""}`}
        style={{ "--tp2-testimonial-duration": `${duration}s` }}
      >
        {renderSet(0)}
        {renderSet(1)}
      </div>
    </div>
  );
}

function LandingPage({ onStartPlanning, onOpenHistory }) {
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const scrollToFeatureStage = () => {
    const track = document.querySelector(
      ".tp2-scroll-section .scroll-expand__track",
    );

    if (!track) return;

    const trackTop = window.scrollY + track.getBoundingClientRect().top;

    window.scrollTo({
      top: trackTop + window.innerHeight * 0.98,
      behavior: "smooth",
    });
  };

  const scrollDestinations = (direction) => {
    const track = document.getElementById("tp2-destination-track");

    if (!track) return;

    track.scrollBy({
      left: direction === "next" ? 340 : -340,
      behavior: "smooth",
    });
  };

  const destinations = [
    {
      city: "Tokyo",
      country: "Japan",
      meta: "Culture · Food",
      image:
        "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=86",
    },
    {
      city: "Paris",
      country: "France",
      meta: "Romance · Culture",
      image:
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=86",
    },
    {
      city: "Bali",
      country: "Indonesia",
      meta: "Nature · Relax",
      image:
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=86",
    },
    {
      city: "New York",
      country: "USA",
      meta: "City · Nightlife",
      image:
        "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=900&q=86",
    },
    {
      city: "Dubai",
      country: "UAE",
      meta: "Luxury · City",
      image:
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=86",
    },
    {
      city: "London",
      country: "United Kingdom",
      meta: "Culture · City",
      image:
        "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=86",
    },
    {
      city: "Mumbai",
      country: "India",
      meta: "City · Food · Culture",
      image:
        "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=900&q=86",
    },
    {
      city: "Leh Ladakh",
      country: "India",
      meta: "Mountains · Adventure",
      image:
        "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=900&q=86",
    },
    {
      city: "Rome",
      country: "Italy",
      meta: "History · Food",
      image:
        "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=900&q=86",
    },
    {
      city: "Maldives",
      country: "Maldives",
      meta: "Beach · Relax",
      image:
        "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=900&q=86",
    },
  ];

  const finalStreamImages = destinations.map((destination) => ({
    src: destination.image,
    alt: destination.city,
  }));

  const testimonials = [
    {
      quote: "TravelPilot planned our Italy trip in minutes — it was perfect.",
      name: "Priya S.",
      trip: "Travelled to Italy",
      avatar: "P",
    },
    {
      quote: "Saved us hours of planning. The suggestions were spot on.",
      name: "Daniel K.",
      trip: "Travelled to Japan",
      avatar: "D",
    },
    {
      quote: "Loved how it adapted when our flight got delayed.",
      name: "Aisha M.",
      trip: "Travelled to Thailand",
      avatar: "A",
    },
  ];

  const testimonialColumns = [
    testimonials,
    [testimonials[1], testimonials[2], testimonials[0]],
    [testimonials[2], testimonials[0], testimonials[1]],
  ];

  return (
    <div className="tp2-home">
      <nav className="tp2-global-navbar">
        <button
          type="button"
          className="tp2-brand"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          <span className="tp2-brand-plane">✈</span>

          <span>
            Travel<span>Pilot</span>
          </span>
        </button>

        <div className="tp2-expand-nav-links">
          <button type="button" onClick={scrollToFeatureStage}>
            Features
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("tp2-destinations")}
          >
            Destinations
          </button>

          <button type="button" onClick={() => scrollToSection("tp2-how")}>
            How it works
          </button>

          <button type="button" onClick={() => scrollToSection("tp2-stories")}>
            Stories
          </button>

          <button type="button" onClick={() => scrollToSection("tp2-final")}>
            Pricing
          </button>
        </div>

        <div className="tp2-expand-nav-actions">
          <button
            type="button"
            className="tp2-search-button"
            aria-label="Search destinations"
            onClick={() => scrollToSection("tp2-destinations")}
          >
            ⌕
          </button>

          <button
            type="button"
            className="tp2-signin-button"
            onClick={onOpenHistory}
          >
            My Trips
          </button>

          <button
            type="button"
            className="tp2-nav-primary"
            onClick={onStartPlanning}
          >
            Plan My Trip
            <span>→</span>
          </button>
        </div>
      </nav>

      <section className="tp2-scroll-section">
        <div className="tp2-scroll-intro-copy">
          <span className="tp2-scroll-intro-kicker">✦ AI-POWERED TRAVEL</span>

          <h1>
            Your next journey
            <br />
            starts with <em>possibility.</em>
          </h1>

          <p>
            Scroll to transform inspiration into a smarter, adaptive journey
            built around you.
          </p>
        </div>

        <ScrollExpand
          src="/background.png"
          mediaType="image"
          alt="Travel landscape"
          title=""
          scrollHint="Scroll to explore"
          startWidth={42}
          startHeight={58}
          startRadius={28}
          endRadius={0}
          mediaZoom={1.18}
          scrollDistance={0.6}
          holdDistance={1.05}
          smoothing={0.08}
          overlayScrim={0.5}
          useWindowScroll={true}
          secondaryContent={
            <section className="tp2-feature-stage" id="tp2-features">
              <div className="tp2-feature-copy">
                <span className="tp2-kicker">⚡ WHY TRAVELPILOT?</span>

                <h2>
                  Your entire trip,
                  <br />
                  intelligently <em>connected.</em>
                </h2>

                <p>
                  Go beyond itinerary generation. TravelPilot continuously
                  checks, connects and improves the moving parts of your
                  journey.
                </p>

                <div className="tp2-feature-copy-meta">
                  <span>
                    <i /> Always adapting
                  </span>

                  <span>
                    <i /> Built around you
                  </span>
                </div>

                <button
                  type="button"
                  className="tp2-outline-button"
                  onClick={() => scrollToSection("tp2-how")}
                >
                  Explore features
                  <span>→</span>
                </button>
              </div>

              <div className="tp2-feature-grid">
                <article className="tp2-feature-card tp2-feature-card-primary">
                  <div className="tp2-feature-card-top">
                    <span className="tp2-feature-status">
                      <i /> ALWAYS ON
                    </span>

                    <span className="tp2-feature-number">01</span>
                  </div>

                  <span className="tp2-feature-icon purple">✦</span>

                  <h3>AI Trip Planner</h3>

                  <p>
                    Build complete itineraries around your interests, budget and
                    travel pace.
                  </p>

                  <span className="tp2-feature-foot">Core intelligence →</span>
                </article>

                <article className="tp2-feature-card">
                  <div className="tp2-feature-card-top">
                    <span className="tp2-feature-status cyan">
                      <i /> ROUTE LIVE
                    </span>

                    <span className="tp2-feature-number">02</span>
                  </div>

                  <span className="tp2-feature-icon cyan">↗</span>

                  <h3>Smart Routes</h3>

                  <p>
                    Find better routes, shorter travel times and hidden gems.
                  </p>

                  <span className="tp2-feature-foot">
                    Continuously optimized
                  </span>
                </article>

                <article className="tp2-feature-card">
                  <div className="tp2-feature-card-top">
                    <span className="tp2-feature-status green">
                      <i /> LIVE SIGNALS
                    </span>

                    <span className="tp2-feature-number">03</span>
                  </div>

                  <span className="tp2-feature-icon green">☂</span>

                  <h3>Live Intelligence</h3>

                  <p>
                    Weather, budgets, opening hours and schedule changes checked
                    automatically.
                  </p>

                  <span className="tp2-feature-foot">Monitors the journey</span>
                </article>

                <article className="tp2-feature-card">
                  <div className="tp2-feature-card-top">
                    <span className="tp2-feature-status gold">
                      <i /> AUTO ADAPT
                    </span>

                    <span className="tp2-feature-number">04</span>
                  </div>

                  <span className="tp2-feature-icon gold">⟳</span>

                  <h3>Real-Time Replanning</h3>

                  <p>
                    Plans adapt instantly when weather, timing or priorities
                    change.
                  </p>

                  <span className="tp2-feature-foot">
                    Replans without starting over
                  </span>
                </article>
              </div>
            </section>
          }
        >
          <div className="tp2-expand-page">
            <div className="tp2-expand-hero-content">
              <span className="tp2-kicker">AI MEETS ADVENTURE</span>

              <h1>
                Plan less.
                <br />
                Travel <em>deeper.</em>
              </h1>

              <p className="tp2-expand-hero-copy">
                TravelPilot builds, checks and adapts your entire journey with
                AI — from smarter routes to weather, budgets and real-time
                replanning.
              </p>

              <div className="tp2-expand-hero-actions">
                <button
                  type="button"
                  className="tp2-primary-button"
                  onClick={onStartPlanning}
                >
                  Plan My Trip
                  <span>→</span>
                </button>

                <button
                  type="button"
                  className="tp2-secondary-button"
                  onClick={() => scrollToSection("tp2-how")}
                >
                  See how it works
                </button>
              </div>

              <div className="tp2-expand-trust-row">
                <span>✓ Smart routes</span>
                <span>◷ Live weather</span>
                <span>◉ Budget aware</span>
                <span>⚡ Instant replan</span>
              </div>
            </div>

            <aside
              className="tp2-hero-trip-card"
              aria-label="Live trip preview"
            >
              <div className="tp2-trip-card-top">
                <span>✦ LIVE JOURNEY</span>
                <small>AI PLANNED</small>
              </div>

              <strong>Dolomites Escape</strong>
              <p>7 days · Nature · Adventure</p>

              <div className="tp2-trip-card-route">
                <span>Venice</span>
                <i />
                <span>Cortina</span>
                <i />
                <span>Bolzano</span>
              </div>

              <div className="tp2-trip-card-footer">
                <span>☀ 18°C</span>
                <span>92% trip health</span>
              </div>
            </aside>
          </div>
        </ScrollExpand>
      </section>

      <main>
        <section
          className="tp2-how-section"
          id="tp2-how"
          style={{ "--tp2-how-bg": `url(${earthSpaceBg})` }}
        >
          <div className="tp2-how-heading">
            <span className="tp2-kicker">FROM IDEA TO JOURNEY</span>

            <h2>
              Three simple steps.
              <br />A smarter trip.
            </h2>
          </div>

          <div className="tp2-journey-map">
            <svg
              className="tp2-route-svg"
              viewBox="0 0 1440 280"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="tp2RouteGradient"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="45%" stopColor="#22d3ee" />
                  <stop offset="75%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#67e8f9" />
                </linearGradient>

                <filter id="tp2Glow">
                  <feGaussianBlur stdDeviation="7" result="blur" />

                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <path
                d="
                  M0 150
                  C140 80, 180 80, 300 145
                  S540 225, 690 145
                  S980 55, 1140 145
                  S1300 190, 1440 115
                "
                fill="none"
                stroke="url(#tp2RouteGradient)"
                strokeWidth="3"
                filter="url(#tp2Glow)"
              />
            </svg>

            <div className="tp2-step tp2-step-one">
              <div className="tp2-step-icon">♡</div>
              <span>01</span>
              <h3>Tell us your style</h3>
              <p>Choose destination, dates, budget and travel pace.</p>
            </div>

            <div className="tp2-step tp2-step-two">
              <div className="tp2-step-icon">⚙</div>
              <span>02</span>
              <h3>AI builds the journey</h3>

              <p>
                TravelPilot creates your itinerary using real places and travel
                intelligence.
              </p>
            </div>

            <div className="tp2-step tp2-step-three">
              <div className="tp2-step-icon">➤</div>
              <span>03</span>
              <h3>Your trip adapts</h3>

              <p>
                Budget, weather and schedule are continuously checked and
                improved.
              </p>
            </div>
          </div>

          <div className="tp2-world">
            <div className="tp2-world-card tp2-world-newyork">
              <img
                loading="lazy"
                src="https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=300&q=80"
                alt=""
              />

              <div>
                <strong>New York</strong>
                <span>USA</span>
              </div>
            </div>

            <div className="tp2-world-card tp2-world-paris">
              <img
                loading="lazy"
                src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=300&q=80"
                alt=""
              />

              <div>
                <strong>Paris</strong>
                <span>France</span>
              </div>
            </div>

            <div className="tp2-world-card tp2-world-bali">
              <img
                loading="lazy"
                src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=300&q=80"
                alt=""
              />

              <div>
                <strong>Bali</strong>
                <span>Indonesia</span>
              </div>
            </div>

            <div className="tp2-world-card tp2-world-tokyo">
              <img
                loading="lazy"
                src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=300&q=80"
                alt=""
              />

              <div>
                <strong>Tokyo</strong>
                <span>Japan</span>
              </div>
            </div>
          </div>
        </section>

        <section className="tp2-destinations" id="tp2-destinations">
          <span className="tp2-kicker">FIND YOUR NEXT STORY</span>

          <h2>Where will you go next?</h2>

          <p className="tp2-section-copy">
            Start with inspiration, then let TravelPilot build the journey
            around you.
          </p>

          <div className="tp2-destination-wrap">
            <button
              type="button"
              className="tp2-slider-arrow left"
              onClick={() => scrollDestinations("previous")}
              aria-label="Previous destinations"
            >
              ‹
            </button>

            <div className="tp2-destination-track" id="tp2-destination-track">
              {destinations.map((destination) => (
                <button
                  type="button"
                  className="tp2-destination-card"
                  key={destination.city}
                  style={{
                    backgroundImage: `url("${destination.image}")`,
                  }}
                  onClick={onStartPlanning}
                >
                  <span className="tp2-destination-shade" />

                  <span className="tp2-destination-copy">
                    <small>{destination.country}</small>
                    <strong>{destination.city}</strong>
                    <span>{destination.meta}</span>
                  </span>

                  <span className="tp2-destination-arrow">→</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="tp2-slider-arrow right"
              onClick={() => scrollDestinations("next")}
              aria-label="Next destinations"
            >
              ›
            </button>
          </div>
        </section>

        <div className="tp2-final-stories-background">
          <section className="tp2-final-cta tp2-final-stream" id="tp2-final">
            <ImageStreamHero
              images={finalStreamImages}
              cardCount={10}
              speed={22}
            />

            <div className="tp2-final-overlay" />

            <div className="tp2-final-content">
              <span className="tp2-kicker">
                READY FOR A BRIGHTER WAY TO TRAVEL?
              </span>

              <h2>
                Your next great trip
                <br />
                is just a click away.
              </h2>

              <p className="tp2-final-copy">
                Pick the feeling. TravelPilot turns it into a connected journey
                that keeps adapting while you travel.
              </p>

              <button
                type="button"
                className="tp2-primary-button"
                onClick={onStartPlanning}
              >
                Plan My Trip Now
                <span>→</span>
              </button>
            </div>
          </section>

          <section className="tp2-stories" id="tp2-stories">
            <div className="tp2-stories-overlay" />

            <div className="tp2-stories-inner">
              <div className="tp2-stories-header">
                <span className="tp2-kicker">
                  ⚡ TRAVELLERS LOVE TRAVELPILOT
                </span>

                <h2>Real trips. Happier travellers.</h2>

                <p>
                  See what our community is saying about their AI-planned
                  adventures.
                </p>
              </div>

              <div className="tp2-testimonials-columns">
                <TestimonialsColumn
                  testimonials={testimonialColumns[0]}
                  duration={15}
                />

                <TestimonialsColumn
                  testimonials={testimonialColumns[1]}
                  duration={19}
                  reverse
                  className="tp2-testimonials-column-middle"
                />

                <TestimonialsColumn
                  testimonials={testimonialColumns[2]}
                  duration={17}
                  className="tp2-testimonials-column-last"
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="tp2-footer">
        <div className="tp2-footer-brand">
          <div className="tp2-brand">
            <span className="tp2-brand-plane">✈</span>

            <span>
              Travel<span>Pilot</span>
            </span>
          </div>

          <p>AI-powered trip planning.</p>
        </div>

        <div className="tp2-footer-column">
          <strong>Product</strong>

          <button type="button" onClick={() => scrollToSection("tp2-features")}>
            Features
          </button>

          <button type="button" onClick={onStartPlanning}>
            Pricing
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("tp2-destinations")}
          >
            Destinations
          </button>

          <button type="button" onClick={() => window.scrollTo({ top: 0 })}>
            Updates
          </button>
        </div>

        <div className="tp2-footer-column">
          <strong>Company</strong>
          <button type="button">About</button>
          <button type="button">Blog</button>
          <button type="button">Careers</button>
          <button type="button">Contact</button>
        </div>

        <div className="tp2-footer-column">
          <strong>Legal</strong>
          <button type="button">Privacy</button>
          <button type="button">Terms</button>
          <button type="button">Cookies</button>
        </div>

        <div className="tp2-footer-social">
          <div>
            <span>𝕏</span>
            <span>◎</span>
            <span>◧</span>
            <span>in</span>
          </div>

          <p>© 2026 TravelPilot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function SplitFlapDestination({ text = "" }) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (!text) {
      setDisplayText("");
      return;
    }

    let frame = 0;

    const totalFrames = Math.max(18, Math.ceil(text.length * 0.48) + 5);

    const interval = window.setInterval(() => {
      frame += 1;

      const next = text
        .split("")
        .map((character, index) => {
          if (character === " " || !/[A-Za-z0-9]/.test(character)) {
            return character;
          }

          const settleFrame = 4 + Math.floor(index * 0.45);

          if (frame >= settleFrame) {
            return character;
          }

          return characters[Math.floor(Math.random() * characters.length)];
        })
        .join("");

      setDisplayText(next);

      if (frame >= totalFrames) {
        window.clearInterval(interval);
        setDisplayText(text);
      }
    }, 55);

    return () => window.clearInterval(interval);
  }, [text]);

  const words = text.split(" ");

  let globalIndex = 0;

  return (
    <div className="split-flap-title-wrap">
      <h1 className="split-flap-destination" aria-label={text}>
        {words.map((word, wordIndex) => {
          const startIndex = globalIndex;

          globalIndex += word.length + 1;

          return (
            <span className="split-flap-word" key={`word-${wordIndex}`}>
              {word.split("").map((originalCharacter, index) => {
                const sourceIndex = startIndex + index;

                const visibleCharacter =
                  displayText[sourceIndex] || originalCharacter;

                const punctuation = !/[A-Za-z0-9]/.test(originalCharacter);

                if (punctuation) {
                  return (
                    <span
                      className="split-flap-punctuation"
                      key={`char-${sourceIndex}`}
                    >
                      {originalCharacter}
                    </span>
                  );
                }

                return (
                  <span
                    className="split-flap-cell"
                    key={`char-${sourceIndex}`}
                    style={{
                      "--flap-delay": `${Math.min(sourceIndex * 16, 260)}ms`,
                    }}
                  >
                    <span className="split-flap-character">
                      {visibleCharacter}
                    </span>
                  </span>
                );
              })}

              {wordIndex < words.length - 1 && (
                <span className="split-flap-space" aria-hidden="true" />
              )}
            </span>
          );
        })}
      </h1>
    </div>
  );
}

function TripLoadingPage({ destination, onCancel }) {
  const [activeStep, setActiveStep] = useState(0);

  const [progress, setProgress] = useState(12);

  const steps = [
    {
      title: "Reading your preferences",
      text: "Understanding your travel style, dates and interests.",
    },
    {
      title: "Finding the best places",
      text: "Searching for experiences that fit your trip.",
    },
    {
      title: "Building smart routes",
      text: "Grouping nearby places and reducing unnecessary travel.",
    },
    {
      title: "Balancing your budget",
      text: "Checking activities against your planned spend.",
    },
    {
      title: "Finalizing your itinerary",
      text: "Putting the finishing touches on your journey.",
    },
  ];

  useEffect(() => {
    const stepTimers = [
      setTimeout(() => setActiveStep(1), 2500),
      setTimeout(() => setActiveStep(2), 6000),
      setTimeout(() => setActiveStep(3), 10000),
      setTimeout(() => setActiveStep(4), 14500),
    ];

    return () => {
      stepTimers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    const targets = [20, 42, 64, 82, 94];

    const target = targets[activeStep];

    const interval = setInterval(() => {
      setProgress((current) => {
        if (current >= target) {
          return current;
        }

        return Math.min(current + 1, target);
      });
    }, 90);

    return () => clearInterval(interval);
  }, [activeStep]);

  useEffect(() => {
    if (activeStep !== 4) return;

    const finalProgress = setInterval(() => {
      setProgress((current) => {
        if (current >= 99) {
          return current;
        }

        return current + 1;
      });
    }, 1600);

    return () => clearInterval(finalProgress);
  }, [activeStep]);

  return (
    <div className="trip-loading-page">
      <div className="trip-loading-bg" />

      <div className="trip-loading-card">
        <div className="trip-loading-brand">
          <span className="trip-loading-plane">✈</span>

          <div>
            <strong>
              Travel
              <span>Pilot</span>
            </strong>

            <small>AI JOURNEY ENGINE</small>
          </div>
        </div>

        <div className="trip-loading-heading">
          <span className="trip-loading-kicker">✦ BUILDING YOUR JOURNEY</span>

          <h1>
            Your trip is
            <br />
            taking shape.
          </h1>

          <p>
            Planning your journey
            {destination ? (
              <>
                {" "}
                to <strong>{destination.split(",")[0]}</strong>
              </>
            ) : null}
            .
          </p>
        </div>

        <div className="trip-loading-progress">
          <div className="trip-loading-progress-info">
            <span>Trip intelligence</span>

            <strong>{progress}%</strong>
          </div>

          <div className="trip-loading-progress-track">
            <span
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <div className="trip-loading-steps">
          {steps.map((step, index) => {
            const completed = index < activeStep;

            const active = index === activeStep;

            return (
              <div
                className={`trip-loading-step ${completed ? "completed" : ""} ${
                  active ? "active" : ""
                }`}
                key={step.title}
              >
                <div className="trip-loading-step-marker">
                  {completed ? "✓" : index + 1}
                </div>

                <div>
                  <strong>{step.title}</strong>

                  <p>{step.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="trip-loading-footer">
          <div className="trip-loading-ai-status">
            <span className="trip-loading-live-dot" />
            TravelPilot AI is working
          </div>

          <button
            type="button"
            className="trip-loading-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="trip-loading-orbit orbit-one" />
      <div className="trip-loading-orbit orbit-two" />
    </div>
  );
}

const getPhotonSuggestions = async ({
  input,
  mode = "destination",
  destination = "",
}) => {
  const cleanInput = String(input || "").trim();
  const cleanDestination = String(destination || "").trim();

  if (!cleanInput) return [];

  const query =
    mode === "mustVisit" && cleanDestination
      ? `${cleanInput}, ${cleanDestination}`
      : cleanInput;

  const params = new URLSearchParams({
    q: query,
    limit: "8",
    lang: "en",
  });

  const response = await fetch(
    `https://photon.komoot.io/api/?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Photon autocomplete failed (${response.status}).`);
  }

  const data = await response.json();
  const features = Array.isArray(data?.features) ? data.features : [];

  return features
    .map((feature) => {
      const properties = feature?.properties || {};

      const parts = [
        properties.name,
        properties.street,
        properties.city,
        properties.district,
        properties.state,
        properties.country,
      ].filter(Boolean);

      const uniqueParts = [...new Set(parts)];
      const text = uniqueParts.join(", ");

      const mainText =
        properties.name ||
        properties.city ||
        properties.district ||
        properties.state ||
        text;

      const secondaryText = uniqueParts
        .filter((part) => part !== mainText)
        .join(", ");

      const osmType = properties.osm_type || properties.type || "place";
      const osmId =
        properties.osm_id || feature?.geometry?.coordinates?.join("-") || text;

      return {
        placeId: `photon-${osmType}-${osmId}`,
        text,
        mainText,
        secondaryText,
        provider: "photon",
      };
    })
    .filter((item) => item.text)
    .slice(0, 7);
};

function App() {
  const [plannerStarted, setPlannerStarted] = useState(false);

  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    budget: "",
    interests: [],
    travelPace: "Balanced",
    mustVisit: "",
    transportType: "",
    transportDetails: "",
    transportStatus: "Planned",
    accommodationBookingRef: "",
    accommodationStatus: "Planned",
  });

  const [destinationSuggestions, setDestinationSuggestions] = useState([]);

  const [destinationSearching, setDestinationSearching] = useState(false);

  const [showDestinationSuggestions, setShowDestinationSuggestions] =
    useState(false);

  const [destinationError, setDestinationError] = useState("");

  const destinationTimerRef = useRef(null);

  const destinationRequestIdRef = useRef(0);

  const [tripGenerated, setTripGenerated] = useState(false);

  const [itinerary, setItinerary] = useState([]);

  const [loading, setLoading] = useState(false);

  const generateTripAbortRef = useRef(null);

  const [fallbackMode, setFallbackMode] = useState(false);

  const [fallbackMessage, setFallbackMessage] = useState("");

  const [chatMessage, setChatMessage] = useState("");

  const [chatAnswer, setChatAnswer] = useState("");

  const [chatLoading, setChatLoading] = useState(false);

  const [budgetOptimizing, setBudgetOptimizing] = useState(false);

  const [budgetOptimizationMessage, setBudgetOptimizationMessage] =
    useState("");

  const [replacingActivity, setReplacingActivity] = useState(null);

  const [fixingConflict, setFixingConflict] = useState(false);

  const [conflictFixMessage, setConflictFixMessage] = useState("");

  const [appError, setAppError] = useState("");

  const [tripId, setTripId] = useState(null);

  const [transportation, setTransportation] = useState({});

  const [accommodation, setAccommodation] = useState({});

  const [realWorldStatus, setRealWorldStatus] = useState({});

  const [weatherAdapting, setWeatherAdapting] = useState(false);

  const [weatherMessage, setWeatherMessage] = useState("");

  const [applyingInsight, setApplyingInsight] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);

  const [tripHistory, setTripHistory] = useState([]);

  const [historyLoading, setHistoryLoading] = useState(false);

  const [historyMessage, setHistoryMessage] = useState("");

  const [assistantOpen, setAssistantOpen] = useState(false);

  const interests = [
    "Food",
    "Culture",
    "Shopping",
    "Adventure",
    "Nightlife",
    "Nature",
  ];

  const travelPaces = ["Relaxed", "Balanced", "Packed"];

  const interestMeta = {
    Food: {
      icon: "🍜",
      description: "Local flavors",
    },

    Culture: {
      icon: "🏛️",
      description: "Art & heritage",
    },

    Shopping: {
      icon: "🛍️",
      description: "Markets & finds",
    },

    Adventure: {
      icon: "🧗",
      description: "Thrills & action",
    },

    Nightlife: {
      icon: "🌙",
      description: "After-dark energy",
    },

    Nature: {
      icon: "🌿",
      description: "Outdoors & views",
    },
  };

  const [transportOpen, setTransportOpen] = useState(false);

  const [accommodationOpen, setAccommodationOpen] = useState(false);

  const [mustVisitPlaces, setMustVisitPlaces] = useState([]);

  const [mustVisitInput, setMustVisitInput] = useState("");

  const [mustVisitSuggestions, setMustVisitSuggestions] = useState([]);

  const [mustVisitSearching, setMustVisitSearching] = useState(false);

  const [showMustVisitSuggestions, setShowMustVisitSuggestions] =
    useState(false);

  const [mustVisitError, setMustVisitError] = useState("");

  const mustVisitTimerRef = useRef(null);

  const mustVisitRequestIdRef = useRef(0);

  // =====================================
  // API ERROR HELPER
  // =====================================

  const getApiErrorMessage = async (response, fallbackMessage) => {
    try {
      const data = await response.json();

      return data.message || data.error || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  };

  const getShortPlaceName = (value) => {
    if (!value) return "";

    return value.split(",")[0].trim();
  };

  const getTripDayCount = () => {
    if (!formData.startDate || !formData.endDate) {
      return null;
    }

    const start = new Date(`${formData.startDate}T00:00:00`);

    const end = new Date(`${formData.endDate}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }

    const difference = Math.round((end - start) / 86400000);

    return difference >= 0 ? difference + 1 : null;
  };

  const formatShortDate = (value) => {
    if (!value) return "";

    const [year, month, day] = value.split("-").map(Number);

    if (!year || !month || !day) {
      return value;
    }

    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const tripDayCount = getTripDayCount();

  const plannerReadiness = Math.round(
    ([
      formData.destination,
      formData.startDate,
      formData.endDate,
      Number(formData.budget || 0) > 0,
      formData.interests.length > 0,
    ].filter(Boolean).length /
      5) *
      100,
  );

  // =====================================
  // FORM
  // =====================================

  const handleChange = (e) => {
    setFormData({
      ...formData,

      [e.target.name]: e.target.value,
    });
  };

  const fetchPlaceSuggestions = async ({
    input,
    mode = "destination",
    destination = "",
  }) => {
    const cleanInput = String(input || "").trim();

    if (!cleanInput) {
      return [];
    }

    const params = new URLSearchParams({
      q: cleanInput,
      mode,
    });

    if (destination.trim()) {
      params.set("destination", destination.trim());
    }

    let backendError = null;

    try {
      const response = await fetch(
        `${API_URL}/api/place-suggestions?${params.toString()}`,
      );

      if (response.ok) {
        const data = await response.json();

        const suggestions = data.suggestions || [];

        if (suggestions.length > 0) {
          return suggestions;
        }
      } else {
        const message = await getApiErrorMessage(
          response,

          "Could not load place suggestions.",
        );

        backendError = new Error(message);
      }
    } catch (error) {
      backendError = error;
    }

    try {
      const fallbackSuggestions = await getPhotonSuggestions({
        input: cleanInput,

        mode,

        destination,
      });

      if (fallbackSuggestions.length > 0) {
        return fallbackSuggestions;
      }
    } catch (fallbackError) {
      console.error(
        "Photon autocomplete fallback failed:",

        fallbackError,
      );
    }

    if (backendError) {
      throw backendError;
    }

    return [];
  };

  const handleDestinationChange = (e) => {
    const value = e.target.value;

    setFormData((current) => ({
      ...current,

      destination: value,

      mustVisit: "",
    }));

    setMustVisitPlaces([]);

    setMustVisitInput("");

    setMustVisitSuggestions([]);

    setShowMustVisitSuggestions(false);

    setDestinationError("");

    if (destinationTimerRef.current) {
      clearTimeout(destinationTimerRef.current);
    }

    if (value.trim().length < 2) {
      setDestinationSuggestions([]);

      setShowDestinationSuggestions(false);

      setDestinationSearching(false);

      return;
    }

    setDestinationSearching(true);

    destinationTimerRef.current = setTimeout(async () => {
      const requestId = ++destinationRequestIdRef.current;

      try {
        const suggestions = await fetchPlaceSuggestions({
          input: value,

          mode: "destination",
        });

        if (requestId !== destinationRequestIdRef.current) {
          return;
        }

        setDestinationSuggestions(suggestions);

        setShowDestinationSuggestions(suggestions.length > 0);

        if (suggestions.length === 0) {
          setDestinationError("No matching destinations found.");
        }
      } catch (error) {
        console.error(
          "Destination autocomplete error:",

          error,
        );

        if (requestId !== destinationRequestIdRef.current) {
          return;
        }

        setDestinationSuggestions([]);

        setShowDestinationSuggestions(false);

        setDestinationError(
          error.message || "Could not load destination suggestions.",
        );
      } finally {
        if (requestId === destinationRequestIdRef.current) {
          setDestinationSearching(false);
        }
      }
    }, 280);
  };

  const selectDestination = (prediction) => {
    const destination =
      prediction.text ||
      [prediction.mainText, prediction.secondaryText]
        .filter(Boolean)
        .join(", ");

    if (!destination) return;

    setFormData((current) => ({
      ...current,

      destination,

      mustVisit: "",
    }));

    setMustVisitPlaces([]);

    setMustVisitInput("");

    setMustVisitSuggestions([]);

    setShowMustVisitSuggestions(false);

    setDestinationSuggestions([]);

    setShowDestinationSuggestions(false);

    setDestinationError("");
  };

  const handleMustVisitChange = (e) => {
    const value = e.target.value;

    setMustVisitInput(value);

    setMustVisitError("");

    if (mustVisitTimerRef.current) {
      clearTimeout(mustVisitTimerRef.current);
    }

    if (value.trim().length < 2) {
      setMustVisitSuggestions([]);

      setShowMustVisitSuggestions(false);

      setMustVisitSearching(false);

      return;
    }

    setMustVisitSearching(true);

    mustVisitTimerRef.current = setTimeout(async () => {
      const requestId = ++mustVisitRequestIdRef.current;

      try {
        const suggestions = await fetchPlaceSuggestions({
          input: value,

          mode: "mustVisit",

          destination: formData.destination,
        });

        if (requestId !== mustVisitRequestIdRef.current) {
          return;
        }

        setMustVisitSuggestions(suggestions.slice(0, 6));

        setShowMustVisitSuggestions(suggestions.length > 0);

        if (suggestions.length === 0) {
          setMustVisitError("No matching places found.");
        }
      } catch (error) {
        console.error(
          "Must-visit autocomplete error:",

          error,
        );

        if (requestId !== mustVisitRequestIdRef.current) {
          return;
        }

        setMustVisitSuggestions([]);

        setShowMustVisitSuggestions(false);

        setMustVisitError(error.message || "Could not load place suggestions.");
      } finally {
        if (requestId === mustVisitRequestIdRef.current) {
          setMustVisitSearching(false);
        }
      }
    }, 280);
  };

  const selectMustVisit = (prediction) => {
    const placeLabel =
      prediction.text ||
      [prediction.mainText, prediction.secondaryText]
        .filter(Boolean)
        .join(", ");

    if (!placeLabel) return;

    const alreadyAdded = mustVisitPlaces.some(
      (item) => item.toLowerCase() === placeLabel.toLowerCase(),
    );

    const nextPlaces = alreadyAdded
      ? mustVisitPlaces
      : [...mustVisitPlaces, placeLabel];

    setMustVisitPlaces(nextPlaces);

    setFormData((current) => ({
      ...current,

      mustVisit: nextPlaces.join("; "),
    }));

    setMustVisitInput("");

    setMustVisitSuggestions([]);

    setShowMustVisitSuggestions(false);

    setMustVisitError("");
  };

  const removeMustVisit = (indexToRemove) => {
    const nextPlaces = mustVisitPlaces.filter(
      (_, index) => index !== indexToRemove,
    );

    setMustVisitPlaces(nextPlaces);

    setFormData((current) => ({
      ...current,

      mustVisit: nextPlaces.join("; "),
    }));
  };

  const toggleInterest = (interest) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,

        interests: formData.interests.filter((item) => item !== interest),
      });
    } else {
      setFormData({
        ...formData,

        interests: [...formData.interests, interest],
      });
    }
  };

  const selectTravelPace = (pace) => {
    setFormData({
      ...formData,

      travelPace: pace,
    });
  };

  // =====================================
  // GENERATE TRIP
  // =====================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    setAppError("");

    setFallbackMode(false);

    setFallbackMessage("");

    setBudgetOptimizationMessage("");

    setConflictFixMessage("");

    const controller = new AbortController();

    generateTripAbortRef.current = controller;

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });

    try {
      const response = await fetch(`${API_URL}/api/generate-trip`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(formData),

        signal: controller.signal,
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,

          "Could not generate your trip.",
        );

        throw new Error(message);
      }

      const data = await response.json();

      setItinerary(data.days || []);

      setTripId(data.tripId || null);

      setTransportation(data.transportation || {});

      setAccommodation(data.accommodation || {});

      setRealWorldStatus(data.realWorldStatus || {});

      setFallbackMode(Boolean(data.fallback));

      if (data.fallback) {
        setFallbackMessage(
          data.message ||
            "TravelPilot is using demo fallback mode because the AI service is temporarily unavailable.",
        );
      }

      setTripGenerated(true);
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      console.error(
        "Generate trip error:",

        error,
      );

      setAppError(error.message);
    } finally {
      generateTripAbortRef.current = null;

      setLoading(false);
    }
  };

  const handleCancelGeneration = () => {
    if (generateTripAbortRef.current) {
      generateTripAbortRef.current.abort();
    }

    setLoading(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================
  // REPLAN ACTIVITY
  // =====================================

  const handleCancelActivity = async (dayIndex, activityIndex) => {
    if (replacingActivity !== null) {
      return;
    }

    const activityKey = `${dayIndex}-${activityIndex}`;

    setReplacingActivity(activityKey);

    setAppError("");

    try {
      const cancelledActivity = itinerary[dayIndex].activities[activityIndex];

      const currentDayActivities = itinerary[dayIndex].activities.filter(
        (_, index) => index !== activityIndex,
      );

      const response = await fetch(`${API_URL}/api/replan`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          destination: formData.destination,

          interests: formData.interests,

          travelPace: formData.travelPace,

          budget: formData.budget,

          cancelledActivity,

          currentDayActivities,
        }),
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,

          "Could not find a replacement activity.",
        );

        throw new Error(message);
      }

      const data = await response.json();

      if (data.fallback) {
        setFallbackMode(true);

        setFallbackMessage(
          "TravelPilot used fallback mode for this replacement because Gemini quota is temporarily unavailable.",
        );
      }

      const updatedItinerary = itinerary.map((day, currentDayIndex) => {
        if (currentDayIndex !== dayIndex) {
          return day;
        }

        return {
          ...day,

          activities: day.activities.map((activity, currentActivityIndex) => {
            if (currentActivityIndex !== activityIndex) {
              return activity;
            }

            return {
              ...data.replacement,

              replaced: true,

              originalActivity: cancelledActivity.name,
            };
          }),
        };
      });

      setItinerary(updatedItinerary);
    } catch (error) {
      console.error(
        "Replan error:",

        error,
      );

      setAppError(error.message);
    } finally {
      setReplacingActivity(null);
    }
  };

  // =====================================
  // CHAT
  // =====================================

  const handleChat = async (messageToSend = chatMessage) => {
    if (!messageToSend.trim() || chatLoading) {
      return;
    }

    setChatLoading(true);

    setChatAnswer("");

    setAppError("");

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          message: messageToSend,

          destination: formData.destination,

          budget: formData.budget,

          interests: formData.interests,

          travelPace: formData.travelPace,

          itinerary,
        }),
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,

          "TravelPilot could not answer your question.",
        );

        throw new Error(message);
      }

      const data = await response.json();

      setChatAnswer(data.answer);

      setChatMessage("");
    } catch (error) {
      console.error("Chat error:", error);

      setChatAnswer(error.message);
    } finally {
      setChatLoading(false);
    }
  };

  // =====================================
  // BUDGET
  // =====================================

  const calculateTotalCost = () => {
    return itinerary.reduce((tripTotal, day) => {
      const dayTotal = (day.activities || []).reduce((total, activity) => {
        return total + Number(activity.cost || 0);
      }, 0);

      return tripTotal + dayTotal;
    }, 0);
  };

  const totalCost = calculateTotalCost();

  const budgetAmount = Number(formData.budget || 0);

  const remainingBudget = budgetAmount - totalCost;

  const isOverBudget = totalCost > budgetAmount;

  // =====================================
  // BUDGET OPTIMIZATION
  // =====================================

  const handleOptimizeBudget = async () => {
    if (budgetOptimizing) {
      return;
    }

    setBudgetOptimizing(true);

    setBudgetOptimizationMessage("");

    setAppError("");

    try {
      const response = await fetch(`${API_URL}/api/optimize-budget`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          destination: formData.destination,

          budget: formData.budget,

          interests: formData.interests,

          travelPace: formData.travelPace,

          itinerary,
        }),
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,

          "Could not optimize the trip budget.",
        );

        throw new Error(message);
      }

      const data = await response.json();

      setItinerary(data.days || []);

      setBudgetOptimizationMessage(
        data.summary?.changes ||
          "TravelPilot optimized your itinerary to reduce costs.",
      );
    } catch (error) {
      console.error(
        "Budget optimization error:",

        error,
      );

      setBudgetOptimizationMessage(error.message);
    } finally {
      setBudgetOptimizing(false);
    }
  };

  // =====================================
  // TIME HELPERS
  // =====================================

  const convertToMinutes = (time) => {
    if (!time || typeof time !== "string") {
      return 0;
    }

    const parts = time.trim().split(" ");

    if (parts.length < 2) {
      return 0;
    }

    const rawTime = parts[0];

    const modifier = parts[1].toUpperCase();

    let [hours, minutes] = rawTime.split(":").map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return 0;
    }

    if (modifier === "PM" && hours !== 12) {
      hours += 12;
    }

    if (modifier === "AM" && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    let hours = Math.floor(minutes / 60);

    const mins = minutes % 60;

    const modifier = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;

    if (hours === 0) {
      hours = 12;
    }

    return `${hours}:${String(mins).padStart(2, "0")} ${modifier}`;
  };

  // =====================================
  // CONFLICT DETECTION
  // =====================================

  const detectConflicts = () => {
    const conflicts = [];

    itinerary.forEach((day, dayIndex) => {
      const activities = day.activities || [];

      for (let i = 0; i < activities.length - 1; i++) {
        const current = activities[i];

        const next = activities[i + 1];

        const currentStart = convertToMinutes(current.time);

        const nextStart = convertToMinutes(next.time);

        const durationMinutes = Number(current.durationMinutes || 60);

        const travelToNext = Number(next.travelMinutesFromPrevious || 0);

        const currentEnd = currentStart + durationMinutes;

        const earliestArrival = currentEnd + travelToNext;

        if (currentStart > 0 && nextStart > 0 && earliestArrival > nextStart) {
          conflicts.push({
            dayIndex,

            dayNumber: day.day,

            firstActivity: current.name,

            secondActivity: next.name,

            currentEnd,

            travelToNext,

            nextStart,

            earliestArrival,

            conflictMinutes: earliestArrival - nextStart,
          });
        }
      }
    });

    return conflicts;
  };

  const conflicts = detectConflicts();

  // =====================================
  // FIX CONFLICT
  // =====================================

  const handleFixConflict = async (conflict) => {
    if (fixingConflict) {
      return;
    }

    setFixingConflict(true);

    setConflictFixMessage("");

    setAppError("");

    try {
      const day = itinerary[conflict.dayIndex];

      if (!day) {
        throw new Error("Could not locate the affected itinerary day.");
      }

      const conflictingActivities = [
        day.activities.find(
          (activity) => activity.name === conflict.firstActivity,
        ),

        day.activities.find(
          (activity) => activity.name === conflict.secondActivity,
        ),
      ].filter(Boolean);

      const response = await fetch(`${API_URL}/api/fix-conflict`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          destination: formData.destination,

          budget: formData.budget,

          interests: formData.interests,

          travelPace: formData.travelPace,

          dayNumber: day.day,

          conflictingActivities,

          currentDayActivities: day.activities,
        }),
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,

          "Could not fix the schedule conflict.",
        );

        throw new Error(message);
      }

      const data = await response.json();

      const updatedItinerary = itinerary.map((currentDay, currentDayIndex) => {
        if (currentDayIndex !== conflict.dayIndex) {
          return currentDay;
        }

        return {
          ...currentDay,

          activities: data.updatedActivities || currentDay.activities,
        };
      });

      setItinerary(updatedItinerary);

      setConflictFixMessage(
        data.reason ||
          "TravelPilot adjusted the schedule to remove the conflict.",
      );
    } catch (error) {
      console.error(
        "Fix conflict error:",

        error,
      );

      setConflictFixMessage(error.message);
    } finally {
      setFixingConflict(false);
    }
  };

  // =====================================
  // WEATHER DISRUPTION
  // =====================================

  const highWeatherRisk = itinerary.some((day) => day.weather?.risk === "high");

  const handleAdaptWeather = async () => {
    if (weatherAdapting) {
      return;
    }

    setWeatherAdapting(true);

    setWeatherMessage("");

    try {
      const response = await fetch(`${API_URL}/api/adapt-weather`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          destination: formData.destination,

          itinerary,
        }),
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,

          "Could not adapt the itinerary for weather.",
        );

        throw new Error(message);
      }

      const data = await response.json();

      setItinerary(data.days || itinerary);

      setWeatherMessage(data.message || "Itinerary adapted for weather.");
    } catch (error) {
      setWeatherMessage(error.message);
    } finally {
      setWeatherAdapting(false);
    }
  };

  // =====================================
  // TRAVELPILOT LIVE INTELLIGENCE
  // =====================================

  const allActivities = itinerary.flatMap((day) => day.activities || []);

  const closedActivityCount = allActivities.filter(
    (activity) => activity.openingHoursStatus === "closed",
  ).length;

  const verifiedPlaceCount = allActivities.filter(
    (activity) => activity.realPlaceVerified,
  ).length;

  const totalTravelMinutes = allActivities.reduce(
    (total, activity) =>
      total + Number(activity.travelMinutesFromPrevious || 0),
    0,
  );

  const dayTravelStats = itinerary.map((day) => ({
    day: day.day,

    title: day.title,

    minutes: (day.activities || []).reduce(
      (total, activity) =>
        total + Number(activity.travelMinutesFromPrevious || 0),
      0,
    ),
  }));

  const heaviestTravelDay =
    [...dayTravelStats].sort((a, b) => b.minutes - a.minutes)[0] || null;

  const packedDays = itinerary.filter(
    (day) => (day.activities || []).length >= 6,
  );

  const firstClosedDay = itinerary.find((day) =>
    (day.activities || []).some(
      (activity) => activity.openingHoursStatus === "closed",
    ),
  );

  const formatTravelMinutes = (minutes) => {
    if (!minutes) {
      return "0 min";
    }

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);

    const remainingMinutes = minutes % 60;

    return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  let calculatedTripHealthScore = 100;

  if (isOverBudget) {
    calculatedTripHealthScore -= 20;
  }

  if (conflicts.length > 0) {
    calculatedTripHealthScore -= Math.min(conflicts.length * 10, 20);
  }

  if (highWeatherRisk) {
    calculatedTripHealthScore -= 15;
  }

  if (closedActivityCount > 0) {
    calculatedTripHealthScore -= 12;
  }

  if (totalTravelMinutes > 240) {
    calculatedTripHealthScore -= 8;
  }

  if (packedDays.length > 0) {
    calculatedTripHealthScore -= Math.min(packedDays.length * 5, 10);
  }

  const tripHealthScore = Math.max(
    35,
    Math.min(
      100,

      calculatedTripHealthScore,
    ),
  );

  const tripHealthLabel =
    tripHealthScore >= 90
      ? "Ready to go"
      : tripHealthScore >= 75
        ? "Looking strong"
        : tripHealthScore >= 60
          ? "Needs a little tuning"
          : "Needs attention";

  const tripInsights = [];

  if (conflicts.length > 0) {
    const conflict = conflicts[0];

    tripInsights.push({
      id: "schedule-conflict",

      type: "schedule",

      icon: "◷",

      eyebrow: "SCHEDULE",

      title: `${conflicts.length} schedule ${
        conflicts.length === 1 ? "conflict" : "conflicts"
      } detected`,

      description: `Day ${conflict.dayNumber} has ${conflict.conflictMinutes} minutes of overlap between ${conflict.firstActivity} and ${conflict.secondActivity}.`,

      action: "conflict",

      actionLabel: "Fix conflict",
    });
  }

  if (highWeatherRisk) {
    tripInsights.push({
      id: "weather-risk",

      type: "weather",

      icon: "☂",

      eyebrow: "WEATHER WATCH",

      title: "Weather may disrupt part of your trip",

      description:
        "TravelPilot found outdoor activities that may be affected and can replace or reschedule them.",

      action: "weather",

      actionLabel: "Adapt itinerary",
    });
  }

  if (isOverBudget) {
    tripInsights.push({
      id: "budget-risk",

      type: "budget",

      icon: "₹",

      eyebrow: "BUDGET WATCH",

      title: `You're ₹${Math.abs(remainingBudget).toLocaleString(
        "en-IN",
      )} over budget`,

      description:
        "TravelPilot can look for lower-cost alternatives while protecting your main interests.",

      action: "budget",

      actionLabel: "Optimize budget",
    });
  }

  if (closedActivityCount > 0) {
    tripInsights.push({
      id: "closed-place",

      type: "place",

      icon: "⌖",

      eyebrow: "PLACE CHECK",

      title: `${closedActivityCount} ${
        closedActivityCount === 1 ? "place appears" : "places appear"
      } closed`,

      description:
        "Review the affected stop before travelling so you do not arrive when it is unavailable.",

      action: "scroll-day",

      dayNumber: firstClosedDay?.day,

      actionLabel: "Review day",
    });
  }

  if (heaviestTravelDay && heaviestTravelDay.minutes >= 120) {
    tripInsights.push({
      id: "travel-load",

      type: "route",

      icon: "↗",

      eyebrow: "ROUTE INTELLIGENCE",

      title: `Day ${heaviestTravelDay.day} has ${formatTravelMinutes(
        heaviestTravelDay.minutes,
      )} of travel`,

      description:
        "This is your most travel-heavy day. Consider grouping nearby activities or removing one distant stop.",

      action: "scroll-day",

      dayNumber: heaviestTravelDay.day,

      actionLabel: "Review day",
    });
  }

  if (packedDays.length > 0) {
    const packedDay = packedDays[0];

    tripInsights.push({
      id: "pace-warning",

      type: "pace",

      icon: "⚡",

      eyebrow: "PACE CHECK",

      title: `Day ${packedDay.day} is especially packed`,

      description: `${packedDay.activities.length} activities are planned. You may want more breathing room between stops.`,

      action: "scroll-day",

      dayNumber: packedDay.day,

      actionLabel: "Review day",
    });
  }

  if (tripInsights.length === 0) {
    tripInsights.push({
      id: "healthy-trip",

      type: "success",

      icon: "✦",

      eyebrow: "TRAVELPILOT LIVE",

      title: "Your itinerary looks healthy",

      description:
        "No major budget, timing, weather, opening-hours or pacing problems are currently detected.",

      action: null,
    });
  }

  const visibleTripInsights = tripInsights.slice(0, 4);

  const handleInsightAction = async (insight) => {
    if (!insight?.action || applyingInsight) {
      return;
    }

    setApplyingInsight(insight.id);

    try {
      if (insight.action === "weather") {
        await handleAdaptWeather();
      }

      if (insight.action === "budget") {
        await handleOptimizeBudget();
      }

      if (insight.action === "conflict" && conflicts.length > 0) {
        await handleFixConflict(conflicts[0]);
      }

      if (insight.action === "scroll-day" && insight.dayNumber) {
        const element = document.getElementById(`day-${insight.dayNumber}`);

        if (element) {
          element.scrollIntoView({
            behavior: "smooth",

            block: "start",
          });
        }
      }
    } finally {
      setApplyingInsight(null);
    }
  };

  // =====================================
  // TRIP HISTORY
  // =====================================

  const loadTripHistory = async () => {
    setHistoryOpen(true);

    setHistoryLoading(true);

    setHistoryMessage("");

    try {
      const response = await fetch(`${API_URL}/api/trips`);

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,

          "Could not load trip history.",
        );

        throw new Error(message);
      }

      const data = await response.json();

      setTripHistory(data.trips || []);

      if (!data.configured) {
        setHistoryMessage(data.message || "Supabase is not configured.");
      }
    } catch (error) {
      setHistoryMessage(error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadSavedTrip = (trip) => {
    setFormData({
      ...formData,

      destination: trip.destination || "",

      startDate: trip.start_date || "",

      endDate: trip.end_date || "",

      budget: String(trip.budget || ""),

      interests: trip.interests || [],

      travelPace: trip.travel_pace || "Balanced",

      mustVisit: trip.must_visit || "",

      transportType: trip.transportation?.type || "",

      transportDetails: trip.transportation?.details || "",

      transportStatus: trip.transportation?.status || "Planned",

      accommodationBookingRef: trip.accommodation?.bookingRef || "",

      accommodationStatus: trip.accommodation?.status || "Planned",
    });

    const savedMustVisit = String(trip.must_visit || "")
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean);

    setMustVisitPlaces(savedMustVisit);

    setMustVisitInput("");

    setMustVisitSuggestions([]);

    setShowMustVisitSuggestions(false);

    setTransportOpen(false);

    setAccommodationOpen(false);

    setItinerary(trip.itinerary || []);

    setTripId(trip.id || null);

    setTransportation(trip.transportation || {});

    setAccommodation(trip.accommodation || {});

    setRealWorldStatus(trip.real_world_status || {});

    setFallbackMode(Boolean(trip.fallback));

    setFallbackMessage(
      trip.fallback
        ? "This saved trip was created while TravelPilot was in fallback mode."
        : "",
    );

    setTripGenerated(true);

    setHistoryOpen(false);
  };

  const IntegrationBadge = ({ label, value }) => {
    const active = value === "enabled" || value === "fallback";

    return (
      <span
        className={`integration-badge ${
          active ? "integration-on" : "integration-off"
        }`}
      >
        {label}:{" "}
        {value === "enabled"
          ? "Live"
          : value === "fallback"
            ? "Fallback"
            : "Not configured"}
      </span>
    );
  };

  // =====================================
  // DASHBOARD
  // =====================================

  if (historyOpen) {
    return (
      <div className="history-page">
        <div className="history-header">
          <div>
            <p className="dashboard-logo">✈ TravelPilot</p>

            <h1>Trip History</h1>
          </div>

          <button
            className="edit-trip-button"
            onClick={() => setHistoryOpen(false)}
          >
            Back
          </button>
        </div>

        {historyLoading && <p>Loading saved trips...</p>}

        {historyMessage && (
          <div className="history-message">{historyMessage}</div>
        )}

        <div className="history-grid">
          {tripHistory.map((trip) => (
            <button
              className="history-card"
              key={trip.id}
              onClick={() => loadSavedTrip(trip)}
            >
              <strong>{trip.destination}</strong>

              <span>
                {trip.start_date} → {trip.end_date}
              </span>

              <span>₹{Number(trip.budget || 0).toLocaleString()}</span>

              <span>{trip.travel_pace || "Balanced"} pace</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <TripLoadingPage
        destination={formData.destination}
        onCancel={handleCancelGeneration}
      />
    );
  }

  if (tripGenerated) {
    const destinationParts = String(formData.destination || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    const destinationPrimary =
      destinationParts[0] || formData.destination || "Your trip";

    const destinationSecondary = destinationParts.slice(1).join(", ");

    return (
      <div className="dashboard-page redesigned-dashboard">
        <nav className="dashboard-topbar">
          <button
            type="button"
            className="dashboard-brand"
            onClick={() => {
              setTripGenerated(false);

              setPlannerStarted(false);

              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
          >
            <span>✈</span>

            <strong>
              Travel
              <span>Pilot</span>
            </strong>
          </button>

          <div className="dashboard-topbar-actions">
            <button type="button" onClick={loadTripHistory}>
              Trip History
            </button>

            <button
              type="button"
              onClick={() => {
                setTripGenerated(false);

                setPlannerStarted(true);

                setAppError("");

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            >
              Edit Trip
            </button>
          </div>
        </nav>

        <header className="dashboard-journey-hero">
          <div className="dashboard-journey-title">
            <span className="dashboard-kicker">YOUR JOURNEY</span>

            <SplitFlapDestination text={destinationPrimary} />

            <div className="dashboard-location-line">
              {destinationSecondary && <strong>{destinationSecondary}</strong>}

              <span>
                {formatShortDate(formData.startDate)} –{" "}
                {formatShortDate(formData.endDate)}
              </span>
            </div>
          </div>

          <div className="dashboard-hero-meta">
            {tripDayCount && (
              <span>
                <small>Duration</small>

                <strong>{tripDayCount} days</strong>
              </span>
            )}

            <span>
              <small>Budget</small>

              <strong>₹{budgetAmount.toLocaleString("en-IN")}</strong>
            </span>

            <span>
              <small>Pace</small>

              <strong>{formData.travelPace}</strong>
            </span>

            <span>
              <small>Interests</small>

              <strong>
                {formData.interests.length
                  ? formData.interests.slice(0, 2).join(" · ")
                  : "Flexible"}
              </strong>
            </span>
          </div>
        </header>

        {fallbackMode && (
          <div className="dashboard-inline-message warning">
            <strong>⚡ Demo fallback mode</strong>

            <span>{fallbackMessage}</span>
          </div>
        )}

        {appError && (
          <div className="dashboard-inline-message danger">
            <strong>⚠ TravelPilot error</strong>

            <span>{appError}</span>

            <button type="button" onClick={() => setAppError("")}>
              Dismiss
            </button>
          </div>
        )}

        <section className="dashboard-intelligence-row">
          <article className="compact-health-card">
            <div className="compact-card-heading">
              <div>
                <span className="dashboard-kicker">
                  <i className="live-dot" /> TRIP HEALTH
                </span>

                <h2>{tripHealthLabel}</h2>
              </div>

              <div
                className="compact-health-score"
                style={{
                  "--health-angle": `${tripHealthScore * 3.6}deg`,
                }}
              >
                <div className="compact-health-score-core">
                  <strong>{tripHealthScore}</strong>

                  <span>/100</span>
                </div>
              </div>
            </div>

            <div className="compact-health-metrics">
              <span className={isOverBudget ? "warning" : "good"}>
                <i>₹</i>

                {isOverBudget ? "Over budget" : "Budget on track"}
              </span>

              <span className={conflicts.length ? "warning" : "good"}>
                <i>◷</i>

                {conflicts.length
                  ? `${conflicts.length} schedule ${
                      conflicts.length === 1 ? "issue" : "issues"
                    }`
                  : "Schedule clear"}
              </span>

              <span className={highWeatherRisk ? "warning" : "good"}>
                <i>☂</i>

                {highWeatherRisk ? "Weather risk" : "Weather stable"}
              </span>

              <span className={totalTravelMinutes > 240 ? "warning" : "good"}>
                <i>↗</i>
                {formatTravelMinutes(totalTravelMinutes)} travel
              </span>
            </div>

            <p className="compact-health-note">
              {verifiedPlaceCount} verified{" "}
              {verifiedPlaceCount === 1 ? "place" : "places"} across your
              journey.
            </p>
          </article>

          <article className="compact-insights-card">
            <div className="compact-card-heading">
              <div>
                <span className="dashboard-kicker">✦ TRAVELPILOT AI</span>

                <h2>
                  {tripInsights[0]?.id === "healthy-trip"
                    ? "Everything looks good"
                    : `${Math.min(tripInsights.length, 3)} things to review`}
                </h2>
              </div>

              <span className="ai-live-pill">LIVE</span>
            </div>

            <div className="compact-insight-list">
              {visibleTripInsights.slice(0, 3).map((insight) => (
                <div
                  className={`compact-insight-row insight-${insight.type}`}
                  key={insight.id}
                >
                  <span className="compact-insight-icon">{insight.icon}</span>

                  <div>
                    <strong>{insight.title}</strong>

                    <p>{insight.description}</p>
                  </div>

                  {insight.action && (
                    <button
                      type="button"
                      disabled={Boolean(applyingInsight)}
                      onClick={() => handleInsightAction(insight)}
                    >
                      {applyingInsight === insight.id
                        ? "Working..."
                        : insight.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </article>
        </section>

        {conflicts.length > 0 && (
          <details className="compact-conflict-review">
            <summary>
              <span>
                <strong>⚠ {conflicts.length} schedule conflicts</strong>

                <small>
                  TravelPilot found timing that may not be physically possible.
                </small>
              </span>

              <span className="compact-review-link">Review conflicts</span>
            </summary>

            <div className="compact-conflict-list">
              {conflicts.map((conflict, index) => (
                <div className="compact-conflict-item" key={index}>
                  <div>
                    <strong>
                      Day {conflict.dayNumber}: {conflict.firstActivity} →{" "}
                      {conflict.secondActivity}
                    </strong>

                    <p>
                      Needs {conflict.conflictMinutes} more minutes. Earliest
                      arrival is {minutesToTime(conflict.earliestArrival)}.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={fixingConflict}
                    onClick={() => handleFixConflict(conflict)}
                  >
                    {fixingConflict ? "Fixing..." : "Fix automatically"}
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}

        {weatherMessage && (
          <div className="dashboard-inline-message success">
            <strong>☁ Weather update</strong>

            <span>{weatherMessage}</span>
          </div>
        )}

        {budgetOptimizationMessage && (
          <div className="dashboard-inline-message success">
            <strong>✦ Budget optimized</strong>

            <span>{budgetOptimizationMessage}</span>
          </div>
        )}

        {conflictFixMessage && (
          <div className="dashboard-inline-message success">
            <strong>✦ Schedule updated</strong>

            <span>{conflictFixMessage}</span>
          </div>
        )}

        <main className="journey-content">
          <section className="journey-itinerary">
            <div className="journey-section-heading">
              <span className="dashboard-kicker">YOUR ITINERARY</span>

              <h2>Day-by-day journey</h2>

              <p>
                Real places, realistic timing and live trip intelligence in one
                view.
              </p>
            </div>

            {itinerary.map((day, dayIndex) => {
              const activities = day.activities || [];

              const dayCost = activities.reduce(
                (sum, activity) => sum + Number(activity.cost || 0),
                0,
              );

              const dayTravel = activities.reduce(
                (sum, activity) =>
                  sum + Number(activity.travelMinutesFromPrevious || 0),
                0,
              );

              return (
                <article
                  className="journey-day-card"
                  id={`day-${day.day}`}
                  key={day.day}
                >
                  <header className="journey-day-hero journey-day-hero-no-image">
                    <div className="journey-day-hero-content">
                      <span>DAY {day.day}</span>

                      <h3>{day.title}</h3>

                      <div className="journey-day-meta">
                        <span>{activities.length} stops</span>

                        <span>₹{dayCost.toLocaleString("en-IN")}</span>

                        <span>{formatTravelMinutes(dayTravel)} travel</span>

                        {day.weather && (
                          <span>
                            {day.weather.summary}

                            {!day.weather.unavailable &&
                              ` · ${day.weather.minTempC}°–${day.weather.maxTempC}°C`}
                          </span>
                        )}
                      </div>
                    </div>
                  </header>

                  <div className="journey-activity-list">
                    {activities.map((activity, index) => {
                      const activityKey = `${dayIndex}-${index}`;

                      const isReplacing = replacingActivity === activityKey;

                      return (
                        <div
                          className="journey-activity-stop"
                          key={activityKey}
                        >
                          {index > 0 &&
                            Number(activity.travelMinutesFromPrevious || 0) >
                              0 && (
                              <div className="journey-travel-connector">
                                <span />

                                <small>
                                  {activity.travelMinutesFromPrevious} min
                                  transfer
                                </small>

                                <span />
                              </div>
                            )}

                          <article className="journey-activity-card journey-activity-card-no-image">
                            <div className="journey-activity-copy">
                              <div className="journey-activity-topline">
                                <span className="journey-activity-time">
                                  {activity.time}
                                </span>

                                {activity.realPlaceVerified && (
                                  <span className="journey-verified">
                                    ✓ Verified place
                                  </span>
                                )}
                              </div>

                              <h4>{activity.name}</h4>

                              <p className="journey-activity-location">
                                ⌖ {activity.location}
                              </p>

                              <div className="journey-activity-meta">
                                {activity.category && (
                                  <span>{activity.category}</span>
                                )}

                                {activity.rating && (
                                  <span>★ {activity.rating}</span>
                                )}

                                {activity.durationMinutes && (
                                  <span>{activity.durationMinutes} min</span>
                                )}

                                {activity.openingHoursLabel && (
                                  <span
                                    className={`opening-${activity.openingHoursStatus}`}
                                  >
                                    {activity.openingHoursLabel}
                                  </span>
                                )}
                              </div>

                              {activity.mapUrl && (
                                <a
                                  className="journey-map-link"
                                  href={activity.mapUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open in Google Maps ↗
                                </a>
                              )}

                              {activity.weatherDisruption && (
                                <p className="journey-activity-alert">
                                  ⛈ This stop may be affected by weather.
                                </p>
                              )}

                              {activity.weatherAdjusted && (
                                <p className="journey-activity-adjusted">
                                  ☂ Weather-adjusted:{" "}
                                  {activity.weatherAdjustmentReason}
                                </p>
                              )}

                              {activity.replaced && (
                                <p className="journey-activity-adjusted">
                                  ✦ Replaced "{activity.originalActivity}"
                                  {activity.reason
                                    ? ` — ${activity.reason}`
                                    : ""}
                                </p>
                              )}
                            </div>

                            <div className="journey-activity-actions">
                              <strong>
                                {Number(activity.cost || 0) > 0
                                  ? `₹${Number(activity.cost).toLocaleString(
                                      "en-IN",
                                    )}`
                                  : "Free"}
                              </strong>

                              <button
                                type="button"
                                disabled={isReplacing}
                                onClick={() =>
                                  handleCancelActivity(dayIndex, index)
                                }
                              >
                                {isReplacing ? "Finding..." : "Replace"}
                              </button>
                            </div>
                          </article>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </section>

          <details className="trip-details-panel">
            <summary>
              <div>
                <span className="dashboard-kicker">TRIP DETAILS</span>

                <strong>Budget, logistics & live connections</strong>
              </div>

              <span>View details</span>
            </summary>

            <div className="trip-details-grid">
              <div>
                <small>Budget</small>

                <strong>₹{budgetAmount.toLocaleString("en-IN")}</strong>

                <p>
                  ₹{totalCost.toLocaleString("en-IN")} estimated activities ·{" "}
                  {isOverBudget
                    ? `₹${Math.abs(remainingBudget).toLocaleString(
                        "en-IN",
                      )} over`
                    : `₹${remainingBudget.toLocaleString("en-IN")} remaining`}
                </p>
              </div>

              <div>
                <small>Interests</small>

                <strong>
                  {formData.interests.length
                    ? formData.interests.join(" · ")
                    : "General"}
                </strong>

                <p>
                  TravelPilot uses these interests to personalize your
                  itinerary.
                </p>
              </div>

              <div>
                <small>Transportation</small>

                <strong>{transportation.type || "Not added"}</strong>

                <p>{transportation.details || "No transport details"}</p>
              </div>

              <div>
                <small>Accommodation</small>

                <strong>{accommodation.name || "Not added"}</strong>

                <p>
                  Booking: {accommodation.bookingRef || "Not added"} ·{" "}
                  {accommodation.status || "Planned"}
                </p>
              </div>

              <div>
                <small>Saved trip</small>

                <strong>{tripId ? "Saved to history" : "Not saved"}</strong>

                <p>
                  {tripId
                    ? "Stored in Supabase."
                    : "Configure Supabase for persistent history."}
                </p>
              </div>

              <div>
                <small>Live connections</small>

                <div className="trip-details-integrations">
                  <IntegrationBadge
                    label="Places"
                    value={realWorldStatus.places}
                  />

                  <IntegrationBadge
                    label="Routes"
                    value={realWorldStatus.routes}
                  />

                  <IntegrationBadge
                    label="Weather"
                    value={realWorldStatus.weather}
                  />

                  <IntegrationBadge
                    label="History"
                    value={realWorldStatus.database}
                  />
                </div>
              </div>
            </div>
          </details>
        </main>

        <button
          type="button"
          className="assistant-fab"
          onClick={() => setAssistantOpen(true)}
          aria-label="Open TravelPilot assistant"
        >
          <span>✦</span>
          Ask TravelPilot
        </button>

        {assistantOpen && (
          <div
            className="assistant-drawer-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setAssistantOpen(false);
              }
            }}
          >
            <aside className="assistant-drawer">
              <div className="assistant-drawer-head">
                <div>
                  <span className="dashboard-kicker">✦ AI ASSISTANT</span>

                  <h3>Ask TravelPilot</h3>
                </div>

                <button
                  type="button"
                  className="assistant-close"
                  onClick={() => setAssistantOpen(false)}
                  aria-label="Close assistant"
                >
                  ×
                </button>
              </div>

              <p className="assistant-drawer-copy">
                Ask about your trip, nearby places, timing or budget.
                TravelPilot already has the context of this itinerary.
              </p>

              <div className="assistant-quick-prompts">
                <button
                  type="button"
                  onClick={() => handleChat("What should I do tomorrow?")}
                >
                  What should I do tomorrow?
                </button>

                <button
                  type="button"
                  onClick={() => handleChat("Can I add another activity?")}
                >
                  Add another activity
                </button>

                <button
                  type="button"
                  onClick={() => handleChat("How can I reduce my trip budget?")}
                >
                  Reduce my trip budget
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleChat("Which activities are close to each other?")
                  }
                >
                  What's nearby?
                </button>
              </div>

              <div className="assistant-drawer-chat">
                <input
                  type="text"
                  placeholder="Ask about your trip..."
                  value={chatMessage}
                  onChange={(event) => setChatMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleChat();
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => handleChat()}
                  disabled={chatLoading}
                >
                  {chatLoading ? "..." : "Send"}
                </button>
              </div>

              {chatLoading && (
                <p className="assistant-thinking">TravelPilot is thinking...</p>
              )}

              {chatAnswer && (
                <div className="assistant-drawer-answer">
                  <strong>TravelPilot</strong>

                  <p>{chatAnswer}</p>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    );
  }

  // =====================================
  // LANDING PAGE
  // =====================================

  if (!plannerStarted) {
    return (
      <LandingPage
        onStartPlanning={() => {
          setPlannerStarted(true);

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }}
        onOpenHistory={loadTripHistory}
      />
    );
  }

  // =====================================
  // FORM
  // =====================================

  return (
    <div className="app planner-background-page">
      <div className="trip-card planner-wide-card">
        <header className="planner-topbar">
          <button
            type="button"
            className="planner-brand"
            onClick={() => {
              setPlannerStarted(false);

              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
          >
            <span className="planner-brand-icon">✈</span>

            <span>
              Travel
              <span>Pilot</span>
            </span>
          </button>

          <div className="planner-topbar-actions">
            <button
              type="button"
              className="history-button"
              onClick={() => {
                setPlannerStarted(false);

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
            >
              ← Home
            </button>

            <button
              type="button"
              className="history-button"
              onClick={loadTripHistory}
            >
              Trip History
            </button>
          </div>
        </header>

        <section className="planner-page-header">
          <div>
            <span className="planner-kicker">✦ AI TRIP DESIGNER</span>

            <h1>Plan your next journey.</h1>

            <p className="subtitle">
              Tell TravelPilot where you're going and what matters to you. We'll
              build the intelligence behind the trip.
            </p>
          </div>

          <div className="planner-header-status">
            <span className="planner-status-dot" />

            <div>
              <small>TRAVELPILOT</small>

              <strong>Ready to plan</strong>
            </div>
          </div>
        </section>

        {appError && (
          <div className="app-error form-error">
            <strong>⚠ TravelPilot Error</strong>

            <p>{appError}</p>

            <button onClick={() => setAppError("")}>Dismiss</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="planner-form">
          <div className="planner-layout">
            <div className="planner-main">
              <div className="planner-section-heading">
                <span>01</span>

                <div>
                  <small>TRIP BASICS</small>

                  <h2>Build the shape of your trip</h2>
                </div>
              </div>

              <label>Destination</label>

              <div className="destination-autocomplete">
                <input
                  type="text"
                  name="destination"
                  placeholder="Search any destination..."
                  value={formData.destination}
                  onChange={handleDestinationChange}
                  onFocus={() => {
                    if (destinationSuggestions.length > 0) {
                      setShowDestinationSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowDestinationSuggestions(false);
                    }, 200);
                  }}
                  autoComplete="off"
                  required
                />

                {destinationSearching && (
                  <div className="destination-searching">Searching...</div>
                )}

                {showDestinationSuggestions &&
                  destinationSuggestions.length > 0 && (
                    <div className="destination-dropdown">
                      {destinationSuggestions.map((prediction) => (
                        <button
                          type="button"
                          className="destination-option"
                          key={prediction.placeId}
                          onMouseDown={(e) => {
                            e.preventDefault();

                            selectDestination(prediction);
                          }}
                        >
                          <div className="destination-pin">📍</div>

                          <div className="destination-option-text">
                            <strong>
                              {prediction.mainText?.toString() ||
                                prediction.text.toString()}
                            </strong>

                            {prediction.secondaryText && (
                              <span>{prediction.secondaryText.toString()}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                {destinationError && (
                  <p className="destination-error">{destinationError}</p>
                )}
              </div>

              <div className="date-row">
                <div>
                  <label>Start Date</label>

                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label>End Date</label>

                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <label>Trip Budget (₹)</label>

              <input
                type="number"
                name="budget"
                placeholder="e.g. 100000"
                value={formData.budget}
                onChange={handleChange}
                required
              />

              <div className={`smart-section ${transportOpen ? "open" : ""}`}>
                <button
                  type="button"
                  className="smart-section-toggle"
                  onClick={() => setTransportOpen((current) => !current)}
                  aria-expanded={transportOpen}
                >
                  <span className="smart-section-icon">✈</span>

                  <span className="smart-section-copy">
                    <strong>Transportation</strong>

                    <small>
                      {formData.transportType
                        ? `${formData.transportType} · ${formData.transportStatus}`
                        : "Add flight, train or transfer details"}
                    </small>
                  </span>

                  <span className="smart-section-action">
                    {transportOpen ? "−" : "+"}
                  </span>
                </button>

                {transportOpen && (
                  <div className="smart-section-body">
                    <div className="date-row">
                      <div>
                        <label>Transport Type</label>

                        <select
                          name="transportType"
                          value={formData.transportType}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>

                          <option value="Flight">Flight</option>

                          <option value="Train">Train</option>

                          <option value="Bus">Bus</option>

                          <option value="Car">Car</option>

                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label>Status</label>

                        <select
                          name="transportStatus"
                          value={formData.transportStatus}
                          onChange={handleChange}
                        >
                          <option>Planned</option>

                          <option>Booked</option>

                          <option>Confirmed</option>

                          <option>Completed</option>

                          <option>Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <label>Transport Details</label>

                    <input
                      type="text"
                      name="transportDetails"
                      placeholder="e.g. AI 101, 08:30 departure"
                      value={formData.transportDetails}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>

              <div
                className={`smart-section ${accommodationOpen ? "open" : ""}`}
              >
                <button
                  type="button"
                  className="smart-section-toggle"
                  onClick={() => setAccommodationOpen((current) => !current)}
                  aria-expanded={accommodationOpen}
                >
                  <span className="smart-section-icon">🏨</span>

                  <span className="smart-section-copy">
                    <strong>Accommodation</strong>

                    <small>
                      {formData.accommodationBookingRef
                        ? `Booking ${formData.accommodationStatus}`
                        : "Add optional booking information"}
                    </small>
                  </span>

                  <span className="smart-section-action">
                    {accommodationOpen ? "−" : "+"}
                  </span>
                </button>

                {accommodationOpen && (
                  <div className="smart-section-body">
                    <div className="date-row">
                      <div>
                        <label>Booking Reference</label>

                        <input
                          type="text"
                          name="accommodationBookingRef"
                          placeholder="Optional"
                          value={formData.accommodationBookingRef}
                          onChange={handleChange}
                        />
                      </div>

                      <div>
                        <label>Status</label>

                        <select
                          name="accommodationStatus"
                          value={formData.accommodationStatus}
                          onChange={handleChange}
                        >
                          <option>Planned</option>

                          <option>Booked</option>

                          <option>Confirmed</option>

                          <option>Checked in</option>

                          <option>Completed</option>

                          <option>Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <label className="section-label">
                What are you interested in?
              </label>

              <div className="interests interest-grid">
                {interests.map((interest) => {
                  const meta = interestMeta[interest];

                  return (
                    <button
                      type="button"
                      key={interest}
                      className={
                        formData.interests.includes(interest)
                          ? "interest active"
                          : "interest"
                      }
                      onClick={() => toggleInterest(interest)}
                    >
                      <span className="interest-icon">{meta.icon}</span>

                      <span className="interest-copy">
                        <strong>{interest}</strong>

                        <small>{meta.description}</small>
                      </span>

                      <span className="interest-check">✓</span>
                    </button>
                  );
                })}
              </div>

              <label>Travel Pace</label>

              <div className="pace-options">
                {travelPaces.map((pace) => (
                  <button
                    type="button"
                    key={pace}
                    className={
                      formData.travelPace === pace
                        ? "pace-button active"
                        : "pace-button"
                    }
                    onClick={() => selectTravelPace(pace)}
                  >
                    {pace === "Relaxed" && "🌿 "}

                    {pace === "Balanced" && "⚖️ "}

                    {pace === "Packed" && "⚡ "}

                    {pace}
                  </button>
                ))}
              </div>

              <div className="pace-description">
                {formData.travelPace === "Relaxed" && (
                  <p>Fewer activities with more free time.</p>
                )}

                {formData.travelPace === "Balanced" && (
                  <p>A comfortable mix of sightseeing and breaks.</p>
                )}

                {formData.travelPace === "Packed" && (
                  <p>More activities with a faster schedule.</p>
                )}
              </div>

              <label className="section-label">Must-Visit Places</label>

              <div className="must-visit-builder">
                {mustVisitPlaces.length > 0 && (
                  <div className="must-visit-tags">
                    {mustVisitPlaces.map((place, index) => (
                      <span
                        className="must-visit-tag"
                        key={`${place}-${index}`}
                      >
                        <span>⌖ {getShortPlaceName(place)}</span>

                        <button
                          type="button"
                          aria-label={`Remove ${getShortPlaceName(place)}`}
                          onClick={() => removeMustVisit(index)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="destination-autocomplete must-visit-autocomplete">
                  <input
                    type="text"
                    placeholder="Search and add a place..."
                    value={mustVisitInput}
                    onChange={handleMustVisitChange}
                    onFocus={() => {
                      if (mustVisitSuggestions.length > 0) {
                        setShowMustVisitSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowMustVisitSuggestions(false);
                      }, 200);
                    }}
                    autoComplete="off"
                  />

                  {mustVisitSearching && (
                    <div className="destination-searching">Searching...</div>
                  )}

                  {showMustVisitSuggestions &&
                    mustVisitSuggestions.length > 0 && (
                      <div className="destination-dropdown">
                        {mustVisitSuggestions.map((prediction) => (
                          <button
                            type="button"
                            className="destination-option"
                            key={prediction.placeId}
                            onMouseDown={(e) => {
                              e.preventDefault();

                              selectMustVisit(prediction);
                            }}
                          >
                            <div className="destination-pin">✦</div>

                            <div className="destination-option-text">
                              <strong>
                                {prediction.mainText?.toString() ||
                                  prediction.text.toString()}
                              </strong>

                              {prediction.secondaryText && (
                                <span>
                                  {prediction.secondaryText.toString()}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                  {mustVisitError && (
                    <p className="destination-error">{mustVisitError}</p>
                  )}
                </div>

                <p className="field-help">
                  Optional — build a short list and TravelPilot will weave it
                  into the itinerary.
                </p>
              </div>

              <div className="planner-bottom-note">
                <span>✦</span>

                <p>
                  TravelPilot will verify places, estimate travel time, check
                  weather and evaluate your trip after generation.
                </p>
              </div>
            </div>

            <aside className="planner-sidebar">
              <div className="planner-sidebar-card">
                <div className="planner-sidebar-head">
                  <span>✦ LIVE TRIP SIGNAL</span>

                  <small>UPDATES LIVE</small>
                </div>

                <div className="planner-sidebar-destination">
                  <span className="planner-sidebar-pin">⌖</span>

                  <div>
                    <small>YOUR JOURNEY</small>

                    <h3>
                      {formData.destination
                        ? getShortPlaceName(formData.destination)
                        : "Your next trip"}
                    </h3>

                    <p>
                      {formData.destination
                        ? "Destination selected"
                        : "Choose your destination"}
                    </p>
                  </div>
                </div>

                <div className="planner-readiness">
                  <div className="planner-readiness-top">
                    <span>Trip readiness</span>

                    <strong>{plannerReadiness}%</strong>
                  </div>

                  <div className="planner-readiness-track">
                    <span
                      style={{
                        width: `${plannerReadiness}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="planner-summary-list">
                  <div className="planner-summary-row">
                    <span>Dates</span>

                    <strong>
                      {formData.startDate && formData.endDate
                        ? `${formatShortDate(
                            formData.startDate,
                          )} – ${formatShortDate(formData.endDate)}`
                        : "Not selected"}
                    </strong>
                  </div>

                  <div className="planner-summary-row">
                    <span>Duration</span>

                    <strong>
                      {tripDayCount ? `${tripDayCount} days` : "—"}
                    </strong>
                  </div>

                  <div className="planner-summary-row">
                    <span>Budget</span>

                    <strong>
                      {Number(formData.budget || 0) > 0
                        ? `₹${Number(formData.budget).toLocaleString("en-IN")}`
                        : "—"}
                    </strong>
                  </div>

                  <div className="planner-summary-row">
                    <span>Travel pace</span>

                    <strong>{formData.travelPace}</strong>
                  </div>
                </div>

                <div className="planner-sidebar-interests">
                  <small>YOUR INTERESTS</small>

                  <div>
                    {formData.interests.length > 0 ? (
                      formData.interests.map((interest) => (
                        <span key={interest}>{interest}</span>
                      ))
                    ) : (
                      <p>Select a few interests to personalize the trip.</p>
                    )}
                  </div>
                </div>

                <button
                  className="generate-button planner-sidebar-cta"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Designing Your Journey..."
                    : "✦ Build My AI Journey →"}
                </button>

                <p className="planner-sidebar-footnote">
                  No itinerary is final — you can edit, replace and replan
                  activities after generation.
                </p>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
