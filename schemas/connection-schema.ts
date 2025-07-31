import { z } from "zod";

export const connectionFormSchema = (t: (key: string) => string) =>
  z
    .object({
      connection_name: z.string().min(1, t("validations.connection_name")),
      connection_type: z.string().min(1, t("validations.connection_type")),
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
            message: t("validations.file_path"),
          });
        }
      } else {
        if (!data.server || data.server.trim() === "") {
          ctx.addIssue({
            path: ["server"],
            code: "custom",
            message: t("validations.server"),
          });
        }
        if (!data.port || data.port.trim() === "") {
          ctx.addIssue({
            path: ["port"],
            code: "custom",
            message: t("validations.port"),
          });
        }
        if (!data.username || data.username.trim() === "") {
          ctx.addIssue({
            path: ["username"],
            code: "custom",
            message: t("validations.username"),
          });
        }
        if (!data.password || data.password.trim() === "") {
          ctx.addIssue({
            path: ["password"],
            code: "custom",
            message: t("validations.password"),
          });
        }
      }
    });

export type ConnectionFormValues = z.infer<
  ReturnType<typeof connectionFormSchema>
>;
