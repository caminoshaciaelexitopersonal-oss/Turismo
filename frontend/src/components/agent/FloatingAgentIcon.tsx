'use client';

import React from 'react';
import { FiMessageSquare } from 'react-icons/fi';

interface FloatingAgentIconProps {
  onClick: () => void;
}

export default function FloatingAgentIcon({ onClick }: FloatingAgentIconProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-50 h-16 w-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 animate-breathing"
      aria-label="Abrir asistente de IA"
    >
      {/* Placeholder for an animated icon */}
      <FiMessageSquare className="h-8 w-8" />
    </button>
  );
}