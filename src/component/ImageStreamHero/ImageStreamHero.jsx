import "./ImageStreamHero.css";

export default function ImageStreamHero({
  images = [],
  cards = 9,
  speed = 20,
  axis = 52,
}) {
  if (!images.length) return null;

  const stream = Array.from({ length: cards }, (_, index) => {
    return images[index % images.length];
  });

  return (
    <div
      className="tp2-image-stream"
      style={{
        "--stream-axis": `${axis}%`,
      }}
      aria-hidden="true"
    >
      <div className="tp2-stream-vanishing-glow" />

      <div className="tp2-stream-rail tp2-stream-left">
        {stream.map((image, index) => (
          <img
            key={`left-${index}`}
            src={image.src}
            alt=""
            loading="lazy"
            style={{
              animationDuration: `${speed}s`,
              animationDelay: `${-(index / cards) * speed}s`,
            }}
          />
        ))}
      </div>

      <div className="tp2-stream-rail tp2-stream-right">
        {stream.map((image, index) => (
          <img
            key={`right-${index}`}
            src={images[(index + 3) % images.length].src}
            alt=""
            loading="lazy"
            style={{
              animationDuration: `${speed}s`,
              animationDelay: `${-(index / cards) * speed}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
