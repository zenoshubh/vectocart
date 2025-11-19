export interface UserProfile {
  id: string;
  userId: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

