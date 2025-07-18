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
import { useState } from "react";

export function ConnectionForm({ onSuccess }: { onSuccess: () => void }) {
  const { createConnection, loading } = useConnections();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [port, setPort] = useState("");

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
    },
  });

  const handleTypeChange = (value: string) => {
    form.setValue("connection_type", value);
    if (value === "mysql") {
      setPort("3306");
      form.setValue("port", "3306");
    } else if (value === "sqlserver") {
      setPort("1433");
      form.setValue("port", "1433");
    } else {
      setPort("");
      form.setValue("port", "");
    }
  };

  const onSubmit = async (values: ConnectionFormValues) => {
    await createConnection(values);
    toast.success("Conexão salva com sucesso");
    onSuccess();
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
              <Select onValueChange={handleTypeChange}>
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

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={loading}
          >
            Fechar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ?? <Loader2Icon className="animate-spin" />}
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
