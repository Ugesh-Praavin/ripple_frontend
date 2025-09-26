import React, { useState, useRef } from 'react';
import type { Report } from '../types';
import { predictIssue, isResolvedClass, getClassDescription } from '../services/api';
import { uploadResolvedPhoto, resolveReportWithML, createNotification } from '../services/supabaseService';
import { useToast } from './Toast';

type Props = {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ImageUploadModal({ report, isOpen, onClose, onSuccess }: Props) {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [prediction, setPrediction] = useState<{ predicted_class: string; confidence: number } | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setPrediction(null); // Reset prediction when new file is selected
      // Upload immediately and store Supabase URL so we don't upload twice
      setIsUploading(true);
      try {
        const publicUrl = await uploadResolvedPhoto(report.id, selectedFile);
        setUploadedImageUrl(publicUrl);
      } catch (err: any) {
        console.error('[ImageUploadModal] Upload failed:', err);
        showToast(`Failed to upload image: ${err.message}`, 'error');
        setFile(null);
        setPreviewUrl(null);
        setUploadedImageUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      const url = URL.createObjectURL(droppedFile);
      setPreviewUrl(url);
      setPrediction(null);
      // Upload immediately and store Supabase URL so we don't upload twice
      setIsUploading(true);
      try {
        const publicUrl = await uploadResolvedPhoto(report.id, droppedFile);
        setUploadedImageUrl(publicUrl);
      } catch (err: any) {
        console.error('[ImageUploadModal] Upload failed (drop):', err);
        showToast(`Failed to upload image: ${err.message}`, 'error');
        setFile(null);
        setPreviewUrl(null);
        setUploadedImageUrl(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handlePredict = async () => {
    if (!file) {
      showToast('Please upload an image before analysis.', 'warning');
      return;
    }

    setIsUploading(true);
    try {
      const result = await predictIssue(file);
      setPrediction(result);
    } catch (error: any) {
      console.error('[ImageUploadModal] Prediction failed:', error);
      showToast(`Failed to analyze image: ${error.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResolve = async () => {
    if (!uploadedImageUrl) {
      showToast('Please upload an image before resolving.', 'warning');
      return;
    }
    if (!prediction) {
      showToast('Please run ML analysis before resolving.', 'warning');
      return;
    }

    setIsUploading(true);
    try {
      // Resolve report using ML analysis (enforces ML pipeline)
      await resolveReportWithML(
        report.id,
        prediction.predicted_class,
        uploadedImageUrl
      );

      // Create notification for the user
      const location = report.location ? 
        `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}` : 
        'your location';
      
      const message = `✅ Your report at ${location} has been resolved as ${getClassDescription(prediction.predicted_class)}.`;
      await createNotification(report.userId, message);

      showToast('Report resolved successfully!', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('[ImageUploadModal] Resolution failed:', error);
      showToast(`Failed to resolve report: ${error.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewUrl(null);
    setPrediction(null);
    onClose();
  };

  if (!isOpen) return null;

  const canResolve = prediction && isResolvedClass(prediction.predicted_class);
  const isIssue = prediction && !isResolvedClass(prediction.predicted_class);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Resolve Report with Image</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Report Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Report Details</h3>
              <p className="text-sm text-gray-600">
                <strong>Title:</strong> {report.title || report.description || 'No title'}
              </p>
              {report.location && (
                <p className="text-sm text-gray-600">
                  <strong>Location:</strong> {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                </p>
              )}
            </div>

            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Resolution Image
              </label>
              
              {!file ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Image Preview */}
                  <div className="relative">
                    <img
                      src={previewUrl!}
                      alt="Upload preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                        setPrediction(null);
                        setUploadedImageUrl(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Predict Button */}
                  {!prediction && (
                    <button
                      onClick={handlePredict}
                      disabled={isUploading}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isUploading ? 'Analyzing Image...' : 'Analyze Image with ML'}
                    </button>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Prediction Results */}
            {prediction && (
              <div className={`p-4 rounded-lg border-2 ${
                canResolve ? 'bg-green-50 border-green-200' : 
                isIssue ? 'bg-red-50 border-red-200' : 
                'bg-gray-50 border-gray-200'
              }`}>
                <h3 className="font-medium mb-2">ML Analysis Result</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Predicted Class:</strong> {getClassDescription(prediction.predicted_class)}
                  </p>
                  <p className="text-sm">
                    <strong>Confidence:</strong> {(prediction.confidence * 100).toFixed(1)}%
                  </p>
                </div>

                {canResolve && (
                  <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      ✅ This image shows the issue has been resolved. You can proceed to mark the report as resolved.
                    </p>
                  </div>
                )}

                {isIssue && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      ❌ The uploaded image still shows an issue ({getClassDescription(prediction.predicted_class)}). Please upload a resolved image.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              
              {canResolve && (
                <button
                  onClick={handleResolve}
                  disabled={isUploading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploading ? 'Resolving...' : 'Mark as Resolved'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
