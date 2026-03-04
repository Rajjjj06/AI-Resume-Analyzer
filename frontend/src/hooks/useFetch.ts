import { useState } from "react";
import { api } from "../services/api";

export const useFetch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function request<T>(url: string, method, data?: unknown): Promise<T> {
    setLoading(true);
    setError(null);
    try {
      const response = await api({
        method,
        url,
        data,
      });
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, request };
};
