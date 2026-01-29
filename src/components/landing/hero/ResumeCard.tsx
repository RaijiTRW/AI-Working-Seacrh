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
      className="relative rounded-3xl p-5 w-56"
      style={{
        background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
        boxShadow: isHovered
          ? "24px 24px 48px rgba(100,140,200,0.3), -24px -24px 48px rgba(255,255,255,0.9), inset 0 2px 4px rgba(255,255,255,0.8)"
          : "20px 20px 40px rgba(100,140,200,0.25), -20px -20px 40px rgba(255,255,255,0.85), inset 0 1px 2px rgba(255,255,255,0.6)",
        transform: isHovered ? "scale(1.02) translateY(-8px)" : "scale(1)",
        transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Ambient Blue Glow */}
      <motion.div
        className="absolute inset-0 rounded-3xl blur-3xl -z-10"
        animate={{
          opacity: isHovered ? 0.6 : 0,
          scale: isHovered ? 1.2 : 0.8,
        }}
        transition={{ duration: 0.4 }}
        style={{
          background: "radial-gradient(circle at 50% 20%, rgba(59,130,246,0.4), transparent 60%)",
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

      <div className="flex items-center gap-2 mb-3">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 8 }}
          className="w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #60a5fa, #1d4ed8)",
            boxShadow: "6px 6px 12px rgba(30,80,200,0.3), -3px -3px 8px rgba(150,200,255,0.3), inset 0 2px 4px rgba(255,255,255,0.3)"
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
            }}
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
            }}
          />
          <span className="text-white text-xs font-bold relative z-10">
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

      {/* 3D Raised Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        className="relative px-5 py-2.5 rounded-full text-xs font-medium text-white"
        style={{
          background: "linear-gradient(145deg, #60a5fa, #1d4ed8)",
          boxShadow: isHovered
            ? "8px 8px 16px rgba(30,80,200,0.3), -4px -4px 12px rgba(150,200,255,0.3), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.2)"
            : "6px 6px 12px rgba(30,80,200,0.25), -4px -4px 10px rgba(150,200,255,0.25), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.15)",
        }}
      >
        <div
          className="absolute top-0 left-3 right-3 h-3 rounded-b-full blur-sm pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.4), transparent)",
          }}
        />
        <span className="relative z-10">Пригласить</span>
      </motion.button>
    </motion.div>
  );
}
