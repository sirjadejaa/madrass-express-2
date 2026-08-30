import { db } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminTablesPage() {
  const restaurant = await db.restaurant.findFirst();
  if (!restaurant) return <div className="p-8">No restaurant configured.</div>;

  const tables = await db.table.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { number: "asc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tables</h2>
        <p className="text-muted-foreground">Manage your dine-in tables and QR codes.</p>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table Number</TableHead>
              <TableHead>QR Code URL</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-32 text-muted-foreground">No tables configured</TableCell>
              </TableRow>
            ) : (
              tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-bold text-lg">{table.number}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{table.qrCodeUrl || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">Active</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
