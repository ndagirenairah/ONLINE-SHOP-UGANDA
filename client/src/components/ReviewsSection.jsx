import React from "react";
import "./ReviewsSection.css";

const reviews = [
  {
    name: "D***s Cheptoek",
    platform: "Google",
    rating: 5,
    comment: "Legit and genuine phones anyday \uD83D\uDC4C\uD83D\uDC4C",
    avatar: "https://dummyimage.com/60x60/ffa600/fff&text=D"
  },
  {
    name: "J***l Olowo Jerome Stowell",
    platform: "Google",
    rating: 5,
    comment: "Variety of phones to choose from",
    avatar: "https://dummyimage.com/60x60/ffa600/fff&text=J"
  },
  {
    name: "D***y Musinguzi",
    platform: "Google",
    rating: 5,
    comment: "The customer care is out of this world",
    avatar: "https://dummyimage.com/60x60/ffa600/fff&text=D"
  }
];

const ReviewsSection = () => (
  <section className="reviews-section">
    <h2>Customers Who Bought From Us, Verified by google</h2>
    <div className="reviews-list">
      {reviews.map((r, idx) => (
        <div className="review-card" key={idx}>
          <div className="review-header">
            <img src={r.avatar} alt={r.name} className="review-avatar" />
            <div className="review-name">{r.name} <span className="verified">✔</span></div>
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="review-platform" />
          </div>
          <div className="review-rating">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
          <div className="review-comment">{r.comment}</div>
        </div>
      ))}
    </div>
  </section>
);

export default ReviewsSection;