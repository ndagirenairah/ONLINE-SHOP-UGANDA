import React from "react";
import "./CurrencySwitcher.css";

const currencies = [
  { code: "USD", label: "usUSD currency" },
  { code: "UGX", label: "ugUGX currency" },
  { code: "KES", label: "keKES currency" },
  { code: "RWF", label: "rwRWF currency" }
];

const CurrencySwitcher = ({ selected, onSelect }) => (
  <div className="currency-switcher">
    {currencies.map((cur) => (
      <span
        key={cur.code}
        className={selected === cur.code ? "currency active" : "currency"}
        onClick={() => onSelect(cur.code)}
      >
        {cur.label}
      </span>
    ))}
  </div>
);

export default CurrencySwitcher;