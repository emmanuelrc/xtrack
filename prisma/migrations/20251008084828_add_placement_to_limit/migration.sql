/*
  Warnings:

  - Added the required column `placement` to the `Limit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Limit" ADD COLUMN     "placement" "Placement" NOT NULL;

-- Add unique constraint
ALTER TABLE "Limit" ADD CONSTRAINT "Limit_role_id_department_id_placement_key" UNIQUE ("role_id", "department_id", "placement");