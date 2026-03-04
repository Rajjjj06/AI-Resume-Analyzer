import { createContext } from "react";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  photoURL?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
  firebaseId?: string;
}

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
