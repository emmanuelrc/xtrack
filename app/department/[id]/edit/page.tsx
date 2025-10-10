'use client'
import { useParams } from "next/navigation";
import DepartmentManagement from "./_components/DepartmentManagement";

export default function DepartmentEditPage() {
  const { id } = useParams();
  
  return <DepartmentManagement departmentId={Number(id)} />;
}
