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
import { ChevronDown } from "lucide-react";
import React from "react";

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
  return (
    <SidebarMenu>
      <Collapsible className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton className="font-bold flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {icon}
                {title}
              </div>
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
                            <div className="flex items-center gap-2">
                              {renderItem(item, index)}
                            </div>
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
