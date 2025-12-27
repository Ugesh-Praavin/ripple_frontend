import React, { useState, useEffect } from 'react';
import { adminAPI, type Report } from '../services/api';
import ReportCard from '../components/ReportCard';
import StartWorkModal from '../components/StartWorkModal';
import { useToast } from '../components/Toast';

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getReports();
      // Sort by created_at DESC
      const sorted = [...data].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
      setReports(sorted);
    } catch (error) {
      console.error('[AdminDashboard] Failed to fetch reports:', error);
      showToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartWork = (reportId: string) => {
    setSelectedReportId(reportId);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (estimatedTime: string) => {
    if (!selectedReportId) return;

    try {
      setActionLoading(selectedReportId);
      await adminAPI.startWork(selectedReportId, { estimated_time: estimatedTime });
      
      // Optimistic update
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReportId
            ? { ...r, status: 'In Progress' as const, estimated_time: estimatedTime }
            : r
        )
      );

      showToast('Work started successfully', 'success');
      setIsModalOpen(false);
      setSelectedReportId(null);
    } catch (error) {
      console.error('[AdminDashboard] Failed to start work:', error);
      showToast('Failed to start work', 'error');
      // Refetch on error
      fetchReports();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage and assign community reports</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading reports...</span>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports</h3>
            <p className="mt-1 text-sm text-gray-500">No reports have been submitted yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onStartWork={handleStartWork}
                isAdmin={true}
                loading={actionLoading === report.id}
              />
            ))}
          </div>
        )}

        <StartWorkModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedReportId(null);
          }}
          onSubmit={handleModalSubmit}
          loading={!!actionLoading}
        />
      </div>
    </div>
  );
}

