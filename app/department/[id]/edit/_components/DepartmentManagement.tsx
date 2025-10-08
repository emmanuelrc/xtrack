'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RoleCard } from './RoleCard';
import { RoleWithLimits } from '@/lib/db/departments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


interface DepartmentWithRoles {
  id: number;
  name: string;
  roles: RoleWithLimits[];
}

interface DepartmentManagementProps {
  departmentId: number;
}
export default function DepartmentManagement({ departmentId }: DepartmentManagementProps) {

  const [department, setDepartment] = useState<DepartmentWithRoles | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);

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

  // TODO: add interactive elements
  const handleAddRole = () => {
    setShowAddRoleModal(true);
  };
  const handleSetLimit = (role) => {
    console.log('setLimitClicked', role)
  }

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
        {/* TODO: implement the modal (see below for logic) */}
          <Button className="
            bg-white text-black
            rounded-full
            px-4 py-1 
            min-w-full
            text-sm font-medium
          " onClick={handleAddRole}>+ Add Role</Button>
      </div>

        {department?.roles.map((role: RoleWithLimits) => (
          <RoleCard
            key={role.id}
            role={role}
            onSetLimit={handleSetLimit}
          />
        ))}

      {/* TODO: add role modal */}
      {showAddRoleModal && (
        <div>
          <h3>Add New Role</h3>
          <button onClick={() => setShowAddRoleModal(false)}>
            Close
          </button>
          {/* TODO: add form*/}
        </div>
      )}
    </main>
  );
}