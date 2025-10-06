'use client'
import { useParams } from "next/navigation";
import { useEffect } from "react";


export default function DepartmentEditPage() {
  const params = useParams(); 
  const departmentId = params.id;



  return <h1>Department: {departmentId}</h1>;
}