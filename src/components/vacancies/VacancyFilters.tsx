"use client";

import { useState, useMemo, useRef, useEffect } from "react";

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
  // Топ-15 по населению
  "Москва",
  "Санкт-Петербург",
  "Новосибирск",
  "Екатеринбург",
  "Казань",
  "Нижний Новгород",
  "Челябинск",
  "Самара",
  "Омск",
  "Ростов-на-Дону",
  "Уфа",
  "Красноярск",
  "Воронеж",
  "Пермь",
  "Волгоград",
  // Крупные города
  "Краснодар",
  "Саратов",
  "Тюмень",
  "Тольятти",
  "Ижевск",
  "Барнаул",
  "Ульяновск",
  "Иркутск",
  "Хабаровск",
  "Ярославль",
  "Владивосток",
  "Махачкала",
  "Томск",
  "Оренбург",
  "Кемерово",
  "Новокузнецк",
  "Рязань",
  "Астрахань",
  "Набережные Челны",
  "Пенза",
  "Липецк",
  "Киров",
  "Чебоксары",
  "Калининград",
  "Тула",
  "Курск",
  "Сочи",
  "Ставрополь",
  "Улан-Удэ",
  "Тверь",
  "Магнитогорск",
  "Белгород",
  "Сургут",
  "Иваново",
  "Брянск",
  // Южные города
  "Новороссийск",
  "Таганрог",
  "Анапа",
  "Геленджик",
  "Армавир",
  "Волгодонск",
  "Шахты",
  "Батайск",
  "Невинномысск",
  "Пятигорск",
  "Кисловодск",
  "Ессентуки",
  // Центр
  "Калуга",
  "Орёл",
  "Смоленск",
  "Владимир",
  "Кострома",
  "Тамбов",
  "Вологда",
  "Мурманск",
  "Петрозаводск",
  "Архангельск",
  "Великий Новгород",
  "Псков",
  // Урал и Сибирь
  "Нижний Тагил",
  "Златоуст",
  "Миасс",
  "Копейск",
  "Курган",
  "Нижневартовск",
  "Ноябрьск",
  "Новый Уренгой",
  "Норильск",
  "Братск",
  "Ангарск",
  "Чита",
  "Якутск",
  "Благовещенск",
  "Комсомольск-на-Амуре",
  "Южно-Сахалинск",
  "Петропавловск-Камчатский",
  // Поволжье
  "Саранск",
  "Йошкар-Ола",
  "Сызрань",
  "Балаково",
  "Энгельс",
  "Дзержинск",
  "Арзамас",
  "Димитровград",
  "Альметьевск",
  "Нижнекамск",
  "Елабуга",
];

const SOURCE_OPTIONS = [
  { value: "hh", label: "hh.ru", color: "bg-red-100 text-red-600" },
  { value: "superjob", label: "SuperJob", color: "bg-blue-100 text-blue-600" },
  { value: "avito", label: "Avito", color: "bg-green-100 text-green-600" },
  { value: "platform", label: "Наша", color: "bg-orange-100 text-orange-600" },
];

export default function VacancyFilters({ onSearch, onFilterChange, initialFilters }: VacancyFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters || {
    query: "",
    cities: [],
    salaryFrom: "",
    experience: "",
    sources: [],
  });
  const [citySearch, setCitySearch] = useState("");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync filters when initialFilters changes
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter cities by search
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
    { value: "", label: "Любой" },
    { value: "no_experience", label: "Без опыта" },
    { value: "1-3", label: "1-3 года" },
    { value: "3-6", label: "3-6 лет" },
    { value: "6+", label: "6+ лет" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4">
        <div className="relative">
          <input
            type="text"
            value={filters.query}
            onChange={(e) => handleChange("query", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Поиск вакансий..."
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
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
          className="w-full mt-2.5 sm:mt-3 py-2.5 sm:py-3 min-h-11 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors text-sm sm:text-base"
        >
          Найти
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4">
        <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Фильтры</h3>

        {/* City */}
        <div className="mb-3 sm:mb-4" ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2">Город</label>

          {/* Selected cities tags */}
          {filters.cities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
              {filters.cities.map(city => (
                <span
                  key={city}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs sm:text-sm rounded-lg"
                >
                  {city}
                  <button
                    onClick={() => removeCity(city)}
                    className="hover:text-orange-900 min-h-5 min-w-5 flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* City search input */}
          <div className="relative">
            <input
              type="text"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              onFocus={() => setIsCityDropdownOpen(true)}
              placeholder="Найти город..."
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded min-h-7 min-w-7 flex items-center justify-center"
            >
              <svg
                className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* City dropdown with checkboxes */}
          {isCityDropdownOpen && (
            <div className="mt-2 max-h-60 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-lg">
              {filteredCities.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">Город не найден</div>
              ) : (
                filteredCities.map(city => (
                  <label
                    key={city}
                    className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.cities.includes(city)}
                      onChange={() => toggleCity(city)}
                      className="w-4 h-4 sm:w-4 sm:h-4 text-orange-500 focus:ring-orange-500 rounded"
                    />
                    <span className="text-sm text-gray-700">{city}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Salary */}
        <div className="mb-3 sm:mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Уровень дохода</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={filters.salaryFrom}
              onChange={(e) => handleChange("salaryFrom", e.target.value)}
              placeholder="от"
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <span className="text-gray-500 text-sm sm:text-base">₽</span>
          </div>
        </div>

        {/* Experience */}
        <div className="mb-3 sm:mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Опыт работы</label>
          <div className="space-y-1.5 sm:space-y-2">
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
                <span className="text-sm sm:text-base text-gray-600">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div className="mb-3 sm:mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Источники</label>
          <div className="space-y-1.5 sm:space-y-2">
            {SOURCE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.sources.includes(option.value)}
                  onChange={() => toggleSource(option.value)}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500 rounded"
                />
                <span className={`text-xs px-2 py-0.5 rounded-full ${option.color}`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Reset */}
        {(filters.cities.length > 0 || filters.salaryFrom || filters.experience || filters.sources.length > 0) && (
          <button
            onClick={() => {
              setFilters({ query: filters.query, cities: [], salaryFrom: "", experience: "", sources: [] });
              setCitySearch("");
            }}
            className="mt-3 sm:mt-4 text-sm text-orange-600 hover:text-orange-700 min-h-11 flex items-center"
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {/* Map placeholder */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="relative h-40 sm:h-48 bg-gray-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">Вакансии на карте</p>
              <p className="text-xs text-gray-400 mt-1">Скоро</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
