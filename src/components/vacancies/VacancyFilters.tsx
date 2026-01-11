"use client";

import { useState } from "react";

interface VacancyFiltersProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: FilterState) => void;
}

interface FilterState {
  query: string;
  city: string;
  salaryFrom: string;
  experience: string;
}

export default function VacancyFilters({ onSearch, onFilterChange }: VacancyFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    query: "",
    city: "",
    salaryFrom: "",
    experience: "",
  });

  const handleChange = (field: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSearch = () => {
    onSearch?.(filters.query);
  };

  const experienceOptions = [
    { value: "", label: "Любой" },
    { value: "no_experience", label: "Без опыта" },
    { value: "1-3", label: "1-3 года" },
    { value: "3-6", label: "3-6 лет" },
    { value: "6+", label: "6+ лет" },
  ];

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="relative">
          <input
            type="text"
            value={filters.query}
            onChange={(e) => handleChange("query", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Поиск вакансий..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <button
          onClick={handleSearch}
          className="w-full mt-3 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
        >
          Найти
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Фильтры</h3>

        {/* City */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Город</label>
          <input
            type="text"
            value={filters.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Москва"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Salary */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Уровень дохода</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={filters.salaryFrom}
              onChange={(e) => handleChange("salaryFrom", e.target.value)}
              placeholder="от"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <span className="text-gray-500">P</span>
          </div>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Опыт работы</label>
          <div className="space-y-2">
            {experienceOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="experience"
                  value={option.value}
                  checked={filters.experience === option.value}
                  onChange={(e) => handleChange("experience", e.target.value)}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-600">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Reset */}
        {(filters.city || filters.salaryFrom || filters.experience) && (
          <button
            onClick={() => setFilters({ query: filters.query, city: "", salaryFrom: "", experience: "" })}
            className="mt-4 text-sm text-orange-600 hover:text-orange-700"
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {/* Map placeholder */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="relative h-48 bg-gray-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Вакансии на карте</p>
              <p className="text-xs text-gray-400 mt-1">Скоро</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
