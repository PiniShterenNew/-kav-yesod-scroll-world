import { NextResponse } from "next/server";

type ContactPayload = {
  name?: string;
  phone?: string;
  projectType?: string;
  message?: string;
  company?: string; // honeypot — real users never see this field
};

export async function POST(request: Request) {
  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "bad-request" }, { status: 400 });
  }

  // Bots fill every field; answer with a quiet "success" and drop it.
  if (payload.company) {
    return NextResponse.json({ ok: true });
  }

  const name = payload.name?.trim() ?? "";
  const phone = payload.phone?.trim() ?? "";
  if (!name || !phone) {
    return NextResponse.json({ ok: false, error: "missing-fields" }, { status: 422 });
  }
  if (!/^0\d[\d\- ]{7,9}$/.test(phone)) {
    return NextResponse.json({ ok: false, error: "invalid-phone" }, { status: 422 });
  }

  // Concept demo: nothing is stored or forwarded. When the site goes live,
  // wire the lead here (email provider / CRM webhook) using server-side env
  // credentials. Message content is intentionally not logged.
  console.log("[contact] lead received", {
    name,
    projectType: payload.projectType ?? "",
    messageLength: payload.message?.trim().length ?? 0
  });

  return NextResponse.json({ ok: true });
}
