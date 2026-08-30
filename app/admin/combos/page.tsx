import { db } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminCombosPage() {
  const restaurant = await db.restaurant.findFirst();
  if (!restaurant) return <div className="p-8">No restaurant configured.</div>;

  const combos = await db.product.findMany({
    where: { 
      restaurantId: restaurant.id,
      isCombo: true 
    },
    include: {
      category: true,
      productComboItems: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Combos</h2>
        <p className="text-muted-foreground">Manage meal combinations and special offers.</p>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Combo Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Included Items</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">No combos found</TableCell>
              </TableRow>
            ) : (
              combos.map((combo) => (
                <TableRow key={combo.id}>
                  <TableCell className="font-bold">{combo.name}</TableCell>
                  <TableCell>{combo.category.name}</TableCell>
                  <TableCell>₹{Number(combo.price).toFixed(2)}</TableCell>
                  <TableCell>
                    <ul className="list-disc ml-4 text-sm">
                      {combo.productComboItems.map(item => (
                        <li key={item.id}>{item.quantity}x {item.product.name}</li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell>
                    {combo.isAvailable ? <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
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
