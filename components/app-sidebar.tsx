"use client";

import React from "react";
import { useTheme } from "next-themes";
import { useActiveConnection } from "@/hooks/useActiveConnection";
import { useDatabaseObjects } from "@/hooks/useDatabaseObjects";
import { Command, PlusCircle, Loader2Icon, SunMoon } from "lucide-react";
import { NavUser } from "@/components/nav-user";
import { Label } from "@/components/ui/label";
import { ConnectionForm } from "@/components/connection-form";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
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
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConnections } from "@/hooks/useConnections";

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
    refetchConnections,
  } = useConnections();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const { objects, loadingObjects, errorObjects } = useDatabaseObjects();
  const { setConnection, connection } = useActiveConnection();

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
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <SunMoon />
              </Button>
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
                      {/* Tabelas */}
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <span className="font-bold">Tabelas</span>
                        </SidebarMenuItem>
                        {objects.tables?.map((t, i) => (
                          <SidebarMenuItem key={i}>
                            <SidebarMenuButton>
                              {t.TABLE_NAME}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>

                      {/* Views */}
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <span className="font-bold">Views</span>
                        </SidebarMenuItem>
                        {objects.views?.map((t, i) => (
                          <SidebarMenuItem key={i}>
                            <SidebarMenuButton>{t.VIEW_NAME}</SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>

                      {/* Procedures */}
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <span className="font-bold">Procedures</span>
                        </SidebarMenuItem>
                        {objects.procedures?.map((t, i) => (
                          <SidebarMenuItem key={i}>
                            <SidebarMenuButton>
                              {t.ROUTINE_NAME}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>

                      {/* Triggers */}
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <span className="font-bold">Triggers</span>
                        </SidebarMenuItem>
                        {objects.triggers?.map((t, i) => (
                          <SidebarMenuItem key={i}>
                            <SidebarMenuButton>
                              {t.TRIGGER_NAME}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>

                      {/* Eventos */}
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <span className="font-bold">Eventos</span>
                        </SidebarMenuItem>
                        {objects.events?.map((t, i) => (
                          <SidebarMenuItem key={i}>
                            <SidebarMenuButton>
                              {t.EVENT_NAME}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>

                      {/* Índices */}
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <span className="font-bold">Índices</span>
                        </SidebarMenuItem>
                        {objects.indexes?.map((t, i) => (
                          <SidebarMenuItem key={i}>
                            <SidebarMenuButton>
                              {t.INDEX_NAME}
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({t.TABLE_NAME})
                              </span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
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
                      <a
                        href="#"
                        key={conn.id}
                        onClick={() => setConnection(conn)}
                        className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
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
                      </a>
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
    </Sidebar>
  );
}
