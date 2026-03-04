import React from "react";
import "./ProductCard.css";

const ProductCard = ({ product }) => {
  const getBadgeClass = (condition) => {
    switch(condition?.toLowerCase()) {
      case 'brand new': return 'badge-new';
      case 'uk used': return 'badge-uk';
      case 'premium': return 'badge-premium';
      default: return 'badge-default';
    }
  };

  return (
    <div className="product-card">
      {/* Badge */}
      {product.condition && (
        <div className={`product-badge ${getBadgeClass(product.condition)}`}>
          {product.condition}
        </div>
      )}
      
      {/* Views */}
      <div className="product-views">
        <span className="views-icon">📊</span> {product.views || 0} views
      </div>
      
      {/* Image */}
      <div className="product-image-container">
        <img src={product.image} alt={product.title} className="product-image" />
      </div>
      
      {/* Free Delivery Tag */}
      {product.freeDelivery && (
        <div className="free-delivery-tag">• Eligible Free Delivery</div>
      )}
      
      {/* Title */}
      <h3 className="product-title">{product.title}</h3>
      
      {/* Rating */}
      <div className="product-rating">
        <span className="stars">{'★'.repeat(product.stars || 5)}{'☆'.repeat(5 - (product.stars || 5))}</span>
        <span className="review-count">({product.reviews || 5})</span>
      </div>
      
      {/* Price */}
      <div className="product-price-row">
        <span className="uganda-flag">🇺🇬</span>
        <span className="currency">UGX</span>
        <span className="price">{(product.price || 0).toLocaleString()}</span>
      </div>
      
      {/* Guarantee */}
      <div className="product-guarantee">
        {product.guarantee || "Quality guaranteed on all products"}
      </div>
      
      {/* Actions */}
      <div className="product-actions">
        <button className="btn-add-cart">Add to Cart</button>
        <button className="btn-call">
          <span className="call-icon">📞</span>
          CALL
        </button>
      </div>
    </div>
  );
};

export default ProductCard;