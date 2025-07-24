import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Connection } from "@/types/connection";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryResultRow = Record<string, any>;

interface UsePaginatedQueryReturn {
  resultQuery: QueryResultRow[];
  columnsQuery: string[];
  totalQueryRows: number;
  loadingQuery: boolean;
  errorQuery: string | null;
  pageIndex: number;
  pageSize: number;
  setPageIndex: (index: number) => void;
  setPageSize: (size: number) => void;
  executeQuery: (
    query: string,
    connection: Connection,
    page?: number,
    pageSize?: number
  ) => Promise<void>;
  resetQueryResult: () => void;
}

export function usePaginatedQuery(): UsePaginatedQueryReturn {
  const [resultQuery, setResult] = useState<QueryResultRow[]>([]);
  const [columnsQuery, setColumns] = useState<string[]>([]);
  const [totalQueryRows, setTotal] = useState<number>(0);
  const [loadingQuery, setLoading] = useState(false);
  const [errorQuery, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  const executeQuery = async (
    query: string,
    connection: Connection,
    page = pageIndex,
    size = pageSize
  ) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          connection,
          page: page + 1,
          pageSize: size,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const rows = Array.isArray(data.result[0])
          ? data.result[0]
          : data.result;
        setResult(rows);
        if (rows.length > 0) setColumns(Object.keys(rows[0]));
        setTotal(data.total || 0);
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

  const resetQueryResult = useCallback(() => {
    setResult([]);
    setColumns([]);
    setTotal(0);
  }, []);

  return {
    resultQuery,
    columnsQuery,
    totalQueryRows,
    loadingQuery,
    errorQuery,
    pageIndex,
    pageSize,
    setPageIndex,
    setPageSize,
    executeQuery,
    resetQueryResult,
  };
}
