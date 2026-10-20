import { NextResponse } from 'next/server';
import { changePassword } from '@/lib/auth';
import { badRequest, serverError } from '@/lib/api';

/** 修改管理员密码。 */
export async function POST(req: Request) {
  try {
    const { newPassword } = await req.json() as { newPassword?: string };
    if (!newPassword || newPassword.length < 6) return badRequest('密码长度至少 6 位');

    const success = await changePassword(newPassword);
    return success
      ? NextResponse.json({ success: true, message: '密码修改成功' })
      : NextResponse.json({ success: false, message: '密码修改失败' }, { status: 500 });
  } catch (error) {
    return serverError('CHANGE_PASSWORD', error);
  }
}
