import React, { useState, useEffect } from 'react';
import { supervisorAPI, type Report } from '../services/api';
import ReportCard from '../components/ReportCard';
import AssignWorkerDropdown from '../components/AssignWorkerDropdown';
import ImageUploadModal from '../components/ImageUploadModal';
import { useToast } from '../components/Toast';

export default function SupervisorDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await supervisorAPI.getReports();
      // Filter out resolved reports and sort by created_at DESC
      const filtered = data.filter((r) => r.status !== 'Resolved');
      const sorted = [...filtered].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
      setReports(sorted);
    } catch (error) {
      console.error('[SupervisorDashboard] Failed to fetch reports:', error);
      showToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWorker = async (reportId: string, workerName: string) => {
    try {
      setActionLoading(reportId);
      await supervisorAPI.assignWorker(reportId, { worker_name: workerName });

      // Optimistic update
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, worker_name: workerName } : r
        )
      );

      showToast(`Worker ${workerName} assigned successfully`, 'success');
    } catch (error) {
      console.error('[SupervisorDashboard] Failed to assign worker:', error);
      showToast('Failed to assign worker', 'error');
      // Refetch on error
      fetchReports();
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = (reportId: string) => {
    setSelectedReportId(reportId);
    setIsImageModalOpen(true);
  };

  const handleImageSubmit = async (imageUrl: string) => {
    if (!selectedReportId) return;

    try {
      setActionLoading(selectedReportId);
      const response = await supervisorAPI.completeReport(selectedReportId, {
        image_url: imageUrl,
      });

      if (response.status === 'Resolved') {
        // Remove from list
        setReports((prev) => prev.filter((r) => r.id !== selectedReportId));
        showToast('Report completed successfully', 'success');
      } else if (response.requires_manual_review) {
        // Update status but keep in list with warning
        setReports((prev) =>
          prev.map((r) =>
            r.id === selectedReportId ? { ...r, status: 'Pending' as const } : r
          )
        );
        showToast('Report requires manual review', 'warning');
      } else {
        // Update status
        setReports((prev) =>
          prev.map((r) =>
            r.id === selectedReportId ? { ...r, status: response.status as any } : r
          )
        );
        showToast('Report updated', 'success');
      }

      setIsImageModalOpen(false);
      setSelectedReportId(null);
    } catch (error) {
      console.error('[SupervisorDashboard] Failed to complete report:', error);
      showToast('Failed to complete report', 'error');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supervisor Dashboard</h1>
          <p className="text-gray-600">Manage assigned reports and workers</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
            <p className="mt-1 text-sm text-gray-500">
              No assigned or unassigned reports available.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div key={report.id}>
                <ReportCard
                  report={report}
                  onComplete={handleComplete}
                  isSupervisor={true}
                  loading={actionLoading === report.id}
                />
                {!report.worker_name && (
                  <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <AssignWorkerDropdown
                      reportId={report.id}
                      onAssign={handleAssignWorker}
                      loading={actionLoading === report.id}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <ImageUploadModal
          isOpen={isImageModalOpen}
          onClose={() => {
            setIsImageModalOpen(false);
            setSelectedReportId(null);
          }}
          onSubmit={handleImageSubmit}
          loading={!!actionLoading}
          reportId={selectedReportId || undefined}
        />
      </div>
    </div>
  );
}

