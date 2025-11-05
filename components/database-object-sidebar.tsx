import { useTranslations } from "next-intl";
import React, { useState } from "react";
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
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Check, ChevronDown, ChevronsUpDownIcon, Plus } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  const [isModalTableOpen, setIsModalTableOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const frameworks = [
    { value: "bigint", label: "bigint" },
    { value: "binary", label: "binary" },
    { value: "blob", label: "blob" },
    { value: "boolean", label: "boolean" },
    { value: "char", label: "char" },
    { value: "date", label: "date" },
    { value: "datetime", label: "datetime" },
    { value: "decimal", label: "decimal" },
    { value: "float", label: "float" },
    { value: "int", label: "int" },
    { value: "numeric", label: "numeric" },
    { value: "text", label: "text" },
    { value: "time", label: "time" },
    { value: "timestamp", label: "timestamp" },
    { value: "uuid", label: "uuid" },
    { value: "varbinary", label: "varbinary" },
    { value: "varchar", label: "varchar" },
  ];

  return (
    <SidebarMenu>
      <Collapsible className="group/collapsible">
        <ContextMenu>
          <SidebarMenuItem>
            <ContextMenuTrigger asChild>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  className="font-bold flex items-center justify-between w-full"
                  onContextMenu={(e) => e.stopPropagation()} // Evita abrir colapso
                >
                  <span className="flex items-center gap-2 w-full">
                    {icon}
                    {title}
                  </span>
                  <ChevronDown className="transition-transform duration-300 ease-in-out group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
            </ContextMenuTrigger>
          </SidebarMenuItem>

          <ContextMenuContent>
            <ContextMenuItem onSelect={() => setIsModalTableOpen(true)}>
              {t("objects.new_table_column")}
            </ContextMenuItem>
            <ContextMenuItem>{t("objects.edit_table_column")}</ContextMenuItem>
            <ContextMenuItem>
              {t("objects.delete_table_column")}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                {t("objects.sql_generate")}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-32">
                <ContextMenuItem>Select</ContextMenuItem>
                <ContextMenuItem>Insert</ContextMenuItem>
                <ContextMenuItem>Update</ContextMenuItem>
                <ContextMenuItem>Delete</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem>Contruir</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>

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
                            <ContextMenuTrigger asChild>
                              <span
                                className="flex items-center gap-2 w-full"
                                onContextMenu={(e) => e.stopPropagation()}
                              >
                                {renderItem(item, index)}
                              </span>
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
      </Collapsible>

      <Dialog open={isModalTableOpen} onOpenChange={setIsModalTableOpen}>
        <form>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Nova tabela</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-3">
                <Label htmlFor="table_name">Nome da tabela</Label>
                <Input id="table_name" name="table_name" />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="field_name">Nome do campo</Label>
                <div className="flex w-full items-center gap-2">
                  <Input
                    id="field_name"
                    name="field_name"
                    placeholder="Field name"
                    className="w-full"
                  />

                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[200px] justify-between"
                      >
                        {value
                          ? frameworks.find(
                              (framework) => framework.value === value
                            )?.label
                          : "Field type..."}
                        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search type..." />
                        <CommandList>
                          <CommandEmpty>Field type...</CommandEmpty>
                          <CommandGroup>
                            {frameworks.map((framework) => (
                              <CommandItem
                                key={framework.value}
                                value={framework.value}
                                onSelect={(currentValue) => {
                                  setValue(
                                    currentValue === value ? "" : currentValue
                                  );
                                  setOpen(false);
                                }}
                              >
                                {framework.label}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    value === framework.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <Input
                    id="field_size"
                    name="field_size"
                    placeholder="100"
                    className="w-[120px]"
                  />

                  <Button size="icon" variant="outline">
                    <Plus />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </SidebarMenu>
  );
}
