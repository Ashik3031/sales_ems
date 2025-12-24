import { storage } from './storage';
import bcrypt from 'bcryptjs';

export async function seedData() {
  // If admin exists, assume already seeded
  const existingAdmin = await storage.getUserByEmail(process.env.ADMIN_EMAIL || 'admin@example.com');
  if (existingAdmin) {
    return;
  }

  // Passwords
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  const tl1PasswordHash   = await bcrypt.hash(process.env.TL1_PASSWORD || 'tl1-pass', 10);
  const tl2PasswordHash   = await bcrypt.hash(process.env.TL2_PASSWORD || 'tl2-pass', 10);
  const tl3PasswordHash   = await bcrypt.hash(process.env.TL3_PASSWORD || 'tl2-pass', 10);

  // Users
  const admin = await storage.createUser({
    name: 'Admin User',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    passwordHash: adminPasswordHash,
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face'
  });

  const tl1 = await storage.createUser({
    name: 'Fuhad Zenin',
    email: process.env.TL1_EMAIL || 'tl1@tele.com',
    passwordHash: tl1PasswordHash,
    role: 'tl',
    avatarUrl: 'https://res.cloudinary.com/dxq0nrirt/image/upload/v1762951340/WhatsApp_Image_2025-11-12_at_16.41.26_ec2fe733_exsk0a.jpg'
  });

  const tl2 = await storage.createUser({
    name: 'Anandhan ',
    email: process.env.TL2_EMAIL || 'tl2@example.com',
    passwordHash: tl2PasswordHash,
    role: 'tl',
    avatarUrl: 'https://res.cloudinary.com/dxq0nrirt/image/upload/…tsApp_Image_2025-10-04_at_6.03.24_PM_1_equwbv.jpg'
  });

  const tl3 = await storage.createUser({
    name: 'Vimal',
    email: process.env.TL3_EMAIL || 'tl2@example.com',
    passwordHash: tl3PasswordHash,
    role: 'tl',
    avatarUrl: 'https://res.cloudinary.com/dxq0nrirt/image/upload/v1762951340/WhatsApp_Image_2025-11-12_at_16.41.26_23b04ae8_exzmfa.jpg'
  });

  // Teams
  const teamAlpha = await storage.createTeam({
    name: 'FNE',
    tlId: tl1.id,
    agents: [],
    avgActivation: 0,
    totalActivations: 0,
    totalSubmissions: 0,
    totalPoints: 0
  });

  const teamBravo = await storage.createTeam({
    name: 'Charlie',
    tlId: tl2.id,
    agents: [],
    avgActivation: 0,
    totalActivations: 0,
    totalSubmissions: 0,
    totalPoints: 0
  });

  const teamfne = await storage.createTeam({
    name: 'Digtel',
    tlId: tl3.id,
    agents: [],
    avgActivation: 0,
    totalActivations: 0,
    totalSubmissions: 0,
    totalPoints: 0
  });

  // Agents
  // const alphaAgents = [
  //   {
  //     name: 'Alice Johnson',
  //     email: 'alice.johnson@example.com',
  //     teamId: teamAlpha.id,
  //     avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=64&h=64&fit=crop&crop=face',
  //     points: 0,
  //     activations: 0,
  //     submissions: 0
  //   },
  //   {
  //     name: 'Bob Lee',
  //     email: 'bob.lee@example.com',
  //     teamId: teamAlpha.id,
  //     avatarUrl: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=64&h=64&fit=crop&crop=face',
  //     points: 0,
  //     activations: 0,
  //     submissions: 0
  //   }
  // ];

  // const bravoAgents = [
  //   {
  //     name: 'Carol Smith',
  //     email: 'carol.smith@example.com',
  //     teamId: teamBravo.id,
  //     avatarUrl: 'https://images.unsplash.com/photo-1519340333755-c89213c1e339?w=64&h=64&fit=crop&crop=face',
  //     points: 0,
  //     activations: 0,
  //     submissions: 0
  //   },
  //   {
  //     name: 'David Kim',
  //     email: 'david.kim@example.com',
  //     teamId: teamBravo.id,
  //     avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=64&h=64&fit=crop&crop=face',
  //     points: 0,
  //     activations: 0,
  //     submissions: 0
  //   }
  // ];

  // for (const agentData of [...alphaAgents, ...bravoAgents]) {
  //   await storage.createAgent(agentData);
  // }

}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedData().catch(console.error);
}
