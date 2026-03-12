import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async (req, { session }) => {
  return NextResponse.json({
    message: 'This is a protected API route',
    user: session!.user,
  });
});
