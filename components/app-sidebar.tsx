/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { useTheme } from "next-themes";
import { useActiveConnection } from "@/hooks/useActiveConnection";
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
  PackagePlus,
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
import {
  Dialog,
  DialogClose,
  DialogContent,
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

// This is sample data
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
  const { theme, setTheme } = useTheme();
  const { objects, loadingObjects, errorObjects, resetObjects } =
    useDatabaseObjects();
  const { connection, setConnection, resetActiveConnection } =
    useActiveConnection();
  const [isModalRemoveOpen, setIsModalRemoveOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] =
    useState<Connection | null>(null);
  const [loadingOpenConnection, setLoadingOpenConnection] = useState(false);

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
    refetchConnections();
  };

  const connectDatabase = async (conn: Connection) => {
    try {
      await testConnection(conn);
      setConnection(conn);
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
        body: JSON.stringify({ connection: conn }),
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

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
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
              {connection?.id && (
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      variant="outline"
                      tooltip={{
                        children: t("tooltips.simultaneous_connection"),
                        hidden: false,
                      }}
                      onClick={() => setIsModalOpen(true)}
                      className="px-2.5 md:px-2 cursor-pointer"
                    >
                      <PackagePlus />
                      <span>{t("tooltips.simultaneous_connection")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        {
          <SidebarFooter>
            <NavUser user={data.user} />
          </SidebarFooter>
        }
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
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

              {connection ? (
                // Exibe objetos do banco
                <>
                  {loadingObjects && (
                    <div className="flex justify-center py-4">
                      <Loader2Icon className="animate-spin size-4 text-muted-foreground" />
                    </div>
                  )}

                  {errorObjects && (
                    <div className="text-red-500 text-sm px-4">
                      {errorObjects}
                    </div>
                  )}

                  {!loadingObjects && objects && (
                    <>
                      {/* Database */}
                      <SidebarGroupLabel className="font-bold flex items-center justify-between w-full mb-2">
                        <div className="flex items-center gap-2">
                          {connection?.connection_name}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8 cursor-pointer"
                              onClick={() => {
                                resetObjects();
                                setConnection(null);
                                refetchConnections();
                                resetActiveConnection();
                              }}
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
                        items={objects.tables ?? []}
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
                                <TooltipContent>{t.TABLE_NAME}</TooltipContent>
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

                            return {
                              fullText,
                              displayText,
                            };
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
                              <TooltipContent>{ch.fullText}</TooltipContent>
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
                        items={objects.views ?? []}
                        renderItem={(t) => (
                          <SidebarMenuButton>
                            <Eye />
                            {t.VIEW_NAME.length > 20
                              ? `${t.VIEW_NAME.slice(0, 20)}...`
                              : t.VIEW_NAME}
                          </SidebarMenuButton>
                        )}
                      />

                      {/* Procedures */}
                      <DatabaseObjectSideBar
                        icon={<Workflow className="size-5" />}
                        title={t("objects.procedures")}
                        items={objects.procedures ?? []}
                        renderItem={(t) => (
                          <SidebarMenuButton>
                            <ListStart />
                            {t.ROUTINE_NAME.length > 20
                              ? `${t.ROUTINE_NAME.slice(0, 20)}...`
                              : t.ROUTINE_NAME}
                          </SidebarMenuButton>
                        )}
                      />

                      {/* Triggers */}
                      <DatabaseObjectSideBar
                        icon={<Waypoints className="size-5" />}
                        title={t("objects.triggers")}
                        items={objects.triggers ?? []}
                        renderItem={(t) => (
                          <SidebarMenuButton>
                            <Activity />
                            {t.TRIGGER_NAME.length > 20
                              ? `${t.TRIGGER_NAME.slice(0, 20)}...`
                              : t.TRIGGER_NAME}
                          </SidebarMenuButton>
                        )}
                      />

                      {/* Eventos */}
                      <DatabaseObjectSideBar
                        icon={<FileScan className="size-5" />}
                        title={t("objects.events")}
                        items={objects.events ?? []}
                        renderItem={(t) => (
                          <SidebarMenuButton>
                            <FileTerminal />
                            {t.EVENT_NAME.length > 20
                              ? `${t.EVENT_NAME.slice(0, 20)}...`
                              : t.EVENT_NAME}
                          </SidebarMenuButton>
                        )}
                      />

                      {/* Índices */}
                      <DatabaseObjectSideBar
                        icon={<FolderKey className="size-5" />}
                        title={t("objects.indices")}
                        items={objects.indexes ?? []}
                        renderItem={(t) => (
                          <SidebarMenuButton>
                            <Key />
                            {t.INDEX_NAME.length > 20
                              ? `${t.INDEX_NAME.slice(0, 20)}...`
                              : t.INDEX_NAME}
                            <span className="ml-1 text-xs text-muted-foreground">
                              (
                              {t.TABLE_NAME.length > 20
                                ? `${t.TABLE_NAME.slice(0, 20)}...`
                                : t.TABLE_NAME}
                              )
                            </span>
                          </SidebarMenuButton>
                        )}
                      />
                    </>
                  )}
                </>
              ) : (
                // Exibe conexões disponíveis
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
    </Sidebar>
  );
}
