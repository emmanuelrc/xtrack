'use client';

import { useState, useEffect } from 'react';
import { Placement } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';


export interface RoleCard {
  id: number;
  name: string;
  limitDoseMSv: number;
  activeDosimeterTypes: Placement[];
  workerCount: number;
}

export interface DepartmentWithRoles {
  id: number;
  name: string;
  roles: RoleCard[];
}

interface DepartmentManagementProps {
  departmentId: number;
}

export default function DepartmentManagement({ departmentId }: DepartmentManagementProps) {
  const [data, setData] = useState<DepartmentWithRoles | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);

  const fetchDepartmentData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/departments/${departmentId}/edit`);
      if (!res.ok) throw new Error('Failed to fetch department data');
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentData();
  }, [departmentId]);

  const handleAddRole = () => {
    setShowAddRoleModal(true);
  };

  if (isLoading) {
    // TODO: add a nice loading component
    return <div>Loading...</div>;
  }

  if (error) {
    // TODO: show error in a nicer fashion
    return <div>Error: {error}</div>;
  }

  if (!data) {
    // TODO: style this
    return <div>No data found</div>;
  }

  return (
    <main className="max-w-sm mx-auto p-4 h-screen overflow-y-auto">
      {/* TODO: extract components */}
      <div>
        <h1 className="text-xl text-green-700 mb-[1rem]">{data.name}</h1>

        {/* TODO: implement the modal (see below for logic) */}
          <Button className="
            bg-white text-black
            rounded-full
            px-4 py-1 
            min-w-full
            text-sm font-medium
          " onClick={handleAddRole}>+ Add Role</Button>
      </div>

      {/* List of role cards */}
      <ul className="space-y-2  overflow-y-auto">
        { data.roles.map((role: RoleCard) => (
            <Card className="bg-gray-200 shadow-md min-w-full my-2" key={role.id}>
              <CardContent>
                <h2 className="text-green-700">{role.name}</h2>
                <div className='flex justify-between'>
                <h3>Dosimeter Types:</h3>
                  {role.activeDosimeterTypes.length > 0 ? (
                  <ul className='flex'>
                    {role.activeDosimeterTypes.map((type) => (
                      <li key={type} className="pr-2 before:content-['|'] before:pr-2 first:before:content-none">{type}</li>
                    ))}
                  </ul>
                ) : (
                  <span> None assigned</span>
                )}
              </div>
              <div>
                <strong>Dose Limit:</strong> {role.limitDoseMSv} mSv
              </div>
              <div>
                <strong>Workers:</strong> {role.workerCount}
              </div>

                </CardContent>
            </Card>
          ))
        }
      </ul>

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