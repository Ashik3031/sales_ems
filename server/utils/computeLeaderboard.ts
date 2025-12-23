import { storage } from '../storage';
import { Team, Agent } from '@shared/schema';

export interface TeamWithAgents extends Team {
  agents: Agent[];
  tlName: string;
  tlPhotoUrl: string;
}

export interface LeaderboardData {
  teams: TeamWithAgents[];
  teamCards: TeamWithAgents[];
  computedRanks: TeamWithAgents[];
}

export const computeLeaderboard = async (): Promise<LeaderboardData> => {
  let teams = await storage.getAllTeams();
  const settings = await storage.getSystemSettings();

  // If admin has selected featured teams, restrict leaderboard to those teams only
  if (settings?.featuredTeamIds && settings.featuredTeamIds.length > 0) {
    teams = teams.filter(t => settings.featuredTeamIds!.includes(t.id));
  }

  const allAgents = await storage.getAllAgents();
  
  const teamsWithAgents: TeamWithAgents[] = [];

  for (const team of teams) {
    const teamAgents = allAgents.filter(agent => agent.teamId === team.id);
    const tl = await storage.getUser(team.tlId);
    
    // Sort agents by activation percentage (descending)
    const sortedAgents = teamAgents.sort((a, b) => {
      const aPercent = a.activationTarget > 0 ? (a.activations / a.activationTarget) * 100 : 0;
      const bPercent = b.activationTarget > 0 ? (b.activations / b.activationTarget) * 100 : 0;
      return bPercent - aPercent;
    });

    // Calculate team averages
    const totalActivations = teamAgents.reduce((sum, agent) => sum + agent.activations, 0);
    const totalSubmissions = teamAgents.reduce((sum, agent) => sum + agent.submissions, 0);
    const totalPoints = teamAgents.reduce((sum, agent) => sum + agent.points, 0);
    
    const avgActivation = teamAgents.length > 0 
      ? teamAgents.reduce((sum, agent) => {
          const percent = agent.activationTarget > 0 ? (agent.activations / agent.activationTarget) * 100 : 0;
          return sum + percent;
        }, 0) / teamAgents.length
      : 0;

    // Update team totals in storage
    await storage.updateTeam(team.id, {
      totalActivations,
      totalSubmissions,
      totalPoints,
      avgActivation: Math.round(avgActivation)
    });

    teamsWithAgents.push({
      ...team,
      totalActivations,
      totalSubmissions,
      totalPoints,
      avgActivation: Math.round(avgActivation),
      agents: sortedAgents,
      tlName: tl?.name || 'Unknown',
      tlPhotoUrl: tl?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face'
    });
  }

  // Sort teams by average activation percentage (descending)
  const rankedTeams = teamsWithAgents.sort((a, b) => b.avgActivation - a.avgActivation);

  return {
    teams: rankedTeams,
    teamCards: rankedTeams,
    computedRanks: rankedTeams
  };
};
