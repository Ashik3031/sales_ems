import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { UserPlus, Eye, EyeOff, Users, Briefcase, Phone, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Team {
    id: string;
    name: string;
    tlName?: string;
}

export default function EmployeeRegister() {
    const [, setLocation] = useLocation();
    const { login } = useAuthStore();
    const { toast } = useToast();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [jobRole, setJobRole] = useState('');
    const [teamId, setTeamId] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>('');

    // Fetch teams for selection
    const { data: teams = [], isLoading: isLoadingTeams } = useQuery<Team[]>({
        queryKey: ['/api/teams/list'],
        enabled: true
    });

    const registerMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await apiRequest('POST', '/api/auth/register/employee', data);
            return response.json();
        },
        onSuccess: (data) => {
            login(data.user, data.token);
            toast({
                title: 'Registration Successful!',
                description: `Welcome ${data.user.name}!`,
            });
            setLocation('/employee-dashboard');
        },
        onError: (error: Error) => {
            toast({
                title: 'Registration Failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email || !password || !teamId || !contactNumber || !jobRole) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all fields',
                variant: 'destructive',
            });
            return;
        }

        if (password.length < 6) {
            toast({ title: 'Invalid Password', description: 'Password must be at least 6 characters', variant: 'destructive' });
            return;
        }

        try {
            let avatarUrl = '';
            if (photoFile) {
                avatarUrl = await uploadPhoto(photoFile);
            }

            registerMutation.mutate({
                name,
                email,
                password,
                teamId,
                contactNumber,
                jobRole,
                avatarUrl
            });
        } catch (error) {
            toast({
                title: 'Upload Failed',
                description: 'Failed to upload profile photo',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                            <Users className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">Employee Registration</h1>
                    <p className="text-muted-foreground">Join your team and track your progress</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <UserPlus className="w-5 h-5" />
                            <span>Create Account</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pr-10"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="photo">Profile Photo (Optional)</Label>
                                <div className="flex items-center gap-4">
                                    {photoPreview && (
                                        <div className="relative">
                                            <img src={photoPreview} className="w-20 h-20 rounded-full object-cover border-2 border-border" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPhotoFile(null);
                                                    setPhotoPreview('');
                                                }}
                                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <Input
                                            id="photo"
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
                                        <p className="text-xs text-muted-foreground mt-1">Upload a profile photo (JPG, PNG, max 50MB)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contact">Contact Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="contact" className="pl-8" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Job Role</Label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="role" className="pl-8" value={jobRole} onChange={(e) => setJobRole(e.target.value)} placeholder="e.g. Sales Executive" required />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="team">Select Team / TL</Label>
                                <Select onValueChange={setTeamId} value={teamId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your team" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teams.length === 0 && !isLoadingTeams && <SelectItem value="demo">No teams found</SelectItem>}
                                        {teams.map(team => (
                                            <SelectItem key={team.id} value={team.id}>
                                                {team.name} {team.tlName ? `- ${team.tlName}` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                                {registerMutation.isPending ? 'Creating...' : 'Register'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="text-center">
                    <Button variant="link" onClick={() => setLocation('/login')}>
                        Back to Login
                    </Button>
                </div>
            </div>
        </div>
    );
}
