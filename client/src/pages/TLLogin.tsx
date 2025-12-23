import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { LogIn, Eye, EyeOff, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function TLLogin() {
  const [, setLocation] = useLocation();
  const { login } = useAuthStore();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.user.role !== 'tl') {
        toast({
          title: 'Access Denied',
          description: 'This login page is for Team Leaders only',
          variant: 'destructive',
        });
        return;
      }

      login(data.user, data.token);
      toast({
        title: 'Welcome Back!',
        description: `Logged in as ${data.user.name}`,
      });
      setLocation('/tl');
    },
    onError: (error: Error) => {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      return;
    }

    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <UserCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Team Leader Login</h1>
          <p className="text-muted-foreground">Access your team dashboard</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </CardTitle>
            <CardDescription>
              Enter your credentials to manage your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loginMutation.isPending}
                  data-testid="tl-login-email-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                    className="pr-10"
                    data-testid="tl-login-password-input"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loginMutation.isPending}
                    data-testid="tl-password-toggle-button"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="tl-login-submit-button"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Registration Link */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Don't have a Team Leader account?
          </p>
          <Button
            variant="outline"
            onClick={() => setLocation('/tl-register')}
            data-testid="tl-register-link"
            className="w-full"
          >
            Create New Account
          </Button>
        </div>

        {/* Other Options */}
        <div className="text-center border-t pt-4">
          <p className="text-sm text-muted-foreground mb-2">
            Not a Team Leader?
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setLocation('/login')}
              data-testid="admin-login-link"
              className="flex-1"
            >
              Admin Login
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              data-testid="public-leaderboard-link"
              className="flex-1"
            >
              View Leaderboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
