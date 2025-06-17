import { useState } from "react";
import "./ImageCarousel.scss";

interface ImageCarouselProps {
  images: string[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) return null;

  return (
    <div className="carousel-container">
      <div className="carousel-wrapper">
        <img
          src={images[currentIndex]}
          alt="Update media"
          className="carousel-image"

        />

        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="carousel-btn carousel-btn-prev"
              aria-label="Previous image"
            >
              &#8249;
            </button>
            <button
              onClick={nextImage}
              className="carousel-btn carousel-btn-next"
              aria-label="Next image"
            >
              &#8250;
            </button>
            <div className="carousel-counter">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}