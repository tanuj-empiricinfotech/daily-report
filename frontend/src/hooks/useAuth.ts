import type { RootState } from '@/store/store';
import { useSelector } from 'react-redux';

export const useAuth = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'admin';

  return {
    user,
    isAuthenticated,
    isAdmin,
  };
};

