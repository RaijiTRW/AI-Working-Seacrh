"use client";

import { useState } from "react";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, x: -60, filter: "blur(8px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.5,
        delay: index * 0.4,
        ease: [0.22, 1, 0.36, 1]
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="soft-card-base soft-card-blue rounded-2xl p-4 w-56 border border-blue-50/50"
      style={{
        transform: isHovered ? "scale(1.02) translateX(4px)" : "scale(1)",
      }}
    >
      {/* Ambient Glow on Hover */}
      {isHovered && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="absolute inset-0 rounded-2xl blur-xl -z-10"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.3), transparent 70%)"
          }}
        />
      )}

      <div className="flex items-center gap-2 mb-3">
        <motion.div
          whileHover={{ scale: 1.05, rotate: 5 }}
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
          style={{
            background: "linear-gradient(135deg, #60a5fa, #2563eb)",
            boxShadow: "0 4px 12px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.3)"
          }}
        >
          <span className="text-white text-xs font-bold">
            {resume.name.split(" ").map(n => n[0]).join("")}
          </span>
        </motion.div>
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

      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="relative px-3 py-1.5 rounded-full text-xs font-medium text-white overflow-hidden transition-all duration-300"
        style={{
          background: "linear-gradient(to right, #3b82f6, #2563eb)",
          boxShadow: "0 8px 20px rgba(59,130,246,0.25), 0 2px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.25)"
        }}
      >
        <span className="relative z-10">Пригласить</span>
      </motion.button>
    </motion.div>
  );
}
