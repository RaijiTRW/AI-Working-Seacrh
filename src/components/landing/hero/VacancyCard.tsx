"use client";

import { useState } from "react";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, x: 60, filter: "blur(8px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.5,
        delay: index * 0.4,
        ease: [0.22, 1, 0.36, 1]
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative rounded-3xl p-5 w-56"
      style={{
        background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
        // Явные outset тени для 3D эффекта
        boxShadow: isHovered
          ? "24px 24px 48px rgba(160,160,160,0.4), -24px -24px 48px rgba(255,255,255,0.9), inset 0 2px 4px rgba(255,255,255,0.8)"
          : "20px 20px 40px rgba(160,160,160,0.35), -20px -20px 40px rgba(255,255,255,0.85), inset 0 1px 2px rgba(255,255,255,0.6)",
        transform: isHovered ? "scale(1.02) translateY(-8px)" : "scale(1)",
        transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Ambient Orange Glow */}
      <motion.div
        className="absolute inset-0 rounded-3xl blur-3xl -z-10"
        animate={{
          opacity: isHovered ? 0.6 : 0,
          scale: isHovered ? 1.2 : 0.8,
        }}
        transition={{ duration: 0.4 }}
        style={{
          background: "radial-gradient(circle at 50% 20%, rgba(249,115,22,0.4), transparent 60%)",
        }}
      />

      {/* Top highlight streak */}
      <div
        className="absolute top-0 left-4 right-4 h-8 rounded-b-full blur-md pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.8), transparent)",
          opacity: isHovered ? 0.7 : 0.5,
        }}
      />

      <h4 className="font-semibold text-sm mb-2">{vacancy.title}</h4>
      <p className="text-orange-500 font-bold text-sm mb-2">{vacancy.salary}</p>
      <p className="text-xs text-gray-500 mb-1">{vacancy.location}</p>
      <p className="text-xs text-gray-500 mb-3">
        {vacancy.schedule || vacancy.experience}
      </p>

      {/* 3D Raised Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        className="relative px-5 py-2.5 rounded-full text-xs font-medium text-white"
        style={{
          background: "linear-gradient(145deg, #ff9a56, #e65c00)",
          // Явные 3D тени для кнопки
          boxShadow: isHovered
            ? "8px 8px 16px rgba(200,80,0,0.3), -4px -4px 12px rgba(255,200,150,0.4), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.2)"
            : "6px 6px 12px rgba(200,80,0,0.25), -4px -4px 10px rgba(255,200,150,0.3), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.15)",
        }}
      >
        {/* Top highlight */}
        <div
          className="absolute top-0 left-3 right-3 h-3 rounded-b-full blur-sm pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.4), transparent)",
          }}
        />
        <span className="relative z-10">Откликнуться</span>
      </motion.button>
    </motion.div>
  );
}
