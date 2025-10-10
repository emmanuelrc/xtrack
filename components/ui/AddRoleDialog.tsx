"use client"
import {
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


// TODO: replace with API call when ready
async function fetchWorkersApi(q: string): Promise<Partial<Worker>[]> {
  // Example: call `/api/workers?q=${encodeURIComponent(q)}`
  const all: Partial<Worker>[] = [
    { id: 1, first_name: "Alice", last_name: "Johnson"},
    { id: 2, first_name: "Bob", last_name: "Smith"},
    { id: 3, first_name: "Clive", last_name: "Peters"},
    { id: 4, first_name: "Dana", last_name: "Scully"},
    { id: 5, first_name: "Alice", last_name: "Peters"},
  ];
  if (!q) return all.slice(0, 10);
  const qq = q.toLowerCase();
  return all.filter(
    (w) => w.first_name && w.first_name.toLowerCase().includes(qq)
  );
}


interface AddRoleDialogProps {
  isDialogOpen: boolean,
  setIsDialogOpen: (open: boolean) => void;
  onOpenChange?: (open: boolean) => void
  onSubmitRole: (submitData: { roleName: string; workerIds: number[] }) => void;
}

export function AddRoleDialog ({isDialogOpen, setIsDialogOpen, onOpenChange, onSubmitRole}: AddRoleDialogProps) {

  const [roleName, setRoleName] = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState<Partial<Worker>[]>([]);
  const [multiOpen, setMultiOpen] = useState(false)

  useEffect(() => {
    if (!isDialogOpen) setRoleName("");
  }, [isDialogOpen]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!roleName.trim()) return; // simple guard; add validation as needed
    onSubmitRole({
      roleName: roleName.trim(),
      workerIds: selectedWorkers.map((w) => w.id??0),
    }
    );
    setIsDialogOpen(false);
  };

  const handleCancel: MouseEventHandler<HTMLButtonElement> = () => {
    setIsDialogOpen(false);
  };
  /**
   * {cn(
          "sm:max-w-[480px] transition-transform",
          multiOpen ? "translate-y-[-8%]" : "" // move it up when dropdown is open
        )}

        "sm:max-w-[425px] mt-[-100px]"
   */

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
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type='submit' className="bg-green-700" > OK </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}