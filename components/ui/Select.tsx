import React, { useState, useEffect } from "react";

interface Category {
  id: number;
  name: string;
}

interface CustomSelectProps {
  options: Category[];
  onSelect: (value: number | null) => void;
  defaultValue?: number | null;
  placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  onSelect,
  defaultValue = null,
  placeholder = "انتخاب",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<number | null>(
    defaultValue
  );

  useEffect(() => {
    setSelectedValue(defaultValue);
  }, [defaultValue]);

  const handleSelect = (id: number | null) => {
    setSelectedValue(id);
    onSelect(id);
    setIsOpen(false);
  };

  const getSelectedName = () => {
    if (selectedValue === null) return placeholder;
    const selected = options.find((option) => option.id === selectedValue);
    return selected ? selected.name : placeholder;
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all duration-200 text-right flex items-center justify-between hover:border-gray-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedValue === null ? "text-gray-500" : "text-gray-900"}>
          {getSelectedName()}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
      {isOpen && (
        <div className="fixed top-0 right-0 w-full h-screen bg-black/50 backdrop-blur-lg z-40 flex flex-col justify-end p-2">
          <div onClick={() => setIsOpen(false)} className="rounded-full bg-white/50 mx-auto w-fit py-2 px-5 border border-white/30">
            <p>بازگشت</p>
          </div>
          <ul className="w-full md:w-1/3 mx-auto bg-white rounded-3xl mt-2 text-sm hide-scroll text-gray-700 max-h-[50%] overflow-auto">
            <li
              className="px-4 py-3 hover:bg-teal-50 cursor-pointer text-gray-500 hover:text-teal-600 border-b border-gray-100 transition-colors"
              onClick={() => handleSelect(null)}
            >
              بدون دسته‌بندی
            </li>
            {options.map((option) => (
              <li
                key={option.id}
                className={`px-4 py-3 hover:bg-teal-50 cursor-pointer border-b border-gray-100 transition-colors ${selectedValue === option.id ? "bg-teal-100 text-teal-700 font-semibold" : "text-gray-700"
                  }`}
                onClick={() => handleSelect(option.id)}
              >
                {option.name}
              </li>
            ))}
          </ul>
        </div>

      )}
    </div>
  );
};

export default CustomSelect;
