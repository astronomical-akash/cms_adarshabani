
import { User, UserRole } from '../types';

const USER_KEY = 'adarshabani_user_v1';

export const login = (name: string, role: UserRole): User => {
  const user: User = {
    id: crypto.randomUUID(),
    name,
    role
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};

export const logout = (): void => {
  localStorage.removeItem(USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  return JSON.parse(data);
};
