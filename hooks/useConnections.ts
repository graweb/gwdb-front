import { useEffect, useState } from "react";
import { Connection } from "@/types/connection";

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loadingConnection, setLoading] = useState(false);
  const [errorConnection, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchConnections = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/connections", {
        method: "GET",
      });

      if (!res.ok) throw new Error("Erro ao buscar conexões");

      const data = await res.json();
      setConnections(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  async function createConnection(data: {
    connection_name: string;
    connection_type: string;
    server: string;
    port: string;
    database_name: string;
    username: string;
    password: string;
  }) {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Erro ao criar conexão.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro desconhecido");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConnections();
  }, []);

  return {
    connections,
    loadingConnection,
    errorConnection,
    success,
    createConnection,
    refetchConnections: fetchConnections,
  };
}
