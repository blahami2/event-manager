-- CreateEnum
CREATE TYPE "AccommodationOption" AS ENUM ('PRIVATE_ROOM', 'COMMON_ROOM', 'OWN_TENT', 'ANYWHERE', 'NONE');

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN "accommodation" "AccommodationOption" NOT NULL DEFAULT 'ANYWHERE';
