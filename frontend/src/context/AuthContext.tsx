import React, { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/utils/firebase";
import { AuthContext, AuthContextType } from "./AuthContextDef";
import { login, getUser } from "@/services/auth";
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const existingToken = localStorage.getItem("token");
        if (existingToken) {
          try {
            const response = await getUser();
            setUser(response.data.user);
          } catch (error) {
            const firebaseToken = await firebaseUser.getIdToken();
            try {
              const loginResponse = await login(firebaseToken);
              const backendToken = loginResponse.data.data?.token;
              if (backendToken) {
                localStorage.setItem("token", backendToken);
                const userResponse = await getUser();
                setUser(userResponse.data.user);
              } else {
                setUser(null);
                localStorage.removeItem("token");
              }
            } catch (error) {
              setUser(null);
              localStorage.removeItem("token");
            }
          }
        } else {
          // No token, need to authenticate with backend
          const firebaseToken = await firebaseUser.getIdToken();
          try {
            const loginResponse = await login(firebaseToken);
            const backendToken = loginResponse.data.data?.token;
            if (backendToken) {
              localStorage.setItem("token", backendToken);
              const userResponse = await getUser();
              setUser(userResponse.data.user);
            } else {
              setUser(null);
            }
          } catch {
            setUser(null);
          }
        }
      } else {
        setUser(null);
        localStorage.removeItem("token");
      }
      setLoading(false);
    });
    return () => fetchUser();
  }, []);

  const signInWithGoogle = async () => {
    await signOut(auth);
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();
    console.log("Google token:", token);
    const response = await login(token);
    console.log("Login response:", response.data);
    const backendToken = response.data.data?.token;
    if (backendToken) {
      localStorage.setItem("token", backendToken);
      const userResponse = await getUser();
      console.log("User data:", userResponse.data);
      setUser(userResponse.data.user);
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signOutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
