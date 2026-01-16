"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getSchedulerStatus,
  getJobHistory,
  getVolumeStats,
  pauseJob,
  resumeJob,
  triggerJob,
  SchedulerStatus,
  JobHistoryItem,
  VolumeDataPoint,
} from "@/lib/api";
import PlatformStatusCard from "./PlatformStatusCard";
import JobHistoryTable from "./JobHistoryTable";
import VolumeChart from "./VolumeChart";

interface SchedulerTabProps {
  token: string;
}

export default function SchedulerTab({ token }: SchedulerTabProps) {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [history, setHistory] = useState<JobHistoryItem[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [statusData, historyData, volumeDataResult] = await Promise.all([
        getSchedulerStatus(token),
        getJobHistory(token, undefined, 20),
        getVolumeStats(token, 168), // 7 days
      ]);

      setStatus(statusData);
      setHistory(historyData);
      setVolumeData(volumeDataResult);
    } catch (err) {
      console.error("Error fetching scheduler data:", err);
      setError("Не удалось загрузить данные планировщика");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handlePause = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      await pauseJob(token, jobId);
      await fetchData();
    } catch (err) {
      console.error("Error pausing job:", err);
      setError("Не удалось остановить задачу");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      await resumeJob(token, jobId);
      await fetchData();
    } catch (err) {
      console.error("Error resuming job:", err);
      setError("Не удалось возобновить задачу");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTrigger = async (jobId: string) => {
    try {
      setActionLoading(jobId);
      await triggerJob(token, jobId);
      // Wait a bit for the job to start
      setTimeout(fetchData, 2000);
    } catch (err) {
      console.error("Error triggering job:", err);
      setError("Не удалось запустить задачу");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-32 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div className="h-48 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        {error}
      </div>
    );
  }

  // Sort jobs: mass_parsing_job (лента) первый, потом verification
  // Старые parsing_job и avito_job в конец (deprecated/отключены)
  const sortedJobs = status?.jobs.sort((a, b) => {
    const order = ["mass_parsing_job", "verification_job", "parsing_job", "avito_job"];
    return order.indexOf(a.job_id) - order.indexOf(b.job_id);
  }) || [];

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Scheduler status */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${status?.scheduler_running ? "bg-green-500" : "bg-red-500"}`} />
        <span className="text-gray-600">
          Планировщик: {status?.scheduler_running ? "работает" : "остановлен"}
        </span>
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedJobs.map((job) => (
          <PlatformStatusCard
            key={job.job_id}
            job={job}
            onPause={() => handlePause(job.job_id)}
            onResume={() => handleResume(job.job_id)}
            onTrigger={() => handleTrigger(job.job_id)}
            isLoading={actionLoading === job.job_id}
          />
        ))}
      </div>

      {/* Job history */}
      <JobHistoryTable history={history} />

      {/* Volume chart */}
      <VolumeChart data={volumeData} height={220} />
    </div>
  );
}
