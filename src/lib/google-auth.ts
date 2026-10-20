// Google OAuth 认证工具

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

/**
 * 验证 Google ID Token
 * @param idToken Google ID Token
 * @returns 用户信息
 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleUserInfo | null> {
  try {
    // 使用 Google 的 tokeninfo 端点验证 token
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    
    if (!response.ok) {
      console.error('Google token verification failed:', response.status);
      return null;
    }
    
    const data = await response.json() as {
      sub: string;
      email: string;
      name: string;
      picture: string;
      email_verified: string;
    };
    
    // 验证 email 是否已验证
    if (data.email_verified !== 'true') {
      console.error('Email not verified');
      return null;
    }
    
    return {
      id: data.sub,
      email: data.email,
      name: data.name,
      picture: data.picture,
      verified_email: true,
    };
  } catch (error) {
    console.error('Error verifying Google token:', error);
    return null;
  }
}
