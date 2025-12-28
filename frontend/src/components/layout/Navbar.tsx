import { useLogout } from '@/lib/query/hooks/useAuth';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
  const { user, isAdmin } = useAuth();
  const logoutMutation = useLogout();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/login');
  };

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Daily Report</h1>
          {user && (
            <span className="text-sm text-muted-foreground">
              {user.name} ({isAdmin ? 'Admin' : 'Member'})
            </span>
          )}
        </div>
        {user && (
          <Button variant="ghost" onClick={handleLogout} disabled={logoutMutation.isPending}>
            Logout
          </Button>
        )}
      </div>
    </nav>
  );
}

