import React, { useState } from "react";
import ProductCard from "./ProductCard";
import "./ProductGrid.css";

const ProductGrid = ({ products }) => {
  const [perPage, setPerPage] = useState(60);
  const [sortBy, setSortBy] = useState("Most Popular");

  return (
    <div className="product-grid-wrapper">
      {/* Header */}
      <div className="product-grid-header">
        <div className="products-count">
          {products.length} products available
        </div>
        <div className="grid-controls">
          <div className="control-group">
            <label>Show:</label>
            <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
              <option value={20}>20 per page</option>
              <option value={40}>40 per page</option>
              <option value={60}>60 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
          <div className="control-group">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option>Most Popular</option>
              <option>Newest First</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Best Rating</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Products Grid */}
      <div className="product-grid">
        {products.slice(0, perPage).map((product, idx) => (
          <ProductCard key={idx} product={product} />
        ))}
      </div>
      
      {products.length === 0 && (
        <div className="no-products">
          No products found. Add some products to get started!
        </div>
      )}
    </div>
  );
};

export default ProductGrid;