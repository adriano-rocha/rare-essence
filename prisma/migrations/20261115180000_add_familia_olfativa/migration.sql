CREATE TYPE "FamiliaOlfativa" AS ENUM (
  'CITRICO',
  'AMADEIRADO',
  'ESPECIADO',
  'ORIENTAL'
);

ALTER TABLE "produtos"
ADD COLUMN "familia_olfativa" "FamiliaOlfativa";

UPDATE "produtos"
SET "familia_olfativa" = CASE "slug"
  WHEN 'noir-absolu' THEN 'AMADEIRADO'::"FamiliaOlfativa"
  WHEN 'ambre-nocturne' THEN 'ORIENTAL'::"FamiliaOlfativa"
  WHEN 'oud-royal' THEN 'ORIENTAL'::"FamiliaOlfativa"
  WHEN 'cuir-majestueux' THEN 'ESPECIADO'::"FamiliaOlfativa"
  WHEN 'santal-precieux' THEN 'AMADEIRADO'::"FamiliaOlfativa"
  WHEN 'rose-noire' THEN 'ESPECIADO'::"FamiliaOlfativa"
  WHEN 'vanille-fumee' THEN 'ORIENTAL'::"FamiliaOlfativa"
  WHEN 'tabac-dore' THEN 'ESPECIADO'::"FamiliaOlfativa"
  WHEN 'iris-celeste' THEN 'AMADEIRADO'::"FamiliaOlfativa"
  WHEN 'vetiver-sauvage' THEN 'CITRICO'::"FamiliaOlfativa"
  ELSE NULL
END;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "produtos"
    WHERE "familia_olfativa" IS NULL
  ) THEN
    RAISE EXCEPTION
      'Classifique cada produto existente em uma família olfativa antes de concluir esta migration.';
  END IF;
END $$;

ALTER TABLE "produtos"
ALTER COLUMN "familia_olfativa" SET NOT NULL;
