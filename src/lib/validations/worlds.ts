import { z } from "zod";

// IMPORTANT: Zod v4 uses { error: '...' } not { message: '...' }

export const CreateWorldSchema = z.object({
  name: z
    .string()
    .min(1, { error: "World name is required." })
    .max(100, { error: "Name must be 100 characters or fewer." }),
  description: z
    .string()
    .max(500, { error: "Description must be 500 characters or fewer." })
    .optional(),
});

export const UpdateWorldSchema = z.object({
  name: z
    .string()
    .min(1, { error: "World name is required." })
    .max(100, { error: "Name must be 100 characters or fewer." }),
  description: z
    .string()
    .max(500, { error: "Description must be 500 characters or fewer." })
    .optional(),
});

export type CreateWorldInput = z.infer<typeof CreateWorldSchema>;
export type UpdateWorldInput = z.infer<typeof UpdateWorldSchema>;

export type WorldActionState = {
  errors?: {
    name?: string[];
    description?: string[];
  };
  message?: string;
};
