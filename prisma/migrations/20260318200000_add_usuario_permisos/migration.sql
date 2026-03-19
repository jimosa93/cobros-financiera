-- Enum Permiso already exists from a previous migration
-- CreateTable
CREATE TABLE IF NOT EXISTS "UsuarioPermiso" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "permiso" "Permiso" NOT NULL,

    CONSTRAINT "UsuarioPermiso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UsuarioPermiso_usuarioId_idx" ON "UsuarioPermiso"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UsuarioPermiso_usuarioId_permiso_key" ON "UsuarioPermiso"("usuarioId", "permiso");

-- AddForeignKey (only if constraint does not exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UsuarioPermiso_usuarioId_fkey'
  ) THEN
    ALTER TABLE "UsuarioPermiso" ADD CONSTRAINT "UsuarioPermiso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
