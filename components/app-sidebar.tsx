"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import { useActiveConnection } from "@/hooks/useActiveConnection";
import { useDatabaseObjects } from "@/hooks/useDatabaseObjects";
import {
  Command,
  PlusCircle,
  Loader2Icon,
  SunMoon,
  FolderSymlink,
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
  Trash,
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
  const {
    connections,
    loadingConnection,
    errorConnection,
    removeConnection,
    refetchConnections,
  } = useConnections();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { objects, loadingObjects, errorObjects } = useDatabaseObjects();
  const { setConnection, connection } = useActiveConnection();
  const [isModalRemoveOpen, setIsModalRemoveOpen] = useState(false);
  const [connectionToRemove, setConnectionToRemove] =
    useState<Connection | null>(null);

  const handleRemoveConnection = (conn: Connection) => {
    setConnectionToRemove(conn);
    setIsModalRemoveOpen(true);
  };

  const submitRemoveConnection = async () => {
    await removeConnection(connectionToRemove);
    setIsModalRemoveOpen(false);
    refetchConnections();
  };

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
                      children: "Nova conexão",
                      hidden: false,
                    }}
                    onClick={() => setIsModalOpen(true)}
                    className="px-2.5 md:px-2 cursor-pointer"
                  >
                    <PlusCircle />
                    <span>Nova conexão</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">GWDB</div>
            <Label className="flex items-center gap-2 text-sm">
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
                  {theme === "dark" ? "Light" : "Dark"}
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

              {errorConnection && (
                <p className="text-red-500">{errorConnection}</p>
              )}

              {!loadingConnection &&
                !errorConnection &&
                connections.length === 0 && (
                  <div className="flex justify-center py-4">
                    <span className="text-sm text-muted-foreground">
                      Nenhuma conexão encontrada
                    </span>
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
                                setConnection(null);
                                refetchConnections();
                              }}
                            >
                              <Unplug />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Desconectar</TooltipContent>
                        </Tooltip>
                      </SidebarGroupLabel>

                      {/* Tables */}
                      <DatabaseObjectSideBar
                        icon={<FolderSymlink className="size-5" />}
                        title="Tabelas"
                        items={objects.tables ?? []}
                        renderItem={(t) => (
                          <SidebarMenuButton>
                            <Table2 />
                            {t.TABLE_NAME}
                          </SidebarMenuButton>
                        )}
                      />

                      {/* Views */}
                      <DatabaseObjectSideBar
                        icon={<ScanEye className="size-5" />}
                        title="Views"
                        items={objects.views ?? []}
                        renderItem={(t) => (
                          <SidebarMenuButton>
                            <Eye />
                            {t.VIEW_NAME}
                          </SidebarMenuButton>
                        )}
                      />

                      {/* Procedures */}
                      <DatabaseObjectSideBar
                        icon={<Workflow className="size-5" />}
                        title="Procedures"
                        items={objects.procedures ?? []}
                        renderItem={(t) => (
                          <SidebarMenuButton>
                            <ListStart />
                            {t.ROUTINE_NAME}
                          </SidebarMenuButton>
                        )}
                      />

                      {/* Triggers */}
                      <DatabaseObjectSideBar
                        icon={<Waypoints className="size-5" />}
                        title="Triggers"
                        items={objects.triggers ?? []}
                        renderItem={(t) => (
                          <SidebarMenuButton>
                            <Activity />
                            {t.TRIGGER_NAME}
                          </SidebarMenuButton>
                        )}
                      />

                      {/* Eventos */}
                      <DatabaseObjectSideBar
                        icon={<FileScan className="size-5" />}
                        title="Eventos"
                        items={objects.events ?? []}
                        renderItem={(t) => (
                          <SidebarMenuButton>
                            <FileTerminal />
                            {t.EVENT_NAME}
                          </SidebarMenuButton>
                        )}
                      />

                      {/* Índices */}
                      <DatabaseObjectSideBar
                        icon={<FolderKey className="size-5" />}
                        title="Índices"
                        items={objects.indexes ?? []}
                        renderItem={(t) => (
                          <SidebarMenuButton>
                            <Key />
                            {t.INDEX_NAME}
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({t.TABLE_NAME})
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
                          Nenhuma conexão encontrada
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
                                onClick={() => setConnection(conn)}
                              >
                                <Plug />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Conectar</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="size-8 cursor-pointer"
                              >
                                <Edit />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="size-8 cursor-pointer"
                                onClick={() => handleRemoveConnection(conn)}
                              >
                                <Trash />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova conexão</DialogTitle>
          </DialogHeader>
          <ConnectionForm
            onSuccess={() => {
              setIsModalOpen(false);
              refetchConnections();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isModalRemoveOpen} onOpenChange={setIsModalRemoveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atenção</DialogTitle>
          </DialogHeader>
          <Label>
            Deseja remover a conexão {connectionToRemove?.connection_name} com o
            banco de dados {connectionToRemove?.database_name}?
          </Label>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Não
              </Button>
            </DialogClose>
            <Button onClick={submitRemoveConnection}>Sim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
