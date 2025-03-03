import React, { useState } from "react";

interface CustomSelectProps {
  options: string[];
  onSelect: (value: string) => void;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        className="border text-gray-600 rounded-lg p-3 text-sm w-full text-right"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedValue || "انتخاب"}
      </button>
      {isOpen && (
        <ul className="absolute w-full bg-white border border-gray-200 p-3 rounded-lg mt-1 text-sm text-gray-700 max-h-[150px] z-20 overflow-auto custom-scroll">
          {options.map((option, index) => (
            <li
              key={index}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
