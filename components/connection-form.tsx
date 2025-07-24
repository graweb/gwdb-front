"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  connectionFormSchema,
  ConnectionFormValues,
} from "@/schemas/connection-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2Icon, EyeIcon, EyeOffIcon } from "lucide-react";
import { encrypt, decrypt, isEncrypted } from "@/lib/crypto";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useConnections } from "@/hooks/useConnections";
import { Connection } from "@/types/connection";

type Props = {
  onSuccess: () => void;
  connection?: Connection | null;
};

export function ConnectionForm({ onSuccess, connection }: Props) {
  const t = useTranslations();
  const { createConnection, updateConnection, loadingConnection } =
    useConnections();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      connection_name: "",
      connection_type: "",
      server: "",
      port: "",
      database_name: "",
      username: "",
      password: "",
      file_path: "",
    },
  });

  const selectedType = form.watch("connection_type");

  useEffect(() => {
    if (connection) {
      form.reset({
        connection_name: connection.connection_name ?? "",
        connection_type: connection.connection_type ?? "",
        server: connection.server ?? "",
        port: connection.port ?? "",
        database_name: connection.database_name ?? "",
        username: connection.username ?? "",
        file_path: connection.file_path ?? "",
        password: connection.password ?? "",
      });
    } else {
      form.reset({
        connection_name: "",
        connection_type: "",
        server: "",
        port: "",
        database_name: "",
        username: "",
        file_path: "",
        password: "",
      });
    }
  }, [connection, form]);

  const handleTypeChange = (value: string) => {
    const defaultPorts: Record<string, string> = {
      mysql: "3306",
      mariadb: "3306",
      sqlserver: "1433",
      postgresql: "5432",
      sqlite: "",
    };

    form.setValue("connection_type", value ?? "");
    form.setValue("port", defaultPorts[value] || connection?.port);
  };

  const onSubmit = async (values: ConnectionFormValues) => {
    try {
      if (connection?.id) {
        await updateConnection(values, connection.id);
        toast.success(t("messages.connection_updated"));
      } else {
        await createConnection(values);
        toast.success(t("messages.connection_created"));
      }

      onSuccess();
    } catch (error) {
      toast.error(t("messages.connection_error_save") + error);
    }
  };

  const handleShowPassword = () => {
    const currentPassword = form.getValues("password") ?? "";

    if (!showPassword) {
      if (isEncrypted(currentPassword)) {
        const decrypted = decrypt(currentPassword);
        form.setValue("password", decrypted);
      }
      setShowPassword(true);
    } else {
      if (!isEncrypted(currentPassword)) {
        const encrypted = encrypt(currentPassword);
        form.setValue("password", encrypted);
      }
      setShowPassword(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="connection_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da conexão</FormLabel>
              <FormControl>
                <Input placeholder="Conexão" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="connection_type"
          render={() => (
            <FormItem>
              <FormLabel>Banco de dados</FormLabel>
              <Select
                value={
                  form.watch("connection_type") ||
                  connection?.connection_type ||
                  ""
                }
                onValueChange={(value) => {
                  handleTypeChange(value);
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="mariadb">MariaDB</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="sqlite">SQLite</SelectItem>
                  <SelectItem value="sqlserver">SQL Server</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Campo específico para SQLite */}
        {selectedType === "sqlite" && (
          <FormField
            control={form.control}
            name="file_path"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Caminho do arquivo SQLite</FormLabel>
                <FormControl>
                  <Input
                    placeholder="/caminho/para/database.sqlite"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Campos ocultos quando SQLite é selecionado */}
        {selectedType !== "sqlite" && (
          <>
            <FormField
              control={form.control}
              name="server"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servidor</FormLabel>
                  <FormControl>
                    <Input placeholder="localhost" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porta</FormLabel>
                  <FormControl>
                    <Input placeholder="3306" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="database_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do banco</FormLabel>
                  <FormControl>
                    <Input placeholder="database" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="root" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="*******"
                          className="pr-10"
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={handleShowPassword}
                        className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeIcon className="w-4 h-4" />
                        ) : (
                          <EyeOffIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </>
        )}

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={loadingConnection}>
              Fechar
            </Button>
          </DialogClose>
          <Button type="submit" disabled={loadingConnection}>
            {loadingConnection && (
              <Loader2Icon className="animate-spin mr-2 size-4" />
            )}
            {connection?.id ? "Atualizar" : "Salvar"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
