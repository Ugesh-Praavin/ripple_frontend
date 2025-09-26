import React, { useState, useRef } from 'react';
import type { Report } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from './Toast';
import { getClassDescription } from '../services/api';

type Props = {
  report: Report;
  onUpdateStatus: (id: string, status: string, file?: File | null) => Promise<void>;
  onResolveWithImage?: (report: Report) => void;
};

export default function ReportCard({ report, onUpdateStatus, onResolveWithImage }: Props) {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const hasPhoto = !!(file || previewUrl);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  const handleUploadFile = () => {
    fileInputRef.current?.click();
  };

  const handleStatusChange = (newStatus: string) => {
    setPendingStatus(newStatus);
    setShowConfirmModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (pendingStatus === 'Resolved' && !hasPhoto) {
      showToast('Please upload a photo before marking as resolved.', 'warning');
      setShowConfirmModal(false);
      return;
    }

    setIsUploading(true);
    try {
      await onUpdateStatus(report.id, pendingStatus, pendingStatus === 'Resolved' ? file : null);
      setFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      console.error('Failed to update status:', error);
      showToast(`Failed to update: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsUploading(false);
      setShowConfirmModal(false);
    }
  };


  const formatLocation = (location: { lat: number; lng: number } | null) => {
    if (!location) return 'Location not available';
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Image Section */}
      <div className="relative">
        <img 
          src={report.photoUrl} 
          alt="Report" 
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(report.status || 'Pending')}`}>
            {report.status || 'Pending'}
          </span>
        </div>
        
        {/* Resolved Status Display */}
        {report.status === 'Resolved' && report.resolvedClass && (
          <div className="absolute bottom-3 left-3 bg-green-100 text-green-800 px-2 py-1 text-xs font-medium rounded-full border border-green-200">
            ✅ {getClassDescription(report.resolvedClass)}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {report.title || report.description || 'No title'}
        </h3>
        
        {report.description && report.title && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {report.description}
          </p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {formatLocation(report.location || null)}
          </div>
          
          {/* Status Timeline */}
          <div className="mt-3">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Status Timeline</h4>
            <div className="flex items-center space-x-2">
              {/* Pending */}
              <div className={`flex items-center ${report.status === 'Pending' ? 'text-yellow-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${report.status === 'Pending' ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                <span className="ml-1 text-xs">Pending</span>
              </div>
              
              <div className={`flex-1 h-px ${report.status === 'In Progress' || report.status === 'Resolved' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              
              {/* In Progress */}
              <div className={`flex items-center ${report.status === 'In Progress' ? 'text-blue-600' : report.status === 'Resolved' ? 'text-blue-500' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${report.status === 'In Progress' ? 'bg-blue-500' : report.status === 'Resolved' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                <span className="ml-1 text-xs">In Progress</span>
              </div>
              
              <div className={`flex-1 h-px ${report.status === 'Resolved' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              
              {/* Resolved */}
              <div className={`flex items-center ${report.status === 'Resolved' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${report.status === 'Resolved' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="ml-1 text-xs">Resolved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resolved Image Preview */}
        {report.status === 'Resolved' && report.resolvedImageUrl && (
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Resolution Evidence</h4>
            <div className="relative">
              <img
                src={report.resolvedImageUrl}
                alt="Resolution evidence"
                className="w-full h-32 object-cover rounded-md border border-gray-200"
              />
              <div className="absolute top-2 left-2 bg-green-100 text-green-800 px-2 py-1 text-xs font-medium rounded-full">
                ✅ Resolved
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {report.status === 'Pending' && (
            <button
              onClick={() => handleStatusChange('In Progress')}
              disabled={isUploading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Mark In Progress
            </button>
          )}
          
          {report.status === 'In Progress' && (
            <div className="space-y-2">
              {onResolveWithImage ? (
                // Admin: Only allow resolution through ML pipeline
                <button
                  onClick={() => onResolveWithImage(report)}
                  disabled={isUploading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Resolve with ML Analysis
                </button>
              ) : (
                // Regular user: Allow manual resolution with photo
                <button
                  onClick={() => handleStatusChange('Resolved')}
                  disabled={isUploading || !hasPhoto}
                  className={`w-full text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center ${hasPhoto ? 'bg-green-600 hover:bg-green-700' : 'bg-green-300 cursor-not-allowed'}`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mark Resolved
                </button>
              )}
            </div>
          )}
          
          {report.status === 'Resolved' && (
            <div className="w-full bg-green-100 text-green-800 text-sm font-medium py-2 px-4 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resolved
            </div>
          )}

          {report.status === 'In Progress' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={handleTakePhoto}
                  disabled={isUploading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Take Photo
                </button>
                <button
                  onClick={handleUploadFile}
                  disabled={isUploading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload File
                </button>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Photo Preview */}
              {previewUrl && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Photo Preview:</p>
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        if (cameraInputRef.current) cameraInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Mark Resolved Button */}
              {/* keep secondary button hidden to avoid duplicate primary CTA */}
            </div>
          )}

          {/* Resolved Photo Display */}
          {report.resolvedPhotoUrl && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Resolved Photo:</p>
              <img
                src={report.resolvedPhotoUrl}
                alt="Resolved"
                className="w-full h-32 object-cover rounded-md border"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmStatusChange}
        title={`Confirm Status Change`}
        message={`Are you sure you want to change this report status to "${pendingStatus}"?`}
        confirmText="Confirm"
        cancelText="Cancel"
        confirmButtonColor={pendingStatus === 'Resolved' ? 'green' : 'blue'}
      />
    </div>
  );
}