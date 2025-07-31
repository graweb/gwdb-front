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
    server?: string;
    port?: string;
    database_name?: string;
    username?: string;
    password?: string;
    file_path?: string;
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

  async function checkExistingDatabases(data: {
    connection_name: string;
    connection_type: string;
    server?: string;
    port?: string;
    database_name?: string;
    username?: string;
    password?: string;
    file_path?: string;
  }) {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/check_databases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Erro ao listar bancos de dados.");
      }

      const databases = await res.json();
      setSuccess(true);
      return databases;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro desconhecido");
      }
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function updateConnection(
    data: {
      connection_name: string;
      connection_type: string;
      server?: string;
      port?: string;
      database_name?: string;
      username?: string;
      password?: string;
      file_path?: string;
    },
    id: number
  ) {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/connections", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...data }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Erro ao atualizar a conexão.");
      }

      const updated = await res.json();
      setSuccess(true);

      return updated;
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

  async function removeConnection(data: Connection | null) {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/connections", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Erro ao remover a conexão.");
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

  const resetConnections = () => {
    setConnections([]);
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  return {
    connections,
    loadingConnection,
    errorConnection,
    success,
    createConnection,
    checkExistingDatabases,
    updateConnection,
    removeConnection,
    refetchConnections: fetchConnections,
    resetConnections,
  };
}
