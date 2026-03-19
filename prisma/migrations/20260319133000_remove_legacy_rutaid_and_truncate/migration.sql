-- Data reset requested for test environment.
TRUNCATE TABLE
  "Abono",
  "Prestamo",
  "Caja",
  "UsuarioPermiso",
  "UsuarioRuta",
  "ClienteRuta",
  "Usuario",
  "Cliente",
  "Ruta"
RESTART IDENTITY CASCADE;

DROP INDEX IF EXISTS "Usuario_rutaId_idx";
DROP INDEX IF EXISTS "Cliente_rutaId_idx";

ALTER TABLE "Usuario" DROP CONSTRAINT IF EXISTS "Usuario_rutaId_fkey";
ALTER TABLE "Cliente" DROP CONSTRAINT IF EXISTS "Cliente_rutaId_fkey";

ALTER TABLE "Usuario" DROP COLUMN IF EXISTS "rutaId";
ALTER TABLE "Cliente" DROP COLUMN IF EXISTS "rutaId";
