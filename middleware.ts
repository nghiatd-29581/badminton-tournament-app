// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authorization = request.headers.get('authorization');

    if (!authorization) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Admin Area"',
        },
      });
    }

    const [type, credentials] = authorization.split(' ');
    if (type !== 'Basic') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');

    if (
      username === process.env.ADMIN_USER &&
      password === process.env.ADMIN_PASS
    ) {
      return NextResponse.next();
    }

    return new NextResponse('Unauthorized', { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};