"use client";

import { useState } from "react";
import { User, Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Shield, User as UserIcon, PowerOff, Power } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StaffForm } from "./staff-form";
import { updateStaff } from "./actions";
import { useToast } from "@/components/ui/use-toast";

interface StaffClientProps {
  data: User[];
  restaurantId: string;
}

export function StaffClient({ data, restaurantId }: StaffClientProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const [editingStaff, setEditingStaff] = useState<User | null>(null);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateStaff(id, { isActive: !currentStatus });
      toast({ title: "Status updated successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error updating status" });
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="h-3 w-3 mr-1 text-amber-600" />;
      case "KITCHEN":
      case "KIOSK":
      case "DISPLAY":
        return <UserIcon className="h-3 w-3 mr-1 text-blue-600" />;
      default:
        return <UserIcon className="h-3 w-3 mr-1 text-zinc-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-zinc-200/50">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">Staff Members</h2>
          <p className="text-sm font-medium text-zinc-500 mt-1.5">Manage accounts and roles for your team.</p>
        </div>
        <Button 
          onClick={() => { setEditingStaff(null); setIsFormOpen(true); }} 
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm h-10 px-5 rounded-lg"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Staff
        </Button>
      </div>

      {/* Mobile view: Cards */}
      <div className="grid gap-4 md:hidden">
        {data.map((staff) => (
          <div key={staff.id} className="bg-white rounded-xl border border-zinc-100 p-5 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-zinc-950 flex items-center">
                  {staff.name || "N/A"}
                </h3>
                <p className="text-sm font-medium text-zinc-500 mt-0.5">{staff.email}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline" className="bg-zinc-50 border-zinc-200/60 font-semibold px-2 py-0.5">
                    <span className="flex items-center">
                      {getRoleIcon(staff.role)}
                      {staff.role}
                    </span>
                  </Badge>
                </div>
              </div>
              <Badge variant={staff.isActive ? "default" : "secondary"} className={staff.isActive ? "bg-emerald-500 hover:bg-emerald-600" : "bg-zinc-200 text-zinc-600"}>
                {staff.isActive ? "Active" : "Disabled"}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-100">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 min-h-[40px] border-zinc-200 font-semibold text-zinc-600"
                onClick={() => { setEditingStaff(staff); setIsFormOpen(true); }}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                variant={staff.isActive ? "secondary" : "default"}
                size="sm"
                className={`flex-1 min-h-[40px] font-semibold ${staff.isActive ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                onClick={() => handleToggleStatus(staff.id, staff.isActive)}
              >
                {staff.isActive ? <PowerOff className="mr-2 h-3.5 w-3.5" /> : <Power className="mr-2 h-3.5 w-3.5" />}
                {staff.isActive ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-center py-16 text-zinc-400 bg-white rounded-2xl border border-zinc-100 shadow-sm">
            <p className="font-medium text-sm">No staff found.</p>
          </div>
        )}
      </div>

      {/* Desktop view: Table */}
      <div className="hidden md:block rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/80 border-b border-zinc-100">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Name</TableHead>
              <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Email</TableHead>
              <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Role</TableHead>
              <TableHead className="font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Status</TableHead>
              <TableHead className="text-right font-bold text-zinc-500 uppercase tracking-widest text-[11px] h-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-zinc-100">
            {data.map((staff) => (
              <TableRow key={staff.id} className="hover:bg-zinc-50/50 transition-colors group border-none">
                <TableCell className="py-4 font-bold text-zinc-950">{staff.name || "N/A"}</TableCell>
                <TableCell className="py-4 text-sm font-medium text-zinc-500">{staff.email}</TableCell>
                <TableCell className="py-4">
                  <Badge variant="outline" className="bg-zinc-50 border-zinc-200/60 font-semibold px-2 py-0.5">
                    <span className="flex items-center">
                      {getRoleIcon(staff.role)}
                      {staff.role}
                    </span>
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <Badge variant={staff.isActive ? "default" : "secondary"} className={staff.isActive ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold" : "bg-zinc-100 text-zinc-500 border border-zinc-200/50 font-bold"}>
                    {staff.isActive ? "Active" : "Disabled"}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 text-right">
                  <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                      onClick={() => { setEditingStaff(staff); setIsFormOpen(true); }}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 rounded-lg ${staff.isActive ? 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                      onClick={() => handleToggleStatus(staff.id, staff.isActive)}
                      title={staff.isActive ? "Disable" : "Enable"}
                    >
                      {staff.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-zinc-400 font-medium">
                  No staff found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <StaffForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        initialData={editingStaff}
        restaurantId={restaurantId}
      />
    </div>
  );
}
