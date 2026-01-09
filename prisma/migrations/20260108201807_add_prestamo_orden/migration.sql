/*
  Warnings:

  - Added the required column `orden` to the `Prestamo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Prestamo" ADD COLUMN     "orden" INTEGER NOT NULL;
