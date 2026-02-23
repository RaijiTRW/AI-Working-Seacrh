"use client";

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
  return (
    <motion.div
      whileHover={{ scale: 1.05, x: 5 }}
      className="bg-[#1f2833]/80 backdrop-blur-md rounded-xl shadow-[0_5px_15px_rgba(0,0,0,0.5)] p-4 w-60 border border-[#c5c6c7]/10 hover:border-[#00f0ff]/50 transition-colors"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00f0ff] to-[#00c0cc] flex items-center justify-center shadow-[0_0_10px_rgba(0,240,255,0.4)]">
          <span className="text-[#0b0c10] text-xs font-bold">
            {resume.name.split(" ").map(n => n[0]).join("")}
          </span>
        </div>
        <div>
          <h4 className="font-bold text-sm text-white">{resume.name}</h4>
          <p className="text-xs text-[#c5c6c7]">{resume.position}</p>
        </div>
      </div>
      <p className="text-[#00f0ff] font-bold text-sm mb-2 drop-shadow-[0_0_5px_rgba(0,240,255,0.4)]">{resume.salary}</p>
      <p className="text-xs text-[#c5c6c7] mb-1">
        <span className="font-medium opacity-70">Опыт:</span> {resume.experience}
      </p>
      <p className="text-xs text-[#c5c6c7] mb-3 truncate">
        <span className="font-medium opacity-70">Навыки:</span> {resume.skills}
      </p>
      <button className="px-4 py-1.5 bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] text-xs font-bold rounded-full hover:bg-[#00f0ff] hover:text-[#0b0c10] transition-all w-full shadow-[0_0_10px_rgba(0,240,255,0.1)] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]">
        Пригласить
      </button>
    </motion.div>
  );
}
