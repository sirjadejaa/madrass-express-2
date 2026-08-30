"use client";

import { useState } from "react";
import { User, Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => { setEditingStaff(null); setIsFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Staff
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((staff) => (
              <TableRow key={staff.id}>
                <TableCell className="font-medium">{staff.name || "N/A"}</TableCell>
                <TableCell>{staff.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{staff.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={staff.isActive ? "default" : "destructive"}>
                    {staff.isActive ? "Active" : "Disabled"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    onClick={() => { setEditingStaff(staff); setIsFormOpen(true); }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant={staff.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleToggleStatus(staff.id, staff.isActive)}
                  >
                    {staff.isActive ? "Disable" : "Enable"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <StaffForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        initialData={editingStaff}
        restaurantId={restaurantId}
      />
    </>
  );
}
