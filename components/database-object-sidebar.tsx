import { useTranslations } from "next-intl";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ChevronDown } from "lucide-react";
import React from "react";
import { Separator } from "./ui/separator";

type DatabaseObjectSideBarProps<T> = {
  icon: React.ReactNode;
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getChildren?: (item: T) => unknown[];
  renderChild?: (child: unknown, index: number, parent: T) => React.ReactNode;
};

export function DatabaseObjectSideBar<T>({
  icon,
  title,
  items,
  renderItem,
  getChildren,
  renderChild,
}: DatabaseObjectSideBarProps<T>) {
  const t = useTranslations();

  return (
    <SidebarMenu>
      <Collapsible className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className="font-bold flex items-center justify-between w-full">
              <ContextMenu>
                <ContextMenuTrigger className="flex items-center gap-2 w-full">
                  {icon}
                  {title}
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>
                    {t("objects.new_table_column")}
                  </ContextMenuItem>
                  <ContextMenuItem>
                    {t("objects.edit_table_column")}
                  </ContextMenuItem>
                  <ContextMenuItem>
                    {t("objects.delete_table_column")}
                  </ContextMenuItem>
                  <Separator />
                  <ContextMenuItem>{t("objects.sql_generate")}</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
              <ChevronDown className="transition-transform duration-300 ease-in-out group-data-[state=open]/collapsible:rotate-180" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {items.map((item, index) => {
                const children = getChildren?.(item);
                const hasChildren = children && children.length > 0;

                return (
                  <SidebarMenuSubItem key={index}>
                    {hasChildren ? (
                      <Collapsible className="group/nested">
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="flex items-center justify-between w-full">
                            <ContextMenu>
                              <ContextMenuTrigger className="flex items-center gap-2 w-full">
                                {renderItem(item, index)}
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem>
                                  {t("objects.new_table_column")}
                                </ContextMenuItem>
                                <ContextMenuItem>
                                  {t("objects.edit_table_column")}
                                </ContextMenuItem>
                                <ContextMenuItem>
                                  {t("objects.delete_table_column")}
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                            <ChevronDown className="transition-transform duration-300 ease-in-out group-data-[state=open]/nested:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {children.map((child, childIndex) => (
                              <SidebarMenuSubItem key={childIndex}>
                                {renderChild?.(child, childIndex, item)}
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      renderItem(item, index)
                    )}
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  );
}
