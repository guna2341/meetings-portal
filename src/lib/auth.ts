import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { JWTPayload, OrgRole } from '../types/common';
import Membership, { hasMinimumRole } from '../models/Membership';

const JWT_SECRET = process.env.JWT_SECRET as string;

/**
 * Decode the JWT from the request cookie.
 * Returns the payload or null if missing / invalid.
 */
export function getUserFromRequest(req: NextRequest): JWTPayload | null {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return null;
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Assert the request is authenticated.
 * Returns the JWT payload or a 401 NextResponse.
 */
export function requireAuth(
  req: NextRequest
): JWTPayload | NextResponse {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }
  return user;
}

/**
 * Assert the user is an active member of the given org.
 * Returns the Membership doc or a 403 NextResponse.
 */
export async function requireOrgMember(
  req: NextRequest,
  orgId: string
): Promise<{ userId: string; role: OrgRole } | NextResponse> {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  const membership = await Membership.findOne({
    userId: user.id,
    organizationId: orgId,
    isActive: true,
  }).lean();

  if (!membership) {
    return NextResponse.json(
      { success: false, message: 'You are not a member of this organization' },
      { status: 403 }
    );
  }

  return { userId: user.id, role: membership.role as OrgRole };
}

/**
 * Assert the user has at least `minRole` in the org.
 * Returns { userId, role } or a 403 NextResponse.
 */
export async function requireOrgRole(
  req: NextRequest,
  orgId: string,
  minRole: OrgRole
): Promise<{ userId: string; role: OrgRole } | NextResponse> {
  const result = await requireOrgMember(req, orgId);
  if (result instanceof NextResponse) return result;

  if (!hasMinimumRole(result.role, minRole)) {
    return NextResponse.json(
      {
        success: false,
        message: `This action requires at least '${minRole}' role`,
      },
      { status: 403 }
    );
  }

  return result;
}
