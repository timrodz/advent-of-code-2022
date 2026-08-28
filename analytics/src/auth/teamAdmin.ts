export type Role = "team_admin" | "member";

export interface AuthContext {
  userId: string;
  workspaceId: string;
  role: Role;
  email: string;
}

export class AuthorizationError extends Error {
  readonly status = 403;
  constructor(message = "Team admin role required") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class AuthenticationError extends Error {
  readonly status = 401;
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

const USERS: AuthContext[] = [
  { userId: "u_admin", workspaceId: "ws_demo", role: "team_admin", email: "admin@example.com" },
  { userId: "u_admin_b", workspaceId: "ws_other", role: "team_admin", email: "other-admin@example.com" },
  { userId: "u_member", workspaceId: "ws_demo", role: "member", email: "member@example.com" },
];

export function authenticate(token: string | undefined): AuthContext {
  if (!token) throw new AuthenticationError();
  const user = USERS.find((u) => u.userId === token);
  if (!user) throw new AuthenticationError("Unknown token");
  return user;
}

/** Team-admin gate shared by all core dashboard metric endpoints. */
export function requireTeamAdmin(auth: AuthContext): void {
  if (auth.role !== "team_admin") {
    throw new AuthorizationError();
  }
}

export function listTeamAdmins(workspaceId?: string): AuthContext[] {
  return USERS.filter(
    (u) => u.role === "team_admin" && (workspaceId === undefined || u.workspaceId === workspaceId),
  );
}

export function listWorkspaces(): string[] {
  return [...new Set(USERS.map((u) => u.workspaceId))];
}
