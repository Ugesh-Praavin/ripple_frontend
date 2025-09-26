export type Report = {
    id: string;
    userId: string;
    title?: string;
    description?: string;
    photoUrl?: string;
    location?: { lat: number; lng: number } | null;
    status?: 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
    createdAt?: { seconds: number; nanoseconds: number } | any;
    resolvedPhotoUrl?: string | null;
    resolvedClass?: string | null;
    resolvedImageUrl?: string | null;
    resolvedAt?: { seconds: number; nanoseconds: number } | any;
    contact?: string | null;
    coords?: string;
    timestamp?: string;
    image_url?: string;
    likes_count?: number;
    comments_count?: number;
    updated_at?: string;
}

export type MLPrediction = {
    predicted_class: 'BrokenStreetLight' | 'DrainageOverFlow' | 'GarbageNotOverflow' | 'GarbageOverflow' | 'NoPotHole' | 'NotBrokenStreetLight' | 'PotHole';
    confidence: number;
}

export type Notification = {
    id: string;
    userId: string;
    message: string;
    read: boolean;
    createdAt: string;
}