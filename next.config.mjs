import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

// `next dev` 时注入真实的 Cloudflare 绑定（本地 D1 / AI 等），
// 这样本地开发可以直接用真实数据库，无需再为每个接口写 mock 分支。
initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
