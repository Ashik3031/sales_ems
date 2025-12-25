import { type User, type InsertUser, type Team, type InsertTeam, type Agent, type InsertAgent, type Notification, type InsertNotification, type Booking, type InsertBooking, type LeaveRequest, type InsertLeaveRequest, type SystemSettings, type InsertSystemSettings, type AgentHistory, type InsertAgentHistory } from "./shared/schema.ts";
import { randomUUID } from "crypto";

export interface IStorage {
  // ... existing methods ...

  // Leave Request methods
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  getLeaveRequestsByUserId(userId: string): Promise<LeaveRequest[]>;
  getLeaveRequestsByTeamId(teamId: string): Promise<(LeaveRequest & { user: User })[]>;
  updateLeaveRequestStatus(id: string, status: 'pending_tl' | 'pending_admin' | 'approved' | 'rejected'): Promise<LeaveRequest | undefined>;
  getLeaveRequestsForAdmin(): Promise<(LeaveRequest & { user: User, team: Team | undefined })[]>;

  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Team methods
  getTeam(id: string): Promise<Team | undefined>;
  getTeamByTlId(tlId: string): Promise<Team | undefined>;
  getAllTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<boolean>;

  // Agent methods
  getAgent(id: string): Promise<Agent | undefined>;
  getAgentByUserId(userId: string): Promise<Agent | undefined>;
  getAgentByEmail(email: string): Promise<Agent | undefined>;
  getAgentsByTeamId(teamId: string): Promise<Agent[]>;
  getAllAgents(): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<boolean>;
  resetDailySubmissions(): Promise<void>;
  getAgentHistory(agentId: string): Promise<AgentHistory[]>;

  // Notification methods
  getActiveNotification(): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  clearActiveNotifications(): Promise<void>;

  // Booking methods
  getBookingsByDate(date: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  deleteBooking(id: string): Promise<boolean>;

  // System Settings methods
  getSystemSettings(): Promise<SystemSettings | undefined>;
  updateSystemSettings(settings: InsertSystemSettings): Promise<SystemSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private teams: Map<string, Team>;
  private agents: Map<string, Agent>;
  private notifications: Map<string, Notification>;

  private systemSettings?: SystemSettings;

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.agents = new Map();
    this.notifications = new Map();
    this.systemSettings = undefined;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeamByTlId(tlId: string): Promise<Team | undefined> {
    return Array.from(this.teams.values()).find(team => team.tlId === tlId);
  }

  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const team: Team = { ...insertTeam, id };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;

    const updatedTeam = { ...team, ...updates };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: string): Promise<boolean> {
    const team = this.teams.get(id);
    if (!team) return false;

    // Remove the team itself
    this.teams.delete(id);

    // Unset teamId from any users who were TLs or members
    Array.from(this.users.values()).forEach((u) => {
      if (u.teamId === id) {
        this.users.set(u.id, { ...u, teamId: undefined });
      }
    });

    // Unset teamId from agents that referenced the deleted team
    Array.from(this.agents.values()).forEach((a) => {
      if (a.teamId === id) {
        this.agents.set(a.id, { ...a, teamId: undefined });
      }
    });

    // Also remove from system settings featuredTeamIds if present
    if (this.systemSettings && this.systemSettings.featuredTeamIds) {
      this.systemSettings.featuredTeamIds = this.systemSettings.featuredTeamIds.filter(tid => tid !== id);
    }

    return true;
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgentByUserId(userId: string): Promise<Agent | undefined> {
    return Array.from(this.agents.values()).find(agent => agent.userId === userId);
  }

  async getAgentByEmail(email: string): Promise<Agent | undefined> {
    return Array.from(this.agents.values()).find(agent => agent.email === email);
  }

  async getAgentsByTeamId(teamId: string): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(agent => agent.teamId === teamId);
  }

  async getAgentHistory(agentId: string): Promise<AgentHistory[]> {
    return [];
  }

  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = randomUUID();
    const agent: Agent = { ...insertAgent, id };
    this.agents.set(id, agent);
    return agent;
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;

    const updatedAgent = { ...agent, ...updates };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: string): Promise<boolean> {
    return this.agents.delete(id);
  }

  async resetDailySubmissions(): Promise<void> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    Array.from(this.agents.entries()).forEach(([id, agent]) => {
      const lastReset = new Date(agent.lastSubmissionReset);
      const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());

      // If last reset was before today, reset submissions
      if (lastResetDay < today) {
        this.agents.set(id, {
          ...agent,
          submissions: 0,
          lastSubmissionReset: now
        });
      }
    });
  }

  async getActiveNotification(): Promise<Notification | undefined> {
    return Array.from(this.notifications.values()).find(notification => notification.isActive);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    // Clear any existing active notifications
    await this.clearActiveNotifications();

    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      createdAt: new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async clearActiveNotifications(): Promise<void> {
    Array.from(this.notifications.entries()).forEach(([id, notification]) => {
      if (notification.isActive) {
        this.notifications.set(id, { ...notification, isActive: false });
      }
    });
  }

  // Booking methods
  async getBookingsByDate(date: string): Promise<Booking[]> {
    return [];
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    throw new Error("Method not implemented.");
  }

  async deleteBooking(id: string): Promise<boolean> {
    return false;
  }
  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    throw new Error("Method not implemented.");
  }
  async getLeaveRequestsByUserId(userId: string): Promise<LeaveRequest[]> {
    return [];
  }
  async getLeaveRequestsByTeamId(teamId: string): Promise<(LeaveRequest & { user: User })[]> {
    return [];
  }
  async updateLeaveRequestStatus(id: string, status: 'pending_tl' | 'pending_admin' | 'approved' | 'rejected'): Promise<LeaveRequest | undefined> {
    return undefined;
  }

  async getLeaveRequestsForAdmin(): Promise<(LeaveRequest & { user: User, team: Team | undefined })[]> {
    return [];
  }

  // System Settings Logic
  async getSystemSettings(): Promise<SystemSettings | undefined> {
    return this.systemSettings;
  }

  async updateSystemSettings(settings: InsertSystemSettings): Promise<SystemSettings> {
    // Merge with existing so partial updates don't remove other fields
    const updated: SystemSettings = {
      id: this.systemSettings?.id || randomUUID(),
      notificationSoundUrl: settings.notificationSoundUrl ?? this.systemSettings?.notificationSoundUrl,
      featuredTeamIds: settings.featuredTeamIds ?? this.systemSettings?.featuredTeamIds
    } as SystemSettings;

    this.systemSettings = updated;
    return updated;
  }
}

import { MongoStorage } from "./db/mongoStorage.js";

export const storage = new MongoStorage();
