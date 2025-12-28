import { supabase } from '../supabase';


/**
 * Upload a resolved photo file to Supabase storage and return public URL
 */
export async function uploadResolvedPhoto(
  reportId: string,
  file: File
): Promise<string> {
  // Create a unique path
  const path = `resolved/${reportId}_${Date.now()}_${file.name}`;
  const bucket = "reports"; // use the same bucket as defined in schema

  console.log("[Supabase] Uploading file:", {
    reportId,
    path,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });

  const { error: uploadError, data: uploadData } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    console.error("[Supabase] Upload error:", uploadError);
    throw new Error(`Failed to upload to Supabase: ${uploadError.message}`);
  }

  console.log("[Supabase] Upload successful:", uploadData);

  // Get public URL
  const { data: publicData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  const publicUrl = publicData?.publicUrl ?? "";

  if (!publicUrl || publicUrl.trim() === "") {
    throw new Error("Failed to get public URL from Supabase");
  }

  console.log("[Supabase] Public URL generated:", publicUrl);

  return publicUrl;
}

type SupabaseReportRow = {
id: string;
user_id: string;
title: string;
description: string;
contact: string | null;
location: string;
coords: string;
timestamp: string;
image_url: string;
status: 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
likes_count: number;
comments_count: number;
created_at: string;
updated_at: string;
resolved_photo?: string | null;
resolved_class?: string | null;
resolved_image_url?: string | null;
resolved_at?: string | null;
};

export async function fetchReportsForDashboard(params: { userId?: string; isAdmin?: boolean } = {}) {
const { userId, isAdmin = false } = params;
let query = supabase
.from('reports')
.select('*')
.order('created_at', { ascending: false });

if (!isAdmin && userId) {
query = query.eq('user_id', userId);
}

console.log('[Supabase] Fetching reports', { isAdmin, userId });
const { data, error } = await query;
if (error) {
console.error('[Supabase] Error fetching reports', error);
throw error;
}
console.log('[Supabase] Raw reports rows', data);
const rows = (data ?? []) as SupabaseReportRow[];
return rows.map((r) => ({
id: r.id,
userId: r.user_id,
title: r.title,
description: r.description,
photoUrl: r.image_url,
status: (r.status === 'In Progress' ? 'In Progress' : r.status) as 'Pending' | 'In Progress' | 'Resolved' | 'Rejected',
location: parseCoords(r.coords),
createdAt: r.created_at,
contact: r.contact,
coords: r.coords,
timestamp: r.timestamp,
image_url: r.image_url,
likes_count: r.likes_count,
comments_count: r.comments_count,
updated_at: r.updated_at,
resolvedPhotoUrl: r.resolved_photo ?? null,
resolvedClass: r.resolved_class ?? null,
resolvedImageUrl: r.resolved_image_url ?? null,
resolvedAt: r.resolved_at ?? null,
}));
}

/**
 * Update report status in Supabase
 */
export async function updateReportStatus(
  reportId: string, 
  status: string, 
  resolvedPhotoUrl?: string, 
  resolvedClass?: string,
  resolvedImageUrl?: string,
  adminId?: string
): Promise<void> {
  console.log('[Supabase] Updating report status', { reportId, status, resolvedPhotoUrl, resolvedClass, resolvedImageUrl, adminId });
  
  const updateData: any = { 
    status,
    updated_at: new Date().toISOString()
  };
  
  if (resolvedPhotoUrl) {
    updateData.resolved_photo = resolvedPhotoUrl;
    updateData.resolved_at = new Date().toISOString();
  }
  
  if (resolvedClass) {
    updateData.resolved_class = resolvedClass;
  }
  
  if (resolvedImageUrl) {
    updateData.resolved_image_url = resolvedImageUrl;
    updateData.resolved_at = new Date().toISOString();
  }
  
  const { data, error } = await supabase
    .from('reports')
    .update(updateData)
    .eq('id', reportId)
    .select('*')
    .single();
    
  if (error) {
    console.error('[Supabase] Error updating report status', error);
    throw new Error(`Failed to update report: ${error.message}`);
  }
  
  console.log('[Supabase] Report status updated successfully', { reportId, status, data });

  // Best-effort status logging for accountability (future-proof)
  if (adminId) {
    try {
      await logStatusUpdate(reportId, status, adminId);
    } catch (e) {
      console.warn('[Supabase] Skipping status log (optional)', e);
    }
  }
}

