// components/ui/AddRoleSection.tsx
"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AddRoleDialog } from "@/components/ui/AddRoleDialog";

export function AddRoleSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const handleSubmitRole = async (submitData: { 
    roleName: string; 
    workerIds: number[];
    departmentId?: number;
  }) => {
    try {
      if (!submitData.departmentId) {
        throw new Error('department id is required')
      }
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create role');
      }

      const newRole = await response.json();
      console.log('Role created:', newRole);
      
      // Refresh server components without full reload
      router.refresh();
      
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  };

  return (
    <>
      <Button 
        className="
          bg-gray-200 text-black
          rounded-full
          px-4 py-1 
          min-w-full
          text-sm font-medium
        "
        onClick={() => setIsDialogOpen(true)}
      >
        Add Role
      </Button>

      <AddRoleDialog
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmitRole={handleSubmitRole}
      />
    </>
  );
}