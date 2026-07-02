ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

UPDATE "User"
SET "passwordHash" = 'scrypt$a15ea650fdc63e7b09bcea758ae7882f$8c1ee4cb493353d22e196799c29618e4de9af6dba502baa5030b80c9d72566a2b156a19e68b157978151236b27aa471d8af35a6791c650100331fe66c1460df3'
WHERE "email" = 'deniz@shipin.local';

UPDATE "User"
SET "passwordHash" = 'scrypt$8e5b1e62c8defecb5eb2e892699b36b8$d73617eb40aec8cd72dadbc5655ff03266ff2662f7c5a1109db8c040505643d405228e14bebfa96bc660a691a7b8082b122116396e1bf22fb0b55e12ec387bd0'
WHERE "email" = 'ece@shipin.local';

UPDATE "User"
SET "passwordHash" = 'scrypt$b7eb6cd0c5f1631e4b8f08979875b5fe$386c4d876d16ab4c72de67cd01ba5dcb0a4261234f3d037bf2353e59b692ddf623f998cb9615038b31e230f73093e3a888db6d8f3db2c65994e8154451163077'
WHERE "email" = 'mert@shipin.local';

ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;
