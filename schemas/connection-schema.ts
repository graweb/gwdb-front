import { z } from "zod";

export const connectionFormSchema = z.object({
  connection_name: z.string().min(1, "Nome da conexão é obrigatório"),
  connection_type: z.string().min(1, "Tipo de conexão é obrigatório"),
  server: z.string().min(1, "Servidor é obrigatório"),
  port: z.string().min(1, "Porta é obrigatória"),
  database_name: z.string().min(1, "Nome do banco é obrigatório"),
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type ConnectionFormValues = z.infer<typeof connectionFormSchema>;
