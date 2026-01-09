-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'COBRADOR');

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "direccionNegocio" TEXT,
    "direccionVivienda" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "alias" TEXT,
    "rol" "Rol" NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL,
    "placaMoto" TEXT,
    "fechaTecnico" TIMESTAMP(3),
    "fechaSoat" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prestamo" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "montoPrestado" DECIMAL(65,30) NOT NULL,
    "tasa" DOUBLE PRECISION NOT NULL,
    "cuotas" INTEGER NOT NULL,
    "cobradorId" INTEGER NOT NULL,
    "notas" TEXT,

    CONSTRAINT "Prestamo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Abono" (
    "id" SERIAL NOT NULL,
    "prestamoId" INTEGER NOT NULL,
    "cobradorId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "tipoPago" TEXT NOT NULL,
    "notas" TEXT,

    CONSTRAINT "Abono_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- AddForeignKey
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prestamo" ADD CONSTRAINT "Prestamo_cobradorId_fkey" FOREIGN KEY ("cobradorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_prestamoId_fkey" FOREIGN KEY ("prestamoId") REFERENCES "Prestamo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_cobradorId_fkey" FOREIGN KEY ("cobradorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
