import { NextRequest, NextResponse } from "next/server";
import { socialCache } from "@/lib/social/cache";
import { checkBrightDataSnapshot } from "@/lib/social/brightdata/scraper";
import {
  normalizeTikTokProfileData,
  resolveTikTokProfileByUsername,
  normalizeTwitterProfileData,
  resolveTwitterProfileByUsername,
} from "@/lib/social/brightdata/resolvers";
import {
  normalizeYouTubeChannelData,
  resolveYouTubeChannel,
} from "@/lib/social/brightdata/youtube";
import { verifySignedJobToken } from "@/lib/social/tokens";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json(
        { success: false, status: "failed", code: "INVALID_INPUT", message: "requestId é obrigatório." },
        { status: 400 }
      );
    }

    // 1. Valida o token assinado HMAC-SHA256 (stateless / serverless-safe)
    const verification = verifySignedJobToken(requestId);

    if (!verification.valid) {
      if (verification.error === "JOB_EXPIRED") {
        return NextResponse.json(
          {
            success: false,
            status: "failed",
            code: "PROVIDER_TIMEOUT",
            message: "A consulta demorou mais que o esperado. Tente novamente.",
          },
          { status: 410 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          status: "failed",
          code: "INVALID_INPUT",
          message: "Identificador de busca inválido ou adulterado.",
        },
        { status: 400 }
      );
    }

    const job = verification.payload;

    // 2. Consulta o status do snapshot na Bright Data
    const snapshotRes = await checkBrightDataSnapshot(job.snapshotId);

    console.log(`[Status API] Request: ${job.platform}/${job.operation} | Snapshot: ${job.snapshotId} | Status: ${snapshotRes.status}`);

    if (snapshotRes.status === "pending") {
      return NextResponse.json({
        success: true,
        status: "pending",
        platform: job.platform,
      });
    }

    if (snapshotRes.status === "ready" && snapshotRes.data) {
      // -------------------------------------------------------------
      // CASO YOUTUBE
      // -------------------------------------------------------------
      if (job.platform === "youtube") {
        if (job.operation === "profile") {
          const normalized = normalizeYouTubeChannelData(snapshotRes.data, job.originalInput || "youtube_channel");
          if (normalized) {
            socialCache.set(`yt:channel:${normalized.username.toLowerCase()}`, normalized, 180);
            return NextResponse.json({
              success: true,
              status: "complete",
              platform: "youtube",
              resolvedType: "profile",
              data: normalized,
            });
          }
        }

        if (job.operation === "content") {
          const rawData = snapshotRes.data;
          const item = Array.isArray(rawData) ? rawData[0] : (rawData.data ? rawData.data[0] || rawData.data : rawData);
          const channelTarget = item?.channel_url || item?.channel_url_decoded || item?.handle_name || item?.youtuber || item?.uploader_url;

          if (channelTarget) {
            const profileRes = await resolveYouTubeChannel(channelTarget);

            if (profileRes.pending && profileRes.requestId) {
              return NextResponse.json({
                success: true,
                status: "pending",
                platform: "youtube",
                requestId: profileRes.requestId,
              });
            }

            if (profileRes.success && profileRes.data) {
              return NextResponse.json({
                success: true,
                status: "complete",
                platform: "youtube",
                resolvedType: "profile",
                data: profileRes.data,
              });
            }
          }
        }

        return NextResponse.json({
          success: false,
          status: "failed",
          code: "PROFILE_NOT_FOUND",
          message: "Não encontramos esse canal no YouTube. Confira o @ ou link e tente novamente.",
        });
      }

      // -------------------------------------------------------------
      // CASO TIKTOK
      // -------------------------------------------------------------
      if (job.platform === "tiktok") {
        if (job.operation === "profile") {
          const normalized = normalizeTikTokProfileData(snapshotRes.data, job.originalInput || "tiktok_user");
          if (normalized) {
            socialCache.set(`tk:user:${normalized.username.toLowerCase()}`, normalized, 180);
            return NextResponse.json({
              success: true,
              status: "complete",
              platform: "tiktok",
              resolvedType: "profile",
              data: normalized,
            });
          }
        }

        if (job.operation === "content") {
          const rawData = snapshotRes.data;
          const item = Array.isArray(rawData) ? rawData[0] : (rawData.data ? rawData.data[0] || rawData.data : rawData);
          const authorIdentifier = item?.author?.uniqueId || item?.author?.username || item?.author_username || item?.account_id || item?.username;

          if (authorIdentifier) {
            const profileRes = await resolveTikTokProfileByUsername(authorIdentifier);

            if (profileRes.pending && profileRes.requestId) {
              return NextResponse.json({
                success: true,
                status: "pending",
                platform: "tiktok",
                requestId: profileRes.requestId,
              });
            }

            if (profileRes.success && profileRes.data) {
              return NextResponse.json({
                success: true,
                status: "complete",
                platform: "tiktok",
                resolvedType: "profile",
                data: profileRes.data,
              });
            }
          }
        }

        return NextResponse.json({
          success: false,
          status: "failed",
          code: "PROFILE_NOT_FOUND",
          message: "Não encontramos esse perfil no TikTok. Confira o @ ou link e tente novamente.",
        });
      }

      // -------------------------------------------------------------
      // CASO TWITTER / X
      // -------------------------------------------------------------
      if (job.platform === "twitter") {
        if (job.operation === "profile") {
          const normalized = normalizeTwitterProfileData(snapshotRes.data, job.originalInput || "twitter_user");
          if (normalized) {
            socialCache.set(`tw:user:${normalized.username.toLowerCase()}`, normalized, 180);
            return NextResponse.json({
              success: true,
              status: "complete",
              platform: "twitter",
              resolvedType: "profile",
              data: normalized,
            });
          }
        }

        if (job.operation === "content") {
          const rawData = snapshotRes.data;
          const item = Array.isArray(rawData) ? rawData[0] : (rawData.data ? rawData.data[0] || rawData.data : rawData);
          const authorIdentifier = item?.user?.screen_name || item?.author?.username || item?.author_username || item?.user_id || item?.screen_name;

          if (authorIdentifier) {
            const profileRes = await resolveTwitterProfileByUsername(authorIdentifier);

            if (profileRes.pending && profileRes.requestId) {
              return NextResponse.json({
                success: true,
                status: "pending",
                platform: "twitter",
                requestId: profileRes.requestId,
              });
            }

            if (profileRes.success && profileRes.data) {
              return NextResponse.json({
                success: true,
                status: "complete",
                platform: "twitter",
                resolvedType: "profile",
                data: profileRes.data,
              });
            }
          }
        }

        return NextResponse.json({
          success: false,
          status: "failed",
          code: "PROFILE_NOT_FOUND",
          message: "Não encontramos esse perfil no X/Twitter. Confira o @ ou link e tente novamente.",
        });
      }
    }

    if (snapshotRes.status === "failed") {
      return NextResponse.json({
        success: false,
        status: "failed",
        code: "PROVIDER_ERROR",
        message: "Não foi possível concluir a busca neste momento. Tente novamente.",
      });
    }

    return NextResponse.json({
      success: true,
      status: "pending",
      platform: job.platform,
    });
  } catch (error: any) {
    console.error("Error in /api/search/status:", error);
    return NextResponse.json(
      { success: false, status: "failed", code: "PROVIDER_ERROR", message: "Erro ao consultar status da busca." },
      { status: 500 }
    );
  }
}
