"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { Play, FileCode2, Loader2Icon } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { useActiveConnection } from "@/hooks/useActiveConnection";
import { useExecuteQuery } from "@/hooks/useExecuteQuery";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { sqlKeywords } from "@/lib/sql-keywords";
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
import { useDatabaseObjects } from "@/hooks/useDatabaseObjects";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monacoType from "monaco-editor";
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
  const { connection } = useActiveConnection();
  const { objects } = useDatabaseObjects();
  const editorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(
    null
  );
  const monacoRef = useRef<typeof monacoType | null>(null);
  const connectionRef = useRef(connection);

  const {
    executeQuery,
    resetQueryResult,
    loadingQuery,
    resultQuery,
    columnsQuery,
  } = useExecuteQuery();

  const [columnDefs, setColumnDefs] = useState<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ColumnDef<Record<string, any>>[]
  >([]);

  useEffect(() => {
    setMonacoTheme(resolvedTheme === "dark" ? "vs-dark" : "vs");
  }, [resolvedTheme]);

  useEffect(() => {
    if (columnsQuery.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dynamicColumns: ColumnDef<Record<string, any>>[] = columnsQuery.map(
        (col: string) => ({
          accessorKey: col,
          header: col.toUpperCase(),
          cell: ({ row }) => row.original[col]?.toString() ?? "",
        })
      );

      setColumnDefs(dynamicColumns);
    }
  }, [columnsQuery]);

  useEffect(() => {
    connectionRef.current = connection;
  }, [connection]);

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco || !objects?.tables) return;

    const provider = monaco.languages.registerCompletionItemProvider("sql", {
      triggerCharacters: [" ", ".", ..."_abcdefghijklmnopqrstuvwxyz".split("")],
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: monacoType.languages.CompletionItem[] = [];
        const columnSet = new Set<string>();

        objects?.tables?.forEach((table) => {
          suggestions.push({
            label: table.TABLE_NAME,
            kind: monaco.languages.CompletionItemKind.Struct,
            insertText: table.TABLE_NAME,
            detail: "Tabela",
            range,
          });

          table.COLUMNS?.forEach((column) => {
            const key = `${table.TABLE_NAME}.${column}`;
            if (!columnSet.has(key)) {
              columnSet.add(key);
              suggestions.push({
                label: key,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: key,
                detail: `Coluna de ${table.TABLE_NAME}`,
                range,
              });
            }
          });
        });

        sqlKeywords.forEach((kw) => {
          suggestions.push({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            detail: "Palavra-chave SQL",
            range,
          });
        });

        return { suggestions };
      },
    });

    return () => provider.dispose();
  }, [objects]);

  useEffect(() => {
    if (connection === null) {
      setQuery("");
      resetQueryResult();
      if (editorRef.current) {
        editorRef.current.setValue("-- digite sua query");
      }
    }
  }, [connection, resetQueryResult]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (!editorRef.current) return;
      const sqlBlock = getSqlBlockAtCursor(editorRef.current);
      setQuery(sqlBlock);
      handleExecuteQuery(sqlBlock);
    });
  };

  const handleExecuteQuery = async (queryToRun?: string) => {
    const activeConnection = connectionRef.current;

    if (!activeConnection?.connection_name) {
      toast.warning(
        "Por favor, selecione uma conexão antes de executar a query."
      );
      return;
    }

    const finalQuery = queryToRun || query;
    executeQuery(finalQuery, activeConnection);
  };

  function getSqlBlockAtCursor(
    editor: monacoType.editor.IStandaloneCodeEditor
  ): string {
    const model = editor.getModel();
    if (!model) return "";

    const position = editor.getPosition();
    if (!position) return "";

    const lines = model.getLinesContent();
    let start = position.lineNumber - 1;
    let end = position.lineNumber - 1;

    while (start > 0 && lines[start - 1].trim() !== "") start--;
    while (end < lines.length - 1 && lines[end + 1].trim() !== "") end++;

    return lines
      .slice(start, end + 1)
      .join("\n")
      .trim();
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "350px" } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled={!connection?.connection_name}
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => handleExecuteQuery()}
                  >
                    <Play />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Executar</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="size-8">
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
          <div className="min-h-[300px] border rounded-md overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="sql"
              defaultValue="-- digite sua query"
              theme={monacoTheme}
              onMount={handleEditorDidMount}
              onChange={(val) => setQuery(val || "")}
              options={{ fontSize: 14, minimap: { enabled: true } }}
            />
          </div>

          <div className="@container/main flex flex-1 flex-col gap-2 border rounded-md">
            {loadingQuery ? (
              <Loader2Icon className="animate-spin size-4 text-muted-foreground" />
            ) : connection !== null &&
              resultQuery.length > 0 &&
              columnDefs.length > 0 ? (
              <div className="flex flex-col gap-4 py-2 p-2">
                <DataTable columns={columnDefs} data={resultQuery} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-2">
                Nenhum resultado encontrado.
              </p>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
