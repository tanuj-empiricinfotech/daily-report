import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useLogin, useRegister } from '@/lib/query/hooks/useAuth';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/admin' : '/logs', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let user;
      if (isRegister) {
        user = await registerMutation.mutateAsync({
          email,
          password,
          name,
          role: 'member',
        });
      } else {
        user = await loginMutation.mutateAsync({ email, password });
      }

      // Redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/logs');
      }
    } catch (error) {
      // Error is already handled by the mutation and displayed via error state
      // No need to navigate on error
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;
  const error = loginMutation.error || registerMutation.error;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isRegister ? 'Register' : 'Login'}</CardTitle>
          <CardDescription>
            {isRegister ? 'Create a new account' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <IconEyeOff className="h-5 w-5" />
                  ) : (
                    <IconEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {error && <ErrorDisplay error={error} />}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm" /> : isRegister ? 'Register' : 'Login'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

