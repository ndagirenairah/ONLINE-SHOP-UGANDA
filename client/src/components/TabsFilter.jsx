import React from "react";
import "./TabsFilter.css";

const tabs = [
  "All",
  "Apple",
  "Samsung",
  "Hisense Appliances",
  "Google",
  "Tecno",
  "Macbooks",
  "PS Games",
  "Sound Bars",
  "JBL Speakers",
  "Samsung-TV",
  "TCL",
  "Sony Xperia",
  "OnePlus",
  "ZTE",
  "Lenovo",
  // ...add more as needed
];

const TabsFilter = ({ selected, onSelect }) => (
  <div className="tabs-filter">
    {tabs.map((tab, idx) => (
      <button
        key={idx}
        className={selected === tab ? "tab active" : "tab"}
        onClick={() => onSelect(tab)}
      >
        {tab}
      </button>
    ))}
  </div>
);

export default TabsFilter;