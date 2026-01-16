"use client";

import { useState } from "react";

interface Resume {
  name: string;
  position: string;
  experience: string;
  skills: string;
  salary: string;
}

interface ResumeCardProps {
  resume: Resume;
  index: number;
}

export default function ResumeCard({ resume, index }: ResumeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-xl shadow-lg p-4 w-56 border border-gray-100 transition-all duration-500 animate-in fade-in slide-in-from-left-4"
      style={{
        animationDelay: `${index * 400}ms`,
        animationFillMode: "backwards",
        transform: isHovered ? "scale(1.02) translateX(4px)" : "scale(1)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">
            {resume.name.split(" ").map(n => n[0]).join("")}
          </span>
        </div>
        <div>
          <h4 className="font-semibold text-sm">{resume.name}</h4>
          <p className="text-xs text-gray-500">{resume.position}</p>
        </div>
      </div>
      <p className="text-blue-500 font-bold text-sm mb-2">{resume.salary}</p>
      <p className="text-xs text-gray-600 mb-1">
        <span className="font-medium">Опыт:</span> {resume.experience}
      </p>
      <p className="text-xs text-gray-600 mb-3">
        <span className="font-medium">Навыки:</span> {resume.skills}
      </p>
      <button className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-full hover:from-blue-600 hover:to-blue-700 transition-all">
        Пригласить
      </button>
    </div>
  );
}
