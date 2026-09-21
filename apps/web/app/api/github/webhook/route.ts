import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  // 1. Read raw body as text
  // We must not parse it as JSON yet because the HMAC signature covers the exact
  // bytes sent by GitHub, including specific whitespace and ordering.
  const rawBody = await req.text();

  // 2. Verify signature
  const signatureHeader = req.headers.get("x-hub-signature-256") ?? "";
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[Webhook] GITHUB_WEBHOOK_SECRET is not set.");
    return new NextResponse("Server configuration error", { status: 500 });
  }

  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(rawBody).digest("hex");

  // timingSafeEqual requires buffers of the exact same length
  if (signatureHeader.length !== digest.length) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(digest)
  );

  if (!isValid) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 3. Process the event
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    // Malformed JSON but signature matched (highly unlikely from real GitHub)
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const eventType = req.headers.get("x-github-event");
  const deliveryId = req.headers.get("x-github-delivery");

  if (
    eventType === "pull_request" &&
    (payload.action === "opened" || payload.action === "synchronize")
  ) {
    const repoFullName = payload.repository?.full_name;
    const prNumber = payload.pull_request?.number;
    
    console.log(
      `[Webhook] Delivery ID: ${deliveryId} | Repo: ${repoFullName} | PR #${prNumber} | Action: ${payload.action}`
    );
  }

  // 4. Always respond 200 { received: true } immediately
  return NextResponse.json({ received: true }, { status: 200 });
}