export interface InstagramUser {
  pk: string;
  username: string;
  full_name: string;
  is_private: boolean;
  profile_pic_url: string;
  follower_count: number;
  following_count: number;
  media_count: number;
}

export interface InstagramMedia {
  id: string;
  pk: string;
  code: string;
  media_type: number;
  thumbnail_url: string;
  video_url?: string;
  like_count: number;
  comment_count: number;
  view_count?: number;
}

const HIKERAPI_KEY = process.env.HIKERAPI_KEY;
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || '15000', 10);

function normalizeUsername(input: string): string {
  if (!input) return '';
  let username = input.trim();
  
  if (username.startsWith('@')) {
    username = username.substring(1);
  }
  
  if (username.includes('instagram.com/')) {
    const urlParts = username.split('instagram.com/');
    if (urlParts.length > 1) {
      username = urlParts[1].split('/')[0].split('?')[0];
    }
  }
  
  return username;
}

async function fetchWithTimeout(resource: string, options: RequestInit = {}) {
  const { timeout = API_TIMEOUT } = options as Record<string, unknown>;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), Number(timeout));
  
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  });
  clearTimeout(id);
  return response;
}

export async function getInstagramUserByUsername(input: string): Promise<InstagramUser | null> {
  const username = normalizeUsername(input);
  if (!username) return null;
  
  if (!HIKERAPI_KEY) {
    console.warn('HIKERAPI_KEY not set, using mock data for development');
    return {
      pk: '123456789',
      username,
      full_name: 'Mock User',
      is_private: false,
      profile_pic_url: 'https://ui-avatars.com/api/?name=' + username,
      follower_count: 1500,
      following_count: 300,
      media_count: 42
    };
  }

  try {
    // A lot of HikerAPI plans default strictly to the /a1/ endpoints or /v1/ endpoints
    // For universal compatibility, we will try the /v1/ url but strictly with 'v' parameter which Hiker often enforces
    let response = await fetchWithTimeout(`https://api.hikerapi.com/v1/user/by/username?v=${username}`, {
      headers: {
        'x-access-key': HIKERAPI_KEY,
        'Accept': 'application/json'
      }
    });

    // If 422, try another popular hiker endpoint structure
    if (!response.ok) {
      console.log(`HikerAPI v1 failed with ${response.status}. Trying v2...`);
      response = await fetchWithTimeout(`https://api.hikerapi.com/v2/user/by/username?v=${username}`, {
        headers: {
          'x-access-key': HIKERAPI_KEY,
          'Accept': 'application/json'
        }
      });
    }
    
    // If STILL failing, try the raw endpoint format often used by basic plans
    if (!response.ok) {
      console.log(`HikerAPI v2 failed with ${response.status}. Trying raw endpoint...`);
      response = await fetchWithTimeout(`https://api.hikerapi.com/v1/user/by/username?username=${username}`, {
        headers: {
          'x-access-key': HIKERAPI_KEY,
          'Accept': 'application/json'
        }
      });
    }

    if (!response.ok) {
      console.error(`HikerAPI all endpoints failed. Final status: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // Safety check for dynamic HikerAPI response structure
    const userObj = data.user || data.data || data;
    
    if (!userObj || (!userObj.username && !userObj.full_name)) {
      console.error('Invalid HikerAPI response structure', data);
      return null;
    }

    return {
      pk: String(userObj.pk || userObj.id || ''),
      username: String(userObj.username || username),
      full_name: String(userObj.full_name || userObj.username || username),
      is_private: Boolean(userObj.is_private),
      profile_pic_url: String(userObj.profile_pic_url || userObj.profile_pic_url_hd || `https://ui-avatars.com/api/?name=${userObj.username || username}`),
      follower_count: Number(userObj.follower_count || 0),
      following_count: Number(userObj.following_count || 0),
      media_count: Number(userObj.media_count || 0)
    };
  } catch (error) {
    console.error('Error fetching Instagram user:', error);
    return null;
  }
}

export async function getInstagramUserMedias(userId: string): Promise<InstagramMedia[]> {
  if (!HIKERAPI_KEY) {
    return Array(12).fill(0).map((_, i) => ({
      id: `media_${i}`,
      pk: `pk_${i}`,
      code: `code_${i}`,
      media_type: 1,
      thumbnail_url: `https://picsum.photos/seed/${userId}${i}/300/300`,
      like_count: Math.floor(Math.random() * 1000),
      comment_count: Math.floor(Math.random() * 50)
    }));
  }

  try {
    const response = await fetchWithTimeout(`https://api.hikerapi.com/v1/user/medias?user_id=${userId}`, {
      headers: {
        'x-access-key': HIKERAPI_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`HikerAPI error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    // Normalize response based on actual HikerAPI structure
    return data.items || data.data || [];
  } catch (error) {
    console.error('Error fetching Instagram medias:', error);
    return [];
  }
}
