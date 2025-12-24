import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'tl', 'employee'], required: true },
  teamId: { type: String },
  avatarUrl: { type: String },
  contactNumber: { type: String },
  jobRole: { type: String }
});

const leaveRequestSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['leave', 'late_coming', 'early_going'], required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending_tl', 'pending_admin', 'approved', 'rejected'], default: 'pending_tl' },
  createdAt: { type: Date, default: Date.now }
});

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tlId: { type: String, required: true },
  agents: [{ type: String }],
  avgActivation: { type: Number, default: 0 },
  totalActivations: { type: Number, default: 0 },
  totalSubmissions: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  celebrationAudioUrl: { type: String }
});

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photoUrl: { type: String, required: true },
  teamId: { type: String, required: true },
  activationTarget: { type: Number, required: true },
  activations: { type: Number, default: 0 },
  submissions: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  todaySubmissions: { type: Number, default: 0 },
  lastSubmissionReset: { type: Date, default: Date.now },
  userId: { type: String }, // Linked User ID
  email: { type: String }   // Linked Email
});

const agentHistorySchema = new mongoose.Schema({
  agentId: { type: String, required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  activations: { type: Number, default: 0 },
  submissions: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});



const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ['text', 'image', 'video', 'audio'], required: true },
  title: { type: String },
  message: { type: String },
  mediaUrl: { type: String },
  isActive: { type: Boolean, default: true },
  duration: { type: Number, default: 15000 },
  createdAt: { type: Date, default: Date.now }
});

const bookingSchema = new mongoose.Schema({
  slotTime: { type: String, required: true },
  date: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.model('User', userSchema);
export const TeamModel = mongoose.model('Team', teamSchema);
export const AgentModel = mongoose.model('Agent', agentSchema);
export const AgentHistoryModel = mongoose.model('AgentHistory', agentHistorySchema);
export const NotificationModel = mongoose.model('Notification', notificationSchema);
export const BookingModel = mongoose.model('Booking', bookingSchema);
export const LeaveRequestModel = mongoose.model('LeaveRequest', leaveRequestSchema);

const systemSettingsSchema = new mongoose.Schema({
  notificationSoundUrl: { type: String },
  featuredTeamIds: [{ type: String }]
});
export const SystemSettingsModel = mongoose.model('SystemSettings', systemSettingsSchema);

