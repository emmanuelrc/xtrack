// components/ui/AddRoleSection.tsx
"use client"
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AddRoleDialog } from "@/components/ui/AddRoleDialog";

interface AddRoleSectionProps {
  permissionLevel: 'ALL' | 'DEPARTMENT' | 'WORKER';
  allowedDepartmentIds: number[] | null;
}

export function AddRoleSection({ permissionLevel, allowedDepartmentIds }: AddRoleSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const preselectedDepartmentId = useMemo(() => {
    if (permissionLevel === 'DEPARTMENT') {
      const first = Array.isArray(allowedDepartmentIds) ? allowedDepartmentIds[0] : undefined;
      return Number.isFinite(first) ? first : undefined;
    }
    return undefined;
  }, [permissionLevel, allowedDepartmentIds]);

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

  // Hide entry point for WORKER users entirely
  if (permissionLevel === 'WORKER') return null;

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
        // For DEPARTMENT users we pass a fixed departmentId; ALL users omit it
        departmentId={preselectedDepartmentId}
        permissionLevel={permissionLevel}
        allowedDepartmentIds={allowedDepartmentIds}
      />
    </>
  );
}