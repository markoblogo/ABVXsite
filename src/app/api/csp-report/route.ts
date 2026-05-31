import { NextResponse } from 'next/server';

const MAX_REPORT_BYTES = 16_384;

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/csp-report') && !contentType.includes('application/reports+json')) {
    return new NextResponse(null, { status: 415 });
  }

  const body = await request.text();
  if (body.length > MAX_REPORT_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  return new NextResponse(null, { status: 204 });
}

export function GET() {
  return NextResponse.json({ ok: true });
}
