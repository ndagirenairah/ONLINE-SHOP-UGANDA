import React from "react";
import "./ProductCard.css";

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      {product.badge && (
        <div className={`badge badge-${product.badgeType || "default"}`}>{product.badge}</div>
      )}
      <div className="views">{product.views} views</div>
      <img src={product.image} alt={product.title} className="product-image" />
      <div className="product-title">{product.title}</div>
      <div className="product-price">
        UGX {product.price.toLocaleString()}
        {product.oldPrice && (
          <span className="old-price">UGX {product.oldPrice.toLocaleString()}</span>
        )}
        {product.discount && (
          <span className="discount">-{product.discount}%</span>
        )}
      </div>
      <div className="product-stars">{'★'.repeat(product.stars)}{'☆'.repeat(5 - product.stars)}</div>
      <div className="product-guarantee">{product.guarantee}</div>
      <button className="add-to-cart">ADD TO CART</button>
    </div>
  );
};

export default ProductCard;