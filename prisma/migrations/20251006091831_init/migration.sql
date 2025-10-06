/*
  Warnings:

  - You are about to alter the column `limit_dose_mSv` on the `Limit` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,3)`.
  - You are about to alter the column `dose_mSv_chest` on the `Reading` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,3)`.
  - You are about to alter the column `dose_mSv_eye` on the `Reading` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,3)`.
  - You are about to alter the column `dose_mSv_extremities` on the `Reading` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,3)`.
  - You are about to alter the column `dose_mSv_foetal` on the `Reading` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,3)`.
  - You are about to alter the column `total_mSv_chest` on the `Reading` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,3)`.
  - You are about to alter the column `total_mSv_eye` on the `Reading` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,3)`.
  - You are about to alter the column `total_mSv_extremities` on the `Reading` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,3)`.
  - You are about to alter the column `total_mSv_foetal` on the `Reading` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,3)`.

*/
-- AlterTable
ALTER TABLE "Limit" ALTER COLUMN "limit_dose_mSv" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "Reading" ALTER COLUMN "dose_mSv_chest" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "dose_mSv_eye" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "dose_mSv_extremities" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "dose_mSv_foetal" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "total_mSv_chest" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "total_mSv_eye" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "total_mSv_extremities" SET DATA TYPE DECIMAL(10,3),
ALTER COLUMN "total_mSv_foetal" SET DATA TYPE DECIMAL(10,3);
