"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import VacancyFilters from "@/components/vacancies/VacancyFilters";
import VacancyFeed from "@/components/vacancies/VacancyFeed";
import VacancyStats from "@/components/vacancies/VacancyStats";
import { getVacancyFeed, Vacancy, FeedFilters } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/lib/useSiteSettings";
import AppHeader from "@/components/app/Header";

interface FilterState {
  query: string;
  cities: string[];
  salaryFrom: string;
  experience: string;
  sources: string[];
}

export default function VacanciesPageClient() {
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [currentSource, setCurrentSource] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    query: "",
    cities: [],
    salaryFrom: "",
    experience: "",
    sources: [],
  });

  // Get current user ID and check admin role
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);

        // Check if user is admin
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        setIsAdmin(profile?.role === "admin");
      }
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
      source: currentFilters.sources.length > 0 ? currentFilters.sources.join(",") : currentSource || undefined,
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
      source: filters.sources.length > 0 ? filters.sources.join(",") : currentSource || undefined,
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
      source: currentFilters.sources.length > 0 ? currentFilters.sources.join(",") : currentSource || undefined,
      page: nextPage,
      limit: 20,
    }, true);
  }, [hasNext, loading, page, currentQuery, currentFilters, currentSource, fetchVacancies]);

  // Check if vacancies are disabled
  if (settingsLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#0b0c10]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-[#ff6b00]/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-[#ff6b00] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(255,107,0,0.5)]" />
        </div>
      </div>
    );
  }

  if (!settings.vacancies_enabled && !isAdmin) {
    return (
      <div className="min-h-[100dvh] bg-[#0b0c10]">
        <AppHeader />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-32">
          <div className="bg-[#1f2833]/40 backdrop-blur-md rounded-2xl border border-[#c5c6c7]/10 p-8 text-center shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="w-20 h-20 bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative">
              <div className="absolute inset-0 rounded-full border border-[#ff6b00]/20 animate-ping" />
              <svg className="w-10 h-10 text-[#ff6b00] opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white mb-3 tracking-wide">
              Лента вакансий временно недоступна
            </h1>
            <p className="text-[#c5c6c7]/60 font-medium">
              Функция отключена администратором. Пожалуйста, попробуйте позже.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0b0c10] relative">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
      <AppHeader />

      {/* Hero section */}
      <section className="relative pt-24 sm:pt-28 md:pt-32 pb-6 sm:pb-8 md:pb-10 bg-[#0b0c10] border-b border-[#c5c6c7]/5 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#ff6b00]/20 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3 tracking-wide drop-shadow-sm">
            Найдите <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ff8c00]">работу мечты</span>
          </h1>
          <p className="text-sm sm:text-base text-[#c5c6c7]/70 font-medium">
            Нейро-агрегатор вакансий с hh.ru, Avito, SuperJob и Хабр Карьера.
          </p>
        </div>
      </section>

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-32 sm:pb-40 lg:pb-12">
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
      <div className="lg:hidden fixed bottom-6 sm:bottom-4 left-4 right-4 z-40 flex gap-3">
        <Link
          href="/chat"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 min-h-12 bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] text-[#0b0c10] rounded-2xl shadow-[0_0_20px_rgba(255,107,0,0.3)] text-sm font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(255,107,0,0.5)] transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="hidden sm:inline">ИИ-Поиск</span>
        </Link>
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 min-h-12 bg-[#1f2833]/90 backdrop-blur-md border border-[#c5c6c7]/20 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] text-sm font-bold text-white hover:bg-[#1f2833] transition-all"
        >
          <svg className="w-5 h-5 text-[#00f0ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Фильтры</span>
        </button>
      </div>

      {/* Mobile filters modal */}
      {mobileFiltersOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#0b0c10]/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setMobileFiltersOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#0b0c10] border-t border-[#c5c6c7]/10 rounded-t-3xl max-h-[85vh] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-full duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#c5c6c7]/10 bg-[#1f2833]/50 rounded-t-3xl">
              <h2 className="text-lg font-bold text-white tracking-wide">Фильтры</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 -mr-2 rounded-xl text-[#c5c6c7]/60 hover:text-white hover:bg-[#1f2833] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filters content */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-[#1f2833] scrollbar-track-transparent">
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
