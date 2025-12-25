import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSocket } from '@/hooks/useSocket';
import { useLeaderboardStore } from '@/store/leaderboardStore';
import TopStats from '@/components/TopStats';
import TeamCard from '@/components/TeamCard';

interface CelebrationData {
  agentId: string;
  agentName: string;
  photoUrl: string;
  teamId: string;
  teamName: string;
  newActivationCount: number;
  timestamp: string;
  celebrationAudioUrl?: string;
}

export default function Leaderboard() {
  const { teams, topStats, setTeams, setTopStats, setLoading } = useLeaderboardStore();

  useSocket();

  const { data, isLoading, error } = useQuery<{ teams: any[], topStats: any }>({
    queryKey: ['/api/stats/leaderboard'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (data) {
      setTeams(data.teams || []);
      setTopStats(data.topStats);
      setLoading(false);
    }
  }, [data, setTeams, setTopStats, setLoading]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-xl lg:text-2xl font-bold text-foreground mb-2">Error Loading Leaderboard</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Stats Bar */}
      <TopStats topStats={topStats} />

      {/* Team Cards Grid */}
      <div className=" px-2 sm:px-4 py-3 lg:py-1">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg shadow-lg border border-border p-3 lg:p-6 animate-pulse">
                <div className="h-24 lg:h-32 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : teams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-6">
            {teams.map((team, index) => (
              <TeamCard
                key={team.id}
                team={team}
                rank={index + 1}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 lg:py-12">
            <h2 className="text-lg lg:text-2xl font-bold text-foreground mb-2">No Teams Available</h2>
            <p className="text-xs lg:text-base text-muted-foreground">Teams will appear here once they are created</p>
          </div>
        )}
      </div>
    </div>
  );
}