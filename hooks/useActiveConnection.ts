import { Connection } from "@/types/connection";
import { create } from "zustand";

type State = {
  connection: Connection | null;
  setConnection: (conn: Connection) => void;
};

export const useActiveConnection = create<State>((set) => ({
  connection: null,
  setConnection: (connection) => set({ connection }),
}));
