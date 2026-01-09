-- CreateEnum
CREATE TYPE "MovimientoTipo" AS ENUM ('GASTO', 'ENTRADA', 'SALIDA', 'SALIDA_RUTA', 'ENTRADA_RUTA');

-- CreateTable
CREATE TABLE "Caja" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" "MovimientoTipo" NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "nota" TEXT,

    CONSTRAINT "Caja_pkey" PRIMARY KEY ("id")
);
