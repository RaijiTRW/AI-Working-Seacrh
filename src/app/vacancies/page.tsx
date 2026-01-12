"use client";

import { useState, useCallback, useEffect } from "react";
import Header from "@/components/landing/Header";
import VacancyFilters from "@/components/vacancies/VacancyFilters";
import VacancyFeed from "@/components/vacancies/VacancyFeed";
import VacancyStats from "@/components/vacancies/VacancyStats";
import { getVacancyFeed, Vacancy, FeedFilters } from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface FilterState {
  query: string;
  cities: string[];
  salaryFrom: string;
  experience: string;
}

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [currentSource, setCurrentSource] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    query: "",
    cities: [],
    salaryFrom: "",
    experience: "",
  });

  // Get current user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id);
    };
    getUser();
  }, []);

  const fetchVacancies = useCallback(async (filters: FeedFilters, append = false) => {
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
      cities: currentFilters.cities.length > 0 ? currentFilters.cities : undefined,
      salary_from: currentFilters.salaryFrom ? parseInt(currentFilters.salaryFrom) : undefined,
      experience: currentFilters.experience || undefined,
      source: currentSource || undefined,
      page: 1,
      limit: 20,
    });
  }, [currentFilters, currentSource, fetchVacancies]);

  const handleFilterChange = useCallback((filters: FilterState) => {
    setCurrentFilters(filters);

    // Автоматический поиск при изменении фильтров
    setPage(1);
    fetchVacancies({
      query: filters.query || currentQuery,
      cities: filters.cities.length > 0 ? filters.cities : undefined,
      salary_from: filters.salaryFrom ? parseInt(filters.salaryFrom) : undefined,
      experience: filters.experience || undefined,
      source: currentSource || undefined,
      page: 1,
      limit: 20,
    });
  }, [currentQuery, currentSource, fetchVacancies]);

  const handleSourceFilter = useCallback((source: string | null) => {
    setCurrentSource(source);
    setPage(1);

    fetchVacancies({
      query: currentQuery || undefined,
      cities: currentFilters.cities.length > 0 ? currentFilters.cities : undefined,
      salary_from: currentFilters.salaryFrom ? parseInt(currentFilters.salaryFrom) : undefined,
      experience: currentFilters.experience || undefined,
      source: source || undefined,
      page: 1,
      limit: 20,
    });
  }, [currentQuery, currentFilters, fetchVacancies]);

  // Загружаем вакансии при первом рендере
  useEffect(() => {
    fetchVacancies({ page: 1, limit: 20 });
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!hasNext || loading) return;

    const nextPage = page + 1;
    fetchVacancies({
      query: currentQuery,
      cities: currentFilters.cities.length > 0 ? currentFilters.cities : undefined,
      salary_from: currentFilters.salaryFrom ? parseInt(currentFilters.salaryFrom) : undefined,
      experience: currentFilters.experience || undefined,
      source: currentSource || undefined,
      page: nextPage,
      limit: 20,
    }, true);
  }, [hasNext, loading, page, currentQuery, currentFilters, currentSource, fetchVacancies]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero section */}
      <section className="pt-20 sm:pt-24 pb-6 sm:pb-8 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Найдите работу мечты
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Вакансии от лучших работодателей России в одном месте.
          </p>
        </div>
      </section>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-24 lg:pb-8">
        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar - filters */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <VacancyFilters
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
                initialFilters={currentFilters}
              />
            </div>
          </aside>

          {/* Main feed */}
          <div className="flex-1 min-w-0">
            <VacancyStats
              total={total}
              activeSource={currentSource}
              onSourceFilter={handleSourceFilter}
            />
            <VacancyFeed
              vacancies={vacancies}
              loading={loading}
              query={currentQuery}
              total={total}
              hasNext={hasNext}
              onLoadMore={handleLoadMore}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </main>

      {/* Mobile filter button */}
      <div className="lg:hidden fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-full shadow-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Фильтры
        </button>
      </div>

      {/* Mobile filters modal */}
      {mobileFiltersOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFiltersOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Фильтры</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filters content */}
            <div className="flex-1 overflow-y-auto p-4">
              <VacancyFilters
                initialFilters={currentFilters}
                onSearch={(query) => {
                  handleSearch(query);
                  setMobileFiltersOpen(false);
                }}
                onFilterChange={(filters) => {
                  handleFilterChange(filters);
                  setMobileFiltersOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
