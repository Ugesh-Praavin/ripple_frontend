import axios, { AxiosInstance, AxiosError } from "axios";
import { auth } from "../firebase";
import type { MLPrediction } from "../types";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add Firebase ID token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error("[API] Failed to get ID token:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // REMOVED: window.location.href = '/login';

    // Just reject the promise. Let the calling function (AuthProvider) handle the redirect or state change.
    return Promise.reject(error);
  }
);

// Types
export type Report = {
  id: string;
  title: string;
  description: string;
  location: string;
  status: "Pending" | "In Progress" | "Resolved" | "Rejected";
  created_at: string;
  worker_name?: string | null;
  estimated_time?: string | null;
};

export type AdminUser = {
  id: string;
  email: string;
  role: "ADMIN";
};

export type SupervisorUser = {
  id: string;
  email: string;
  role: "SUPERVISOR";
};

export type StartWorkRequest = {
  estimated_time: string;
};

export type AssignWorkerRequest = {
  worker_name: string;
};

export type CompleteReportRequest = {
  image_url: string;
};

export type CompleteReportResponse = {
  status: string;
  requires_manual_review?: boolean;
};

// Admin API
export const adminAPI = {
  getMe: async (): Promise<AdminUser> => {
    const response = await api.get<AdminUser>("/admin/me");
    return response.data;
  },

  getReports: async (): Promise<Report[]> => {
    const response = await api.get<Report[]>("/admin/reports");
    return response.data;
  },

  startWork: async (
    reportId: string,
    data: StartWorkRequest
  ): Promise<Report> => {
    const response = await api.patch<Report>(
      `/admin/report/${reportId}/start`,
      data
    );
    return response.data;
  },
};

// Supervisor API
export const supervisorAPI = {
  getMe: async (): Promise<SupervisorUser> => {
    const response = await api.get<SupervisorUser>("/supervisor/me");
    return response.data;
  },

  getReports: async (): Promise<Report[]> => {
    const response = await api.get<Report[]>("/supervisor/reports");
    return response.data;
  },

  assignWorker: async (
    reportId: string,
    data: AssignWorkerRequest
  ): Promise<Report> => {
    const response = await api.patch<Report>(
      `/supervisor/report/${reportId}/assign-worker`,
      data
    );
    return response.data;
  },

  completeReport: async (
    reportId: string,
    data: CompleteReportRequest
  ): Promise<CompleteReportResponse> => {
    const response = await api.patch<CompleteReportResponse>(
      `/supervisor/report/${reportId}/complete`,
      data
    );
    return response.data;
  },
};

// ML API (keeping existing functionality)
const ML_API_BASE_URL = "https://ripple-model-dfgk.onrender.com";

export async function predictIssue(file: File): Promise<MLPrediction> {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(`${ML_API_BASE_URL}/predict`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `ML API request failed: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const data = await response.json();

    if (!data.predicted_class || typeof data.confidence !== "number") {
      throw new Error("Invalid response format from ML API");
    }

    return {
      predicted_class: data.predicted_class,
      confidence: data.confidence,
    };
  } catch (error) {
    console.error("[API] Error calling ML prediction service:", error);
    throw new Error(
      `Failed to get ML prediction: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function isResolvedClass(predictedClass: string): boolean {
  const resolvedClasses = [
    "NoPotHole",
    "GarbageNotOverflow",
    "NotBrokenStreetLight",
  ];
  return resolvedClasses.includes(predictedClass);
}

export function getClassDescription(predictedClass: string): string {
  const descriptions: Record<string, string> = {
    BrokenStreetLight: "Broken Street Light",
    DrainageOverFlow: "Drainage Overflow",
    GarbageNotOverflow: "Garbage Not Overflowing (Resolved)",
    GarbageOverflow: "Garbage Overflowing",
    NoPotHole: "No Pothole (Resolved)",
    NotBrokenStreetLight: "Street Light Working (Resolved)",
    PotHole: "Pothole",
  };

  return descriptions[predictedClass] || predictedClass;
}
