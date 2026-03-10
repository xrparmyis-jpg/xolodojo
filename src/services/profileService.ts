// Use relative path for API - works with both Vite dev and Vercel dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface UserProfile {
  id: number;
  auth0_id: string;
  email: string;
  name: string;
  picture_url: string;
  bio: string | null;
  wallet_address: string | null;
  wallet_type: string | null;
  preferences: Record<string, unknown>;
  updated_at: string;
}

export interface ProfileSocials {
  twitter?: string;
  discord?: string;
  tiktok?: string;
  instagram?: string;
  telegram?: string;
}

interface ProfileResponse {
  success: boolean;
  user: UserProfile;
}

/**
 * Get user profile from database
 */
export async function getUserProfile(
  auth0Id: string,
  accessToken?: string
): Promise<ProfileResponse> {
  const url = `${API_BASE_URL}/user/profile?auth0_id=${encodeURIComponent(auth0Id)}`;
  console.log('getUserProfile: Making request to:', url);
  console.log('getUserProfile: API_BASE_URL is:', API_BASE_URL);

  try {
    console.log('getUserProfile: Starting fetch to:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    }).catch(fetchError => {
      console.error('getUserProfile: Fetch error (network/CORS):', fetchError);
      throw new Error(`Network error: ${fetchError.message}`);
    });

    console.log('getUserProfile: Response received, status:', response.status);
    console.log('getUserProfile: Response ok:', response.ok);
    console.log(
      'getUserProfile: Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('getUserProfile: Error response:', errorText);
      console.error('getUserProfile: Response status:', response.status);
      console.error(
        'getUserProfile: Response headers:',
        Object.fromEntries(response.headers.entries())
      );
      let error;
      try {
        error = JSON.parse(errorText);
      } catch (parseError) {
        console.error(
          'getUserProfile: Failed to parse error response as JSON:',
          parseError
        );
        console.error('getUserProfile: Raw error text:', errorText);
        // If it's not JSON, it might be HTML or plain text
        if (errorText.includes('import') || errorText.includes('export')) {
          throw new Error(
            'API route returned TypeScript code instead of JSON. Make sure the API server is running on port 3000.'
          );
        }
        // If errorText is empty, the server might have crashed
        if (!errorText || errorText.trim() === '') {
          throw new Error(
            `Server returned empty response (status ${response.status}). Check server logs for errors.`
          );
        }
        error = { error: errorText || 'Unknown error' };
      }
      throw new Error(
        error.error ||
          error.message ||
          error.details ||
          `HTTP error! status: ${response.status}`
      );
    }

    const data: ProfileResponse = await response.json();
    console.log('getUserProfile: Success, data:', data);
    return data;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('getUserProfile: Exception caught:', err);
    console.error('getUserProfile: Error message:', err.message);
    console.error('getUserProfile: Error stack:', err.stack);
    throw err;
  }
}

/**
 * Update user profile in database
 */
export async function updateUserProfile(
  auth0Id: string,
  payload: {
    bio?: string;
    socials?: ProfileSocials;
  },
  accessToken?: string
): Promise<ProfileResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({
        auth0_id: auth0Id,
        bio: payload.bio ?? '',
        socials: payload.socials ?? {},
      }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    const data: ProfileResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}
