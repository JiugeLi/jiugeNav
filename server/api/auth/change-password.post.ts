/** 修改管理员密码。 */
export default defineEventHandler(async (event) => {
  const db = requireDb(event);

  try {
    const { newPassword } = await readBody<{ newPassword?: string }>(event);
    if (!newPassword || newPassword.length < 6) fail(event, 400, '密码长度至少 6 位');

    await changeAdminPassword(db, newPassword);
    return { success: true, message: '密码修改成功' };
  } catch (error) {
    return serverError(event, 'CHANGE_PASSWORD', error);
  }
});
