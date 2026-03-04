import { api } from "./api";

export const login = (token: string) => {
  const response = api.post("/api/v1/auth/signin", { token });
  return response;
};

export const getUser = () => {
  const response = api.get("/api/v1/me");
  return response;
};
