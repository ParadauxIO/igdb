import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import "./ImageCarousel.scss";

interface ImageCarouselProps {
  images: string[];
  startIndex?: number;
}

export default function ImageCarousel({ images, startIndex = 0 }: ImageCarouselProps) {
  const safeImages = useMemo(() => images?.filter(Boolean) ?? [], [images]);
  const [currentIndex, setCurrentIndex] = useState(
      Math.min(Math.max(startIndex, 0), Math.max(safeImages.length - 1, 0))
  );

  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, Math.max(safeImages.length - 1, 0)));
  }, [safeImages.length]);

  if (safeImages.length === 0) return null;

  const nextImage = () => {
    if (safeImages.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % safeImages.length);
  };

  const prevImage = () => {
    if (safeImages.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") nextImage();
    else if (e.key === "ArrowLeft") prevImage();
  };

  return (
      <div className="carousel-container" onKeyDown={onKeyDown} tabIndex={0} aria-roledescription="carousel">
        <div className="carousel-wrapper">
          <img
              src={safeImages[currentIndex]}
              alt={`Image ${currentIndex + 1} of ${safeImages.length}`}
              className="carousel-image"
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
          />

          {safeImages.length > 1 && (
              <>
                <button
                    type="button"
                    onClick={prevImage}
                    className="carousel-btn carousel-btn-prev"
                    aria-label="Previous image"
                >
                  &#8249;
                </button>
                <button
                    type="button"
                    onClick={nextImage}
                    className="carousel-btn carousel-btn-next"
                    aria-label="Next image"
                >
                  &#8250;
                </button>
                <div className="carousel-counter" aria-live="polite">
                  {currentIndex + 1} / {safeImages.length}
                </div>
              </>
          )}
        </div>
      </div>
  );
}