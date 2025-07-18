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
};

export function DatabaseObjectSideBar<T>({
  icon,
  title,
  items,
  renderItem,
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
              {items.map((item, index) => (
                <SidebarMenuSubItem key={index}>
                  {renderItem(item, index)}
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  );
}
