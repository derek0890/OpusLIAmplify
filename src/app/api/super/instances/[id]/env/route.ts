import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin } from "@/lib/super-admin";
import { prisma } from "@/lib/prisma";
import { buildEnvFile } from "@/lib/instance-env";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.email)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { id } = await params;
  const instance = await prisma.whiteboxInstance.findUnique({ where: { id } });
  if (!instance) {
    return NextResponse.json({ error: "Instance not found." }, { status: 404 });
  }

  const slug = instance.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return new NextResponse(buildEnvFile(instance), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.env"`,
    },
  });
}
