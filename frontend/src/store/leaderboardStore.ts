import { create } from 'zustand';

interface Agent {
  id: string;
  name: string;
  photoUrl: string;
  teamId: string;
  teamName: string;
  activationTarget: number;
  activations: number;
  submissions: number;
  points: number;
}

interface TeamWithAgents {
  id: string;
  name: string;
  tlId: string;
  agents: Agent[];
  avgActivation: number;
  totalActivations: number;
  totalSubmissions: number;
  totalPoints: number;
  tlName: string;
  tlPhotoUrl: string;
}

interface TopStats {
  topAgentMonth: {
    name: string;
    photoUrl: string;
    activations: number;
  };
  topAgentToday: {
    name: string;
    photoUrl: string;
    todaySubmissions: number;
  };
  totalActivations: number;
  totalSubmissions: number;
  totalTodaySubmissions: number;
}


interface LeaderboardState {
  teams: TeamWithAgents[];
  topStats: TopStats | null;
  isLoading: boolean;
  lastUpdated: Date | null;
  setTeams: (teams: TeamWithAgents[]) => void;
  setTopStats: (topStats: TopStats) => void;
  setLoading: (isLoading: boolean) => void;
  updateFromSocket: (data: any) => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  teams: [],
  topStats: null,
  isLoading: true,
  lastUpdated: null,
  setTeams: (teams) => set({ teams, lastUpdated: new Date() }),
  setTopStats: (topStats) => set({ topStats }),
  setLoading: (isLoading) => set({ isLoading }),
  updateFromSocket: (data) => {
    if (data.teams) {
      set({
        teams: data.teams,
        lastUpdated: new Date()
      });
    }
    if (data.topStats) {
      set({ topStats: data.topStats });
    }
  },
}));
