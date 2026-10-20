/** Google 登录：校验 ID Token → 建号/更新 → 返回会话。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);

  try {
    const { idToken } = await readBody<{ idToken?: string }>(event);
    if (!idToken) fail(event, 400, '缺少 ID Token');

    const googleInfo = await verifyGoogleToken(idToken);
    if (!googleInfo) fail(event, 401, 'Google 凭证无效');

    return { success: true, user: await loginOrCreateUserWithGoogle(db, googleInfo) };
  } catch (error) {
    return serverError(event, 'GOOGLE_AUTH', error);
  }
});
