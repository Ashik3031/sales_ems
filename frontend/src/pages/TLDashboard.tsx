import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus, UserPlus, Trash2, Edit, Users, Music, Check, X } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Agent {
  id: string;
  name: string;
  photoUrl: string;
  teamId: string;
  activationTarget: number;
  activations: number;
  submissions: number;
  // points: number;
}

// Schema removed

export default function TLDashboard() {
  const { user } = useAuthStore();
  const { sendWithAuth } = useSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);

  const { data: team } = useQuery<{ id: string, name: string, celebrationAudioUrl: string }>({
    queryKey: ['/api/tl/team'],
    enabled: !!user,
  });

  useEffect(() => {
    if (team?.name) {
      setNewName(team.name);
    }
  }, [team]);

  const { data: agents = [], isLoading, error } = useQuery<Agent[]>({
    queryKey: ['/api/tl/agents'],
    enabled: !!user,
  });

  // Fetch current team settings to show current music or status
  // For now, simpler to just allow upload without showing current file name unless we fetch team details

  const updateMutation = useMutation({
    mutationFn: async ({ agentId, delta }: { agentId: string; delta: any }) => {
      const response = await apiRequest('PATCH', `/api/tl/agents/${agentId}/increment`, delta);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tl/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/leaderboard'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async (data: { celebrationAudioUrl?: string, name?: string }) => {
      const res = await apiRequest('PATCH', '/api/tl/team', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tl/team'] });
      toast({ title: 'Team Updated', description: 'Your team settings have been updated.' });
      setIsEditingName(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    }
  });

  const uploadMusicMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      // We need native fetch for FormData
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: (data) => {
      // Once uploaded, save the URL to the team
      updateTeamMutation.mutate({ celebrationAudioUrl: data.url });
      setIsUploadingMusic(false);
    },
    onError: (error: Error) => {
      setIsUploadingMusic(false);
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
    }
  });

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingMusic(true);
      uploadMusicMutation.mutate(file);
    }
  };


  // Fetch Leave Requests
  const { data: leaveRequests = [], isLoading: isLoadingLeaves } = useQuery<any[]>({
    queryKey: ['/api/tl/leaves'],
    enabled: !!user
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'pending_admin' | 'rejected' }) => {
      const res = await apiRequest('PATCH', `/api/tl/leaves/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tl/leaves'] });
      toast({ title: 'Request Updated', description: 'Employee request status updated.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    }
  });

  // createAgentMutation removed

  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const response = await apiRequest('DELETE', `/api/tl/agents/${agentId}`, null);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tl/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/leaderboard'] });
      toast({
        title: 'Agent Deleted',
        description: 'Agent has been successfully removed from your team',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Deletion Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // const handleIncrement = (agentId: string, field: 'submissions' | 'activations' | 'points', delta: number) => {
  //   // Send via WebSocket for real-time updates
  //   sendWithAuth({
  //     type: 'tl:updateCounters',
  //     data: {
  //       agentId,
  //       delta: { [field]: delta }
  //     }
  //   });

  //   // Also update via REST API as backup
  //   updateMutation.mutate({
  //     agentId,
  //     delta: { [field]: delta }
  //   });
  // };

  const [isUpdating, setIsUpdating] = useState(false);

  // Target editing state
  const [isTargetDialogOpen, setIsTargetDialogOpen] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [editingTarget, setEditingTarget] = useState<number | string>(0);

  const setTargetMutation = useMutation({
    mutationFn: async ({ agentId, activationTarget }: { agentId: string; activationTarget: number }) => {
      const res = await apiRequest('PATCH', `/api/tl/agents/${agentId}/target`, { activationTarget });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tl/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/leaderboard'] });
      setIsTargetDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    }
  });

  const openTargetDialog = (agentId: string, currentTarget: number) => {
    setEditingAgentId(agentId);
    setEditingTarget(currentTarget);
    setIsTargetDialogOpen(true);
  };

  const saveTarget = async () => {
    if (!editingAgentId) return;
    await setTargetMutation.mutateAsync({ agentId: editingAgentId, activationTarget: Number(editingTarget) });
  };

  const handleIncrement = async (agentId: string, field: 'submissions' | 'activations', delta: number) => {
    if (isUpdating) return;
    setIsUpdating(true);

    // sendWithAuth({
    //   type: 'tl:updateCounters',
    //   data: { agentId, delta: { [field]: delta } }
    // });

    await updateMutation.mutateAsync({ agentId, delta: { [field]: delta } });

    setTimeout(() => setIsUpdating(false), 300); // 300ms debounce
  };


  const calculateActivationPercent = (agent: Agent) => {
    return agent.activationTarget > 0
      ? Math.round((agent.activations / agent.activationTarget) * 100)
      : 0;
  };

  // onCreateAgent removed

  const onDeleteAgent = (agentId: string, agentName: string) => {
    if (window.confirm(`Are you sure you want to delete ${agentName}? This action cannot be undone.`)) {
      deleteAgentMutation.mutate(agentId);
    }
  };

  const getTeamStats = () => {
    const totalActivations = agents.reduce((sum, agent) => sum + agent.activations, 0);
    const totalSubmissions = agents.reduce((sum, agent) => sum + agent.submissions, 0);
    const avgRate = agents.length > 0
      ? Math.round(agents.reduce((sum, agent) => sum + calculateActivationPercent(agent), 0) / agents.length)
      : 0;

    return { totalActivations, totalSubmissions, avgRate };
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to access the TL Dashboard</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Dashboard</h1>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const teamStats = getTeamStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Target edit dialog placed inside returned JSX so it renders properly */}
      <Dialog open={isTargetDialogOpen} onOpenChange={setIsTargetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Agent Target</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <Input type="number" min={1} value={editingTarget as any} onChange={(e) => setEditingTarget(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsTargetDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveTarget} disabled={setTargetMutation.isPending}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="text-2xl font-bold h-12 w-[300px]"
                />
                <Button
                  onClick={() => updateTeamMutation.mutate({ name: newName })}
                  disabled={updateTeamMutation.isPending}
                >
                  Save
                </Button>
                <Button variant="ghost" onClick={() => setIsEditingName(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold text-foreground">
                  {team?.name || 'Team Leader Dashboard'}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setIsEditingName(true)}>
                  <Edit className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </Button>
              </div>
            )}
            <p className="text-muted-foreground mt-2">Manage your team's performance metrics</p>
          </div>
        </div>

        {/* Team Info Card */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
          <div className="flex items-center space-x-4">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face'}
              alt="Team leader photo"
              className="w-16 h-16 rounded-full object-cover"
              data-testid="tl-photo"
            />
            <div>
              <h3 className="text-xl font-bold text-foreground" data-testid="tl-name">
                {user.name}
              </h3>
              <p className="text-muted-foreground">Team Leader</p>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <span className="text-green-600 font-semibold" data-testid="team-total-activations">
                  {teamStats.totalActivations} Total Activations
                </span>
                <span className="text-blue-600 font-semibold" data-testid="team-total-submissions">
                  {teamStats.totalSubmissions} Total Submissions
                </span>
                <span className="text-purple-600 font-semibold" data-testid="team-avg-rate">
                  {teamStats.avgRate}% Avg Rate
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Settings (Music) */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              Team Settings
            </CardTitle>
            <CardDescription>Customize celebration music used when your agents score.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-md">
              <div className="flex flex-col space-y-2">
                <label htmlFor="music-upload" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Celebration Audio
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="music-upload"
                    type="file"
                    accept="audio/*"
                    onChange={handleMusicUpload}
                    disabled={isUploadingMusic}
                    className="cursor-pointer file:cursor-pointer"
                  />
                  {isUploadingMusic && <span className="text-xs text-muted-foreground animate-pulse">Uploading...</span>}
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  Upload an MP3 or WAV file. This music will play on the leaderboard for your team's celebrations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Management Section Header - No Add Button */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Agent Management
                </CardTitle>
                <CardDescription>
                  Manage agents on your team
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading agents...</p>
              </div>
            ) : agents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      <img
                        src={agent.photoUrl}
                        alt={`${agent.name} photo`}
                        className="w-12 h-12 rounded-full object-cover"
                        data-testid={`agent-photo-${agent.id}`}
                      />
                      <div>
                        <h4 className="font-semibold text-foreground" data-testid={`agent-name-${agent.id}`}>
                          {agent.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Target: <span data-testid={`agent-target-${agent.id}`}>{agent.activationTarget}</span>
                          <Button size="sm" variant="ghost" className="ml-2" onClick={() => openTargetDialog(agent.id, agent.activationTarget)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                      <div className="text-center">
                        <div className="font-semibold text-blue-600" data-testid={`agent-submissions-${agent.id}`}>
                          {agent.submissions}
                        </div>
                        <div className="text-muted-foreground">Submissions</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600" data-testid={`agent-activations-${agent.id}`}>
                          {agent.activations}
                        </div>
                        <div className="text-muted-foreground">Activations</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600" data-testid={`agent-activation-percent-${agent.id}`}>
                          {calculateActivationPercent(agent)}%
                        </div>
                        <div className="text-muted-foreground">Rate</div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Link href={`/performance/${agent.id}`}>
                        <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50" data-testid={`button-view-agent-${agent.id}`}>
                          View
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteAgent(agent.id, agent.name)}
                        disabled={deleteAgentMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-agent-${agent.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Agents Found</h3>
                <p className="text-muted-foreground mb-4">Start by creating your first agent to track their performance</p>
                <Button variant="outline" disabled>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Contact Admin to Add Agents
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agents Performance Management Table */}
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Agent Performance Management</h3>
            <p className="text-sm text-muted-foreground">Update agent metrics with +/- buttons</p>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Loading agents...</p>
            </div>
          ) : agents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Submissions
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Activations
                    </th>
                    {/* <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Points
                    </th> */}
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={agent.photoUrl}
                            alt={`${agent.name} photo`}
                            className="w-12 h-12 rounded-full object-cover mr-4"
                            data-testid={`agent-photo-${agent.id}`}
                          />
                          <div>
                            <Link href={`/performance/${agent.id}`} className="text-sm font-medium text-foreground hover:underline" data-testid={`agent-name-${agent.id}`}>
                              {agent.name}
                            </Link>
                            <div className="text-sm text-muted-foreground">
                              Target: <span data-testid={`agent-target-${agent.id}`}>{agent.activationTarget}</span>
                              <Button size="sm" variant="ghost" className="ml-2" onClick={() => openTargetDialog(agent.id, agent.activationTarget)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIncrement(agent.id, 'submissions', -1)}
                            disabled={updateMutation.isPending}
                            className="w-8 h-8 p-0 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                            data-testid={`decrement-submissions-${agent.id}`}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-lg font-semibold text-foreground min-w-[3rem]" data-testid={`agent-submissions-${agent.id}`}>
                            {agent.submissions}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIncrement(agent.id, 'submissions', 1)}
                            disabled={updateMutation.isPending}
                            className="w-8 h-8 p-0 bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                            data-testid={`increment-submissions-${agent.id}`}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIncrement(agent.id, 'activations', -1)}
                            disabled={updateMutation.isPending}
                            className="w-8 h-8 p-0 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                            data-testid={`decrement-activations-${agent.id}`}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-lg font-semibold text-foreground min-w-[3rem]" data-testid={`agent-activations-${agent.id}`}>
                            {agent.activations}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIncrement(agent.id, 'activations', 1)}
                            disabled={updateMutation.isPending}
                            className="w-8 h-8 p-0 bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                            data-testid={`increment-activations-${agent.id}`}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIncrement(agent.id, 'points', -1)}
                            disabled={updateMutation.isPending}
                            className="w-8 h-8 p-0 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                            data-testid={`decrement-points-${agent.id}`}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-lg font-semibold text-foreground min-w-[3rem]" data-testid={`agent-points-${agent.id}`}>
                            {agent.points.toLocaleString()}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleIncrement(agent.id, 'points', 1)}
                            disabled={updateMutation.isPending}
                            className="w-8 h-8 p-0 bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                            data-testid={`increment-points-${agent.id}`}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <span className="text-lg font-bold text-green-600" data-testid={`agent-activation-percent-${agent.id}`}>
                            {calculateActivationPercent(agent)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">No Agents Found</h3>
              <p className="text-muted-foreground">Contact your administrator to add agents to your team</p>
            </div>
          )}
        </div>
        {/* Employee Requests Section */}
        <div className="mt-8 bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Employee Requests</h3>
            <p className="text-sm text-muted-foreground">Manage leave and attendance requests</p>
          </div>

          <div className="p-6">
            {isLoadingLeaves ? (
              <div className="text-center py-4">Loading requests...</div>
            ) : leaveRequests.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No pending requests.</div>
            ) : (
              <div className="space-y-4">
                {leaveRequests.map((req: any) => (
                  <div key={req.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg bg-card/50 gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{req.user?.name || 'Unknown User'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${req.status === 'approved' ? 'text-green-600 border-green-600' :
                            req.status === 'rejected' ? 'text-red-600 border-red-600' :
                              req.status === 'pending_admin' ? 'text-blue-600 border-blue-600' :
                                'text-yellow-600 border-yellow-600'
                          }`}>
                          {req.status === 'pending_tl' ? 'Pending Approval' :
                            req.status === 'pending_admin' ? 'Pending Admin' :
                              req.status}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase bg-secondary px-2 py-0.5 rounded">
                          {req.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(req.startDate).toLocaleString()} - {new Date(req.endDate).toLocaleString()}
                      </div>
                      <div className="text-sm mt-1">
                        Reason: {req.reason}
                      </div>
                    </div>

                    {(req.status === 'pending_tl' || req.status === 'pending') && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'pending_admin' })}
                          disabled={updateRequestMutation.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" /> Forward to Admin
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'rejected' })}
                          disabled={updateRequestMutation.isPending}
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}
