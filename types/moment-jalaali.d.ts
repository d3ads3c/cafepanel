declare module "moment-jalaali" {
  import moment from "moment";
  export default moment;
}

declare module "moment" {
  type JDurationUnit = "jYear" | "jMonth" | "jDay";
  type JStartOf = "jYear" | "jMonth";

  interface Moment {
    jYear(): number;
    jYear(year: number): Moment;
    jMonth(): number; // 0-based
    jMonth(month: number): Moment;
    jDate(): number;
    jDate(day: number): Moment;
    jDaysInMonth(): number;
    add(amount?: DurationInputArg1, unit?: unitOfTime.DurationConstructor | JDurationUnit): Moment;
    add(unit: unitOfTime.DurationConstructor | JDurationUnit, amount: DurationInputArg2): Moment;
    startOf(unit: unitOfTime.StartOf | JStartOf): Moment;
  }

  interface MomentStatic {
    loadPersian(opts?: { usePersianDigits?: boolean; dialect?: "persian-modern" | "persian-classic" }): void;
  }
}

