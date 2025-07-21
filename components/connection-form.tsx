"use client";

import {
  connectionFormSchema,
  ConnectionFormValues,
} from "@/schemas/connection-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2Icon } from "lucide-react";
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
import { DialogFooter } from "@/components/ui/dialog";
import { useConnections } from "@/hooks/useConnections";
import { useEffect } from "react";
import { Connection } from "@/types/connection";

type Props = {
  onSuccess: () => void;
  connection?: Connection | null;
};

export function ConnectionForm({ onSuccess, connection }: Props) {
  const { createConnection, updateConnection, loadingConnection } =
    useConnections();

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
      form.setValue("connection_name", connection.connection_name ?? "");
      form.setValue("connection_type", connection.connection_type ?? "");
      form.setValue("server", connection.server ?? "");
      form.setValue("port", connection.port ?? "");
      form.setValue("database_name", connection.database_name ?? "");
      form.setValue("username", connection.username ?? "");
      form.setValue("file_path", connection.file_path ?? "");
      form.setValue("password", connection.password ?? "");
    }
  }, [connection, form]);

  const handleTypeChange = (value: string) => {
    form.setValue("connection_type", value);

    const defaultPorts: Record<string, string> = {
      mysql: "3306",
      mariadb: "3306",
      sqlserver: "1433",
      postgresql: "5432",
      sqlite: "",
    };

    form.setValue("port", defaultPorts[value] || "");
  };

  const onSubmit = async (values: ConnectionFormValues) => {
    try {
      if (connection?.id) {
        await updateConnection(values, connection.id);
        toast.success("Conexão atualizada com sucesso");
      } else {
        await createConnection(values);
        toast.success("Conexão criada com sucesso");
      }

      onSuccess();
    } catch (error) {
      toast.error("Erro ao salvar conexão " + error);
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banco de dados</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
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
              <FormMessage />
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input placeholder="*******" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={loadingConnection}
          >
            Fechar
          </Button>
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
