import type { MLPrediction } from '../types';

const ML_API_BASE_URL = 'https://ripple-model-9zph.onrender.com';

/**
 * Send image to ML API for prediction
 */
export async function predictIssue(file: File): Promise<MLPrediction> {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`${ML_API_BASE_URL}/predict`, {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type header - let browser set it with boundary
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ML API request failed: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.predicted_class || typeof data.confidence !== 'number') {
      throw new Error('Invalid response format from ML API');
    }

    return {
      predicted_class: data.predicted_class,
      confidence: data.confidence,
    };
  } catch (error) {
    console.error('[API] Error calling ML prediction service:', error);
    throw new Error(`Failed to get ML prediction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if the predicted class indicates a resolved issue
 */
export function isResolvedClass(predictedClass: string): boolean {
  const resolvedClasses = ['NoPotHole', 'GarbageNotOverflow', 'NotBrokenStreetLight'];
  return resolvedClasses.includes(predictedClass);
}

/**
 * Get user-friendly description for predicted class
 */
export function getClassDescription(predictedClass: string): string {
  const descriptions: Record<string, string> = {
    'BrokenStreetLight': 'Broken Street Light',
    'DrainageOverFlow': 'Drainage Overflow',
    'GarbageNotOverflow': 'Garbage Not Overflowing (Resolved)',
    'GarbageOverflow': 'Garbage Overflowing',
    'NoPotHole': 'No Pothole (Resolved)',
    'NotBrokenStreetLight': 'Street Light Working (Resolved)',
    'PotHole': 'Pothole',
  };
  
  return descriptions[predictedClass] || predictedClass;
}
