import { useMutation, useQueryClient } from '@tanstack/react-query';
import client, { endpoints } from '../../api/client';
import { setAuthToken, clearAuthToken } from '@/lib/storage.service';
import type { CreateUserDto, ApiResponse, User, ChangePasswordDto } from '../../api/types';
import { useDispatch } from 'react-redux';
import { setUser, clearUser } from '../../../store/slices/authSlice';

export const useLogin = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await client.post<ApiResponse<User> & { token?: string }>(endpoints.auth.login, data);
      if (response.data.token) {
        setAuthToken(response.data.token);
      }
      return response.data.data;
    },
    onSuccess: (user) => {
      dispatch(setUser(user));
      queryClient.invalidateQueries();
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (data: CreateUserDto) => {
      const response = await client.post<ApiResponse<User> & { token?: string }>(endpoints.auth.register, data);
      if (response.data.token) {
        setAuthToken(response.data.token);
      }
      return response.data.data;
    },
    onSuccess: (user) => {
      dispatch(setUser(user));
      queryClient.invalidateQueries();
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async () => {
      await client.post(endpoints.auth.logout);
    },
    onSuccess: () => {
      clearAuthToken();
      dispatch(clearUser());
      queryClient.clear();
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: ChangePasswordDto) => {
      const response = await client.put<ApiResponse<null>>(endpoints.auth.changePassword, data);
      return response.data;
    },
  });
};

