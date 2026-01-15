-- CreateEnum
CREATE TYPE "EstadoPrestamo" AS ENUM ('ACTIVO', 'INACTIVO', 'CANCELADO');

-- AlterTable: add estado to Prestamo with default ACTIVO
ALTER TABLE "Prestamo" ADD COLUMN "estado" "EstadoPrestamo" NOT NULL DEFAULT 'ACTIVO';

-- CreateIndex
CREATE INDEX "Prestamo_estado_index" ON "Prestamo"("estado");

