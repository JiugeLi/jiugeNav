import { NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import { serverError } from '@/lib/api';

/** 管理员密码校验。 */
export async function POST(req: Request) {
  try {
    const { password } = await req.json() as { password?: string };
    if (!password) return NextResponse.json({ valid: false }, { status: 400 });

    return NextResponse.json({ valid: await verifyPassword(password) });
  } catch (error) {
    return serverError('AUTH_VERIFY', error);
  }
}
