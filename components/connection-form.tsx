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
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type Props = {
  onSuccess: () => void;
  connection?: Connection | null;
};

type DatabaseItem = {
  id: string;
  name: string;
};

export function ConnectionForm({ onSuccess, connection }: Props) {
  const t = useTranslations();
  const [databases, setDatabases] = useState<DatabaseItem[]>([]);
  const [isModalDatabasesOpen, setIsModalDatabasesOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const {
    createConnection,
    checkExistingDatabases,
    updateConnection,
    loadingConnection,
  } = useConnections();
  const [showPassword, setShowPassword] = useState(false);
  const { connections } = useConnections();

  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionFormSchema(t)),
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

  // Colunas da tabela com checkbox para seleção
  const columns: ColumnDef<DatabaseItem>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: "name",
      header: t("dialog.label_database.label"),
      cell: ({ row }) => <span>{row.getValue("name")}</span>,
    },
  ];

  const table = useReactTable({
    data: databases,
    columns,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  });

  const onSubmit = async (values: ConnectionFormValues) => {
    try {
      if (connection?.id) {
        await updateConnection(values, connection.id);
        toast.success(t("messages.connection_updated"));
      } else {
        if (!values.database_name && selectedType !== "sqlite") {
          const checkDatabases = await checkExistingDatabases(values);

          // mapear os nomes para objetos com id e name
          const mapped = checkDatabases.data.map((dbName: string) => ({
            id: dbName,
            name: dbName,
          }));
          setDatabases(mapped);
          setRowSelection({}); // limpa seleção anterior
          setIsModalDatabasesOpen(true);
          return;
        } else {
          const existingConnections = connections.filter(
            (conn) =>
              conn.connection_type === form.getValues("connection_type") &&
              conn.server === form.getValues("server") &&
              String(conn.port) === String(form.getValues("port")) &&
              conn.username === form.getValues("username")
          );

          const existingDbNames = existingConnections.map(
            (conn) => conn.database_name
          );

          if (existingDbNames.includes(values.database_name)) {
            toast.warning(t("messages.connection_already_exists"));
            return;
          }

          await createConnection(values);
          toast.success(t("messages.connection_created"));
        }
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

  // Confirmar seleção dos bancos no modal
  const handleConfirmDatabases = async () => {
    try {
      // bancos marcados na tabela
      const selectedDbNames = table
        .getSelectedRowModel()
        .rows.map((row) => row.original.name);

      if (selectedDbNames.length === 0) {
        toast.error(t("messages.connection_select"));
        return;
      }

      // conexões já existentes para o mesmo host/porta/usuário/tipo
      const existingConnections = connections.filter(
        (conn) =>
          conn.connection_type === form.getValues("connection_type") &&
          conn.server === form.getValues("server") &&
          String(conn.port) === String(form.getValues("port")) &&
          conn.username === form.getValues("username")
      );

      const existingDbNames = existingConnections.map(
        (conn) => conn.database_name
      );

      // filtra apenas bancos que ainda NÃO existem
      const databasesToCreate = selectedDbNames.filter(
        (db) => !existingDbNames.includes(db)
      );

      if (databasesToCreate.length === 0) {
        toast.warning(t("messages.connection_all_databases_ok"));
        setIsModalDatabasesOpen(false);
        return;
      }

      // cria as novas conexões em paralelo
      await Promise.all(
        databasesToCreate.map((dbName) =>
          createConnection({
            ...form.getValues(),
            database_name: dbName,
          })
        )
      );

      toast.success(t("messages.connections_created"));
      setIsModalDatabasesOpen(false);
      onSuccess();
    } catch (error) {
      toast.error(t("messages.connection_error_save") + error);
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
              <FormLabel>{t("dialog.label_connection_name.label")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("dialog.label_connection_name.placeholder")}
                  {...field}
                />
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
              <FormLabel>{t("dialog.label_database.label")}</FormLabel>
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
                    <SelectValue
                      placeholder={t("dialog.label_database.placeholder")}
                    />
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
                <FormLabel>{t("dialog.file_path.label")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("dialog.file_path.placeholder")}
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
                  <FormLabel>{t("dialog.label_server.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("dialog.label_server.placeholder")}
                      {...field}
                    />
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
                  <FormLabel>{t("dialog.label_port.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("dialog.label_port.placeholder")}
                      {...field}
                    />
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
                  <FormLabel>{t("dialog.label_database_name.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("dialog.label_database_name.placeholder")}
                      {...field}
                    />
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
                  <FormLabel>{t("dialog.label_username.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("dialog.label_username.placeholder")}
                      {...field}
                    />
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
                    <FormLabel>{t("dialog.label_password.label")}</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          type={
                            showPassword
                              ? "text"
                              : t("dialog.label_password.placeholder")
                          }
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
              {t("buttons.close")}
            </Button>
          </DialogClose>
          <Button type="submit" disabled={loadingConnection}>
            {loadingConnection && (
              <Loader2Icon className="animate-spin mr-2 size-4" />
            )}
            {connection?.id ? t("buttons.update") : t("buttons.save")}
          </Button>
        </DialogFooter>
      </form>

      <Dialog
        open={isModalDatabasesOpen}
        onOpenChange={setIsModalDatabasesOpen}
      >
        <DialogContent
          className="max-w-lg"
          onInteractOutside={(event) => {
            event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("dialog.title_database_select")}</DialogTitle>
            <DialogDescription className="text-red-800 font-bold">
              {t("dialog.description_databases_select")}
            </DialogDescription>
          </DialogHeader>

          {databases.length > 0 ? (
            <div className="overflow-x-auto max-h-80">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? "selected" : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p>{t("messages.no_results")}</p>
          )}

          <DialogFooter>
            <Button
              onClick={handleConfirmDatabases}
              disabled={loadingConnection}
            >
              {loadingConnection && (
                <Loader2Icon className="animate-spin mr-2 size-4" />
              )}
              {t("buttons.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
