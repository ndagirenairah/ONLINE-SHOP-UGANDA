import React, { useState } from "react";
import "./CurrencySwitcher.css";

const currencies = [
  { code: "UGX", flag: "🇺🇬", label: "UGX" },
  { code: "USD", flag: "🇺🇸", label: "USD" },
  { code: "KES", flag: "🇰🇪", label: "KES" },
  { code: "RWF", flag: "🇷🇼", label: "RWF" }
];

const CurrencySwitcher = ({ selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentCurrency = currencies.find(c => c.code === selected) || currencies[0];

  return (
    <div className="currency-switcher-floating">
      <button 
        className="currency-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="currency-flag">{currentCurrency.flag}</span>
        <span className="currency-code">{currentCurrency.label}</span>
        <span className="currency-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="currency-dropdown">
          {currencies.map((cur) => (
            <div
              key={cur.code}
              className={`currency-option ${selected === cur.code ? 'active' : ''}`}
              onClick={() => {
                onSelect(cur.code);
                setIsOpen(false);
              }}
            >
              <span className="currency-flag">{cur.flag}</span>
              <span className="currency-code">{cur.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrencySwitcher;