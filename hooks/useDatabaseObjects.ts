import { useActiveConnections } from "@/hooks/useActiveConnections";
import { DatabaseObjects } from "@/types/database-objects";
import { useEffect, useState } from "react";

type ObjectsState = {
  [connectionId: number]: DatabaseObjects | null;
};

type ErrorState = {
  [connectionId: number]: string | null;
};

export function useDatabaseObjects() {
  const { activeConnections } = useActiveConnections();

  const [objects, setObjects] = useState<ObjectsState>({});
  const [loadingObjects, setLoading] = useState(Boolean);
  const [errorObjects, setError] = useState<ErrorState>({});

  useEffect(() => {
    const fetchAllObjects = async () => {
      setLoading(true);
      setError({});
      const allObjects: ObjectsState = {};

      for (const conn of activeConnections) {
        setError((prev) => ({ ...prev, [conn.id]: null }));

        try {
          const res = await fetch("/api/objects", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ connections: [conn] }),
          });

          const json = await res.json();

          if (!json.success) throw new Error(json.error);

          Object.assign(allObjects, json.data);
        } catch (err: unknown) {
          const errorMsg =
            err instanceof Error ? err.message : "Erro desconhecido";
          setError((prev) => ({ ...prev, [conn.id]: errorMsg }));
        }
      }

      setObjects(allObjects);
      setLoading(false);
    };

    if (Array.isArray(activeConnections) && activeConnections.length > 0) {
      fetchAllObjects();
    } else {
      setObjects({});
      setError({});
      setLoading(false);
    }
  }, [activeConnections]);

  const resetObjects = () => {
    setObjects({});
    setError({});
  };

  return {
    objects,
    loadingObjects,
    errorObjects,
    resetObjects,
  };
}
