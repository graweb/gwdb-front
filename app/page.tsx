"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Play, FileCode2 } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { useActiveConnection } from "@/hooks/useActiveConnection";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import Editor from "@monaco-editor/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export default function Page() {
  const { resolvedTheme } = useTheme();
  const [monacoTheme, setMonacoTheme] = useState("vs");
  const [query, setQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const { connection } = useActiveConnection();

  useEffect(() => {
    setMonacoTheme(resolvedTheme === "dark" ? "vs-dark" : "vs");
  }, [resolvedTheme]);

  const handleExecuteQuery = async () => {
    const res = await fetch("/api/query", {
      method: "POST",
      body: JSON.stringify({ query, connection }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (data.success) {
      const rows = Array.isArray(data.result[0]) ? data.result[0] : data.result;
      setResult(rows);
      if (rows.length > 0) setColumns(Object.keys(rows[0]));
    } else {
      toast.warning(data.error);
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={!connection?.connection_name}
                    variant="outline"
                    size="icon"
                    className="size-8 cursor-pointer"
                    onClick={handleExecuteQuery}
                  >
                    <Play />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Executar</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 cursor-pointer"
                  >
                    <FileCode2 />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Abrir</TooltipContent>
              </Tooltip>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">All Inboxes</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Inbox</BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{connection?.connection_name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-col p-2 gap-2 h-[calc(100vh-64px)]">
          {/* Editor */}
          <div className="min-h-[300px] border rounded-md overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="sql"
              defaultValue="-- digite sua query"
              theme={monacoTheme}
              onChange={(val) => setQuery(val || "")}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
              }}
            />
          </div>

          {/* Resultado da Tabela */}
          <div className="flex-1 min-h-[200px] border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col}>{col.toUpperCase()}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.map((row, idx) => (
                  <TableRow key={idx}>
                    {columns.map((col) => (
                      <TableCell key={col}>{row[col]?.toString()}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