async function logStatusUpdate(reportId: string, status: string, adminId: string) {
  const payload = {
    report_id: reportId,
    new_status: status,
    admin_id: adminId,
    created_at: new Date().toISOString(),
  } as const;
  const { error } = await supabase.from('report_status_logs').insert(payload);
  if (error) {
    // If table does not exist or no permissions, just warn and continue
    throw error;
  }
}

function parseCoords(coords: string): { lat: number; lng: number } | null {
try {
// try "lat,lng"
if (coords && coords.includes(',')) {
const [latStr, lngStr] = coords.split(',');
const lat = parseFloat(latStr.trim());
const lng = parseFloat(lngStr.trim());
if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
}
// try JSON
const obj = JSON.parse(coords);
if (obj && typeof obj.lat === 'number' && typeof obj.lng === 'number') return { lat: obj.lat, lng: obj.lng };
return null;
} catch {
return null;
}
}

/**
 * Resolve a report using ML analysis (admin only)
 * This enforces that resolution must go through the ML pipeline
 */
export async function resolveReportWithML(
  reportId: string,
  resolvedClass: string,
  resolvedImageUrl: string,
  adminId?: string
): Promise<any> {
  console.log('[Supabase] Resolving report with ML', { reportId, resolvedClass, resolvedImageUrl, adminId });
  
  try {
    const updateData = {
      status: 'Resolved',
      resolved_class: resolvedClass,
      resolved_image_url: resolvedImageUrl,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', reportId)
      .select('*')
      .single();
      
    if (error) {
      console.error('[Supabase] Error resolving report with ML', error);
      throw new Error(`Failed to resolve report: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned after update');
    }
    
    console.log('[Supabase] Report resolved with ML successfully', { reportId, resolvedClass, data });

    // Best-effort status logging for accountability (future-proof)
    if (adminId) {
      try {
        await logStatusUpdate(reportId, 'Resolved', adminId);
      } catch (e) {
        console.warn('[Supabase] Skipping status log (optional)', e);
      }
    }

    return data;
  } catch (error) {
    console.error('[Supabase] Unexpected error in resolveReportWithML:', error);
    throw error;
  }
}

/**
 * Mark a report as resolved with ML analysis results
 * Safe function with comprehensive error handling
 */
export async function markReportAsResolved(
  reportId: string,
  resolvedClass: string,
  resolvedImageUrl: string,
  adminId?: string
): Promise<any> {
  console.log('[Supabase] Marking report as resolved', { 
    reportId, 
    resolvedClass, 
    resolvedImageUrl, 
    adminId 
  });
  
  try {
    // Validate inputs
    if (!reportId || !resolvedClass || !resolvedImageUrl) {
      throw new Error('Missing required parameters: reportId, resolvedClass, and resolvedImageUrl are required');
    }

    const updateData = {
      status: 'Resolved',
      resolved_class: resolvedClass,
      resolved_image_url: resolvedImageUrl,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('[Supabase] Updating report with data:', updateData);
    
    const { data, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', reportId)
      .select('*')
      .single();
      
    if (error) {
      console.error('[Supabase] Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (!data) {
      throw new Error(`Report with ID ${reportId} not found or could not be updated`);
    }
    
    console.log('[Supabase] Report marked as resolved successfully:', data);

    // Optional: Log admin action for audit trail
    if (adminId) {
      try {
        await logStatusUpdate(reportId, 'Resolved', adminId);
        console.log('[Supabase] Admin action logged successfully');
      } catch (logError) {
        console.warn('[Supabase] Failed to log admin action (non-critical):', logError);
      }
    }

    return data;
  } catch (error) {
    console.error('[Supabase] Error in markReportAsResolved:', error);
    throw error;
  }
}

/**
 * Create a notification for a user
 * Safely handles missing notifications table
 */
export async function createNotification(userId: string, message: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message,
        read: false,
      })
      .select('*')
      .single();

    if (error) {
      // Check if the error is due to missing table
      if (error.message && error.message.includes('notifications')) {
        console.warn('[Supabase] Notifications table not found, skipping notification creation:', error.message);
        return null; // Return null to indicate notification was skipped
      }
      
      console.error('[Supabase] Error creating notification', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    if (!data) {
      throw new Error('No notification returned after insert');
    }

    return data;
  } catch (err) {
    // Check if the error is due to missing table or schema issues
    if (err instanceof Error && (
      err.message.includes('notifications') || 
      err.message.includes('relation') ||
      err.message.includes('does not exist')
    )) {
      console.warn('[Supabase] Notifications table not available, skipping notification creation:', err.message);
      return null; // Return null to indicate notification was skipped
    }
    
    console.error('[Supabase] Unexpected error in createNotification:', err);
    throw err;
  }
}
