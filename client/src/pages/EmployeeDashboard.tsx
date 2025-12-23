import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, FileText, CheckCircle, XCircle, AlertCircle, Phone, Briefcase, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface LeaveRequest {
    id: string;
    type: 'leave' | 'late_coming' | 'early_going';
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending_tl' | 'pending_admin' | 'approved' | 'rejected';
    createdAt: string;
}

export default function EmployeeDashboard() {
    const { user, logout, setUser } = useAuthStore();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
    const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>('');

    // Form State
    const [type, setType] = useState('leave');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    const { data: leaves = [], isLoading } = useQuery<LeaveRequest[]>({
        queryKey: ['/api/leaves'],
    });

    const createRequestMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest('POST', '/api/leaves', data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/leaves'] });
            setIsRequestDialogOpen(false);
            resetForm();
            toast({ title: 'Request Submitted', description: 'Your request has been sent to your TL.' });
        },
        onError: (error: Error) => {
            toast({ title: 'Submission Failed', description: error.message, variant: 'destructive' });
        }
    });

    const updatePhotoMutation = useMutation({
        mutationFn: async (avatarUrl: string) => {
            const res = await apiRequest('PATCH', '/api/user/profile-photo', { avatarUrl });
            return res.json();
        },
        onSuccess: (data) => {
            setUser(data.user);
            setIsPhotoDialogOpen(false);
            setPhotoFile(null);
            setPhotoPreview('');
            toast({ title: 'Success', description: 'Profile photo updated successfully!' });
        },
        onError: (error: Error) => {
            toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
        }
    });

    const resetForm = () => {
        setType('leave');
        setStartDate('');
        setEndDate('');
        setReason('');
    };

    const uploadPhoto = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('photo', file);

        const response = await fetch('/api/upload/profile-photo', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload photo');
        }

        const data = await response.json();
        return data.photoUrl;
    };

    const handlePhotoUpdate = async () => {
        if (!photoFile) {
            toast({ title: 'No Photo', description: 'Please select a photo to upload', variant: 'destructive' });
            return;
        }

        try {
            const avatarUrl = await uploadPhoto(photoFile);
            updatePhotoMutation.mutate(avatarUrl);
        } catch (error) {
            toast({ title: 'Upload Failed', description: 'Failed to upload photo', variant: 'destructive' });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate || !reason) {
            toast({ title: 'Missing Info', description: 'Please fill all fields', variant: 'destructive' });
            return;
        }
        createRequestMutation.mutate({ type, startDate, endDate, reason });
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-green-500';
            case 'rejected': return 'text-red-500';
            case 'pending_admin': return 'text-blue-500';
            default: return 'text-yellow-500';
        }
    };

    const statusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'pending_admin': return <Clock className="w-4 h-4 text-blue-500" />;
            default: return <Clock className="w-4 h-4 text-yellow-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <img
                                src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                                className="w-16 h-16 rounded-full object-cover border-2 border-border"
                                alt="Profile"
                            />
                            <button
                                onClick={() => setIsPhotoDialogOpen(true)}
                                className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">{user?.name}</h1>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {user?.jobRole || 'Employee'}</span>
                                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {user?.contactNumber || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => logout()}>Logout</Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Photo Upload Dialog */}
                <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Update Profile Photo</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex flex-col items-center gap-4">
                                {photoPreview ? (
                                    <div className="relative">
                                        <img src={photoPreview} className="w-32 h-32 rounded-full object-cover border-2 border-border" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPhotoFile(null);
                                                setPhotoPreview('');
                                            }}
                                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                                        <Camera className="w-12 h-12 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="w-full">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setPhotoFile(file);
                                                setPhotoPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                        className="cursor-pointer"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">Upload a new profile photo (JPG, PNG, max 50MB)</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handlePhotoUpdate}
                                    disabled={!photoFile || updatePhotoMutation.isPending}
                                    className="flex-1"
                                >
                                    {updatePhotoMutation.isPending ? 'Uploading...' : 'Update Photo'}
                                </Button>
                                <Button variant="outline" onClick={() => setIsPhotoDialogOpen(false)}>Cancel</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Leave & Attendance Management</h2>
                    <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="w-4 h-4 mr-2" /> New Request</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Submit a Request</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Request Type</Label>
                                    <Select value={type} onValueChange={setType}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="leave">Leave</SelectItem>
                                            <SelectItem value="late_coming">Late Coming</SelectItem>
                                            <SelectItem value="early_going">Early Going</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Date/Time</Label>
                                        <Input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date/Time</Label>
                                        <Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Reason</Label>
                                    <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for request..." required />
                                </div>
                                <Button type="submit" className="w-full" disabled={createRequestMutation.isPending}>
                                    {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Requests History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="text-center py-4">Loading...</div>
                            ) : leaves.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground">No requests found.</div>
                            ) : (
                                <div className="space-y-4">
                                    {leaves.map((leave) => (
                                        <div key={leave.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1 ${statusColor(leave.status)}`}>
                                                    {statusIcon(leave.status)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold capitalize flex items-center gap-2">
                                                        {leave.type.replace('_', ' ')}
                                                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${statusColor(leave.status)} border-current`}>
                                                            {leave.status === 'pending_tl' ? 'Pending TL' :
                                                                leave.status === 'pending_admin' ? 'Pending Admin' :
                                                                    leave.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        {format(new Date(leave.startDate), 'PP p')} - {format(new Date(leave.endDate), 'PP p')}
                                                    </div>
                                                    <div className="text-sm mt-1">
                                                        Reason: {leave.reason}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Applied: {format(new Date(leave.createdAt), 'PP')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
