import { create } from "zustand";
import { Connection } from "@/types/connection";

type State = {
  activeConnections: Connection[];
  setActiveConnections: (conns: Connection[]) => void;
  removeActiveConnections: (id: number) => void;
  resetActiveConnections: () => void;
};

export const useActiveConnections = create<State>((set) => ({
  activeConnections: [],
  setActiveConnections: (connections) =>
    set({ activeConnections: connections }),
  removeActiveConnections: (id) =>
    set((state) => ({
      activeConnections: state.activeConnections.filter(
        (conn) => conn.id !== id
      ),
    })),
  resetActiveConnections: () => set({ activeConnections: [] }),
}));
