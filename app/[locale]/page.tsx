/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { Play, FileCode, Loader2Icon, Save, FileSearch } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { useActiveConnection } from "@/hooks/useActiveConnection";
import { usePaginatedQuery } from "@/hooks/useExecuteQuery";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { sqlKeywordsByDialect } from "@/lib/sql-keywords";
import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";
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
  const t = useTranslations();
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
  const dialect = connection?.connection_type ?? "mysql";
  const sqlKeywords = sqlKeywordsByDialect[dialect] ?? [];

  const {
    executeQuery,
    resetQueryResult,
    loadingQuery,
    resultQuery,
    columnsQuery,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    totalQueryRows,
  } = usePaginatedQuery();

  const [columnDefs, setColumnDefs] = useState<
    ColumnDef<Record<string, any>>[]
  >([]);

  useEffect(() => {
    setMonacoTheme(resolvedTheme === "dark" ? "vs-dark" : "vs");
  }, [resolvedTheme]);

  useEffect(() => {
    if (columnsQuery.length > 0) {
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

        const value = model.getValue().toUpperCase();
        const linesUntilCursor = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const suggestions: monacoType.languages.CompletionItem[] = [];

        // Verifica se estamos logo após FROM
        const isAfterFrom = /\bFROM\s+[\w]*$/i.test(linesUntilCursor);
        const isAfterWhere = /\bWHERE\s+[\w]*$/i.test(linesUntilCursor);
        const isAfterJoin = /\bJOIN\s+[\w]*$/i.test(linesUntilCursor);

        // Extrai a(s) tabela(s) mencionada(s) no FROM
        const fromMatch = value.match(/\bFROM\s+([a-zA-Z0-9_]+)/);
        const tableInFrom = fromMatch?.[1];

        if (isAfterFrom || isAfterJoin) {
          // Apenas sugestões de tabelas
          objects?.tables?.forEach((table) => {
            suggestions.push({
              label: table.TABLE_NAME,
              kind: monaco.languages.CompletionItemKind.Struct,
              insertText: table.TABLE_NAME,
              detail: t("objects.table"),
              range,
            });
          });
        } else if (isAfterWhere && tableInFrom) {
          const targetTable = objects?.tables?.find(
            (t) => t.TABLE_NAME.toUpperCase() === tableInFrom.toUpperCase()
          );

          targetTable?.COLUMNS?.forEach((column) => {
            suggestions.push({
              label: column.name,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: column.name,
              detail: `${t("objects.column_of")} ${tableInFrom}`,
              range,
            });
          });
        } else {
          // Palavras-chave e funções (default)
          sqlKeywords.forEach((kw) => {
            suggestions.push({
              label: kw,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: kw,
              detail: t("objects.key_word"),
              range,
            });
          });

          // E também tabelas e colunas com `table.column` opcionalmente
          objects?.tables?.forEach((table) => {
            suggestions.push({
              label: table.TABLE_NAME,
              kind: monaco.languages.CompletionItemKind.Struct,
              insertText: table.TABLE_NAME,
              detail: t("objects.table"),
              range,
            });

            table.COLUMNS?.forEach((column) => {
              suggestions.push({
                label: `${table.TABLE_NAME}.${column.name}`,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: `${table.TABLE_NAME}.${column.name}`,
                detail: `${t("objects.column_of")} ${table.TABLE_NAME}`,
                range,
              });
            });
          });
        }

        return { suggestions };
      },
    });

    return () => provider.dispose();
  });

  useEffect(() => {
    if (connection === null) {
      setQuery("");
      resetQueryResult();
      if (editorRef.current) {
        editorRef.current.setValue(t("default_editor_text"));
      }
    }
  }, [connection, resetQueryResult, t]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (!editorRef.current) return;

      const editorInstance = editorRef.current;
      const model = editorInstance.getModel();
      const selection = editorInstance.getSelection();
      const cursor = editorInstance.getPosition();

      if (!model || !selection || !cursor) return;

      const selectedText = model.getValueInRange(selection).trim();
      const sqlToRun =
        selectedText.length > 0
          ? selectedText
          : getSqlBlockAtCursor(editorInstance);

      setQuery(sqlToRun);
      handleExecuteQuery(sqlToRun);
    });
  };

  const handleExecuteQuery = async (queryToRun?: string, page?: number) => {
    const activeConnection = connectionRef.current;

    if (!activeConnection?.connection_name) {
      toast.warning(t("messages.connection_not_selected"));
      return;
    }

    if (!page) {
      setPageIndex(0);
    }

    const finalQuery = queryToRun || query;
    executeQuery(finalQuery, activeConnection, page ?? pageIndex, pageSize);
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

  const paginate = (page: number) => {
    setPageIndex(page);
    handleExecuteQuery("", page);
  };

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
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!connection?.connection_name}
                    onClick={() => handleExecuteQuery("", 0)}
                  >
                    <Play />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("tooltips.connect")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!connection?.connection_name}
                  >
                    <FileCode />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("tooltips.open_file")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!connection?.connection_name}
                  >
                    <FileSearch />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("tooltips.my_queries")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!connection?.connection_name}
                  >
                    <Save />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("tooltips.save_query")}</TooltipContent>
              </Tooltip>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-col p-2 gap-2 h-[calc(100vh-64px)]">
          <div className="min-h-[250px] border rounded-md overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="sql"
              defaultValue={t("default_editor_text")}
              theme={monacoTheme}
              onMount={handleEditorDidMount}
              onChange={(val) => setQuery(val || "")}
              options={{ fontSize: 14, minimap: { enabled: true } }}
            />
          </div>

          <div className="@container/main flex flex-1 flex-col gap-2 border rounded-md overflow-auto">
            {loadingQuery ? (
              <Loader2Icon className="animate-spin size-4 text-muted-foreground p-2" />
            ) : connection !== null &&
              resultQuery.length > 0 &&
              columnDefs.length > 0 ? (
              <div className="flex flex-col gap-4 py-2 p-2">
                <DataTable
                  columns={columnDefs}
                  data={resultQuery}
                  total={totalQueryRows}
                  pageIndex={pageIndex}
                  pageSize={pageSize}
                  setPageIndex={paginate}
                  setPageSize={setPageSize}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-2">
                {t("messages.no_results")}
              </p>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
