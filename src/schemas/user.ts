import { z } from 'zod';

export const UsernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .refine((val) => !val.startsWith('_') && !val.endsWith('_'), {
      message: 'Username cannot start or end with underscore',
    }),
});

export type UsernameInput = z.infer<typeof UsernameSchema>;

