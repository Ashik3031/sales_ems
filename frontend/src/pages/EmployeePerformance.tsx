import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { format } from "date-fns";
import { Loader2, TrendingUp, CalendarDays, Award, CheckCircle2, XCircle, Clock, ArrowLeft } from "lucide-react";
import { Link, useRoute } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

export default function EmployeePerformance() {
    const { user } = useAuthStore();
    const [, params] = useRoute('/performance/:agentId') as [boolean, any];
    const agentId = params?.agentId;

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['/api/employee/performance', agentId],
        enabled: !!user, // wait for auth state
        retry: false,
        queryFn: async () => {
            const url = `/api/employee/performance${agentId ? `?agentId=${encodeURIComponent(agentId)}` : ''}`;
            try {
                const res = await apiRequest('GET', url);
                return await res.json();
            } catch (e: any) {
                // apiRequest throws with status message in body; use that if available
                throw new Error(e?.message || 'Failed to fetch performance data');
            }
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-10">
                            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">Unable to load performance</h3>
                            <p className="text-muted-foreground mt-2">{(error as Error)?.message}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Handle case where no agent is linked
    if (!data?.agent) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <h1 className="text-3xl font-bold">My Performance</h1>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-10">
                            <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No Performance Data Available</h3>
                            <p className="text-muted-foreground mt-2">
                                Your account is not yet linked to a sales agent profile.
                                Please contact your Team Leader or Admin linked to email: {user?.email}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { agent, history, leaves } = data;

    // Prepare chart data (ensure we have at least some data points or placeholder)
    const chartData = history.length > 0 ? history.map((h: any) => ({
        name: `${h.month} ${h.year}`,
        activations: h.activations,
        submissions: h.submissions
    })) : [
        { name: 'No Data', activations: 0, submissions: 0 }
    ];

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold">{agentId ? `${data?.agent?.name || 'Employee'} — Performance` : 'My Performance'}</h1>
                        <p className="text-muted-foreground mt-1">
                            Track sales metrics and leave status
                        </p>
                      </div>
                      {agentId && (
                        <div>
                          <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-4 h-4" /> Back
                          </button>
                        </div>
                      )}
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Activations
                            </CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{agent.activations}</div>
                            <p className="text-xs text-muted-foreground">
                                Target: {agent.activationTarget}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Submissions
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{agent.submissions}</div>
                            <p className="text-xs text-muted-foreground">
                                Today: {agent.todaySubmissions || 0}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Performance Points
                            </CardTitle>
                            <Award className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{agent.points}</div>
                            <p className="text-xs text-muted-foreground">
                                Keep it up!
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sales Graph - Takes up 2/3 */}
                    <div className="lg:col-span-2">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Sales History (Past 3 Months)</CardTitle>
                                <CardDescription>
                                    Your activation and submission trend
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    {history.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                            <TrendingUp className="w-10 h-10 mb-2 opacity-20" />
                                            <p>No historical data collected yet.</p>
                                            <p className="text-xs">Data will appear here next month.</p>
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                                <XAxis dataKey="name" fontSize={12} stroke="#888888" />
                                                <YAxis fontSize={12} stroke="#888888" />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                                                />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="activations"
                                                    stroke="#22c55e"
                                                    strokeWidth={2}
                                                    activeDot={{ r: 6 }}
                                                    name="Activations"
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="submissions"
                                                    stroke="#3b82f6"
                                                    strokeWidth={2}
                                                    activeDot={{ r: 6 }}
                                                    name="Submissions"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Leaves - Takes up 1/3 */}
                    <div>
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>Recent Requests</CardTitle>
                                <CardDescription>
                                    Latest status of your requests
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {leaves.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">No recent requests.</p>
                                    ) : (
                                        leaves.map((leave: any) => (
                                            <div key={leave.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none capitalize">
                                                        {leave.type.replace('_', ' ')}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(leave.startDate), 'MMM d')} - {format(new Date(leave.endDate), 'MMM d')}
                                                    </p>
                                                </div>
                                                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium border
                          ${leave.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        leave.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                            'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                                    {leave.status === 'approved' ? <CheckCircle2 className="w-3 h-3 mr-1" /> :
                                                        leave.status === 'rejected' ? <XCircle className="w-3 h-3 mr-1" /> :
                                                            <Clock className="w-3 h-3 mr-1" />}
                                                    <span className="capitalize">{leave.status === 'pending_tl' ? 'Pending TL' :
                                                        leave.status === 'pending_admin' ? 'Pending Admin' :
                                                            leave.status}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
