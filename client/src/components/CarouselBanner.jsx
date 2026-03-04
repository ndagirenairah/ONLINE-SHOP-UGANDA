import React, { useState } from "react";
import "./CarouselBanner.css";

const slides = [
  {
    title: "Premium Fashion",
    subtitle: "Dress to impress with our latest collection",
    buttonText: "Explore Now",
    bgColor: "#1a1f36"
  },
  {
    title: "Trendy Styles",
    subtitle: "Discover the newest trends in fashion",
    buttonText: "Shop Now",
    bgColor: "#2c1810"
  },
  {
    title: "Quality Wear",
    subtitle: "Premium quality at affordable prices",
    buttonText: "View Collection",
    bgColor: "#0d2137"
  }
];

const CarouselBanner = () => {
  const [index, setIndex] = useState(0);
  const prev = () => setIndex((i) => (i === 0 ? slides.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === slides.length - 1 ? 0 : i + 1));
  
  const currentSlide = slides[index];
  
  return (
    <div className="carousel-banner" style={{ background: currentSlide.bgColor }}>
      <button className="carousel-arrow left" onClick={prev}>‹</button>
      
      <div className="carousel-content">
        <h2 className="carousel-title">{currentSlide.title}</h2>
        <p className="carousel-subtitle">{currentSlide.subtitle}</p>
        <button className="carousel-btn">{currentSlide.buttonText}</button>
      </div>
      
      <button className="carousel-arrow right" onClick={next}>›</button>
      
      <div className="carousel-dots">
        {slides.map((_, i) => (
          <span 
            key={i} 
            className={`dot ${i === index ? 'active' : ''}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default CarouselBanner;