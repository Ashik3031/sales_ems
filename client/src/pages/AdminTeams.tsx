import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';

export default function AdminTeams() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: adminTeams = [], isLoading: isLoadingAdminTeams } = useQuery<any[]>({
    queryKey: ['/api/admin/teams'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/teams');
      return res.json();
    },
    enabled: !!user
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const res = await apiRequest('DELETE', `/api/admin/teams/${teamId}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || 'Failed to delete team');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Team Deleted', description: 'Team has been removed.' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teams/list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (e: Error) => {
      toast({ title: 'Delete Failed', description: e.message, variant: 'destructive' });
    }
  });

  // Leave requests
  const { data: leaveRequests = [], isLoading: isLoadingLeaves } = useQuery<any[]>({
    queryKey: ['/api/admin/leaves'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/leaves');
      return res.json();
    },
    enabled: !!user
  });

  const updateLeaveRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => {
      const res = await apiRequest('PATCH', `/api/admin/leaves/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/leaves'] });
      toast({ title: 'Request Updated', description: 'Request status updated successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    }
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-sm text-muted-foreground">View teams and remove teams if needed. Deleting a team will unassign any agents and TLs associated with it.</p>
        </div>

        <Card className="mb-8">
          <CardContent>
            {isLoadingAdminTeams ? (
              <div className="text-sm">Loading teams...</div>
            ) : adminTeams.length === 0 ? (
              <div className="text-sm text-muted-foreground">No teams found.</div>
            ) : (
              <div className="space-y-2">
                {adminTeams.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">TL: {t.tl?.name || 'Unassigned'}</div>
                      <div className="text-xs text-muted-foreground">Agents: {t.agents?.length || 0}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const confirmed = window.confirm(`Delete team "${t.name}"? This will unassign any agents and the TL.`);
                          if (!confirmed) return;
                          deleteTeamMutation.mutate(t.id);
                        }}
                        disabled={deleteTeamMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mb-6">
          <h2 className="text-2xl font-bold">Leave Request Management</h2>
          <p className="text-sm text-muted-foreground">Approve or reject leave requests from employees.</p>
        </div>

        <Card>
          <CardContent>
            {isLoadingLeaves ? (
              <div className="text-center py-4">Loading requests...</div>
            ) : leaveRequests.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No leave requests found.</div>
            ) : (
              <div className="space-y-4">
                {leaveRequests.map((req: any) => (
                  <div key={req.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg bg-card/50 gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{req.user?.name || 'Unknown User'}</span>
                        <span className="text-xs text-muted-foreground">({req.team?.name || 'No Team'})</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${req.status === 'approved' ? 'text-green-600 border-green-600' :
                          req.status === 'rejected' ? 'text-red-600 border-red-600' :
                            req.status === 'pending_admin' ? 'text-blue-600 border-blue-600' :
                              'text-yellow-600 border-yellow-600'
                          }`}>
                          {req.status === 'pending_tl' ? 'Pending TL' :
                            req.status === 'pending_admin' ? 'Pending Approval' :
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

                    {req.status === 'pending_admin' && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => updateLeaveRequestMutation.mutate({ id: req.id, status: 'approved' })}
                          disabled={updateLeaveRequestMutation.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => updateLeaveRequestMutation.mutate({ id: req.id, status: 'rejected' })}
                          disabled={updateLeaveRequestMutation.isPending}
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
