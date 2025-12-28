import React, { useState, useEffect } from "react";
import { supervisorAPI, type Report } from "../services/api";
import ReportCard from "../components/ReportCard";
import AssignWorkerDropdown from "../components/AssignWorkerDropdown";
import ImageUploadModal from "../components/ImageUploadModal";
import { useToast } from "../components/Toast";
import { uploadResolvedPhoto } from "../services/supabaseService";

import type { AxiosError } from "axios";

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
      const filtered = data.filter((r) => r.status !== "Resolved");
      const sorted = [...filtered].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
      setReports(sorted);
    } catch (error) {
      console.error("[SupervisorDashboard] Failed to fetch reports:", error);
      showToast("Failed to load reports", "error");
    } finally {
      setLoading(false);
    }
  };

  // Inside handleAssignWorker
  // Corrected handleAssignWorker
  const handleAssignWorker = async (reportId: string, workerName: string) => {
    try {
      setActionLoading(reportId);

      // 1. Call backend API
      const updatedReport = await supervisorAPI.assignWorker(reportId, {
        worker_name: workerName,
      });

      // 2. Update local state using BACKEND RESPONSE ONLY
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? {
                ...r,
                worker_name: updatedReport.worker_name,
                status: updatedReport.status, // ✅ TRUST BACKEND
              }
            : r
        )
      );

      showToast(`Worker ${workerName} assigned successfully`, "success");
    } catch (error) {
      console.error("[SupervisorDashboard] Failed to assign worker:", error);
      showToast("Failed to assign worker", "error");

      // Ensure UI is always in sync with DB
      await fetchReports();
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = (reportId: string) => {
    setSelectedReportId(reportId);
    setIsImageModalOpen(true);
  };

  const handleImageSubmit = async (file: File) => {
    if (!selectedReportId) {
      console.error("[SupervisorDashboard] No report ID selected");
      showToast("No report selected", "error");
      return;
    }

    // TEMP: Log selected reportId
    console.log(
      "[SupervisorDashboard] TEMP - Selected reportId:",
      selectedReportId
    );
    console.log("[SupervisorDashboard] TEMP - File details:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    try {
      setActionLoading(selectedReportId);

      // Step 1: Upload image to Supabase Storage (NOT database)
      console.log(
        "[SupervisorDashboard] Starting upload to Supabase Storage...",
        {
          reportId: selectedReportId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        }
      );

      const publicUrl = await uploadResolvedPhoto(selectedReportId, file);

      // Step 2: Validate public URL
      if (!publicUrl || typeof publicUrl !== "string") {
        throw new Error("Image upload failed - no public URL returned");
      }

      if (!publicUrl.startsWith("http")) {
        throw new Error(`Invalid public URL format: ${publicUrl}`);
      }

      // TEMP: Log generated image URL
      console.log(
        "[SupervisorDashboard] TEMP - Generated image URL:",
        publicUrl
      );
      console.log("[SupervisorDashboard] TEMP - URL type:", typeof publicUrl);
      console.log("[SupervisorDashboard] TEMP - URL length:", publicUrl.length);

      // Step 3: Prepare request payload
      const requestPayload = {
        image_url: publicUrl,
      };

      // TEMP: Log request payload
      console.log(
        "[SupervisorDashboard] TEMP - Request payload:",
        requestPayload
      );
      console.log(
        "[SupervisorDashboard] TEMP - Payload JSON stringified:",
        JSON.stringify(requestPayload)
      );
      console.log(
        "[SupervisorDashboard] TEMP - API base URL:",
        process.env.REACT_APP_API_BASE_URL || "http://localhost:3000"
      );
      console.log(
        "[SupervisorDashboard] TEMP - Endpoint:",
        `/supervisor/report/${selectedReportId}/complete`
      );

      // Step 4: Call backend API using supervisorAPI.completeReport
      // This ensures proper error handling and JSON serialization
      const responseData = await supervisorAPI.completeReport(
        selectedReportId,
        requestPayload
      );

      console.log(
        "[SupervisorDashboard] TEMP - Backend response received:",
        responseData
      );

      // Step 5: Handle response
      if (responseData.status === "Resolved") {
        // Remove from list
        setReports((prev) => prev.filter((r) => r.id !== selectedReportId));
        showToast("Report completed successfully", "success");
      } else if (responseData.requires_manual_review) {
        // Update status but keep in list with warning badge
        setReports((prev) =>
          prev.map((r) =>
            r.id === selectedReportId
              ? {
                  ...r,
                  status: "Pending" as const,
                  requires_manual_review: true,
                }
              : r
          )
        );
        showToast("Report requires manual review", "warning");
      } else {
        // Update status
        setReports((prev) =>
          prev.map((r) =>
            r.id === selectedReportId
              ? { ...r, status: responseData.status as any }
              : r
          )
        );
        showToast("Report updated", "success");
      }

      setIsImageModalOpen(false);
      setSelectedReportId(null);
    } catch (error) {
      // TEMP: Comprehensive error logging
      console.error("[SupervisorDashboard] TEMP - Error occurred:", error);

      if (error && typeof error === "object" && "isAxiosError" in error) {
        const axiosError = error as AxiosError;
        console.error("[SupervisorDashboard] TEMP - Is Axios Error: true");
        console.error(
          "[SupervisorDashboard] TEMP - Error status:",
          axiosError.response?.status
        );
        console.error(
          "[SupervisorDashboard] TEMP - Error status text:",
          axiosError.response?.statusText
        );
        console.error(
          "[SupervisorDashboard] TEMP - Error response headers:",
          axiosError.response?.headers
        );
        console.error(
          "[SupervisorDashboard] TEMP - Error response data:",
          axiosError.response?.data
        );
        console.error(
          "[SupervisorDashboard] TEMP - Error response data (stringified):",
          JSON.stringify(axiosError.response?.data)
        );
        console.error("[SupervisorDashboard] TEMP - Error request config:", {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          baseURL: axiosError.config?.baseURL,
          headers: axiosError.config?.headers,
          data: axiosError.config?.data,
        });

        const errorMessage = axiosError.response?.data
          ? typeof axiosError.response.data === "string"
            ? axiosError.response.data
            : JSON.stringify(axiosError.response.data)
          : axiosError.message || "Unknown error";

        showToast(`Failed to complete report: ${errorMessage}`, "error");
      } else {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          "[SupervisorDashboard] TEMP - Non-Axios error:",
          errorMessage
        );
        showToast(`Failed to complete report: ${errorMessage}`, "error");
      }

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Supervisor Dashboard
          </h1>
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No reports
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No assigned or unassigned reports available.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div key={report.id} className="space-y-4">
                <ReportCard
                  report={report}
                  onComplete={handleComplete}
                  isSupervisor={true}
                  loading={actionLoading === report.id}
                />
                {/* Worker Assignment - Show when worker_name is null */}
                {!report.worker_name && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Worker
                    </label>
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
