// src/hooks/useExecuteQuery.ts
import { useState } from "react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryResultRow = Record<string, any>;

interface UseExecuteQueryReturn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executeQuery: (query: string, connection: any) => Promise<void>;
  loadingQuery: boolean;
  errorQuery: string | null;
  resultQuery: QueryResultRow[];
  columnsQuery: string[];
}

export function useExecuteQuery(): UseExecuteQueryReturn {
  const [resultQuery, setResult] = useState<QueryResultRow[]>([]);
  const [columnsQuery, setColumns] = useState<string[]>([]);
  const [loadingQuery, setLoading] = useState(false);
  const [errorQuery, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executeQuery = async (query: string, connection: any) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        body: JSON.stringify({ query, connection }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (data.success) {
        const rows = Array.isArray(data.result[0])
          ? data.result[0]
          : data.result;

        setResult(rows);
        if (rows.length > 0) setColumns(Object.keys(rows[0]));
      } else {
        setError(data.error || "Erro ao executar a consulta.");
        toast.warning(data.error || "Erro ao executar a consulta.");
      }
    } catch (err) {
      setError("Erro inesperado.");
      toast.error("Erro inesperado ao executar a consulta " + err);
    } finally {
      setLoading(false);
    }
  };

  return {
    executeQuery,
    loadingQuery,
    errorQuery,
    resultQuery,
    columnsQuery,
  };
}
