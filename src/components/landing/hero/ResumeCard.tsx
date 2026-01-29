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
      className="relative rounded-3xl p-5 w-56 overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #ffffff, #f8f8f8)",
        boxShadow: isHovered
          ? "0 20px 50px rgba(59,130,246,0.25), 0 8px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -2px 8px rgba(59,130,246,0.08)"
          : "0 15px 35px rgba(59,130,246,0.15), 0 5px 12px rgba(0,0,0,0.06), inset 0 2px 0 rgba(255,255,255,0.95), inset 0 -1px 4px rgba(59,130,246,0.04)",
        transform: isHovered ? "scale(1.03) translateX(6px) translateY(-4px)" : "scale(1)",
      }}
    >
      {/* Gradient Border */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          padding: "1px",
          background: isHovered
            ? "linear-gradient(135deg, rgba(59,130,246,0.4), rgba(255,255,255,0.3), rgba(59,130,246,0.4))"
            : "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(255,255,255,0.5), rgba(59,130,246,0.1))",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* Ambient Glow */}
      <motion.div
        className="absolute inset-0 rounded-3xl blur-2xl -z-10"
        animate={{
          opacity: isHovered ? 0.8 : 0.3,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.4 }}
        style={{
          background: "radial-gradient(circle at 50% 30%, rgba(59,130,246,0.35), transparent 65%)",
        }}
      />

      <div className="flex items-center gap-2 mb-3">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 8 }}
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #60a5fa, #2563eb)",
            boxShadow: "0 6px 16px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 4px rgba(0,0,0,0.1)"
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
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
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

      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="relative px-4 py-2 rounded-full text-xs font-medium text-white overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #3b82f6, #2563eb)",
          boxShadow: "0 8px 24px rgba(59,130,246,0.35), 0 2px 6px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 4px rgba(0,0,0,0.1)",
        }}
      >
        {/* Button Gradient Border */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            padding: "1px",
            background: "linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1), rgba(255,255,255,0.4))",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
        <span className="relative z-10">Пригласить</span>
      </motion.button>
    </motion.div>
  );
}
