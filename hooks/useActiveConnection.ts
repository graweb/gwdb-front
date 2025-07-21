import { create } from "zustand";
import { Connection } from "@/types/connection";

type State = {
  connection: Connection | null;
  setConnection: (conn: Connection | null) => void;
  resetActiveConnection: () => void;
};

export const useActiveConnection = create<State>((set) => ({
  connection: null,
  setConnection: (connection) => set({ connection }),
  resetActiveConnection: () => set({ connection: null }),
}));
