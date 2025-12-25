import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Radio, XCircle, Save, Mic, Square, Check, X, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // Ensure useQueryClient is imported
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';



export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Leave Management Logic
  const { data: leaveRequests = [], isLoading: isLoadingLeaves } = useQuery<any[]>({
    queryKey: ['/api/admin/leaves'],
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

  const [notificationType, setNotificationType] = useState<'text' | 'image' | 'video' | 'audio'>('text');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [duration, setDuration] = useState(15);
  const [defaultPopupDuration, setDefaultPopupDuration] = useState(5000);
  const [defaultNotificationDuration, setDefaultNotificationDuration] = useState(15000);

  const [globalSoundEnabled, setGlobalSoundEnabled] = useState(true);
  const [notificationSoundUrl, setNotificationSoundUrl] = useState('');

  // Fetch Settings
  const { data: systemSettings } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/settings');
      const data = await res.json();
      if (data.notificationSoundUrl) setNotificationSoundUrl(data.notificationSoundUrl);
      if (data.featuredTeamIds) setFeaturedTeamIds(data.featuredTeamIds);
      return data;
    },
    enabled: !!user
  });

  // Fetch Teams for selecting featured teams
  const { data: teamsList = [] } = useQuery<any[]>({
    queryKey: ['/api/teams/list'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/teams/list');
      return res.json();
    },
    enabled: !!user
  });

  // Fetch full admin teams for management
  const { data: adminTeams = [], isLoading: isLoadingAdminTeams } = useQuery<any[]>({
    queryKey: ['/api/admin/teams'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/teams');
      return res.json();
    },
    enabled: !!user
  });

  const [featuredTeamIds, setFeaturedTeamIds] = useState<string[]>([]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PATCH', '/api/admin/settings', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Settings Saved', description: 'System settings have been updated.' });
      // Refresh settings cache
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (e: Error) => {
      toast({ title: 'Failed to Save', description: e.message, variant: 'destructive' });
    }
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

  // Create TL Mutation
  const createTLMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/admin/create-tl', data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Success', description: `Team Leader ${data.user.name} created.` });
      // Reset form if possible, but basic alert is fine for now
    },
    onError: (e: Error) => {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    }
  });

  const [newTLName, setNewTLName] = useState('');
  const [newTLEmail, setNewTLEmail] = useState('');
  const [newTLPassword, setNewTLPassword] = useState('');
  const [newTLTeam, setNewTLTeam] = useState('');
  const [newTLPhotoUrl, setNewTLPhotoUrl] = useState('');

  const handleCreateTL = (e: React.FormEvent) => {
    e.preventDefault();
    createTLMutation.mutate({
      name: newTLName,
      email: newTLEmail,
      password: newTLPassword,
      teamName: newTLTeam,
      avatarUrl: newTLPhotoUrl || undefined
    });
    // Clear form
    setNewTLName('');
    setNewTLEmail('');
    setNewTLPassword('');
    setNewTLTeam('');
  };

  // 🔴 Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // Mutation for file uploads
  const uploadFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Use standard fetch here since apiRequest helper might not handle FormData correctly if it expects JSON
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setMediaUrl(data.url);
      setNotificationType(determineMediaType(data.mimetype));
      toast({
        title: 'Upload Successful',
        description: 'File has been uploaded and attached.',
      });
      setIsUploading(false);
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: 'Upload Failed',
        description: 'Could not upload the file.',
        variant: 'destructive',
      });
      setIsUploading(false);
    }
  });

  const determineMediaType = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'text';
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    uploadFileMutation.mutate(formData);
  };

  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleStartRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: 'Recording not supported',
          description: 'Your browser does not support audio recording.',
          variant: 'destructive',
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Upload the recorded audio
        setIsUploading(true);
        const formData = new FormData();
        // Append with a filename so multer can give it an extension
        formData.append('file', audioBlob, 'recording.webm');

        try {
          const data = await uploadFileMutation.mutateAsync(formData);
          setRecordedAudioUrl(data.url); // Use the server URL for playback too
          // setMediaUrl is set in mutation onSuccess
        } catch (e) {
          console.error("Failed to upload recording", e);
        }

        // Stop all tracks (mic)
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: 'Recording started',
        description: 'Speak now. Click the button again to stop.',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Failed to start recording',
        description: error?.message || 'Microphone access was denied.',
        variant: 'destructive',
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // toast is handled in mutation
    }
  };

  const handleClearRecording = () => {
    setRecordedAudioUrl(null);
    setMediaUrl('');
    // Optional: reset type back to text
    // setNotificationType('text');
  };

  const pushNotificationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/admin/notifications', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Notification Sent',
        description: 'Notification has been pushed to all clients',
      });
      // Clear form
      setTitle('');
      setMessage('');
      setMediaUrl('');
      setRecordedAudioUrl(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Send Notification',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const clearNotificationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', '/api/admin/notifications/clear');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Notifications Cleared',
        description: 'All active notifications have been cleared',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Clear Notifications',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handlePushNotification = () => {
    if (!message && !mediaUrl) {
      toast({
        title: 'Invalid Input',
        description: 'Please provide either a message or media (recorded or URL)',
        variant: 'destructive',
      });
      return;
    }

    pushNotificationMutation.mutate({
      type: notificationType,
      title: title || undefined,
      message: message || undefined,
      mediaUrl: mediaUrl || undefined,
      duration: duration * 1000, // Convert to milliseconds
    });
  };

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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-2">Manage notifications and system settings</p>
        </div>

        {/* Notification Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Push Takeover Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notification-type">Notification Type</Label>
              <Select
                value={notificationType}
                onValueChange={(value: any) => setNotificationType(value)}
              >
                <SelectTrigger data-testid="notification-type-select">
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Message</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="Notification title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="notification-title-input"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="300"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 15)}
                  data-testid="notification-duration-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message here..."
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                data-testid="notification-message-textarea"
              />
            </div>

            {/* Manual media URL or File Upload */}
            <div className="space-y-4 border p-4 rounded-md">
              <Label className="text-base font-semibold">Media Content</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option 1: URL Input */}
                <div>
                  <Label htmlFor="media-url">Option 1: External URL</Label>
                  <Input
                    id="media-url"
                    type="text"
                    placeholder="External URL or /uploads/filename.ext"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    data-testid="notification-media-url-input"
                    className="mt-1.5"
                  />
                </div>

                {/* Option 2: File Upload */}
                <div>
                  <Label htmlFor="file-upload">Option 2: Upload File</Label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Input
                      id="file-upload"
                      type="file"
                      accept="image/*,video/*,audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      disabled={isUploading}
                      className="cursor-pointer"
                    />
                    {isUploading && <div className="text-xs animate-pulse text-blue-600">Uploading...</div>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports images, videos, and audio files.
                  </p>
                </div>
              </div>

              {/* Preview of selected/uploaded media */}
              {mediaUrl && (
                <div className="mt-2 p-2 bg-muted/50 rounded flex items-center justify-between">
                  <div className="text-sm truncate max-w-[80%]">
                    <span className="font-semibold mr-2">Selected Media:</span>
                    <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {mediaUrl}
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setMediaUrl('');
                      setRecordedAudioUrl(null);
                    }}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* 🎙 Recording controls */}
            <div className="space-y-2 border p-4 rounded-md">
              <Label className="text-base font-semibold">Record Voice Message</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={isUploading}
                  variant={isRecording ? 'destructive' : 'default'}
                  className={`flex items-center gap-2 ${isRecording ? 'border-red-500 text-red-500 animate-pulse' : ''}`}
                >
                  <Mic className="w-4 h-4" />
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>

                {isRecording && (
                  <span className="text-xs text-red-500 font-mono animate-pulse">
                    Recording in progress... Click "Stop Recording" to finish.
                  </span>
                )}
              </div>

              {recordedAudioUrl && (
                <div className="mt-2">
                  <audio
                    controls
                    src={recordedAudioUrl}
                    className="h-10 w-full max-w-md"
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Recorded audio will be automatically uploaded (unlimited duration).
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handlePushNotification}
                disabled={pushNotificationMutation.isPending || isUploading}
                data-testid="push-notification-button"
                className="w-full md:w-auto"
              >
                <Radio className="w-4 h-4 mr-2" />
                {pushNotificationMutation.isPending ? 'Pushing...' : 'Push Notification'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => clearNotificationMutation.mutate()}
                disabled={clearNotificationMutation.isPending}
                data-testid="clear-notification-button"
                className="w-full md:w-auto"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {clearNotificationMutation.isPending ? 'Clearing...' : 'Clear Active'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Team Leader Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Create New Team Leader
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTL} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Team Leader Name</Label>
                <Input
                  value={newTLName}
                  onChange={(e) => setNewTLName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newTLEmail}
                  onChange={(e) => setNewTLEmail(e.target.value)}
                  placeholder="e.g. jane@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={newTLPassword}
                  onChange={(e) => setNewTLPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  value={newTLTeam}
                  onChange={(e) => setNewTLTeam(e.target.value)}
                  placeholder="e.g. Sales Hawks"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Profile Photo (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('file', file);
                        uploadFileMutation.mutate(formData, {
                          onSuccess: (data) => setNewTLPhotoUrl(data.url)
                        });
                      }
                    }}
                    disabled={uploadFileMutation.isPending}
                  />
                  {newTLPhotoUrl && (
                    <img
                      src={newTLPhotoUrl}
                      alt="Preview"
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                  )}
                </div>
              </div>
              <Button type="submit" disabled={createTLMutation.isPending}>
                {createTLMutation.isPending ? 'Creating...' : 'Create Team Leader'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Small card linking to Team Management page */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Team & Leave Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <div className="font-medium">Manage teams and leave requests</div>
                <div className="text-xs text-muted-foreground">Open the dedicated management page to view, delete teams, and manage leave requests.</div>
              </div>
              <div>
                <a href="/admin/teams">
                  <Button>Open Team Management</Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="popup-duration">Default Popup Duration (ms)</Label>
                <Input
                  id="popup-duration"
                  type="number"
                  min="1000"
                  max="30000"
                  step="1000"
                  value={defaultPopupDuration}
                  onChange={(e) =>
                    setDefaultPopupDuration(parseInt(e.target.value) || 5000)
                  }
                  data-testid="popup-duration-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Duration for celebration popups
                </p>
              </div>
              <div>
                <Label htmlFor="notification-duration">
                  Default Notification Duration (ms)
                </Label>
                <Input
                  id="notification-duration"
                  type="number"
                  min="5000"
                  max="300000"
                  step="1000"
                  value={defaultNotificationDuration}
                  onChange={(e) =>
                    setDefaultNotificationDuration(
                      parseInt(e.target.value) || 15000
                    )
                  }
                  data-testid="notification-duration-setting-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Duration for takeover notifications
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label htmlFor="global-sound">Global Celebration Sound</Label>
                <p className="text-xs text-muted-foreground">
                  Enable/disable sound for all celebration popups
                </p>
              </div>
              <Switch
                id="global-sound"
                checked={globalSoundEnabled}
                onCheckedChange={setGlobalSoundEnabled}
                data-testid="global-sound-switch"
              />
            </div>

            {/* Notification Sound Setting */}
            <div className="p-4 bg-muted rounded-lg space-y-4">
              <div>
                <Label>Global Notification Sound (Takeover)</Label>
                <p className="text-xs text-muted-foreground">
                  Sound played when a global notification appears.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Input
                  type="text"
                  placeholder="Sound URL or /uploads/filename.mp3"
                  value={notificationSoundUrl}
                  onChange={(e) => setNotificationSoundUrl(e.target.value)}
                  className="flex-1"
                />
                <div className="relative">
                  <Input
                    type="file"
                    accept="audio/*"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const formData = new FormData();
                        formData.append('file', file);
                        uploadFileMutation.mutate(formData, {
                          onSuccess: (data) => setNotificationSoundUrl(data.url)
                        });
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" disabled={uploadFileMutation.isPending}>
                    {uploadFileMutation.isPending ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>

              {/* Featured Teams selection */}
              <div className="p-4 bg-muted rounded-lg">
                <Label className="font-semibold">Featured Teams</Label>
                <p className="text-xs text-muted-foreground">Select which teams should be visible on the leaderboard</p>
                <div className="mt-3 space-y-2 max-h-48 overflow-auto">
                  {teamsList.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.tlName}</div>
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          checked={featuredTeamIds.includes(t.id)}
                          onChange={(e) => {
                            if (e.target.checked) setFeaturedTeamIds([...featuredTeamIds, t.id]);
                            else setFeaturedTeamIds(featuredTeamIds.filter(id => id !== t.id));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3">
                  <Button onClick={() => updateSettingsMutation.mutate({
                    notificationSoundUrl,
                    defaultPopupDuration,
                    defaultNotificationDuration,
                    featuredTeamIds
                  })}>
                    <Save className="w-4 h-4 mr-2" /> Save Settings
                  </Button>
                </div>
              </div>

              {/* Manage Teams (Admin) */}
              <div className="p-4 bg-muted rounded-lg">
                <Label className="font-semibold">Manage Teams</Label>
                <p className="text-xs text-muted-foreground">View teams and remove teams if needed. Deleting a team will unassign any agents and TLs associated with it.</p>

                <div className="mt-3 space-y-3">
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
                </div>
              </div>

              {notificationSoundUrl && (
                <div className="flex items-center gap-2">
                  <audio src={notificationSoundUrl} controls className="h-8 w-full max-w-xs" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNotificationSoundUrl('')}
                    className="text-red-500 h-8 w-8 p-0"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              data-testid="save-settings-button"
              onClick={() => updateSettingsMutation.mutate({ notificationSoundUrl })}
              disabled={updateSettingsMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div >
  );
}
