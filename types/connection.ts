export type Connection = {
  id: number;
  connection_name: string;
  connection_type: string;
  server?: string;
  port?: string;
  database_name?: string;
  username?: string;
  password?: string;
  file_path?: string;
};
