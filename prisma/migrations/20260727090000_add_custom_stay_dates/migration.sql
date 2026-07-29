-- Issue #101: allow administrators to pin an arbitrary stay date range on a
-- registration instead of being limited to the predefined stay options.
--
-- Both columns are nullable and default to NULL, so every existing row keeps
-- deriving its dates from `stay` and public registration behaviour is unchanged.
-- Date (not timestamp) columns: these are calendar dates, not instants.

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN "stayStartDate" DATE;
ALTER TABLE "Registration" ADD COLUMN "stayEndDate" DATE;

-- The range is meaningful only as a complete, ordered pair: a half-set pair
-- silently falls back to the stay-option dates when the calendar invite is
-- built, so the guest is mailed dates nobody chose and nothing reports it.
-- The application enforces this (`stayDateRangeSchema`, and the repository's
-- three-state mapping), but the invariant belongs to the data as well — these
-- constraints are what makes "both or neither, in order" true of the table
-- rather than merely true of the current code paths.
--
-- Safe to add here: both columns are introduced by this migration, so every
-- existing row has NULL for both and satisfies the constraints already.
--
-- Note for local development: `scripts/dev.sh` provisions the schema with
-- `prisma db push`, which builds from `schema.prisma`. Prisma's schema language
-- cannot express CHECK constraints, so a pushed local database will not have
-- them; deployed environments run `prisma migrate deploy` (see vercel.json) and
-- will. The application layer therefore remains the primary enforcement, and
-- these are a backstop rather than the only guard.
ALTER TABLE "Registration"
  ADD CONSTRAINT "Registration_stayDates_pair_check"
  CHECK (("stayStartDate" IS NULL) = ("stayEndDate" IS NULL));

ALTER TABLE "Registration"
  ADD CONSTRAINT "Registration_stayDates_order_check"
  CHECK ("stayStartDate" IS NULL OR "stayEndDate" >= "stayStartDate");
