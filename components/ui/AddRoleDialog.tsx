"use client"
import {
  useCallback,
  useState,
  useEffect,
  type FormEventHandler,
  type MouseEventHandler,
} from "react";
import { Button } from "./button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog"
import { Input } from "./input"
import { WorkerMultiSelect } from "./WorkerMultiSelect";
import { Department } from "@prisma/client";
import { cn } from "@/lib/utils";


interface AddRoleDialogProps {
  isDialogOpen: boolean,
  setIsDialogOpen: (open: boolean) => void;
  onOpenChange?: (open: boolean) => void
  onSubmitRole: (submitData: { roleName: string; workerIds: number[], departmentId?: number }) => void;
  departmentId?: number;
  permissionLevel?: 'ALL' | 'DEPARTMENT' | 'WORKER';
  allowedDepartmentIds?: number[] | null;
}

export interface WorkerResponse {
    id: number;
    first_name: string;
    last_name: string;
  }

export function AddRoleDialog ({
  isDialogOpen, 
  setIsDialogOpen, 
  onOpenChange, 
  onSubmitRole,
  departmentId,
  permissionLevel = 'WORKER',
  allowedDepartmentIds = null
}: AddRoleDialogProps) {

  
  const [roleName, setRoleName] = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState<WorkerResponse[]>([]);
  const [multiOpen, setMultiOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Department selection state is only used for workers with [ALL] persmissions
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>(undefined);
  const [departments, setDepartments] = useState<Pick<Department, 'id' | 'name'>[]>([]);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false);

  const showDepartmentSelector = departmentId === undefined && permissionLevel === 'ALL';

  // The actual department ID to use (from props or selected)
  const effectiveDepartmentId = departmentId ?? selectedDepartmentId ?? (Array.isArray(allowedDepartmentIds) ? allowedDepartmentIds[0] : undefined);

  // Fetch departments if we need to show the selector
  useEffect(() => {
    if (showDepartmentSelector && isDialogOpen && departments.length === 0) {
      setIsDepartmentsLoading(true);
      fetch('/api/departments')
        .then(res => res.json())
        .then(data => {
          setDepartments(data);
          setIsDepartmentsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching departments:', err);
          setIsDepartmentsLoading(false);
        });
    }
  }, [showDepartmentSelector, isDialogOpen, departments.length]);


  const fetchWorkersApi = useCallback(async (q: string): Promise<WorkerResponse[]> => {
    if (!effectiveDepartmentId) return [];
    try {
      console.log('effective dept', effectiveDepartmentId)
      // TODO: decide if filtering by department is even necessary
      const params = new URLSearchParams({
        q,
        departmentId: effectiveDepartmentId.toString(),
      });
      const res = await fetch(`/api/workers?${params}`);
      if (!res.ok) throw new Error('Failed to fetch workers');
      return await res.json();
    } catch (e) {
      console.error('Error fetching workers:', e);
      return [];
    }
  }, [departmentId, selectedDepartmentId, effectiveDepartmentId]);

  useEffect(() => {
    if (!isDialogOpen) setRoleName("");
  }, [isDialogOpen]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitRole({
        roleName: roleName.trim(),
        workerIds: selectedWorkers.map((w) => w.id ?? 0),
        departmentId: effectiveDepartmentId
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error submitting role:', error);
      // TODO handle error nicely
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel: MouseEventHandler<HTMLButtonElement> = () => {
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
          "sm:max-w-[450px] transition-transform",
          multiOpen ? "translate-y-[-200px]" : "" // move it up when dropdown is open
        )}>
        <DialogHeader>
          <DialogTitle>
              <label htmlFor="add-new-role">Add new role</label>
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>            
        <div>
          <form onSubmit={handleSubmit} id="add-new-role">

          {/* Department Selector - only shown for users with the right permissions */}
            {showDepartmentSelector && (
              <div className="mb-4">
                <label htmlFor="department-select" className="text-sm font-medium">
                  Department
                </label>
                <select
                  id="department-select"
                  value={selectedDepartmentId ?? ''}
                  onChange={(e) => {
                    setSelectedDepartmentId(e.target.value ? Number(e.target.value) : undefined);
                    // Reset workers when department changes
                    setSelectedWorkers([]);
                  }}
                  disabled={isDepartmentsLoading || isSubmitting}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select a department...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <label htmlFor="role-name" className="text-sm font-medium">Role name</label>
            <Input
              id="role-name" 
              type='text'
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="mb-4"
              required
            />
        <div className="space-y-1 mb-10">
            <label className="text-sm font-medium">Assign workers</label>
            <WorkerMultiSelect
              value={selectedWorkers}
              onChange={setSelectedWorkers}
              fetchWorkers={fetchWorkersApi}
              placeholder="Type a name"
              multiOpen = {multiOpen}
              setMultiOpen={setMultiOpen}
            />
        </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type='submit' 
              className="bg-green-700"
              disabled={isSubmitting}
            > 
              {isSubmitting ? 'Creating...' : 'OK'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}