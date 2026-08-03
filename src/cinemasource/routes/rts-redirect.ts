import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get('RedirectUrl');

  if (!redirectUrl || !/^https:\/\//i.test(redirectUrl)) {
    return new NextResponse('Invalid redirect URL', { status: 400 });
  }

  const hiddenFields = [...searchParams.entries()]
    .filter(([key]) => key !== 'RedirectUrl')
    .map(
      ([key, value]) =>
        `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">`,
    )
    .join('\n');

  const html = `<!DOCTYPE html>
<html>
  <body>
    <form action="${escapeHtml(redirectUrl)}" method="post" name="frm">
      ${hiddenFields}
    </form>
    <script>document.frm.submit();</script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
