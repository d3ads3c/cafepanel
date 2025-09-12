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
        className="border text-gray-600 rounded-lg p-3 text-sm w-full text-right"
        onClick={() => setIsOpen(!isOpen)}
      >
        {getSelectedName()}
      </button>
      {isOpen && (
        <ul className="absolute w-full bg-white border border-gray-200 p-3 rounded-lg mt-1 text-sm text-gray-700 max-h-[150px] z-20 overflow-auto custom-scroll">
          <li
            className="p-2 hover:bg-gray-100 cursor-pointer text-gray-500"
            onClick={() => handleSelect(null)}
          >
            بدون دسته‌بندی
          </li>
          {options.map((option) => (
            <li
              key={option.id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(option.id)}
            >
              {option.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
