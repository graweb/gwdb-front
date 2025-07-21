import { useActiveConnection } from "@/hooks/useActiveConnection";
import { DatabaseObjects } from "@/types/database-objects";
import { useEffect, useState } from "react";

export function useDatabaseObjects() {
  const { connection } = useActiveConnection();
  const [objects, setObjects] = useState<DatabaseObjects | null>(null);
  const [loadingObjects, setLoading] = useState(false);
  const [errorObjects, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchObjects() {
      if (!connection) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/objects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ connection }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setObjects(json.data);
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

    fetchObjects();
  }, [connection]);

  const resetObjects = () => {
    setObjects(null);
    setError(null);
  };

  return { objects, loadingObjects, errorObjects, resetObjects };
}
