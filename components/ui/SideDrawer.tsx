"use client";
import React, { useEffect } from "react";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}

const SideDrawer: React.FC<SideDrawerProps> = ({ open, onClose, width = 400, children }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        open ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Drawer */}
      <div
        className={`absolute left-0 top-0 h-full bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: `${width}px`, maxWidth: '90vw' }}
      >
        <div className="h-full flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SideDrawer;

