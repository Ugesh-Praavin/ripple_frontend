import { useEffect, useState } from 'react';
import { updateReportStatus, uploadResolvedPhoto, fetchReportsForDashboard } from '../services/supabaseService';
import ReportCard from '../components/ReportCard';
import ImageUploadModal from '../components/ImageUploadModal';
import type { Report } from '../types';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';


export default function Reports() {
const [reports, setReports] = useState<Report[]>([]);
const [filteredReports, setFilteredReports] = useState<Report[]>([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
const [statusFilter, setStatusFilter] = useState<string>('all');
const [startDate, setStartDate] = useState<string>('');
const [endDate, setEndDate] = useState<string>('');
const [locationQuery, setLocationQuery] = useState<string>('');
const [radiusKm, setRadiusKm] = useState<number>(0);
const [selectedReport, setSelectedReport] = useState<Report | null>(null);
const [showImageModal, setShowImageModal] = useState(false);
const { user, isAdmin } = useAuth();
const { showToast } = useToast();


useEffect(() => {
let active = true;
async function load() {
try {
setLoading(true);
const list = await fetchReportsForDashboard({ userId: user?.uid, isAdmin });
console.log('[UI] Reports fetched count', list.length);
if (active) setReports(list);
} catch (e) {
console.error('[UI] Failed to load reports', e);
} finally {
if (active) setLoading(false);
}
}
load();
return () => {
active = false;
};
}, [user?.uid, isAdmin]);

// Filter reports based on search term and status
useEffect(() => {
  let filtered = reports;

  // Filter by status
  if (statusFilter !== 'all') {
    filtered = filtered.filter(report => report.status === statusFilter);
  }

  // Filter by search term
  if (searchTerm) {
    filtered = filtered.filter(report => 
      report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Filter by date range (using createdAt if ISO string; otherwise skip)
  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) {
      // include the whole end day
      end.setHours(23, 59, 59, 999);
    }
    filtered = filtered.filter((report) => {
      const created = (report.createdAt && typeof report.createdAt === 'string') ? new Date(report.createdAt) : null;
      if (!created) return true; // keep if missing
      if (start && created < start) return false;
      if (end && created > end) return false;
      return true;
    });
  }

  // Filter by location within radius if query is lat,lng and radiusKm > 0
  if (locationQuery && radiusKm > 0) {
    const [latStr, lngStr] = locationQuery.split(',').map(s => s.trim());
    const lat0 = parseFloat(latStr);
    const lng0 = parseFloat(lngStr);
    if (!Number.isNaN(lat0) && !Number.isNaN(lng0)) {
      filtered = filtered.filter((report) => {
        if (!report.location) return false;
        const d = haversineKm(lat0, lng0, report.location.lat, report.location.lng);
        return d <= radiusKm;
      });
    }
  }

  setFilteredReports(filtered);
}, [reports, searchTerm, statusFilter, startDate, endDate, locationQuery, radiusKm]);

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


async function handleUpdate(id: string, status: string, file?: File | null) {
  try {
    console.log('[Reports] Starting update', { id, status, hasFile: !!file });
    
    if (status === 'Resolved' && file) {
      console.log('[Reports] Uploading resolved photo...');
      const publicUrl = await uploadResolvedPhoto(id, file);
      console.log('[Reports] Photo uploaded, updating status...');
      await updateReportStatus(id, status, publicUrl, user?.uid || undefined);
    } else {
      console.log('[Reports] Updating status without photo...');
      await updateReportStatus(id, status, undefined, user?.uid || undefined);
    }
    
    console.log('[Reports] Update successful, refreshing reports...');
    
    // Refresh the reports list
    const updatedReports = await fetchReportsForDashboard({ userId: user?.uid, isAdmin });
    setReports(updatedReports);
    
    showToast(`Report status updated to ${status} successfully!`, 'success');
    
  } catch (err: any) {
    console.error('[Reports] Update failed:', err);
    showToast(`Failed to update report: ${err.message}`, 'error');
  }
}

const handleResolveWithImage = (report: Report) => {
  setSelectedReport(report);
  setShowImageModal(true);
};

const handleImageModalClose = () => {
  setSelectedReport(null);
  setShowImageModal(false);
};

const handleImageModalSuccess = async () => {
  // Refresh the reports list
  try {
    const updatedReports = await fetchReportsForDashboard({ userId: user?.uid, isAdmin });
    setReports(updatedReports);
  } catch (error) {
    console.error('[Reports] Failed to refresh reports after resolution:', error);
  }
};


return (
<div className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Reports</h1>
      <p className="text-gray-600">Manage and resolve community reports efficiently</p>
    </div>

    {/* Search and Filter Controls */}
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Reports
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Status Filter */
        }
        <div className="sm:w-48">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="sm:w-40">
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="sm:w-40">
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Location within radius */}
        <div className="sm:w-56">
          <label htmlFor="location-query" className="block text-sm font-medium text-gray-700 mb-1">
            Location (lat,lng)
          </label>
          <input
            type="text"
            id="location-query"
            placeholder="e.g. 12.9716, 77.5946"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="sm:w-36">
          <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">
            Radius (km)
          </label>
          <input
            type="number"
            id="radius"
            min={0}
            step={1}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Results Summary */}
      <div className="mt-3 text-sm text-gray-600">
        Showing {filteredReports.length} of {reports.length} reports
        {searchTerm && ` matching "${searchTerm}"`}
        {statusFilter !== 'all' && ` with status "${statusFilter}"`}
      </div>
    </div>

  {loading && (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center space-x-2">
        <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-gray-600">Loading reports...</span>
      </div>
    </div>
  )}

  {filteredReports.length === 0 && !loading && (
    <div className="text-center py-12">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        {reports.length === 0 ? 'No reports' : 'No matching reports'}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {reports.length === 0 
          ? 'No community reports have been submitted yet.' 
          : 'Try adjusting your search or filter criteria.'
        }
      </p>
    </div>
  )}

    {filteredReports.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((r) => (
          <ReportCard 
            key={r.id} 
            report={r} 
            onUpdateStatus={handleUpdate}
            onResolveWithImage={isAdmin ? handleResolveWithImage : undefined}
          />
        ))}
      </div>
    )}

    {/* Image Upload Modal */}
    {selectedReport && (
      <ImageUploadModal
        report={selectedReport}
        isOpen={showImageModal}
        onClose={handleImageModalClose}
        onSuccess={handleImageModalSuccess}
      />
    )}
  </div>
</div>
);
}