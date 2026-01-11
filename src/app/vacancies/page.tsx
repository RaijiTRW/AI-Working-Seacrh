"use client";

import { useState, useCallback } from "react";
import Header from "@/components/landing/Header";
import VacancyFilters from "@/components/vacancies/VacancyFilters";
import VacancyFeed from "@/components/vacancies/VacancyFeed";
import { getVacancyFeed, Vacancy, FeedFilters } from "@/lib/api";

interface FilterState {
  query: string;
  city: string;
  salaryFrom: string;
  experience: string;
}

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    query: "",
    city: "",
    salaryFrom: "",
    experience: "",
  });

  const fetchVacancies = useCallback(async (filters: FeedFilters, append = false) => {
    if (!filters.query) return;

    setLoading(true);
    try {
      const result = await getVacancyFeed(filters);

      if (append) {
        setVacancies(prev => [...prev, ...result.vacancies]);
      } else {
        setVacancies(result.vacancies);
      }

      setTotal(result.total);
      setPage(result.page);
      setHasNext(result.has_next);
    } catch (error) {
      console.error("Failed to fetch vacancies:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    setCurrentQuery(query);
    setPage(1);

    fetchVacancies({
      query,
      city: currentFilters.city || undefined,
      salary_from: currentFilters.salaryFrom ? parseInt(currentFilters.salaryFrom) : undefined,
      experience: currentFilters.experience || undefined,
      page: 1,
      limit: 20,
    });
  }, [currentFilters, fetchVacancies]);

  const handleFilterChange = useCallback((filters: FilterState) => {
    setCurrentFilters(filters);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!hasNext || loading) return;

    const nextPage = page + 1;
    fetchVacancies({
      query: currentQuery,
      city: currentFilters.city || undefined,
      salary_from: currentFilters.salaryFrom ? parseInt(currentFilters.salaryFrom) : undefined,
      experience: currentFilters.experience || undefined,
      page: nextPage,
      limit: 20,
    }, true);
  }, [hasNext, loading, page, currentQuery, currentFilters, fetchVacancies]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero section */}
      <section className="pt-24 pb-8 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Найдите работу мечты
          </h1>
          <p className="text-gray-600">
            Вакансии от лучших работодателей России — без спама и дубликатов
          </p>
        </div>
      </section>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar - filters */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <VacancyFilters
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
              />
            </div>
          </aside>

          {/* Main feed */}
          <div className="flex-1 min-w-0">
            <VacancyFeed
              vacancies={vacancies}
              loading={loading}
              query={currentQuery}
              total={total}
              hasNext={hasNext}
              onLoadMore={handleLoadMore}
            />
          </div>
        </div>
      </main>

      {/* Mobile filter button */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full shadow-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Фильтры
        </button>
      </div>
    </div>
  );
}
