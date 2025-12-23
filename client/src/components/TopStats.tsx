import { Trophy, Zap, RotateCcw, FileText } from "lucide-react";

interface TopStatsProps {
  topStats: {
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
  } | null;
}

export default function TopStats({ topStats }: TopStatsProps) {
  if (!topStats) {
    return (
      <div className="bg-card border-b border-border">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted rounded-lg p-4 animate-pulse">
                <div className="h-16 bg-muted-foreground/20 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 🔒 Safe numeric values (avoid undefined.toLocaleString())
  const totalActivations = topStats.totalActivations ?? 0;
  const totalSubmissions = topStats.totalSubmissions ?? 0;
  const totalTodaySubmissions = topStats.totalTodaySubmissions ?? 0;
  const todaySubmissions = topStats.topAgentToday.todaySubmissions ?? 0;

  return (
    <div className="bg-card border-b border-border">
      <div className="px-2 sm:px-4 lg:px-8 py-2 lg:py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-6">
          {/* Top Agent of the Month */}
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-2 lg:p-1">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="flex-shrink-0">
                <img
                  src={topStats.topAgentMonth.photoUrl}
                  alt="Top agent photo"
                  className="w-12 h-12 lg:w-24 lg:h-24 rounded-xl object-cover border-2 border-yellow-300"
                  data-testid="top-agent-month-photo"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] lg:text-xs font-medium text-yellow-700 uppercase tracking-wider flex items-center">
                  <Trophy className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                  Top Agent (Month)
                </p>
                <p
                  className="text-sm lg:text-xl font-extrabold text-yellow-900 truncate uppercase"
                  data-testid="top-agent-month-name"
                >
                  {topStats.topAgentMonth.name}
                </p>
                <p
                  className="text-xs lg:text-sm text-yellow-700"
                  data-testid="top-agent-month-activations"
                >
                  <span className="font-extrabold text-base lg:text-xl">
                    {topStats.topAgentMonth.activations ?? 0}
                  </span>{" "}
                  activations
                </p>
              </div>
            </div>
          </div>

          {/* Top Agent Today – uses todaySubmissions */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-2 lg:p-1">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="flex-shrink-0">
                <img
                  src={topStats.topAgentToday.photoUrl}
                  alt="Top daily agent photo"
                  className="w-12 h-12 lg:w-24 lg:h-24 rounded-xl object-cover border-2 border-blue-300"
                  data-testid="top-agent-today-photo"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] lg:text-xs font-medium text-blue-700 uppercase tracking-wider flex items-center">
                  <Zap className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                  Top Agent (Today)
                </p>
                <p
                  className="text-sm lg:text-lg font-extrabold text-blue-900 truncate uppercase"
                  data-testid="top-agent-today-name"
                >
                  {topStats.topAgentToday.name}
                </p>
                <p
                  className="text-xs lg:text-sm text-blue-700"
                  data-testid="top-agent-today-submissions"
                >
                  <span className="font-extrabold text-base lg:text-xl">
                    {todaySubmissions}
                  </span>{" "}
                  submissions
                </p>
              </div>
            </div>
          </div>

           {/* 🔥 Today Total Submissions */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-1.5 lg:p-4 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[9px] lg:text-xs font-medium text-orange-700 uppercase tracking-wider">
                Today Total Submissions
              </p>
              <p
                className="text-lg lg:text-3xl font-bold text-orange-900"
                data-testid="total-today-submissions"
              >
                {totalTodaySubmissions.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Total Activations (monthly) */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-1.5 lg:p-4 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[9px] lg:text-xs font-medium text-green-700 uppercase tracking-wider flex items-center justify-center">
                <RotateCcw className="w-2 h-2 lg:w-3 lg:h-3 mr-0.5" />
                Total Activations
              </p>
              <p
                className="text-lg lg:text-3xl font-bold text-green-900"
                data-testid="total-activations"
              >
                {totalActivations.toLocaleString()}
              </p>
            </div>
          </div>

         

          {/* Total Submissions (monthly) */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-1.5 lg:p-4 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[9px] lg:text-xs font-medium text-purple-700 uppercase tracking-wider flex items-center justify-center">
                <FileText className="w-2 h-2 lg:w-3 lg:h-3 mr-0.5" />
                Total Submissions
              </p>
              <p
                className="text-lg lg:text-3xl font-bold text-purple-900"
                data-testid="total-submissions"
              >
                {totalSubmissions.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
