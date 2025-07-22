import { z } from "zod";

export const connectionFormSchema = z
  .object({
    connection_name: z.string().min(1, "Nome da conexão é obrigatório"),
    connection_type: z.string().min(1, "Tipo de conexão é obrigatório"),
    server: z.string().optional(),
    port: z.string().optional(),
    database_name: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    file_path: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.connection_type === "sqlite") {
      if (!data.file_path || data.file_path.trim() === "") {
        ctx.addIssue({
          path: ["file_path"],
          code: "custom",
          message: "Caminho do arquivo é obrigatório para SQLite",
        });
      }
    } else {
      if (!data.server || data.server.trim() === "") {
        ctx.addIssue({
          path: ["server"],
          code: "custom",
          message: "Servidor é obrigatório",
        });
      }
      if (!data.port || data.port.trim() === "") {
        ctx.addIssue({
          path: ["port"],
          code: "custom",
          message: "Porta é obrigatória",
        });
      }
      if (!data.database_name || data.database_name.trim() === "") {
        ctx.addIssue({
          path: ["database_name"],
          code: "custom",
          message: "Nome do banco é obrigatório",
        });
      }
      if (!data.username || data.username.trim() === "") {
        ctx.addIssue({
          path: ["username"],
          code: "custom",
          message: "Usuário é obrigatório",
        });
      }
      if (!data.password || data.password.trim() === "") {
        ctx.addIssue({
          path: ["password"],
          code: "custom",
          message: "Senha é obrigatória",
        });
      }
    }
  });

export type ConnectionFormValues = z.infer<typeof connectionFormSchema>;
