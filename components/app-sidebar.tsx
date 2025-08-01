/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { useTheme } from "next-themes";
import { useActiveConnections } from "@/hooks/useActiveConnections";
import { useDatabaseObjects } from "@/hooks/useDatabaseObjects";
import { toast } from "sonner";
import {
  Command,
  PlusCircle,
  Loader2Icon,
  SunMoon,
  TableProperties,
  Table2,
  ScanEye,
  Eye,
  Workflow,
  ListStart,
  Waypoints,
  Activity,
  FileScan,
  FileTerminal,
  FolderKey,
  Key,
  Unplug,
  Plug,
  Edit,
  Trash2,
  CopyPlus,
  DatabaseBackup,
} from "lucide-react";
import { NavUser } from "@/components/nav-user";
import { Label } from "@/components/ui/label";
import { ConnectionForm } from "@/components/connection-form";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConnections } from "@/hooks/useConnections";
import { DatabaseObjectSideBar } from "./database-object-sidebar";
import { Connection } from "@/types/connection";
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
import { Separator } from "./ui/separator";

// Sample user data
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations();
  const {
    connections,
    loadingConnection,
    errorConnection,
    removeConnection,
    refetchConnections,
  } = useConnections();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [
    isModalSimultaneousConnectionOpen,
    setIsModalSimultaneousConnectionOpen,
  ] = useState(false);
  const { theme, setTheme } = useTheme();
  const { objects, loadingObjects, errorObjects } = useDatabaseObjects();
  const { activeConnections, setActiveConnections, removeActiveConnections } =
    useActiveConnections();
  const [isModalRemoveOpen, setIsModalRemoveOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] =
    useState<Connection | null>(null);
  const [loadingOpenConnection, setLoadingOpenConnection] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const handleModal = (conn: Connection, type: string) => {
    setSelectedConnection(conn);

    if (type === "edit") {
      setIsModalOpen(true);
    }

    if (type === "delete") {
      setIsModalRemoveOpen(true);
    }
  };

  const submitRemoveConnection = async () => {
    await removeConnection(selectedConnection);
    setIsModalRemoveOpen(false);
    setSelectedConnection(null);
    refetchConnections();
  };

  const connectDatabase = async (conn: Connection) => {
    try {
      await testConnection(conn);
      setActiveConnections([conn]);
      toast.success(
        `${t("messages.database_connected")} ${conn.database_name}`
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? t("messages.connection_error")
          : t("messages.unknown_error")
      );
    }
  };

  async function testConnection(conn: Connection) {
    try {
      setLoadingOpenConnection(true);

      const res = await fetch("/api/objects", {
        method: "POST",
        body: JSON.stringify({ connections: [conn] }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || t("messages.error_to_connect"));
      }

      setLoadingOpenConnection(false);

      return true;
    } catch (error) {
      setLoadingOpenConnection(false);
      throw new Error(
        error instanceof Error ? error.message : t("messages.unknown_error")
      );
    }
  }

  // Colunas da tabela com checkbox para seleção
  const columns: ColumnDef<Connection>[] = [
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
      accessorKey: "connection_name",
      header: t("dialog.label_database.label"),
      cell: ({ row }) => <span>{row.getValue("connection_name")}</span>,
    },
  ];

  const table = useReactTable({
    data: connections,
    columns,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  });

  const handleAddConnection = async () => {
    try {
      // Conexões marcadas na tabela (selecionadas)
      const selectConnection = table
        .getSelectedRowModel()
        .rows.map((row) => row.original);

      // Filtrar as conexões selecionadas que ainda NÃO estão ativas
      const newConnections = selectConnection.filter(
        (selected) =>
          !activeConnections.some((active) => active.id === selected.id)
      );

      if (newConnections.length === 0) {
        toast.warning("Essas conexões já estão ativas.");
        return;
      }

      // Testa cada conexão antes de adicionar, para garantir que está ok
      for (const conn of newConnections) {
        try {
          await testConnection(conn);
        } catch {
          toast.error(`Erro ao conectar: ${conn.connection_name}`);
          return;
        }
      }

      // Adicionar as novas conexões ao estado, mantendo as antigas
      setActiveConnections([...activeConnections, ...newConnections]);

      toast.success("Conexões adicionadas com sucesso!");
      setIsModalSimultaneousConnectionOpen(false);
    } catch (error) {
      toast.error(t("messages.connection_error_save") + error);
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* Sidebar Icon Narrow */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="#">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">GWDB</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    variant="outline"
                    tooltip={{
                      children: t("tooltips.new_connection"),
                      hidden: false,
                    }}
                    onClick={() => setIsModalOpen(true)}
                    className="px-2.5 md:px-2 cursor-pointer"
                  >
                    <PlusCircle />
                    <span>{t("tooltips.new_connection")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>

              {activeConnections.length > 0 && (
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      variant="outline"
                      tooltip={{
                        children: t("tooltips.simultaneous_connection"),
                        hidden: false,
                      }}
                      onClick={() => setIsModalSimultaneousConnectionOpen(true)}
                      className="px-2.5 md:px-2 cursor-pointer"
                    >
                      <CopyPlus />
                      <span>{t("tooltips.simultaneous_connection")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      variant="outline"
                      tooltip={{
                        children: t("tooltips.database_backup"),
                        hidden: false,
                      }}
                      onClick={() => setIsModalOpen(true)}
                      className="px-2.5 md:px-2 cursor-pointer"
                    >
                      <DatabaseBackup />
                      <span>{t("tooltips.database_backup")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>

      {/* Main Sidebar */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-2">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">GWDB</div>
            <Label className="flex items-center text-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="cursor-pointer"
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                  >
                    <SunMoon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {theme === "dark"
                    ? t("tooltips.theme_light")
                    : t("tooltips.theme_dark")}
                </TooltipContent>
              </Tooltip>
            </Label>
          </div>
          <SidebarInput placeholder="Type to search..." />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {loadingConnection && (
                <div className="flex justify-center py-4">
                  <Loader2Icon className="animate-spin size-4 text-muted-foreground" />
                </div>
              )}

              {activeConnections.length > 0 ? (
                <>
                  {/* Loader geral - pode ser um overlay, ou simples indicador */}
                  {loadingObjects && (
                    <div className="flex justify-center py-4">
                      <Loader2Icon className="animate-spin size-4 text-muted-foreground" />
                    </div>
                  )}

                  {/*
                    Listagem por conexão
                    Usamos .map e retornamos o JSX, evitando usar lógica condicional que não retorna nada
                  */}
                  {activeConnections.map((conn) => {
                    const connectionId = conn.id;
                    const hasError = errorObjects?.[connectionId];
                    const dbObjects = objects?.[connectionId];

                    return (
                      <React.Fragment key={connectionId}>
                        {hasError && (
                          <div className="text-red-500 text-sm px-4 mb-2">
                            {hasError}
                          </div>
                        )}

                        {!hasError && !loadingObjects && dbObjects && (
                          <>
                            {/* Database Label */}
                            <SidebarGroupLabel className="font-bold flex items-center justify-between w-full mb-2">
                              <div className="flex items-center gap-2">
                                {conn.connection_name}
                              </div>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8 cursor-pointer"
                                    onClick={() =>
                                      removeActiveConnections(connectionId)
                                    }
                                  >
                                    <Unplug />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {t("tooltips.disconnect")}
                                </TooltipContent>
                              </Tooltip>
                            </SidebarGroupLabel>

                            {/* Tables */}
                            <DatabaseObjectSideBar
                              icon={<Table2 className="size-5" />}
                              title={t("objects.tables")}
                              items={dbObjects.tables ?? []}
                              renderItem={(t) => (
                                <>
                                  <TableProperties className="size-4" />
                                  {t.TABLE_NAME.length > 20 ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="max-w-[180px] truncate inline-block cursor-default">
                                          {t.TABLE_NAME.slice(0, 20)}...
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {t.TABLE_NAME}
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <span>{t.TABLE_NAME}</span>
                                  )}
                                </>
                              )}
                              getChildren={(t) =>
                                t.COLUMNS?.map((c) => {
                                  const length =
                                    c.length !== undefined
                                      ? `(${c.length})`
                                      : c.precision !== undefined &&
                                        c.scale !== undefined
                                      ? `(${c.precision},${c.scale})`
                                      : "";

                                  const fullText = `${c.name} - ${c.type}${length}`;
                                  const displayText =
                                    fullText.length > 30
                                      ? `${fullText.slice(0, 30)}...`
                                      : fullText;

                                  return { fullText, displayText };
                                }) ?? []
                              }
                              renderChild={(ch: any) =>
                                ch.fullText.length > 30 ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="max-w-[220px] truncate inline-block cursor-default">
                                        {ch.displayText}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {ch.fullText}
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span>{ch.fullText}</span>
                                )
                              }
                            />

                            {/* Views */}
                            <DatabaseObjectSideBar
                              icon={<ScanEye className="size-5" />}
                              title={t("objects.views")}
                              items={dbObjects.views ?? []}
                              renderItem={(t) => (
                                <SidebarMenuButton>
                                  <Eye />
                                  {t.VIEW_NAME.length > 20 ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="max-w-[180px] truncate inline-block cursor-default">
                                          {t.VIEW_NAME.slice(0, 20)}...
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {t.VIEW_NAME}
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <span>{t.VIEW_NAME}</span>
                                  )}
                                </SidebarMenuButton>
                              )}
                            />

                            {/* Procedures */}
                            <DatabaseObjectSideBar
                              icon={<Workflow className="size-5" />}
                              title={t("objects.procedures")}
                              items={dbObjects.procedures ?? []}
                              renderItem={(t) => (
                                <SidebarMenuButton>
                                  <ListStart />
                                  {t.ROUTINE_NAME.length > 20 ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="max-w-[180px] truncate inline-block cursor-default">
                                          {t.ROUTINE_NAME.slice(0, 20)}...
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {t.ROUTINE_NAME}
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <span>{t.ROUTINE_NAME}</span>
                                  )}
                                </SidebarMenuButton>
                              )}
                            />

                            {/* Triggers */}
                            <DatabaseObjectSideBar
                              icon={<Waypoints className="size-5" />}
                              title={t("objects.triggers")}
                              items={dbObjects.triggers ?? []}
                              renderItem={(t) => (
                                <SidebarMenuButton>
                                  <Activity />
                                  {t.TRIGGER_NAME.length > 20 ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="max-w-[180px] truncate inline-block cursor-default">
                                          {t.TRIGGER_NAME.slice(0, 20)}...
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {t.TRIGGER_NAME}
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <span>{t.TRIGGER_NAME}</span>
                                  )}
                                </SidebarMenuButton>
                              )}
                            />

                            {/* Events */}
                            <DatabaseObjectSideBar
                              icon={<FileScan className="size-5" />}
                              title={t("objects.events")}
                              items={dbObjects.events ?? []}
                              renderItem={(t) => (
                                <SidebarMenuButton>
                                  <FileTerminal />
                                  {t.EVENT_NAME.length > 20 ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="max-w-[180px] truncate inline-block cursor-default">
                                          {t.EVENT_NAME.slice(0, 20)}...
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {t.EVENT_NAME}
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <span>{t.EVENT_NAME}</span>
                                  )}
                                </SidebarMenuButton>
                              )}
                            />

                            {/* Indexes */}
                            <DatabaseObjectSideBar
                              icon={<FolderKey className="size-5" />}
                              title={t("objects.indices")}
                              items={dbObjects.indexes ?? []}
                              renderItem={(t) => {
                                const displayText = `${
                                  t.TABLE_NAME.length > 10
                                    ? t.TABLE_NAME.slice(0, 10) + "..."
                                    : t.TABLE_NAME
                                } (${
                                  t.INDEX_NAME.length > 5
                                    ? t.INDEX_NAME.slice(0, 5) + "..."
                                    : t.INDEX_NAME
                                })`;
                                const fullText = `${t.TABLE_NAME} (${t.INDEX_NAME})`;

                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <SidebarMenuButton className="cursor-default">
                                        <Key />
                                        <span className="max-w-[300px] truncate inline-block ml-1">
                                          {displayText}
                                        </span>
                                      </SidebarMenuButton>
                                    </TooltipTrigger>
                                    <TooltipContent>{fullText}</TooltipContent>
                                  </Tooltip>
                                );
                              }}
                            />

                            {activeConnections.length > 1 && (
                              <Separator className="my-4" />
                            )}
                          </>
                        )}

                        {/* Você pode querer colocar um loading individual por conexão aqui, se desejar */}
                        {!dbObjects && !hasError && !loadingObjects && (
                          <div className="text-sm text-muted-foreground px-4 py-2">
                            {t("messages.no_connections")}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              ) : (
                <>
                  {!loadingConnection &&
                    !errorConnection &&
                    connections.length === 0 && (
                      <div className="flex justify-center py-4">
                        <span className="text-sm text-muted-foreground">
                          {t("messages.no_connections")}
                        </span>
                      </div>
                    )}

                  {!loadingConnection &&
                    !errorConnection &&
                    connections.map((conn) => (
                      <div
                        key={conn.id}
                        className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 text-left w-full"
                      >
                        <div className="flex w-full items-center gap-2">
                          <span>{conn.connection_name}</span>
                          <span className="ml-auto text-xs">
                            <Badge
                              variant="secondary"
                              className="bg-violet-200 text-black dark:bg-violet-300"
                            >
                              {conn.connection_type}
                            </Badge>
                          </span>
                        </div>

                        <span className="font-medium">{conn.server}</span>
                        <span className="line-clamp-2 w-[260px] text-xs whitespace-break-spaces">
                          {conn.database_name + " - " + conn.port}
                        </span>

                        {/* Botões alinhados à direita */}
                        <div className="mt-2 flex w-full justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="size-8 cursor-pointer"
                                onClick={() => connectDatabase(conn)}
                                disabled={loadingOpenConnection}
                              >
                                {loadingOpenConnection ? (
                                  <Loader2Icon className="animate-spin size-4 text-muted-foreground" />
                                ) : (
                                  <Plug />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t("tooltips.connect")}
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="size-8 cursor-pointer"
                                onClick={() => handleModal(conn, "edit")}
                                disabled={loadingOpenConnection}
                              >
                                <Edit />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t("tooltips.edit")}
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="size-8 cursor-pointer"
                                onClick={() => handleModal(conn, "delete")}
                                disabled={loadingOpenConnection}
                              >
                                <Trash2 />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t("tooltips.delete")}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                </>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <Dialog
        open={isModalOpen}
        onOpenChange={(v) => {
          setIsModalOpen(v);
          if (!v) setSelectedConnection(null);
        }}
      >
        <DialogContent
          className="sm:max-w-[425px]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {selectedConnection
                ? t("dialog.new_connection.title.edit")
                : t("dialog.new_connection.title.new")}
            </DialogTitle>
          </DialogHeader>
          <ConnectionForm
            connection={selectedConnection}
            onSuccess={() => {
              setIsModalOpen(false);
              setSelectedConnection(null);
              refetchConnections();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isModalRemoveOpen} onOpenChange={setIsModalRemoveOpen}>
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("dialog.remove.title")}</DialogTitle>
          </DialogHeader>
          <Label>
            {t("dialog.remove.message.part_1")}{" "}
            {selectedConnection?.connection_name}{" "}
            {t("dialog.remove.message.part_2")}{" "}
            {selectedConnection?.database_name}?
          </Label>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                {t("buttons.no")}
              </Button>
            </DialogClose>
            <Button
              onClick={submitRemoveConnection}
              className="bg-red-800 text-white hover:bg-red-700 hover:text-white"
            >
              {t("buttons.yes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isModalSimultaneousConnectionOpen}
        onOpenChange={setIsModalSimultaneousConnectionOpen}
      >
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {t("dialog.title_simultaneous_connection")}
            </DialogTitle>
            <DialogDescription className="text-red-800 font-bold">
              {t("dialog.description_simultaneous_connection")}
            </DialogDescription>
          </DialogHeader>
          {connections.length > 0 ? (
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
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                disabled={loadingOpenConnection}
              >
                {t("buttons.close")}
              </Button>
            </DialogClose>
            <Button
              onClick={handleAddConnection}
              disabled={loadingOpenConnection}
            >
              {loadingOpenConnection && (
                <Loader2Icon className="animate-spin mr-2 size-4" />
              )}
              {t("buttons.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
