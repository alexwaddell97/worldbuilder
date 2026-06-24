import { z } from "zod";

export const CreateEntityTypeSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Entity type name is required." })
    .max(50, { error: "Name must be 50 characters or fewer." }),
  icon: z
    .string()
    .max(50, { error: "Icon name too long." })
    .optional(),
});

export type CreateEntityTypeInput = z.infer<typeof CreateEntityTypeSchema>;

export type EntityTypeActionState = {
  errors?: {
    name?: string[];
    icon?: string[];
  };
  message?: string;
};
