import React, { useState } from "react";
import "./CarouselBanner.css";

const images = [
  {
    src: "https://dummyimage.com/900x200/181c2a/ffa600&text=mobileshop.ug+banner+1",
    alt: "Mobile Shop Banner 1"
  },
  {
    src: "https://dummyimage.com/900x200/23263a/fff&text=mobileshop.ug+banner+2",
    alt: "Mobile Shop Banner 2"
  }
];

const CarouselBanner = () => {
  const [index, setIndex] = useState(0);
  const prev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  return (
    <div className="carousel-banner">
      <button className="carousel-arrow left" onClick={prev}>&lt;</button>
      <img src={images[index].src} alt={images[index].alt} className="carousel-img" />
      <button className="carousel-arrow right" onClick={next}>&gt;</button>
    </div>
  );
};

export default CarouselBanner;