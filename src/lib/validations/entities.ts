import { z } from "zod";

export const CreateEntitySchema = z.object({
  name: z
    .string()
    .min(1, { error: "Entity name is required." })
    .max(100, { error: "Name must be 100 characters or fewer." }),
  tags: z
    .string()
    .max(500, { error: "Tags string too long." })
    .optional(),
  imageUrl: z.string().url({ error: "Must be a valid URL." }).optional().or(z.literal("")),
  imagePosition: z.string().max(50).optional().or(z.literal("")),
});

export const UpdateEntitySchema = z.object({
  name: z
    .string()
    .min(1, { error: "Entity name is required." })
    .max(100, { error: "Name must be 100 characters or fewer." }),
  tags: z
    .string()
    .max(500, { error: "Tags string too long." })
    .optional(),
  imageUrl: z.string().url({ error: "Must be a valid URL." }).optional().or(z.literal("")),
  imagePosition: z.string().max(50).optional().or(z.literal("")),
});

export type CreateEntityInput = z.infer<typeof CreateEntitySchema>;
export type UpdateEntityInput = z.infer<typeof UpdateEntitySchema>;

export type EntityActionState = {
  errors?: {
    name?: string[];
    tags?: string[];
  };
  message?: string;
  slug?: string;
};
