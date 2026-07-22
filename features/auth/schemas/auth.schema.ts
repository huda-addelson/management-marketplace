import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Format email tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
});
