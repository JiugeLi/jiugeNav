/** 管理员密码校验。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);

  try {
    const { password } = await readBody<{ password?: string }>(event);
    if (!password) return { valid: false };

    return { valid: await verifyAdminPassword(db, password) };
  } catch (error) {
    return serverError(event, 'AUTH_VERIFY', error);
  }
});
