import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { schemaMetadata, TableInfo, EnumInfo } from "@/lib/db/schema-metadata";
import { 
  Database, 
  Key, 
  Link2, 
  Search, 
  ChevronDown, 
  ChevronRight,
  Shield,
  FileCode,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";

function OperationBadge({ op }: { op: string }) {
  const colors: Record<string, string> = {
    SELECT: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    INSERT: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    UPDATE: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    DELETE: "bg-red-500/10 text-red-600 border-red-500/20",
  };
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", colors[op])}>
      {op}
    </Badge>
  );
}

function TableCard({ table, isExpanded, onToggle }: { table: TableInfo; isExpanded: boolean; onToggle: () => void }) {
  const pkColumns = table.columns.filter((c) => c.isPrimaryKey);
  const fkColumns = table.columns.filter((c) => c.isForeignKey);

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg font-semibold">{table.name}</CardTitle>
                  {table.description && (
                    <CardDescription className="mt-1">{table.description}</CardDescription>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {table.allowedOperations.map((op) => (
                  <OperationBadge key={op} op={op} />
                ))}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Primary Key & Foreign Keys Summary */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">Primary Key:</span>
                <code className="bg-muted px-2 py-0.5 rounded text-xs">
                  {table.primaryKey.join(", ")}
                </code>
              </div>
              {fkColumns.length > 0 && (
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-blue-500" />
                  <span className="text-muted-foreground">Foreign Keys:</span>
                  <span className="text-xs">{fkColumns.length}</span>
                </div>
              )}
            </div>

            {/* Columns Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-1/4">Column</TableHead>
                    <TableHead className="w-1/4">Type</TableHead>
                    <TableHead className="w-1/6">Nullable</TableHead>
                    <TableHead className="w-1/4">Default</TableHead>
                    <TableHead className="w-1/6">Keys</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.columns.map((column) => (
                    <TableRow key={column.name}>
                      <TableCell className="font-mono text-sm">{column.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">
                          {column.type}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={column.nullable ? "secondary" : "outline"} className="text-xs">
                          {column.nullable ? "YES" : "NO"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {column.defaultValue || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {column.isPrimaryKey && (
                            <span title="Primary Key">
                              <Key className="h-3.5 w-3.5 text-amber-500" />
                            </span>
                          )}
                          {column.isForeignKey && (
                            <span title={`FK → ${column.foreignTable}.${column.foreignColumn}`}>
                              <Link2 className="h-3.5 w-3.5 text-blue-500" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Foreign Key Details */}
            {table.foreignKeys.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-blue-500" />
                  Foreign Key Relationships
                </h4>
                <div className="grid gap-2">
                  {table.foreignKeys.map((fk, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-2 rounded-lg"
                    >
                      <code className="text-xs">{fk.column}</code>
                      <span className="text-muted-foreground">→</span>
                      <code className="text-xs text-primary">
                        {fk.referencedTable}.{fk.referencedColumn}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function EnumCard({ enumInfo }: { enumInfo: EnumInfo }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Tag className="h-5 w-5 text-purple-500" />
          <CardTitle className="text-lg font-semibold">{enumInfo.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {enumInfo.values.map((value) => (
            <Badge key={value} variant="secondary" className="font-mono text-xs">
              {value}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DataDictionaryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const filteredTables = schemaMetadata.tables.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.columns.some((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredEnums = schemaMetadata.enums.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.values.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tableName)) {
        newSet.delete(tableName);
      } else {
        newSet.add(tableName);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedTables(new Set(filteredTables.map((t) => t.name)));
  };

  const collapseAll = () => {
    setExpandedTables(new Set());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCode className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Data Dictionary</h1>
                <p className="text-sm text-muted-foreground">
                  Schema documentation for the EV Charging database
                </p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              Dev Only
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Search & Controls */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tables, columns, or enums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{schemaMetadata.tables.length}</div>
              <p className="text-sm text-muted-foreground">Tables</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {schemaMetadata.tables.reduce((sum, t) => sum + t.columns.length, 0)}
              </div>
              <p className="text-sm text-muted-foreground">Columns</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {schemaMetadata.tables.reduce((sum, t) => sum + t.foreignKeys.length, 0)}
              </div>
              <p className="text-sm text-muted-foreground">Foreign Keys</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{schemaMetadata.enums.length}</div>
              <p className="text-sm text-muted-foreground">Enums</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tables" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tables" className="gap-2">
              <Database className="h-4 w-4" />
              Tables ({filteredTables.length})
            </TabsTrigger>
            <TabsTrigger value="enums" className="gap-2">
              <Tag className="h-4 w-4" />
              Enums ({filteredEnums.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tables" className="space-y-4">
            {filteredTables.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No tables found matching "{searchQuery}"
                </CardContent>
              </Card>
            ) : (
              filteredTables.map((table) => (
                <TableCard
                  key={table.name}
                  table={table}
                  isExpanded={expandedTables.has(table.name)}
                  onToggle={() => toggleTable(table.name)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="enums" className="grid gap-4 md:grid-cols-2">
            {filteredEnums.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No enums found matching "{searchQuery}"
                </CardContent>
              </Card>
            ) : (
              filteredEnums.map((enumInfo) => (
                <EnumCard key={enumInfo.name} enumInfo={enumInfo} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
