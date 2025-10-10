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
import { Worker } from "@prisma/client";
import { cn } from "@/lib/utils";


interface AddRoleDialogProps {
  isDialogOpen: boolean,
  setIsDialogOpen: (open: boolean) => void;
  onOpenChange?: (open: boolean) => void
  onSubmitRole: (submitData: { roleName: string; workerIds: number[] }) => void;
  departmentId: number;
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
  departmentId
}: AddRoleDialogProps) {

  
  const [roleName, setRoleName] = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState<WorkerResponse[]>([]);
  const [multiOpen, setMultiOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);



  const fetchWorkersApi = useCallback(async (q: string): Promise<WorkerResponse[]> => {
  try {
    const params = new URLSearchParams({
      q,
      departmentId: departmentId.toString(),
    });
    const res = await fetch(`/api/workers?${params}`);
    if (!res.ok) throw new Error('Failed to fetch workers');
    return await res.json();
  } catch (e) {
    console.error('Error fetching workers:', e);
    return [];
  }
}, [departmentId]);

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
            <label htmlFor="role-name" className="text-sm font-medium">Role name</label>
            <Input
              id="role-name" 
              type='text'
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="mb-4"
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