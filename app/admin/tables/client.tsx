"use client";

import { useState, useMemo } from "react";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  QrCode,
  Edit,
  Trash2,
  Search,
  Printer,
  Users,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
} from "lucide-react";
import { TableQRDialog } from "./table-qr-dialog";
import {
  createTableAction,
  updateTableAction,
  deleteTableAction,
} from "./actions";
import { QRCodeCanvas } from "qrcode.react";

export type AdminTable = {
  id: string;
  number: string;
  capacity: number | null;
  description: string | null;
  qrToken: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    orders: number;
  };
};

interface TablesClientProps {
  initialTables: AdminTable[];
  restaurant: {
    id: string;
    name: string;
  };
}

export function TablesClient({ initialTables, restaurant }: TablesClientProps) {
  const { toast } = useToast();
  const [tables, setTables] = useState<AdminTable[]>(initialTables);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Dialog states
  const [selectedQRTable, setSelectedQRTable] = useState<AdminTable | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<AdminTable | null>(null);

  // Form states
  const [formNumber, setFormNumber] = useState("");
  const [formCapacity, setFormCapacity] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchesSearch =
        table.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (table.description &&
          table.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && table.isActive) ||
        (statusFilter === "INACTIVE" && !table.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [tables, searchQuery, statusFilter]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setFormNumber("");
    setFormCapacity("4");
    setFormDescription("");
    setIsCreateOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNumber.trim()) {
      toast({
        title: "Validation error",
        description: "Table number is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createTableAction({
        number: formNumber.trim(),
        capacity: formCapacity ? parseInt(formCapacity, 10) : undefined,
        description: formDescription.trim() || undefined,
        restaurantId: restaurant.id,
      });

      if (res.error) {
        toast({
          title: "Error creating table",
          description: res.error,
          variant: "destructive",
        });
      } else if (res.table) {
        setTables((prev) => [...prev, res.table as AdminTable]);
        setIsCreateOpen(false);
        toast({
          title: "Table created",
          description: `Table ${res.table.number} has been created with a secure QR code.`,
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create table.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = (table: AdminTable) => {
    setEditingTable(table);
    setFormNumber(table.number);
    setFormCapacity(table.capacity ? table.capacity.toString() : "");
    setFormDescription(table.description || "");
    setIsEditOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable || !formNumber.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await updateTableAction(editingTable.id, {
        number: formNumber.trim(),
        capacity: formCapacity ? parseInt(formCapacity, 10) : null,
        description: formDescription.trim() || null,
      });

      if (res.error) {
        toast({
          title: "Update failed",
          description: res.error,
          variant: "destructive",
        });
      } else {
        setTables((prev) =>
          prev.map((t) =>
            t.id === editingTable.id
              ? {
                  ...t,
                  number: formNumber.trim(),
                  capacity: formCapacity ? parseInt(formCapacity, 10) : null,
                  description: formDescription.trim() || null,
                }
              : t
          )
        );
        setIsEditOpen(false);
        toast({
          title: "Table updated",
          description: `Table ${formNumber} updated successfully.`,
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update table.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active
  const handleToggleActive = async (table: AdminTable) => {
    const newStatus = !table.isActive;
    try {
      const res = await updateTableAction(table.id, { isActive: newStatus });
      if (res.error) {
        toast({
          title: "Status change failed",
          description: res.error,
          variant: "destructive",
        });
      } else {
        setTables((prev) =>
          prev.map((t) => (t.id === table.id ? { ...t, isActive: newStatus } : t))
        );
        toast({
          title: newStatus ? "Table Activated" : "Table Deactivated",
          description: `Table ${table.number} is now ${newStatus ? "active" : "inactive"}.`,
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update table status.",
        variant: "destructive",
      });
    }
  };

  // Delete Table
  const handleDeleteTable = async (table: AdminTable) => {
    if (
      !confirm(
        `Are you sure you want to delete Table ${table.number}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await deleteTableAction(table.id);
      if (res.error) {
        toast({
          title: "Cannot delete table",
          description: res.error,
          variant: "destructive",
        });
      } else {
        setTables((prev) => prev.filter((t) => t.id !== table.id));
        toast({
          title: "Table deleted",
          description: `Table ${table.number} was removed.`,
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete table.",
        variant: "destructive",
      });
    }
  };

  // Rotate QR Token
  const handleTokenRotated = (newQrToken: string) => {
    if (selectedQRTable) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedQRTable.id ? { ...t, qrToken: newQrToken } : t
        )
      );
      setSelectedQRTable((prev) => (prev ? { ...prev, qrToken: newQrToken } : null));
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-zinc-200/50 print:hidden">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950">
            Table Management & QR Codes
          </h2>
          <p className="text-xs sm:text-sm font-medium text-zinc-500 mt-1">
            Manage your dining tables, generate cryptographically secure QR cards, and monitor table status.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setIsBulkPrintOpen(true)}
            className="flex-1 sm:flex-none border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs sm:text-sm h-9 sm:h-10"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
            Bulk Print
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm h-9 sm:h-10 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
        <div className="relative w-full sm:w-72 md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-zinc-200 text-xs sm:text-sm h-9 sm:h-10"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <Button
            variant={statusFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ALL")}
            className="text-xs h-8 shrink-0"
          >
            All ({tables.length})
          </Button>
          <Button
            variant={statusFilter === "ACTIVE" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ACTIVE")}
            className="text-xs h-8 shrink-0 text-emerald-700 border-emerald-200"
          >
            Active ({tables.filter((t) => t.isActive).length})
          </Button>
          <Button
            variant={statusFilter === "INACTIVE" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("INACTIVE")}
            className="text-xs h-8 shrink-0 text-red-700 border-red-200"
          >
            Inactive ({tables.filter((t) => !t.isActive).length})
          </Button>
        </div>
      </div>

      {/* Mobile Card View (320px - 639px) */}
      <div className="grid grid-cols-1 gap-3 sm:hidden print:hidden">
        {filteredTables.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 bg-white rounded-2xl border border-zinc-200 font-medium text-xs">
            No tables found. Tap &quot;Add Table&quot; to create one.
          </div>
        ) : (
          filteredTables.map((table) => (
            <div
              key={table.id}
              className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-black text-zinc-950 bg-amber-500/10 text-amber-700 border border-amber-500/20 px-3 py-1.5 rounded-xl text-base">
                    {table.number}
                  </span>
                  <span className="text-xs text-zinc-500 font-semibold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {table.capacity ? `${table.capacity} Seats` : "—"}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleActive(table)}
                  className="focus:outline-none"
                  title="Toggle table status"
                >
                  {table.isActive ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs py-0.5">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-bold text-xs py-0.5">
                      <XCircle className="w-3 h-3 mr-1" /> Inactive
                    </Badge>
                  )}
                </button>
              </div>

              {table.description && (
                <p className="text-xs text-zinc-500 line-clamp-2">
                  {table.description}
                </p>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedQRTable(table)}
                  className="flex-1 h-9 text-xs font-bold text-amber-700 border-amber-200 hover:bg-amber-50 gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-600" />
                  View QR Card
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(table)}
                  className="h-9 px-3 text-xs font-semibold text-zinc-600 hover:text-zinc-950 border border-zinc-200 rounded-lg"
                >
                  <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTable(table)}
                  className="h-9 px-2 text-xs font-semibold text-zinc-400 hover:text-red-600 rounded-lg"
                  title="Delete Table"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Tables List (>= 640px) */}
      <div className="hidden sm:block rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <TableComponent>
            <TableHeader className="bg-zinc-50/80 border-b border-zinc-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">
                  Table Number
                </TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">
                  Capacity
                </TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">
                  Status
                </TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">
                  Secure QR
                </TableHead>
                <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">
                  Notes / Description
                </TableHead>
                <TableHead className="text-right font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100">
              {filteredTables.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center h-40 text-zinc-400 font-medium"
                  >
                    No tables found. Click "Add Table" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTables.map((table) => (
                  <TableRow
                    key={table.id}
                    className="hover:bg-zinc-50/50 transition-colors group border-none"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-zinc-950 bg-amber-500/10 text-amber-700 border border-amber-500/20 px-3 py-1.5 rounded-xl text-base">
                          {table.number}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1.5 text-zinc-600 text-sm font-medium">
                        <Users className="w-4 h-4 text-zinc-400" />
                        {table.capacity ? `${table.capacity} Seats` : "—"}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <button
                        onClick={() => handleToggleActive(table)}
                        className="inline-flex items-center gap-1.5 cursor-pointer focus:outline-none"
                        title="Click to toggle status"
                      >
                        {table.isActive ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-2.5 py-0.5 hover:bg-emerald-100"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 font-bold px-2.5 py-0.5 hover:bg-red-100"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Inactive
                          </Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedQRTable(table)}
                        className="h-8 gap-1.5 text-xs font-semibold text-zinc-700 hover:text-amber-700 hover:border-amber-300"
                      >
                        <QrCode className="w-3.5 h-3.5 text-amber-600" />
                        View QR Card
                      </Button>
                    </TableCell>
                    <TableCell className="py-4 max-w-xs truncate text-xs text-zinc-500">
                      {table.description || "—"}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(table)}
                          className="h-8 w-8 text-zinc-500 hover:text-zinc-950"
                          title="Edit Table"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTable(table)}
                          className="h-8 w-8 text-zinc-400 hover:text-red-600"
                          title="Delete Table"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </TableComponent>
        </div>
      </div>

      {/* Individual QR Dialog */}
      <TableQRDialog
        table={selectedQRTable}
        restaurantName={restaurant.name}
        isOpen={!!selectedQRTable}
        onClose={() => setSelectedQRTable(null)}
        onTokenRotated={handleTokenRotated}
      />

      {/* Create Table Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-md p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription>
              Create a dining table. A cryptographically secure QR token will be generated automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-number">Table Number / Name *</Label>
              <Input
                id="create-number"
                placeholder="e.g., T11, Patio 3, Booth A"
                value={formNumber}
                onChange={(e) => setFormNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-capacity">Seating Capacity</Label>
              <Input
                id="create-capacity"
                type="number"
                min="1"
                placeholder="4"
                value={formCapacity}
                onChange={(e) => setFormCapacity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-desc">Description / Notes (Optional)</Label>
              <Textarea
                id="create-desc"
                placeholder="e.g., Near window, family section"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                {isSubmitting ? "Creating..." : "Create Table"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Table Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-md p-4 sm:p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Table {editingTable?.number}</DialogTitle>
            <DialogDescription>
              Update table details or seating information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-number">Table Number / Name *</Label>
              <Input
                id="edit-number"
                value={formNumber}
                onChange={(e) => setFormNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-capacity">Seating Capacity</Label>
              <Input
                id="edit-capacity"
                type="number"
                min="1"
                value={formCapacity}
                onChange={(e) => setFormCapacity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-desc">Description / Notes</Label>
              <Textarea
                id="edit-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Print Sheet Dialog */}
      <Dialog open={isBulkPrintOpen} onOpenChange={setIsBulkPrintOpen}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-4xl max-h-[92dvh] overflow-y-auto p-4 sm:p-6 rounded-2xl print:max-w-none print:p-0 print:border-none print:shadow-none">
          <DialogHeader className="print:hidden">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-600" />
              Bulk QR Print Sheet ({tables.filter((t) => t.isActive).length} Active Tables)
            </DialogTitle>
            <DialogDescription>
              Printable grid of table tent cards for all active dining tables.
            </DialogDescription>
          </DialogHeader>

          {/* Grid of Printable Table Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 print:grid-cols-2 print:gap-4 print:p-0">
            {tables
              .filter((t) => t.isActive)
              .map((table) => {
                const qrUrl = table.qrToken
                  ? `${origin}/m/t/${table.qrToken}`
                  : `${origin}/m/t/not-configured`;

                return (
                  <div
                    key={table.id}
                    className="border-2 border-zinc-200 rounded-3xl p-6 flex flex-col items-center text-center bg-white shadow-sm print:border-2 print:border-black print:rounded-2xl print:break-inside-avoid print:shadow-none"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center">
                        <UtensilsCrossed className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-black text-sm tracking-tight text-zinc-900 uppercase">
                        {restaurant.name}
                      </span>
                    </div>

                    <div className="mb-4">
                      <span className="inline-block bg-zinc-950 text-white font-black text-xl px-4 py-1.5 rounded-xl print:bg-black print:text-white">
                        TABLE {table.number}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-zinc-100 shadow-inner mb-4 print:border-black">
                      <QRCodeCanvas
                        value={qrUrl}
                        size={150}
                        level="H"
                        includeMargin={true}
                      />
                    </div>

                    <p className="font-extrabold text-xs text-zinc-900 tracking-tight">
                      Scan to View Menu & Order
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 print:text-zinc-600">
                      Point phone camera at QR code
                    </p>
                    <span className="text-[8px] font-mono text-zinc-400 mt-2 truncate max-w-[200px] print:text-zinc-600">
                      {qrUrl}
                    </span>
                  </div>
                );
              })}
          </div>

          <DialogFooter className="print:hidden pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsBulkPrintOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => window.print()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print All Cards
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
