import { db } from "@/lib/db";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const restaurant = await db.restaurant.findFirst();
  if (!restaurant) return <div className="p-8">No restaurant configured.</div>;

  const customers = await db.customer.findMany({
    where: { restaurantId: restaurant.id },
    include: {
      _count: {
        select: { orders: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
        <p className="text-muted-foreground">View your customer base and their order history.</p>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Total Orders</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">No customers found</TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name || "—"}</TableCell>
                  <TableCell>{customer.phone || "—"}</TableCell>
                  <TableCell>{customer.email || "—"}</TableCell>
                  <TableCell>{customer._count.orders}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(customer.createdAt), "PP")}
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
