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
      className="soft-card-base soft-card-orange rounded-2xl p-4 w-56 border border-orange-50/50"
      style={{
        transform: isHovered ? "scale(1.02) translateX(-4px)" : "scale(1)",
      }}
    >
      {/* Ambient Glow on Hover */}
      {isHovered && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="absolute inset-0 rounded-2xl blur-xl -z-10"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(249,115,22,0.3), transparent 70%)"
          }}
        />
      )}

      <h4 className="font-semibold text-sm mb-2">{vacancy.title}</h4>
      <p className="text-orange-500 font-bold text-sm mb-2">{vacancy.salary}</p>
      <p className="text-xs text-gray-500 mb-1">{vacancy.location}</p>
      <p className="text-xs text-gray-500 mb-3">
        {vacancy.schedule || vacancy.experience}
      </p>

      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="relative px-3 py-1.5 rounded-full text-xs font-medium text-white overflow-hidden transition-all duration-300"
        style={{
          background: "linear-gradient(to right, #f97316, #ea580c)",
          boxShadow: "0 8px 20px rgba(249,115,22,0.25), 0 2px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.25)"
        }}
      >
        <span className="relative z-10">Откликнуться</span>
      </motion.button>
    </motion.div>
  );
}
