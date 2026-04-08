
export interface UserType {
    name?: string;
    email: string;
    password: string;
    currentOrgId?: string;  // last active org
}

export type OrgRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';

export interface OrgContext {
  orgId: string;
  orgName: string;
  role: OrgRole;
}

export interface JWTPayload {
  id: string;
  email: string;
  currentOrgId?: string;
  iat?: number;
  exp?: number;
}