import { headers } from "next/headers";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

// 50 MB — large enough for Azgaar SVG exports and high-res PNGs.
// Vercel serverless function body limit is 4.5 MB by default; this route
// relies on the VERCEL_MAX_BODY_SIZE env var or a Pro plan increase.
// For truly massive files (>50 MB) switch to client-side upload later.
const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: "Allowed types: JPEG, PNG, WebP, GIF, SVG." },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: `Map image must be ${MAX_BYTES / 1024 / 1024} MB or smaller.` },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const filename = `${session.user.id}/maps/${Date.now()}.${ext}`;

  const blob = await put(filename, file, { access: "private" });

  return Response.json({ url: blob.url });
}
