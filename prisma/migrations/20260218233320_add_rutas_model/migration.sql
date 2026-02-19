/*
  Warnings:

  - Added the required column `rutaId` to the `Cliente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rutaId` to the `Prestamo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Ruta" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ruta_pkey" PRIMARY KEY ("id")
);

-- Insert default route for existing data
INSERT INTO "Ruta" ("nombre", "activo", "fechaCreacion") 
VALUES ('Ruta Principal', true, CURRENT_TIMESTAMP);

-- AlterTable - Add columns with default value pointing to the first route
ALTER TABLE "Cliente" ADD COLUMN "rutaId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Prestamo" ADD COLUMN "rutaId" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Usuario" ADD COLUMN "rutaId" INTEGER;
ALTER TABLE "Caja" ADD COLUMN "rutaId" INTEGER;

-- Remove default constraint after data migration
ALTER TABLE "Cliente" ALTER COLUMN "rutaId" DROP DEFAULT;
ALTER TABLE "Prestamo" ALTER COLUMN "rutaId" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Caja_rutaId_idx" ON "Caja"("rutaId");

-- CreateIndex
CREATE INDEX "Cliente_rutaId_idx" ON "Cliente"("rutaId");

-- CreateIndex
CREATE INDEX "Prestamo_rutaId_idx" ON "Prestamo"("rutaId");

-- CreateIndex
CREATE INDEX "Usuario_rutaId_idx" ON "Usuario"("rutaId");

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Prestamo_estado_index" RENAME TO "Prestamo_estado_idx";
