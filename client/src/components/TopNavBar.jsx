import React from "react";
import "./TopNavBar.css";

const TopNavBar = () => (
  <header className="top-navbar">
    <div className="logo">
      <span className="logo-icon">🛒</span>
      <span className="logo-text">Mobile <b>Shop Ug</b></span>
    </div>
    <nav className="main-nav">
      <a href="#apple">Apple</a>
      <a href="#samsung">Samsung</a>
      <a href="#tecno">Tecno</a>
      <a href="#realme">Realme</a>
      <a href="#google">Google</a>
      <a href="#oneplus">One Plus</a>
      <a href="#infinix">Infinix</a>
      <a href="#oppo">Oppo</a>
      <a href="#xiaomi">Xiaomi</a>
      <a href="#hisense">Hisense</a>
      <a href="#jbl">JBL Speakers</a>
      <a href="#consoles">Consoles</a>
      <a href="#covers">Covers</a>
    </nav>
    <div className="search-cart-user">
      <input className="search-input" placeholder="Search Smartphones, TVs, Speakers, MacBooks" />
      <span className="cart">🛒<span className="cart-count">0</span></span>
      <span className="user">UG</span>
    </div>
  </header>
);

export default TopNavBar;