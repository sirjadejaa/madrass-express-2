import { db } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminAddonsPage() {
  const restaurant = await db.restaurant.findFirst();
  if (!restaurant) return <div className="p-8">No restaurant configured.</div>;

  const optionGroups = await db.productOptionGroup.findMany({
    where: { product: { restaurantId: restaurant.id } },
    include: {
      product: true,
      options: true,
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Add-ons & Option Groups</h2>
        <p className="text-muted-foreground">Manage product customizations and extras.</p>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group Name</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Rules</TableHead>
              <TableHead>Options</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {optionGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">No add-ons found</TableCell>
              </TableRow>
            ) : (
              optionGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>{group.product.name}</TableCell>
                  <TableCell>
                    {group.isRequired ? <Badge variant="destructive" className="mr-1">Required</Badge> : <Badge variant="secondary" className="mr-1">Optional</Badge>}
                    <span className="text-xs text-muted-foreground ml-1">
                      (Min: {group.minSelections}, Max: {group.maxSelections || 'Any'})
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {group.options.map(opt => (
                        <Badge key={opt.id} variant="outline">
                          {opt.name} (+₹{Number(opt.price)})
                        </Badge>
                      ))}
                    </div>
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
