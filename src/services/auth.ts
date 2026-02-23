
export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message: string; errors?: Record<string, string[]> };


/**
 * Register a new user.
 */
export async function registerUser(
  payload: RegisterPayload
): Promise<ApiResponse<AuthUser>> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/**
 * Login with email and password.
 * Sets an HttpOnly cookie with the JWT token on success.
 */
export async function loginUser(
  payload: LoginPayload
): Promise<ApiResponse<AuthUser>> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}
