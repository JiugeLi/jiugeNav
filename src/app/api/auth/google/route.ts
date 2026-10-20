import { NextResponse } from 'next/server';
import { verifyGoogleToken } from '@/lib/google-auth';
import { loginOrCreateUserWithGoogle } from '@/lib/user-auth';
import { badRequest, serverError } from '@/lib/api';

/** Google 登录：校验 ID Token → 建号/更新 → 返回会话。 */
export async function POST(req: Request) {
  try {
    const { idToken } = await req.json() as { idToken?: string };
    if (!idToken) return badRequest('缺少 ID Token');

    const googleInfo = await verifyGoogleToken(idToken);
    if (!googleInfo) return NextResponse.json({ success: false, message: 'Google 凭证无效' }, { status: 401 });

    const user = await loginOrCreateUserWithGoogle(googleInfo);
    if (!user) return NextResponse.json({ success: false, message: '创建会话失败' }, { status: 500 });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return serverError('GOOGLE_AUTH', error);
  }
}
