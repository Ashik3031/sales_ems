import { z } from "zod";

// User (Admin/TL/Employee) schema
export const users = {
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
  role: z.enum(['admin', 'tl', 'employee']),
  teamId: z.string().optional(),
  avatarUrl: z.string().optional(),
  contactNumber: z.string().optional(),
  jobRole: z.string().optional(),
};

export const insertUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  passwordHash: z.string(),
  role: z.enum(['admin', 'tl', 'employee']),
  teamId: z.string().optional(),
  avatarUrl: z.string().optional(),
  contactNumber: z.string().optional(),
  jobRole: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = InsertUser & { id: string };

// Leave Request Schema
export const leaveRequests = {
  id: z.string(),
  userId: z.string(),
  type: z.enum(['leave', 'late_coming', 'early_going']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string(),
  status: z.enum(['pending_tl', 'pending_admin', 'approved', 'rejected']), // Updated flow: pending_tl -> pending_admin -> approved
  createdAt: z.date(),
};

export const insertLeaveRequestSchema = z.object({
  type: z.enum(['leave', 'late_coming', 'early_going']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(1),
  userId: z.string().optional(), // Can be inferred from auth
  status: z.enum(['pending_tl', 'pending_admin', 'approved', 'rejected']).default('pending_tl'),
});

export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveRequest = InsertLeaveRequest & { id: string; userId: string; createdAt: Date };

// Team schema
export const teams = {
  id: z.string(),
  name: z.string(),
  tlId: z.string(),
  agents: z.array(z.string()),
  avgActivation: z.number(),
  totalActivations: z.number(),
  totalSubmissions: z.number(),
  totalPoints: z.number(),
  celebrationAudioUrl: z.string().optional(),
};

export const insertTeamSchema = z.object({
  name: z.string().min(1),
  tlId: z.string(),
  agents: z.array(z.string()).default([]),
  avgActivation: z.number().default(0),
  totalActivations: z.number().default(0),
  totalSubmissions: z.number().default(0),
  totalPoints: z.number().default(0),
  celebrationAudioUrl: z.string().optional(),
});

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = InsertTeam & { id: string };

//
// 🔽🔽🔽 AGENT SCHEMA – UPDATED 🔽🔽🔽
//
export const agents = {
  id: z.string(),
  name: z.string(),
  photoUrl: z.string(),
  teamId: z.string().optional(),
  activationTarget: z.number(),
  activations: z.number(),
  submissions: z.number(),
  points: z.number(),
  todaySubmissions: z.number(),     // 👈 NEW: today-only submissions counter
  lastSubmissionReset: z.date(),    // used for daily/monthly reset logic
};

export const insertAgentSchema = z.object({
  name: z.string().min(1),
  photoUrl: z.string().min(1),
  teamId: z.string().optional(),
  activationTarget: z.number().min(1),
  activations: z.number().default(0),       // monthly activations
  submissions: z.number().default(0),       // monthly submissions
  points: z.number().default(0),
  todaySubmissions: z.number().default(0),  // 👈 NEW: defaults to 0
  // we’ll store when we last reset (day/month).
  // I’ll keep it as "now" so the very first reset works correctly.
  lastSubmissionReset: z.date().default(() => new Date()),
  userId: z.string().optional(),
  email: z.string().email().optional(),
});

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = InsertAgent & { id: string };

// Agent History Schema (Past Months)
export const agentHistory = {
  id: z.string(),
  agentId: z.string(),
  month: z.string(), // "January"
  year: z.number(), // 2025
  activations: z.number(),
  submissions: z.number(),
  points: z.number(),
  createdAt: z.date(),
};

export const insertAgentHistorySchema = z.object({
  agentId: z.string(),
  month: z.string(),
  year: z.number(),
  activations: z.number(),
  submissions: z.number(),
  points: z.number(),
});

export type InsertAgentHistory = z.infer<typeof insertAgentHistorySchema>;
export type AgentHistory = InsertAgentHistory & { id: string; createdAt: Date };

//
// Notification & auth schemas (unchanged)
//
export const notifications = {
  id: z.string(),
  type: z.enum(['text', 'image', 'video', 'audio']),
  title: z.string(),
  message: z.string(),
  mediaUrl: z.string(),
  notificationSoundUrl: z.string().optional(),
  isActive: z.boolean(),
  duration: z.number(),
  createdAt: z.date(),
};

export const insertNotificationSchema = z.object({
  type: z.enum(['text', 'image', 'video', 'audio']),
  title: z.string().optional(),
  message: z.string().optional(),
  mediaUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  duration: z.number().default(15000),
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = InsertNotification & { id: string; createdAt: Date; notificationSoundUrl?: string };

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  teamName: z.string().min(2, "Team name must be at least 2 characters"),
});

export type RegisterData = z.infer<typeof registerSchema>;

// TL Update schema
export const tlUpdateSchema = z.object({
  agentId: z.string(),
  delta: z.object({
    submissions: z.number().optional(),
    activations: z.number().optional(),
    points: z.number().optional(),
  }),
});

// TL Set Target schema — allows TL to set an agent's activation target directly
export const tlSetTargetSchema = z.object({
  agentId: z.string(),
  activationTarget: z.number().min(1),
});

// Conference Room Booking schema
export const bookings = {
  id: z.string(),
  slotTime: z.string(), // "10:30 AM", "11:30 AM", etc.
  date: z.string(), // "YYYY-MM-DD"
  userId: z.string(),
  userName: z.string(),
  createdAt: z.date(),
};

export const insertBookingSchema = z.object({
  slotTime: z.string(),
  date: z.string(),
  userId: z.string(),
  userName: z.string(),
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = InsertBooking & { id: string; createdAt: Date };

// System Settings Schema
export const systemSettings = {
  id: z.string(),
  notificationSoundUrl: z.string().optional(),
  featuredTeamIds: z.array(z.string()).optional(),
};

export const insertSystemSettingsSchema = z.object({
  notificationSoundUrl: z.string().optional(),
  featuredTeamIds: z.array(z.string()).optional(),
});

export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type SystemSettings = InsertSystemSettings & { id: string };

