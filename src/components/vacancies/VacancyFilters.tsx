"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FilterState {
  query: string;
  cities: string[];
  salaryFrom: string;
  experience: string;
  sources: string[];
}

interface VacancyFiltersProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

const POPULAR_CITIES = [
  "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань",
  "Нижний Новгород", "Челябинск", "Самара", "Омск", "Ростов-на-Дону",
  "Уфа", "Красноярск", "Воронеж", "Пермь", "Волгоград", "Краснодар",
  "Саратов", "Тюмень", "Тольятти", "Ижевск"
];

const SOURCE_OPTIONS = [
  { value: "hh", label: "hh.ru", color: "bg-[#ff0000]/10 text-[#ff4444] border-[#ff4444]/30" },
  { value: "superjob", label: "SuperJob", color: "bg-[#00aaff]/10 text-[#00ccff] border-[#00ccff]/30" },
  { value: "avito", label: "Avito", color: "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30" },
  { value: "platform", label: "JobAISearch", color: "bg-[#ff6b00]/10 text-[#ff6b00] border-[#ff6b00]/40 shadow-[0_0_10px_rgba(255,107,0,0.2)]" },
];

export default function VacancyFilters({ onSearch, onFilterChange, initialFilters }: VacancyFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters || {
    query: "", cities: [], salaryFrom: "", experience: "", sources: []
  });
  const [citySearch, setCitySearch] = useState("");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialFilters) setFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return POPULAR_CITIES;
    const search = citySearch.toLowerCase();
    return POPULAR_CITIES.filter(city => city.toLowerCase().includes(search));
  }, [citySearch]);

  const handleChange = (field: keyof FilterState, value: string | string[]) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const toggleCity = (city: string) => {
    const newCities = filters.cities.includes(city)
      ? filters.cities.filter(c => c !== city)
      : [...filters.cities, city];
    handleChange("cities", newCities);
  };

  const removeCity = (city: string) => {
    handleChange("cities", filters.cities.filter(c => c !== city));
  };

  const toggleSource = (source: string) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter(s => s !== source)
      : [...filters.sources, source];
    handleChange("sources", newSources);
  };

  const handleSearch = () => {
    onSearch?.(filters.query);
  };

  const experienceOptions = [
    { value: "", label: "Любой опыт" },
    { value: "no_experience", label: "Нет опыта" },
    { value: "1-3", label: "От 1 года до 3 лет" },
    { value: "3-6", label: "От 3 до 6 лет" },
    { value: "6+", label: "Более 6 лет" },
  ];

  const hasFilters = filters.cities.length > 0 || filters.salaryFrom || filters.experience || filters.sources.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search Input Box */}
      <div className="bg-[#1f2833]/40 backdrop-blur-md rounded-2xl border border-[#c5c6c7]/10 p-4 shadow-[0_5px_15px_rgba(0,0,0,0.3)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#00f0ff]/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
        <h3 className="text-xs uppercase tracking-widest font-black text-[#c5c6c7]/50 mb-3 ml-1">Поиск по фразе</h3>
        <div className="relative z-10">
          <input
            type="text"
            value={filters.query}
            onChange={(e) => handleChange("query", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Профессия, навык..."
            className="w-full pl-10 pr-4 py-3 text-sm font-medium bg-[#0b0c10]/80 text-white placeholder-[#c5c6c7]/30 border border-[#c5c6c7]/20 rounded-xl focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-all"
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5c6c7]/50 group-focus-within:text-[#00f0ff] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={handleSearch}
          className="w-full mt-3 py-3 min-h-[44px] bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] text-[#0b0c10] font-black uppercase tracking-widest text-xs rounded-xl hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all hover:scale-[1.01] relative z-10"
        >
          Применить
        </button>
      </div>

      {/* Complex Filters Pane */}
      <div className="bg-[#1f2833]/40 backdrop-blur-md rounded-2xl border border-[#c5c6c7]/10 p-4 sm:p-5 shadow-[0_5px_15px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#c5c6c7]/10">
          <h3 className="text-sm uppercase tracking-widest font-black text-white flex items-center gap-2">
            <svg className="w-4 h-4 text-[#ff6b00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Критерии
          </h3>

          {hasFilters && (
            <button
              onClick={() => {
                const resetFilters = { query: filters.query, cities: [], salaryFrom: "", experience: "", sources: [] };
                setFilters(resetFilters);
                setCitySearch("");
                onFilterChange?.(resetFilters);
              }}
              className="text-[#ff6b00] text-[10px] uppercase font-bold tracking-widest hover:text-[#ff8c00] transition-colors"
            >
              Очистить
            </button>
          )}
        </div>

        {/* City Filter */}
        <div className="mb-6" ref={dropdownRef}>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#c5c6c7]/60 mb-2.5 ml-1">Регион поиска</label>

          {filters.cities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {filters.cities.map(city => (
                <span
                  key={city}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#ff6b00]/10 border border-[#ff6b00]/30 text-[#ff8c00] text-xs font-bold rounded-lg shadow-[0_0_10px_rgba(255,107,0,0.1)]"
                >
                  {city}
                  <button
                    onClick={() => removeCity(city)}
                    className="hover:text-white transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              onFocus={() => setIsCityDropdownOpen(true)}
              placeholder="Мск, Спб..."
              className="w-full px-4 py-2.5 text-sm bg-[#0b0c10]/50 text-white placeholder-[#c5c6c7]/30 border border-[#c5c6c7]/20 rounded-xl focus:outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00] transition-colors"
            />
            <button
              type="button"
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#c5c6c7]/50 hover:text-white"
            >
              <svg className={`w-4 h-4 transition-transform duration-300 ${isCityDropdownOpen ? 'rotate-180 text-[#ff6b00]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <AnimatePresence>
            {isCityDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                className="absolute z-30 mt-2 w-[calc(100%-2rem)] max-w-[calc(18rem-2rem)] max-h-60 overflow-y-auto border border-[#c5c6c7]/20 rounded-xl bg-[#1f2833]/95 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] scrollbar-thin scrollbar-thumb-[#0b0c10]"
              >
                {filteredCities.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-[#c5c6c7]/50 text-center font-medium">Нет совпадений</div>
                ) : (
                  filteredCities.map(city => (
                    <label key={city} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#0b0c10]/80 cursor-pointer transition-colors border-b border-[#c5c6c7]/5 last:border-0 border-transparent">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={filters.cities.includes(city)}
                          onChange={() => toggleCity(city)}
                          className="peer appearance-none w-4 h-4 border-2 border-[#c5c6c7]/30 rounded bg-transparent checked:bg-[#ff6b00] checked:border-[#ff6b00] transition-all cursor-pointer"
                        />
                        <svg className="absolute w-3 h-3 text-[#0b0c10] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-[#c5c6c7] peer-checked:text-white font-medium">{city}</span>
                    </label>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Salary */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#c5c6c7]/60 mb-2.5 ml-1">Желаемый оклад</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5c6c7]/50 font-medium">от</span>
            <input
              type="number"
              value={filters.salaryFrom}
              onChange={(e) => handleChange("salaryFrom", e.target.value)}
              placeholder="100 000"
              className="w-full pl-10 pr-12 py-2.5 text-sm bg-[#0b0c10]/50 text-white placeholder-[#c5c6c7]/30 border border-[#c5c6c7]/20 rounded-xl focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition-colors font-bold tracking-wide"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c5c6c7]/50 font-bold">₽</span>
          </div>
        </div>

        {/* Experience */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#c5c6c7]/60 mb-3 ml-1">Стаж в IT</label>
          <div className="space-y-2">
            {experienceOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    name="experience"
                    value={option.value}
                    checked={filters.experience === option.value}
                    onChange={(e) => handleChange("experience", e.target.value)}
                    className="peer appearance-none w-4 h-4 border-2 border-[#c5c6c7]/30 rounded-full bg-transparent checked:border-[#00f0ff] transition-all cursor-pointer"
                  />
                  <div className="absolute w-2 h-2 bg-[#00f0ff] rounded-full opacity-0 peer-checked:opacity-100 transform scale-50 peer-checked:scale-100 transition-all pointer-events-none shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
                </div>
                <span className="text-sm font-medium text-[#c5c6c7]/80 group-hover:text-white transition-colors">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div className="mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#c5c6c7]/60 mb-3 ml-1">Агрегаторы</label>
          <div className="flex flex-wrap gap-2">
            {SOURCE_OPTIONS.map((option) => {
              const checked = filters.sources.includes(option.value);
              return (
                <label key={option.value} className="relative cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSource(option.value)}
                    className="sr-only"
                  />
                  <div className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border transition-all ${checked
                      ? option.color
                      : "bg-[#0b0c10]/40 text-[#c5c6c7]/50 border-[#c5c6c7]/10 hover:border-[#c5c6c7]/30 hover:bg-[#0b0c10]/60"
                    }`}>
                    {option.label}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map Module (disabled placeholder) */}
      <div className="bg-[#1f2833]/30 border border-[#c5c6c7]/5 rounded-2xl overflow-hidden relative group">
        <div className="relative h-32 bg-[url('/grid.svg')] bg-center opacity-20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0c10]/80 backdrop-blur-[2px]">
          <div className="w-10 h-10 mb-2 bg-[#00f0ff]/5 border border-[#00f0ff]/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-[#00f0ff]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-xs font-bold text-[#c5c6c7]/40 uppercase tracking-widest">Гео-поиск</p>
          <p className="text-[10px] text-[#00f0ff]/40 uppercase font-black tracking-widest mt-1 border border-[#00f0ff]/20 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(0,240,255,0.1)]">Скоро</p>
        </div>
      </div>
    </div>
  );
}
