import { type User, type InsertUser, type Team, type InsertTeam, type Agent, type InsertAgent, type Notification, type InsertNotification, type Booking, type InsertBooking, type LeaveRequest, type InsertLeaveRequest, type SystemSettings, type InsertSystemSettings, type AgentHistory } from "@shared/schema";
import { UserModel, TeamModel, AgentModel, NotificationModel, BookingModel, LeaveRequestModel, SystemSettingsModel, AgentHistoryModel } from "./models.js";
import path from 'path';
import fs from 'fs/promises';
import { IStorage } from "../storage.js";

export class MongoStorage implements IStorage {
  // Leave Request Methods
  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    const leave = await LeaveRequestModel.create(request);
    return { ...leave.toObject(), id: leave._id.toString() };
  }

  async getLeaveRequestsByUserId(userId: string): Promise<LeaveRequest[]> {
    const leaves = await LeaveRequestModel.find({ userId }).sort({ createdAt: -1 });
    return leaves.map(l => ({ ...l.toObject(), id: l._id.toString() }));
  }

  async getLeaveRequestsByTeamId(teamId: string): Promise<(LeaveRequest & { user: User })[]> {
    // 1. Get all users in this team
    const users = await UserModel.find({ teamId }).lean();
    const userIds = users.map(u => u._id.toString());
    const userMap = new Map(users.map(u => [u._id.toString(), {
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      passwordHash: u.passwordHash,
      role: u.role as 'admin' | 'tl' | 'employee',
      teamId: (u as any).teamId || undefined,
      avatarUrl: (u as any).avatarUrl || undefined,
      contactNumber: (u as any).contactNumber || undefined,
      jobRole: (u as any).jobRole || undefined,
    } as User]));

    // 2. Get requests for these users
    const leaves = await LeaveRequestModel.find({ userId: { $in: userIds } }).sort({ createdAt: -1 });

    // 3. Attach user details
    return leaves.map(l => {
      const leaveObj = l.toObject();
      const user = userMap.get(leaveObj.userId);
      // Fallback user if not found (shouldn't happen)
      const safeUser = user || {
        id: leaveObj.userId,
        name: "Unknown",
        email: "",
        passwordHash: "",
        role: "employee"
      } as User;

      return {
        ...leaveObj,
        id: leaveObj._id.toString(),
        user: safeUser
      };
    });
  }

  async updateLeaveRequestStatus(id: string, status: 'pending_tl' | 'pending_admin' | 'approved' | 'rejected'): Promise<LeaveRequest | undefined> {
    const leave = await LeaveRequestModel.findByIdAndUpdate(id, { status }, { new: true });
    if (!leave) return undefined;
    return { ...leave.toObject(), id: leave._id.toString() };
  }

  async getLeaveRequestsForAdmin(): Promise<(LeaveRequest & { user: User, team: Team | undefined })[]> {
    const leaves = await LeaveRequestModel.find({}).sort({ createdAt: -1 });

    // Get all users referenced
    const userIds = [...new Set(leaves.map(l => l.userId))];
    const users = await UserModel.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map(u => [u._id.toString(), {
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      passwordHash: u.passwordHash,
      role: u.role as 'admin' | 'tl' | 'employee',
      teamId: (u as any).teamId || undefined,
      avatarUrl: (u as any).avatarUrl || undefined,
      contactNumber: (u as any).contactNumber || undefined,
      jobRole: (u as any).jobRole || undefined,
    } as User]));

    // Get all teams for those users
    const teamIds = [...new Set(users.map(u => u.teamId).filter(Boolean))];
    const teams = await TeamModel.find({ _id: { $in: teamIds } });
    const teamMap = new Map(teams.map(t => [t._id.toString(), { ...t.toObject(), id: t._id.toString() } as Team]));

    return leaves.map(l => {
      const leaveObj = l.toObject();
      const user = userMap.get(leaveObj.userId);
      // Fallback user
      const safeUser = user || {
        id: leaveObj.userId,
        name: "Unknown",
        email: "",
        passwordHash: "",
        role: "employee"
      } as User;

      const team = safeUser.teamId ? teamMap.get(safeUser.teamId) : undefined;

      return {
        ...leaveObj,
        id: leaveObj._id.toString(),
        user: safeUser,
        team
      };
    });
  }

  getTeamById(teamId: any): any {
    throw new Error("Method not implemented.");
  }
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id).lean();
    if (!user) return undefined;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role as 'admin' | 'tl',
      teamId: user.teamId || undefined,
      avatarUrl: user.avatarUrl || undefined
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email }).lean();
    if (!user) return undefined;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role as 'admin' | 'tl',
      teamId: user.teamId || undefined,
      avatarUrl: user.avatarUrl || undefined
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = await UserModel.create(insertUser);
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role as 'admin' | 'tl',
      teamId: user.teamId || undefined,
      avatarUrl: user.avatarUrl || undefined
    };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = await UserModel.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!user) return undefined;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role as 'admin' | 'tl',
      teamId: user.teamId || undefined,
      avatarUrl: user.avatarUrl || undefined
    };
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const team = await TeamModel.findById(id).lean();
    if (!team) return undefined;
    return {
      id: team._id.toString(),
      name: team.name,
      tlId: team.tlId,
      agents: team.agents,
      avgActivation: team.avgActivation,
      totalActivations: team.totalActivations,
      totalSubmissions: team.totalSubmissions,
      totalPoints: team.totalPoints,
      celebrationAudioUrl: team.celebrationAudioUrl || undefined
    };
  }

  async getTeamByTlId(tlId: string): Promise<Team | undefined> {
    const team = await TeamModel.findOne({ tlId }).lean();
    if (!team) return undefined;
    return {
      id: team._id.toString(),
      name: team.name,
      tlId: team.tlId,
      agents: team.agents,
      avgActivation: team.avgActivation,
      totalActivations: team.totalActivations,
      totalSubmissions: team.totalSubmissions,
      totalPoints: team.totalPoints,
      celebrationAudioUrl: team.celebrationAudioUrl || undefined
    };
  }

  async getAllTeams(): Promise<Team[]> {
    const teams = await TeamModel.find().lean();
    return teams.map(team => ({
      id: team._id.toString(),
      name: team.name,
      tlId: team.tlId,
      agents: team.agents,
      avgActivation: team.avgActivation,
      totalActivations: team.totalActivations,
      totalSubmissions: team.totalSubmissions,
      totalPoints: team.totalPoints,
      celebrationAudioUrl: team.celebrationAudioUrl || undefined
    }));
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const team = await TeamModel.create(insertTeam);
    return {
      id: team._id.toString(),
      name: team.name,
      tlId: team.tlId,
      agents: team.agents,
      avgActivation: team.avgActivation,
      totalActivations: team.totalActivations,
      totalSubmissions: team.totalSubmissions,
      totalPoints: team.totalPoints,
      celebrationAudioUrl: team.celebrationAudioUrl || undefined
    };
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined> {
    const team = await TeamModel.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!team) return undefined;
    return {
      id: team._id.toString(),
      name: team.name,
      tlId: team.tlId,
      agents: team.agents,
      avgActivation: team.avgActivation,
      totalActivations: team.totalActivations,
      totalSubmissions: team.totalSubmissions,
      totalPoints: team.totalPoints,
      celebrationAudioUrl: team.celebrationAudioUrl || undefined
    };
  }

  async deleteTeam(id: string): Promise<boolean> {
    const team = await TeamModel.findById(id);
    if (!team) return false;

    // Delete the team document
    await TeamModel.deleteOne({ _id: id });

    // Unset teamId from users who referenced this team
    await UserModel.updateMany({ teamId: id }, { $unset: { teamId: "" } });

    // Unset teamId from agents who referenced this team
    await AgentModel.updateMany({ teamId: id }, { $unset: { teamId: "" } });

    // Remove the team from featuredTeamIds in system settings if present
    const settings = await SystemSettingsModel.findOne();
    if (settings && (settings.featuredTeamIds || []).length) {
      settings.featuredTeamIds = (settings.featuredTeamIds || []).filter((tid: string) => tid !== id);
      await settings.save();
    }

    return true;
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    const agent = await AgentModel.findById(id).lean();
    if (!agent) return undefined;
    const todaySubmissions = (agent as any).todaySubmissions ?? 0;

    return {
      id: agent._id.toString(),
      name: agent.name,
      photoUrl: agent.photoUrl,
      teamId: agent.teamId || undefined,
      activationTarget: agent.activationTarget,
      activations: agent.activations,
      submissions: agent.submissions,
      points: agent.points,
      todaySubmissions,
      lastSubmissionReset: agent.lastSubmissionReset,
      userId: agent.userId || undefined,
      email: agent.email || undefined
    };
  }

  async getAgentByUserId(userId: string): Promise<Agent | undefined> {
    const agent = await AgentModel.findOne({ userId }).lean();
    if (!agent) return undefined;
    return {
      id: agent._id.toString(),
      name: agent.name,
      photoUrl: agent.photoUrl,
      teamId: agent.teamId || undefined,
      activationTarget: agent.activationTarget,
      activations: agent.activations,
      submissions: agent.submissions,
      points: agent.points,
      todaySubmissions: agent.todaySubmissions ?? 0,
      lastSubmissionReset: agent.lastSubmissionReset,
      userId: agent.userId || undefined,
      email: agent.email || undefined
    };
  }

  async getAgentByEmail(email: string): Promise<Agent | undefined> {
    const agent = await AgentModel.findOne({ email }).lean();
    if (!agent) return undefined;
    return {
      id: agent._id.toString(),
      name: agent.name,
      photoUrl: agent.photoUrl,
      teamId: agent.teamId || undefined,
      activationTarget: agent.activationTarget,
      activations: agent.activations,
      submissions: agent.submissions,
      points: agent.points,
      todaySubmissions: agent.todaySubmissions ?? 0,
      lastSubmissionReset: agent.lastSubmissionReset,
      userId: agent.userId || undefined,
      email: agent.email || undefined
    };
  }

  async getAgentHistory(agentId: string): Promise<AgentHistory[]> {
    const history = await AgentHistoryModel.find({ agentId }).sort({ year: 1, month: 1 }).lean(); // Basic sort, month string might sort alphabetic but handled in frontend or better mapping
    return history.map(h => ({
      id: h._id.toString(),
      agentId: h.agentId,
      month: h.month,
      year: h.year,
      activations: h.activations,
      submissions: h.submissions,
      points: h.points,
      createdAt: h.createdAt
    }));
  }

  async getAgentsByTeamId(teamId: string): Promise<Agent[]> {
    const agents = await AgentModel.find({ teamId }).lean();
    return agents.map(agent => {
      const todaySubmissions = (agent as any).todaySubmissions ?? 0;

      return {
        id: agent._id.toString(),
        name: agent.name,
        photoUrl: agent.photoUrl,
        teamId: agent.teamId,
        activationTarget: agent.activationTarget,
        activations: agent.activations,
        submissions: agent.submissions,
        points: agent.points,
        todaySubmissions,
        lastSubmissionReset: agent.lastSubmissionReset,
      };
    });
  }


  async getAllAgents(): Promise<Agent[]> {
    const agents = await AgentModel.find().lean();
    return agents.map(agent => {
      const todaySubmissions = (agent as any).todaySubmissions ?? 0;

      return {
        id: agent._id.toString(),
        name: agent.name,
        photoUrl: agent.photoUrl,
        teamId: agent.teamId,
        activationTarget: agent.activationTarget,
        activations: agent.activations,
        submissions: agent.submissions,
        points: agent.points,
        todaySubmissions,
        lastSubmissionReset: agent.lastSubmissionReset,
      };
    });
  }


  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const agent = await AgentModel.create({
      ...insertAgent,
      todaySubmissions: insertAgent.todaySubmissions ?? 0,
      lastSubmissionReset: insertAgent.lastSubmissionReset ?? new Date(),
    });

    const todaySubmissions = (agent as any).todaySubmissions ?? 0;

    return {
      id: agent._id.toString(),
      name: agent.name,
      photoUrl: agent.photoUrl,
      teamId: agent.teamId,
      activationTarget: agent.activationTarget,
      activations: agent.activations,
      submissions: agent.submissions,
      points: agent.points,
      todaySubmissions,
      lastSubmissionReset: agent.lastSubmissionReset,
    };
  }


  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined> {
    const agent = await AgentModel.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!agent) return undefined;

    const todaySubmissions = (agent as any).todaySubmissions ?? 0;

    return {
      id: agent._id.toString(),
      name: agent.name,
      photoUrl: agent.photoUrl,
      teamId: agent.teamId,
      activationTarget: agent.activationTarget,
      activations: agent.activations,
      submissions: agent.submissions,
      points: agent.points,
      todaySubmissions,
      lastSubmissionReset: agent.lastSubmissionReset,
    };
  }

  async deleteAgent(id: string): Promise<boolean> {
    const result = await AgentModel.findByIdAndDelete(id);
    return !!result;
  }

  async resetDailySubmissions(): Promise<void> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const agents = await AgentModel.find().lean();

    for (const agent of agents) {
      const lastResetRaw = agent.lastSubmissionReset
        ? new Date(agent.lastSubmissionReset)
        : new Date(0);

      const lastResetDay = new Date(
        lastResetRaw.getFullYear(),
        lastResetRaw.getMonth(),
        lastResetRaw.getDate()
      );

      // Only do something if we've moved to a new day
      if (lastResetDay >= today) continue;

      // New month?
      const isNewMonth =
        lastResetRaw.getFullYear() !== now.getFullYear() ||
        lastResetRaw.getMonth() !== now.getMonth();

      const update: any = {
        todaySubmissions: 0,     // reset daily counter every new day
        lastSubmissionReset: now,
      };

      if (isNewMonth) {
        // also reset monthly totals when month changed
        update.submissions = 0;
        update.activations = 0;
      }

      await AgentModel.findByIdAndUpdate(agent._id, update);
    }
  }


  async getActiveNotification(): Promise<Notification | undefined> {
    const notification = await NotificationModel.findOne({ isActive: true }).lean();
    if (!notification) return undefined;
    return {
      id: notification._id.toString(),
      type: notification.type as 'text' | 'image' | 'video' | 'audio',
      title: notification.title || undefined,
      message: notification.message || undefined,
      mediaUrl: notification.mediaUrl || undefined,
      isActive: notification.isActive,
      duration: notification.duration,
      createdAt: notification.createdAt
    };
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    await this.clearActiveNotifications();

    const notification = await NotificationModel.create(insertNotification);
    return {
      id: notification._id.toString(),
      type: notification.type as 'text' | 'image' | 'video' | 'audio',
      title: notification.title || undefined,
      message: notification.message || undefined,
      mediaUrl: notification.mediaUrl || undefined,
      isActive: notification.isActive,
      duration: notification.duration,
      createdAt: notification.createdAt
    };
  }

  async clearActiveNotifications(): Promise<void> {
    await NotificationModel.updateMany({ isActive: true }, { isActive: false });
  }

  // Booking methods
  async getBookingsByDate(date: string): Promise<Booking[]> {
    const bookingDocs = await BookingModel.find({ date }).lean();
    return bookingDocs.map(doc => ({
      id: doc._id.toString(),
      slotTime: doc.slotTime,
      date: doc.date,
      userId: doc.userId,
      userName: doc.userName,
      createdAt: doc.createdAt
    }));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const booking = await BookingModel.create(insertBooking);
    return {
      id: booking._id.toString(),
      slotTime: booking.slotTime,
      date: booking.date,
      userId: booking.userId,
      userName: booking.userName,
      createdAt: booking.createdAt
    };
  }

  async deleteBooking(id: string): Promise<boolean> {
    const result = await BookingModel.findByIdAndDelete(id);
    return !!result;
  }

  // System Settings methods
  async getSystemSettings(): Promise<SystemSettings | undefined> {
    const settings = await SystemSettingsModel.findOne({});
    if (!settings) return undefined;

    return {
      id: settings._id.toString(),
      notificationSoundUrl: settings.notificationSoundUrl || undefined,
      featuredTeamIds: settings.featuredTeamIds || undefined
    };
  }

  async updateSystemSettings(settings: InsertSystemSettings): Promise<SystemSettings> {
    // If there was a previous sound uploaded to /uploads, and it's being replaced/removed,
    // remove the old file from disk to avoid orphaned files.
    try {
      const existing = await SystemSettingsModel.findOne({});
      const prevUrl = existing?.notificationSoundUrl;
      const newUrl = settings.notificationSoundUrl;

      if (prevUrl && prevUrl !== newUrl) {
        // Only remove server-stored uploads (local filesystem). Do not attempt to delete external/cloud URLs.
        if (prevUrl.startsWith('/uploads/') || prevUrl.includes('/uploads/')) {
          const filePath = path.join(process.cwd(), prevUrl);
          try {
            await fs.unlink(filePath);
          } catch (err) {
            // ignore errors (file may not exist)
            console.warn('Failed to remove previous notification sound:', (err as any)?.message || err);
          }
        }
      }
    } catch (err) {
      // Non-fatal
      console.warn('Error while cleaning up previous notification sound:', (err as any)?.message || err);
    }

    const updated = await SystemSettingsModel.findOneAndUpdate(
      {},
      settings,
      { upsert: true, new: true }
    );

    return {
      id: updated._id.toString(),
      notificationSoundUrl: updated.notificationSoundUrl || undefined,
      featuredTeamIds: updated.featuredTeamIds || undefined
    };
  }
}
