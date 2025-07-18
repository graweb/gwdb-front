export type TableObject = { TABLE_NAME: string };
export type ViewObject = { VIEW_NAME: string };
export type ProcedureObject = { ROUTINE_NAME: string };
export type TriggerObject = { TRIGGER_NAME: string };
export type EventObject = { EVENT_NAME: string };
export type IndexObject = { INDEX_NAME: string; TABLE_NAME: string };

export type DatabaseObjects = {
  tables?: TableObject[];
  views?: ViewObject[];
  procedures?: ProcedureObject[];
  triggers?: TriggerObject[];
  events?: EventObject[];
  indexes?: IndexObject[];
};
