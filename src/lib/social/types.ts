export type PlatformId = "instagram" | "tiktok" | "twitter" | "youtube";

export type SearchInputType =
  | "handle"
  | "profile_url"
  | "content_url"
  | "email"
  | "invalid";

export type SearchErrorCode =
  | "INVALID_INPUT"
  | "INVALID_HANDLE"
  | "INVALID_URL"
  | "UNSUPPORTED_DOMAIN"
  | "UNSUPPORTED_URL_TYPE"
  | "PROFILE_NOT_FOUND"
  | "CONTENT_NOT_FOUND"
  | "PRIVATE_PROFILE"
  | "PROFILE_SUSPENDED"
  | "CONTENT_REMOVED"
  | "INVALID_EMAIL"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_ERROR"
  | "PROVIDER_RESTRICTED"
  | "PROVIDER_PROCESSING";

export interface PendingJobInfo {
  requestId: string;
  platform: PlatformId;
  snapshotId: string;
  targetType: "profile" | "content";
  targetUrl: string;
  datasetId: string;
  authorUsername?: string;
  createdAt: number;
}

export interface CanonicalSearchInput {
  originalInput: string;
  inputType: SearchInputType;
  platform?: PlatformId;
  canonicalUrl?: string;
  username?: string;
  contentId?: string;
  email?: string;
  isValid: boolean;
  errorCode?: SearchErrorCode;
  errorMessage?: string;
}

// Strictly whitelisted structures for Step 3

export interface InstagramPostItem {
  id: string;
  thumbnail_url: string;
  is_video?: boolean;
}

export interface InstagramVerifiedProfile {
  platform: "instagram";
  username: string;
  full_name: string;
  avatar_url: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
  bio: string;
  link?: string;
  is_private: boolean;
  is_verified?: boolean;
  highlights?: Array<{ title: string; cover_url: string }>;
  posts: InstagramPostItem[];
}

export interface TikTokVideoItem {
  id: string;
  thumbnail_url: string;
  views_count: number;
}

export interface TikTokVerifiedProfile {
  platform: "tiktok";
  username: string;
  full_name: string;
  avatar_url: string;
  following_count: number;
  followers_count: number;
  likes_count: number;
  bio: string;
  link?: string;
  is_private: boolean;
  is_verified?: boolean;
  videos: TikTokVideoItem[];
}

export interface TwitterPinnedTweet {
  id?: string;
  text: string;
  created_at?: string;
  like_count?: number;
  retweet_count?: number;
  reply_count?: number;
}

export interface TwitterVerifiedProfile {
  platform: "twitter";
  username: string;
  full_name: string;
  avatar_url: string;
  cover_url?: string;
  followers_count: number;
  following_count: number;
  bio: string;
  location?: string;
  link?: string;
  is_verified?: boolean;
  pinned_tweet?: TwitterPinnedTweet | null;
}

export interface YouTubeVideoItem {
  id: string;
  title?: string;
  thumbnail_url: string;
  views_count?: number;
}

export interface YouTubeVerifiedProfile {
  platform: "youtube";
  channel_id: string;
  username: string; // @handle
  full_name: string; // Channel name
  avatar_url: string;
  cover_url?: string; // banner_img
  followers_count: number; // subscribers
  video_count?: number;
  total_views?: number;
  bio?: string;
  link?: string;
  is_verified?: boolean;
  videos?: YouTubeVideoItem[];
}

export type VerifiedSocialProfile =
  | InstagramVerifiedProfile
  | TikTokVerifiedProfile
  | TwitterVerifiedProfile
  | YouTubeVerifiedProfile;

export interface EmailValidationResult {
  email: string;
  validFormat: boolean;
}

export type ResolveSearchResult =
  | {
      success: true;
      status?: "complete";
      inputType: "handle" | "profile_url" | "content_url";
      platform: PlatformId;
      resolvedType: "profile";
      data: VerifiedSocialProfile;
    }
  | {
      success: true;
      status: "pending";
      platform: PlatformId;
      requestId: string;
    }
  | {
      success: true;
      inputType: "email";
      resolvedType: "email";
      data: EmailValidationResult;
    }
  | {
      success: false;
      status?: "failed";
      code: SearchErrorCode;
      message: string;
    };
