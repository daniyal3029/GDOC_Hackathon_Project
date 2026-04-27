export interface AccessTokenPayload {
  userId: string;
  email: string;
  version: number;      // refreshTokenVersion
  iat: number;          // issued at
  exp: number;          // expires at
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;      // Unique ID for this refresh token
  version: number;
  iat: number;
  exp: number;
}

export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  accessToken: string;
}
