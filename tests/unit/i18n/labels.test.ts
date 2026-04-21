import { describe, test, expect } from "vitest";
import {
  accommodationLabel,
  stayLabel,
  statusLabel,
  accommodationEnumKey,
  stayEnumKey,
  statusEnumKey,
  ALL_STAY_OPTIONS,
} from "@/i18n/labels";
import {
  AccommodationOption,
  RegistrationStatus,
  StayOption,
} from "@/types/registration";

describe("i18n canonical labels", () => {
  /**
   * The translator fake returns the requested key verbatim. Pairing it with
   * the label helpers lets us assert (a) the correct enum key is computed
   * and (b) the helper passes through whatever the translator returns.
   */
  const passthrough = (key: string): string => key;

  describe("accommodationLabel", () => {
    test("should resolve PRIVATE_ROOM when passed the enum value", () => {
      // given
      // - the translator simply echoes its key
      // when
      const label = accommodationLabel(
        AccommodationOption.PRIVATE_ROOM,
        passthrough,
      );

      // then
      expect(label).toBe("enums.accommodation.PRIVATE_ROOM");
    });

    test("should resolve all five accommodation options distinctly", () => {
      // given
      const options: ReadonlyArray<AccommodationOption> = [
        AccommodationOption.PRIVATE_ROOM,
        AccommodationOption.COMMON_ROOM,
        AccommodationOption.OWN_TENT,
        AccommodationOption.ANYWHERE,
        AccommodationOption.NONE,
      ];

      // when
      const keys = options.map((opt) => accommodationEnumKey(opt));

      // then
      expect(new Set(keys).size).toBe(options.length);
      expect(keys).toEqual([
        "enums.accommodation.PRIVATE_ROOM",
        "enums.accommodation.COMMON_ROOM",
        "enums.accommodation.OWN_TENT",
        "enums.accommodation.ANYWHERE",
        "enums.accommodation.NONE",
      ]);
    });
  });

  describe("stayLabel", () => {
    test("should resolve FRI_SUN when passed the enum value", () => {
      // when
      const label = stayLabel(StayOption.FRI_SUN, passthrough);

      // then
      expect(label).toBe("enums.stay.FRI_SUN");
    });

    test("should resolve all stay options including legacy FRI_SAT", () => {
      // given
      const options: ReadonlyArray<StayOption> = [
        StayOption.FRI_SAT,
        StayOption.SAT_SUN,
        StayOption.FRI_SUN,
        StayOption.SAT_ONLY,
      ];

      // when
      const keys = options.map((opt) => stayEnumKey(opt));

      // then
      expect(keys).toEqual([
        "enums.stay.FRI_SAT",
        "enums.stay.SAT_SUN",
        "enums.stay.FRI_SUN",
        "enums.stay.SAT_ONLY",
      ]);
    });
  });

  describe("ALL_STAY_OPTIONS", () => {
    test("should list every StayOption value exactly once", () => {
      // given
      // - the enum defines four stay options
      const enumValues = Object.values(StayOption);

      // when
      const uniqueOptions = new Set(ALL_STAY_OPTIONS);

      // then
      expect(ALL_STAY_OPTIONS.length).toBe(enumValues.length);
      expect(uniqueOptions.size).toBe(enumValues.length);
      for (const value of enumValues) {
        expect(ALL_STAY_OPTIONS).toContain(value);
      }
    });

    test("should order stays chronologically (FRI_SAT, SAT_SUN, FRI_SUN, SAT_ONLY)", () => {
      // given
      // - admin surfaces display stays in weekend-chronological order:
      //   the shortest early start first (FRI_SAT), then SAT_SUN,
      //   then the full-weekend FRI_SUN, then the daytime-only SAT_ONLY
      // when
      const order = Array.from(ALL_STAY_OPTIONS);

      // then
      expect(order).toEqual([
        StayOption.FRI_SAT,
        StayOption.SAT_SUN,
        StayOption.FRI_SUN,
        StayOption.SAT_ONLY,
      ]);
    });
  });

  describe("statusLabel", () => {
    test("should resolve CONFIRMED when passed the enum value", () => {
      // when
      const label = statusLabel(RegistrationStatus.CONFIRMED, passthrough);

      // then
      expect(label).toBe("enums.status.CONFIRMED");
    });

    test("should resolve CANCELLED when passed the enum value", () => {
      // when
      const label = statusLabel(RegistrationStatus.CANCELLED, passthrough);

      // then
      expect(label).toBe("enums.status.CANCELLED");
    });

    test("should produce distinct keys for each status", () => {
      // when
      const keys = [
        statusEnumKey(RegistrationStatus.CONFIRMED),
        statusEnumKey(RegistrationStatus.CANCELLED),
      ];

      // then
      expect(new Set(keys).size).toBe(2);
    });
  });
});
