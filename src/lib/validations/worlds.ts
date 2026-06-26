import { z } from "zod";
import { PRESET_IDS } from "@/lib/constants/entity-types";

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
  preset: z.enum(PRESET_IDS as [string, ...string[]]).default("blank"),
  imageUrl: z.string().url({ error: "Must be a valid URL." }).optional().or(z.literal("")),
  backgroundImageUrl: z.string().url({ error: "Must be a valid URL." }).optional().or(z.literal("")),
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
  imageUrl: z.string().url({ error: "Must be a valid URL." }).optional().or(z.literal("")),
  backgroundImageUrl: z.string().url({ error: "Must be a valid URL." }).optional().or(z.literal("")),
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
