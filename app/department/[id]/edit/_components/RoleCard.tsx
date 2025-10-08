import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Pencil } from "lucide-react";

export const RoleCard = ({ role, onSetLimit }) => {

  const formatPlacement = (placement: string) => {
    return placement.charAt(0) + placement.slice(1).toLowerCase();
  };

  return (
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
                {role.placementLimits.map(({placement, limit, limitId, hasLimit}, index) => (
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
                        <Pencil size={16} onClick={() => onSetLimit(role)}/>
                        </div>
                        
                      ) : (
                        <div className="flex justify-between">
                        <span className="px-2 text-red-700">
                          Set Limit
                        </span>
                        <Pencil size={16} onClick={() => onSetLimit(role)} />
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
  );
};

