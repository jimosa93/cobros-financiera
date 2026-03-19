-- Enable assigning multiple routes to users and clients.
CREATE TABLE IF NOT EXISTS "UsuarioRuta" (
  "usuarioId" INTEGER NOT NULL,
  "rutaId" INTEGER NOT NULL,
  CONSTRAINT "UsuarioRuta_pkey" PRIMARY KEY ("usuarioId", "rutaId")
);

CREATE TABLE IF NOT EXISTS "ClienteRuta" (
  "clienteId" INTEGER NOT NULL,
  "rutaId" INTEGER NOT NULL,
  CONSTRAINT "ClienteRuta_pkey" PRIMARY KEY ("clienteId", "rutaId")
);

CREATE INDEX IF NOT EXISTS "UsuarioRuta_usuarioId_idx" ON "UsuarioRuta"("usuarioId");
CREATE INDEX IF NOT EXISTS "UsuarioRuta_rutaId_idx" ON "UsuarioRuta"("rutaId");
CREATE INDEX IF NOT EXISTS "ClienteRuta_clienteId_idx" ON "ClienteRuta"("clienteId");
CREATE INDEX IF NOT EXISTS "ClienteRuta_rutaId_idx" ON "ClienteRuta"("rutaId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UsuarioRuta_usuarioId_fkey'
  ) THEN
    ALTER TABLE "UsuarioRuta"
      ADD CONSTRAINT "UsuarioRuta_usuarioId_fkey"
      FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UsuarioRuta_rutaId_fkey'
  ) THEN
    ALTER TABLE "UsuarioRuta"
      ADD CONSTRAINT "UsuarioRuta_rutaId_fkey"
      FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ClienteRuta_clienteId_fkey'
  ) THEN
    ALTER TABLE "ClienteRuta"
      ADD CONSTRAINT "ClienteRuta_clienteId_fkey"
      FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ClienteRuta_rutaId_fkey'
  ) THEN
    ALTER TABLE "ClienteRuta"
      ADD CONSTRAINT "ClienteRuta_rutaId_fkey"
      FOREIGN KEY ("rutaId") REFERENCES "Ruta"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "UsuarioRuta" ("usuarioId", "rutaId")
SELECT "id", "rutaId"
FROM "Usuario"
WHERE "rutaId" IS NOT NULL
ON CONFLICT ("usuarioId", "rutaId") DO NOTHING;

INSERT INTO "ClienteRuta" ("clienteId", "rutaId")
SELECT "id", "rutaId"
FROM "Cliente"
WHERE "rutaId" IS NOT NULL
ON CONFLICT ("clienteId", "rutaId") DO NOTHING;
