import { Users, Award } from 'lucide-react';
import AgentRow from './AgentRow';

interface Agent {
  id: string;
  name: string;
  photoUrl: string;
  activations: number;
  submissions: number;
  activationTarget: number;
}

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    tlName: string;
    tlPhotoUrl: string;
    avgActivation: number;
    totalActivations: number;
    totalSubmissions: number;
    totalPoints: number;
    agents: Agent[];
  };
  rank: number;
}

export default function TeamCard({ team, rank }: TeamCardProps) {
  const isTopTeam = rank === 1;

  return (
    <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
     {/* Team Header */}
{/* Team Header (square TL photo, header height auto) */}
<div className={`px-2 py-1 ${isTopTeam ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
  {/* ultra-compact grid, no extra height */}
  <div className="grid grid-cols-[auto,1fr] items-center gap-2">
    {/* LEFT: fixed-height image (square), tight border */}
    <div className="flex">
      <img
        src={team.tlPhotoUrl}
        alt={`${team.tlName} photo`}
        className={`h-16 w-16 md:h-32 md:w-32 object-cover rounded-2xl border ${
          isTopTeam ? 'border-white/20' : 'border-gray-300'
        }`}
        data-testid={`team-leader-photo-${team.id}`}
      />
    </div>

    {/* RIGHT: two tight rows */}
    <div className="grid grid-rows-[auto,auto] gap-1">
      {/* Top row: name + avg (tight line-height) */}
      <div className="grid grid-cols-2 gap-2 items-center min-w-0 px-10">
        <div className="min-w-0">
          <div className="flex items-center gap-1 leading-none">
            {rank === 1 && <Award className="w-5 h-5 text-yellow-300 flex-shrink-0" />}
            <h3 className="text-xs md:text-xl font-bold truncate leading-none" data-testid={`team-name-${team.id}`}>
              {team.name}
            </h3>
          </div>
          <p
            className={`text-[10px] md:text-base truncate leading-tight ${
              isTopTeam ? 'text-primary-foreground/80' : 'text-secondary-foreground/80'
            }`}
            data-testid={`team-leader-name-${team.id}`}
          >
            {team.tlName} - TL
          </p>
        </div>

        <div className="text-right leading-none">
          <div className="text-sm md:text-xl font-bold" data-testid={`team-avg-activation-${team.id}`}>
            {team.avgActivation}%
          </div>
          <div className={`${isTopTeam ? 'text-primary-foreground/80' : 'text-secondary-foreground/80'} text-[10px]`}>
            Avg Act
          </div>
        </div>
      </div>

      {/* Bottom row: stats (tiny, no heavy padding) */}
      <div
        className={`grid grid-cols-2 gap-2 pt-2 border-t ${
          isTopTeam ? 'border-primary-foreground/15' : 'border-secondary-foreground/15'
        }`}
      >
        <div className="text-center leading-none">
          <div className="text-xl font-extrabold" data-testid={`team-total-activations-${team.id}`}>
            {team.totalActivations}
          </div>
          <div className={`${isTopTeam ? 'text-primary-foreground/80' : 'text-secondary-foreground/80'} text-[10px] uppercase`}>
            Activations
          </div>
        </div>
        <div className="text-center leading-none">
          <div className="text-xl font-extrabold" data-testid={`team-total-submissions-${team.id}`}>
            {team.totalSubmissions}
          </div>
          <div className={`${isTopTeam ? 'text-primary-foreground/80' : 'text-secondary-foreground/80'} text-[10px] uppercase`}>
            Submissions
          </div>
        </div>
      </div>
    </div>
  </div>
</div>




      {/* Agents List */}
      <div className="p-1.5 lg:p-6">
        {team.agents.length > 0 ? (
          team.agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} />
          ))
        ) : (
          <div className="text-center py-4 lg:py-8 text-muted-foreground">
            <Users className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-2" />
            <p className="text-xs lg:text-base">No agents in this team</p>
          </div>
        )}
      </div>
    </div>
  );
}