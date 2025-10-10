'use client'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";

export const RoleCard = ({ role, onSetLimit }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [selectedLimit, setSelectedLimit] = useState(null);
  const [limitValue, setLimitValue] = useState("");

  const formatPlacement = (placement: string) => {
    return placement.charAt(0) + placement.slice(1).toLowerCase();
  };

  const handlePencilClick = (placement, currentLimit, limitId) => {
    setSelectedPlacement(placement);
    setSelectedLimit(limitId);
    setLimitValue(String(currentLimit) || "");
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    const floatValue = parseFloat(limitValue);
    if (limitValue && floatValue) {
      onSetLimit({
        roleId: role.id, 
        limitId: selectedLimit, 
        limitValue: floatValue, 
        placement: selectedPlacement})
      setIsDialogOpen(false);
      setLimitValue("");
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setLimitValue("");
  };

  return (
    <>
      <Card className="my-2 bg-gray-200 shadow-md">
        <h2 className="m-auto">{role.name}</h2>
        <CardContent className="py-0 m-0">
          {role.placementLimits.length === 0 ? (
            <p>No dosimeters assigned</p>
          ) : (
            <Table className="my-0 min-w-full w-full text-sm border-collapse table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead>Dosimeter Type</TableHead>
                  <TableHead>Dose Limit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {role.placementLimits.map(({ placement, limit, limitId, hasLimit }, index) => (
                  <TableRow key={limitId || index}>
                    <TableCell>
                      {formatPlacement(placement)}
                    </TableCell>
                    <TableCell>
                      {hasLimit ? (
                        <div className="flex justify-between">
                          <span className="px-2">
                            {limit} mSv
                          </span>
                          <Pencil 
                            size={16} 
                            onClick={() => handlePencilClick(placement, limit, limitId)}
                            className="cursor-pointer"
                          />
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="px-2 text-red-700">
                            Set Limit
                          </span>
                          <Pencil 
                            size={16} 
                            onClick={() => handlePencilClick(placement, null, null)}
                            className="cursor-pointer"
                          />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle><label htmlFor="doseLimit">Set the dose limit for {`${selectedPlacement 
              ? formatPlacement(selectedPlacement)
              : ''}`}  dosimeter </label></DialogTitle>
            <DialogDescription/>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                id="doseLimit"
                type="number"
                step="0.01"
                value={limitValue}
                onChange={(e) => setLimitValue(e.target.value)}
                placeholder="Enter dose limit"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleConfirm}  className="bg-green-700">
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};