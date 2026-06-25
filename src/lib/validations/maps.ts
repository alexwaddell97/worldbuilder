import { z } from "zod";

// IMPORTANT: Zod v4 uses { error: '...' } not { message: '...' }

export const CreateMapSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Map name is required." })
    .max(100, { error: "Name must be 100 characters or fewer." }),
  description: z
    .string()
    .max(500, { error: "Description must be 500 characters or fewer." })
    .optional(),
  imageUrl: z
    .string()
    .url({ error: "Must be a valid URL." })
    .optional()
    .or(z.literal("")),
  isRootMap: z.boolean().default(true),
});

export const UpdateMapSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Map name is required." })
    .max(100, { error: "Name must be 100 characters or fewer." }),
  description: z
    .string()
    .max(500, { error: "Description must be 500 characters or fewer." })
    .optional(),
  imageUrl: z
    .string()
    .url({ error: "Must be a valid URL." })
    .optional()
    .or(z.literal("")),
  isRootMap: z.boolean().default(true),
});

export const CreateMapPinSchema = z.object({
  mapId: z.string().uuid({ error: "Invalid map ID." }),
  entityId: z.string().uuid({ error: "Invalid entity ID." }).optional().nullable(),
  linkedMapId: z.string().uuid({ error: "Invalid linked map ID." }).optional().nullable(),
  label: z.string().max(80, { error: "Label must be 80 characters or fewer." }).optional().nullable(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

export const UpdateMapPinSchema = z.object({
  entityId: z.string().uuid().optional().nullable(),
  linkedMapId: z.string().uuid().optional().nullable(),
  label: z.string().max(80).optional().nullable(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

export type CreateMapInput = z.infer<typeof CreateMapSchema>;
export type UpdateMapInput = z.infer<typeof UpdateMapSchema>;
export type CreateMapPinInput = z.infer<typeof CreateMapPinSchema>;
export type UpdateMapPinInput = z.infer<typeof UpdateMapPinSchema>;

export type MapActionState = {
  errors?: { name?: string[]; description?: string[] };
  message?: string;
};
