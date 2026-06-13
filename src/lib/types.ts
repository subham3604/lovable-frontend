export interface UserProfileResponse {
  id: number;
  username: string;
  name: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  projectId: string;
  user?: UserProfileResponse;
}

export interface AuthResponse {
  token: string;
  user: UserProfileResponse;
}

export interface SignupRequest {
  username: string;
  name: string;
  password: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

export interface DeployResponse {
  previewUrl: string;
}

export interface ChatHistoryMessage {
  id: number;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export enum ChatEventType {
  THOUGHT = 'THOUGHT',
  MESSAGE = 'MESSAGE',
  FILE_EDIT = 'FILE_EDIT',
  TOOL_LOG = 'TOOL_LOG'
}

export interface ChatEvent {
  id?: number;
  type: ChatEventType;
  content: string; // Markdown, Code, or Tool Summary
  metadata?: string; // Tool args (e.g. "src/App.tsx")
  filePath?: string; // For FILE_EDIT
  sequenceOrder?: number;
}

export interface ChatMessage {
  id: number;
  role: 'USER' | 'ASSISTANT';
  content?: string; // Fallback raw text
  events: ChatEvent[]; // The granular events
  createdAt?: string;
}

export interface ProjectResponse {
  id: number;
  name: string;
  owner: UserProfileResponse;
  createdAt: string;
  updatedAt?: string;
  role?: ProjectRole;
}

export interface ProjectSummaryResponse {
  id: number;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  role?: ProjectRole;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectRequest {
  name: string;
}

export type ProjectRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface MemberResponse {
  userId: number;
  username: string;
  name?: string;
  projectRole: ProjectRole;
  invitedAt?: string;
}

export interface ProjectMember {
  userId: number;
  username: string;
  name?: string;
  role: ProjectRole;
  invitedAt?: string;
}

export interface InviteMemberRequest {
  username: string;
  role: ProjectRole;
}

export interface UpdateMemberRoleRequest {
  role: ProjectRole;
}

// Billing & Plans
export interface PlanResponse {
  id: number;
  name: string;
  maxProjects: number;
  maxTokensPerDay: number;
  unlimitedAi: boolean;
  price: string;
}

export interface SubscriptionResponse {
  plan: PlanResponse;
  status: string;
  currentPeriodEnd: string;
  tokensUsedThisCycle: number;
}

export interface UsageTodayResponse {
  tokensUsed: number;
  tokensLimit: number;
  previewsRunning: number;
  previewsLimit: number;
}

export interface PlanLimitsResponse {
  planName: string;
  maxTokensPerDay: number;
  maxProjects: number;
  unlimitedAi: boolean;
}

export interface CheckoutRequest {
  planId: number;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

export interface PortalResponse {
  portalUrl: string;
}