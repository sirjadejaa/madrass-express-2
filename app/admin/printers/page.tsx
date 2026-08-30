import { db } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPrintersPage() {
  const restaurant = await db.restaurant.findFirst();
  if (!restaurant) return <div className="p-8">No restaurant configured.</div>;

  const printers = await db.printerSetting.findMany({
    where: { restaurantId: restaurant.id }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Printers</h2>
        <p className="text-muted-foreground">Manage your receipt and kitchen printers.</p>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Printer Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Paper Width</TableHead>
              <TableHead>Auto-print</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {printers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">No printers configured</TableCell>
              </TableRow>
            ) : (
              printers.map((printer) => (
                <TableRow key={printer.id}>
                  <TableCell className="font-medium">{printer.name}</TableCell>
                  <TableCell>{printer.type}</TableCell>
                  <TableCell>{printer.paperWidth}</TableCell>
                  <TableCell>
                    {printer.autoPrint ? <Check className="text-green-500 h-4 w-4" /> : <X className="text-muted-foreground h-4 w-4" />}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>
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
