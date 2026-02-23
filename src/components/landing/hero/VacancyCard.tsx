"use client";

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
  return (
    <motion.div
      whileHover={{ scale: 1.05, x: -5 }}
      className="bg-[#1f2833]/80 backdrop-blur-md rounded-xl shadow-[0_5px_15px_rgba(0,0,0,0.5)] p-4 w-60 border border-[#c5c6c7]/10 hover:border-[#ff6b00]/50 transition-colors"
    >
      <h4 className="font-bold text-sm mb-2 text-white">{vacancy.title}</h4>
      <p className="text-[#ff6b00] font-bold text-sm mb-2 drop-shadow-[0_0_5px_rgba(255,107,0,0.4)]">{vacancy.salary}</p>
      <p className="text-xs text-[#c5c6c7] mb-1">{vacancy.location}</p>
      <p className="text-xs text-[#c5c6c7]/70 mb-3">
        {vacancy.schedule || vacancy.experience}
      </p>
      <button className="px-4 py-1.5 bg-[#ff6b00]/10 border border-[#ff6b00]/30 text-[#ff6b00] text-xs font-bold rounded-full hover:bg-[#ff6b00] hover:text-white transition-all w-full shadow-[0_0_10px_rgba(255,107,0,0.1)] hover:shadow-[0_0_15px_rgba(255,107,0,0.4)]">
        Откликнуться
      </button>
    </motion.div>
  );
}
