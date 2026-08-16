import { NextRequest, NextResponse } from "next/server";
import { resolveSearchInput } from "@/lib/social";
import { checkRateLimit } from "@/lib/social/cache";

export async function POST(req: NextRequest) {
  try {
    // 1. IP & Rate Limit Protection
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous-client";
    const rateCheck = checkRateLimit(ip, 60, 60000); // 60 requests per minute

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          code: "PROVIDER_RATE_LIMIT",
          message: "Muitas requisições. Aguarde um minuto e tente novamente.",
        },
        { status: 429 }
      );
    }

    // 2. Parse and Validate Request Body
    const body = await req.json().catch(() => null);

    if (!body || typeof body.input !== "string") {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_INPUT",
          message: "Parâmetro 'input' é obrigatório.",
        },
        { status: 400 }
      );
    }

    const input = body.input.trim();
    const selectedPlatform = body.selectedPlatform || body.platform;

    // 3. Resolve using Central Social Resolver
    const result = await resolveSearchInput(input, selectedPlatform);

    if (!result.success) {
      const statusMap: Record<string, number> = {
        INVALID_INPUT: 400,
        INVALID_HANDLE: 400,
        INVALID_URL: 400,
        INVALID_EMAIL: 400,
        UNSUPPORTED_DOMAIN: 400,
        UNSUPPORTED_URL_TYPE: 400,
        PROFILE_NOT_FOUND: 404,
        CONTENT_NOT_FOUND: 404,
        PRIVATE_PROFILE: 403,
        PROVIDER_RESTRICTED: 503,
        PROVIDER_RATE_LIMIT: 429,
        PROVIDER_TIMEOUT: 504,
      };

      const statusCode = statusMap[result.code] || 500;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error: any) {
    console.error("Unhandled error in /api/search/resolve:", error);
    return NextResponse.json(
      {
        success: false,
        code: "PROVIDER_ERROR",
        message: "Ocorreu um erro interno ao processar a busca.",
      },
      { status: 500 }
    );
  }
}
