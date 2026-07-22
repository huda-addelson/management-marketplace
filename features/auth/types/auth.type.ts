import type { User } from "@supabase/supabase-js";
import type { z } from "zod";

import type { loginSchema } from "../schemas/auth.schema";

export type LoginInput = z.infer<typeof loginSchema>;

export type AuthResult = {
  user: User;
};

export type CurrentUser = {
  user: User;
};
