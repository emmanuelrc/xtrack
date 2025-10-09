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


interface AddRoleDialogProps {
  isDialogOpen: boolean,
  setIsDialogOpen: (open: boolean) => void;
  onOpenChange?: (open: boolean) => void
  onSubmitRole: (roleName: string) => void;
}

export function AddRoleDialog ({isDialogOpen, setIsDialogOpen, onOpenChange, onSubmitRole}: AddRoleDialogProps) {

  const [roleName, setRoleName] = useState("");


  useEffect(() => {
    if (!isDialogOpen) setRoleName("");
  }, [isDialogOpen]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!roleName.trim()) return; // simple guard; add validation as needed
    onSubmitRole(roleName.trim());
    setIsDialogOpen(false);
  };

  const handleCancel: MouseEventHandler<HTMLButtonElement> = () => {
    setIsDialogOpen(false);
  };
  return (
    <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
              <label htmlFor="add-new-role">Add new role</label>
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>            
        <div>
          <form onSubmit={handleSubmit} id="add-new-role">
            <Input
              id="role-name" 
              type='text'
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
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