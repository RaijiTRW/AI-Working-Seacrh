"use client";

import { useState } from "react";

interface Vacancy {
  title: string;
  salary: string;
  location: string;
  schedule?: string;
  experience?: string;
}

interface VacancyCardProps {
  vacancy: Vacancy;
  index: number;
}

export default function VacancyCard({ vacancy, index }: VacancyCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-xl shadow-lg p-4 w-56 border border-gray-100 transition-all duration-500 animate-in fade-in slide-in-from-right-4"
      style={{
        animationDelay: `${index * 400}ms`,
        animationFillMode: "backwards",
        transform: isHovered ? "scale(1.02) translateX(-4px)" : "scale(1)",
      }}
    >
      <h4 className="font-semibold text-sm mb-2">{vacancy.title}</h4>
      <p className="text-orange-500 font-bold text-sm mb-2">{vacancy.salary}</p>
      <p className="text-xs text-gray-500 mb-1">{vacancy.location}</p>
      <p className="text-xs text-gray-500 mb-3">
        {vacancy.schedule || vacancy.experience}
      </p>
      <button className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full hover:from-orange-600 hover:to-orange-700 transition-all">
        Откликнуться
      </button>
    </div>
  );
}
