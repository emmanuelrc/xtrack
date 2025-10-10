'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RoleCard } from './RoleCard';
import { PlacementLimit, RoleWithLimits } from '@/lib/db/departments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Placement } from '@prisma/client';
import { AddRoleDialog } from '@/components/ui/AddRoleDialog';


interface DepartmentWithRoles {
  id: number;
  name: string;
  roles: RoleWithLimits[];
}

interface DepartmentManagementProps {
  departmentId: number;
}

interface ServerLimit { 
  id: number;
  placement: Placement; 
  limitDoseMSv: number;
  hasLimit: boolean 
};


export default function DepartmentManagement({ departmentId }: DepartmentManagementProps) {

  const [department, setDepartment] = useState<DepartmentWithRoles | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);


  const fetchDepartmentData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/departments/${departmentId}/edit`);
      if (!res.ok) throw new Error('Failed to fetch department data');
      const department = await res.json();
      setDepartment(department);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentData();
  }, [departmentId]);


  /**
   * Logic for adding a new role
   */
  const handleAddRoleClick = () => {
    setIsDialogOpen(true);

  } 

  const handleSubmitRole = ({roleName, workerIds}:{ 
    roleName: string; 
    workerIds: number[] 
  } ) => {
    console.log('adding', roleName, workerIds);
  };


  /**
   * Logic for setting a new limit
  */
  const handleSetLimit = async ({roleId, limitId, limitValue, placement}) => {
    console.log('setLimitClicked',{roleId, limitId, limitValue} )
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    try {
      const res = await fetch(`${baseUrl}/api/limits`, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          departmentId: department?.id,
          limitId,
          roleId,
          placement,
          limitDoseMSv: limitValue,
  
        })
      })
      const updatedLimit: ServerLimit = await res.json();
      const nextLimit: PlacementLimit = {
        limitId: updatedLimit.id, 
        placement: updatedLimit.placement, 
        limit: updatedLimit.limitDoseMSv, 
        hasLimit: true};
      console.log(updatedLimit, nextLimit)
      
      applyServerLimit(roleId, nextLimit);


    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  // TODO: might be worth refactoring the state to make the update less convoluted
  function applyServerLimit (roleId: number, updatedLimit: PlacementLimit) {
    setDepartment(prevState => {
        if (!prevState) return null;
        return ({
          ...prevState,
          roles: prevState.roles.map(role => (
            role.id !== roleId
              ? role
              : {...role, placementLimits: upsertPlacementLimits(role.placementLimits, updatedLimit)}
          ))
        })
    })};
  function upsertPlacementLimits (limits: PlacementLimit[], updatedLimit: PlacementLimit): PlacementLimit[] {
    try {
      const idx = limits.findIndex(existingLimit => existingLimit.placement === updatedLimit.placement);
      
      if (idx === -1) throw new Error("can't find the old limit");

      // [{ placement: "EYE" }] => [{ placement: "EYE", limit: 7, limitId: 28, hasLimit: true }]
      const nextLimits = [...limits];
  
      nextLimits[idx] = { ...nextLimits[idx], ...updatedLimit };
      return nextLimits;
    } catch (e) {
      console.error(e);
      return limits;
    }

  }

  /**
   * Misc. logic for abnormal states
   */

  if (isLoading) {
    // TODO: add a nice loading component
    return <div>Loading...</div>;
  }

  if (error) {
    // TODO: show error in a nicer fashion
    return <div>Error: {error}</div>;
  }

  return (
    <main className="max-w-sm mx-auto p-4 h-screen overflow-y-auto">
      {/* TODO: extract components */}

      <nav className="flex justify-between">
      <h1 className="text-xl text-green-700 mb-[1rem]">
          {department?.name}
      </h1>
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>      
      </nav>
      <div>
          <Button className="
            bg-gray-200 text-black
            hover:bg-white
            hover:border-gray-200
            hover:border-2
            rounded-full
            px-4 py-1 
            min-w-full
            text-sm font-medium" 
            onClick={handleAddRoleClick}>+ Add Role</Button>
      </div>

        {department?.roles.map((role: RoleWithLimits) => (
          role && <RoleCard
            key={role.id}
            role={role}
            onSetLimit={handleSetLimit}
          />
        ))}
        <AddRoleDialog
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            onSubmitRole={handleSubmitRole}
        />
    </main>
  );
}