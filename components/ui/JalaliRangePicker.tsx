"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import momentOrig from "moment-jalaali";

const moment: any = momentOrig;
moment.loadPersian({ usePersianDigits: false, dialect: "persian-modern" });

type Range = { from: string | null; to: string | null };

type Props = {
  value?: Range;
  onChange?: (range: Range) => void;
  className?: string;
};

const monthNamesFa = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const weekdaysFa = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];

const toIso = (m: any) => m.clone().utc().format("YYYY-MM-DD");
const isoToMoment = (iso?: string | null) =>
  iso ? moment.utc(iso, "YYYY-MM-DD") : null;
const isoToPretty = (iso?: string | null) =>
  iso ? moment.utc(iso, "YYYY-MM-DD").format("jYYYY/jMM/jDD") : "";

const weekdayOffsetStartSaturday = (m: any) => {
  const jsDay = m.day(); // Sunday=0 ... Saturday=6
  return (jsDay + 1) % 7; // Saturday=0
};

export default function JalaliRangePicker({ value, onChange, className }: Props) {
  const initialMoment =
    (value?.from && isoToMoment(value.from)) || moment.utc();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<any>(() => initialMoment.clone());
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");
  const [internal, setInternal] = useState<Range>(() => ({
    from: value?.from ?? null,
    to: value?.to ?? null,
  }));
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  useEffect(() => {
    setInternal({ from: value?.from ?? null, to: value?.to ?? null });
  }, [value?.from, value?.to]);

  const pretty = useMemo(() => {
    const from = isoToPretty(internal.from);
    const to = isoToPretty(internal.to);
    return `${from}${from && to ? " — " : ""}${to}`;
  }, [internal.from, internal.to]);

  const days = useMemo(() => {
    const current = moment(view);
    const len = typeof current.jDaysInMonth === "function" ? current.jDaysInMonth() : current.daysInMonth();
    return Array.from({ length: len }, (_, i) => i + 1);
  }, [view]);

  const firstDayOffset = useMemo(() => {
    const start = view.clone().startOf("jMonth");
    return weekdayOffsetStartSaturday(start);
  }, [view]);

  const dayCells = useMemo<(number | null)[]>(() => {
    return [...Array(firstDayOffset).fill(null), ...days];
  }, [firstDayOffset, days]);

  const titleText = () => {
    const jy = view.jYear();
    const jm = view.jMonth();
    const noGroup = new Intl.NumberFormat("fa-IR", { useGrouping: false });
    if (viewMode === "months") return `${noGroup.format(jy)} - انتخاب ماه`;
    if (viewMode === "years") return "انتخاب سال";
    return `${monthNamesFa[jm]} ${noGroup.format(jy)}`;
  };

  const changeMonth = (delta: number) => {
    setView((v: any) => v.clone().add(delta, "jMonth"));
  };

  const changeYear = (delta: number) => {
    setView((v: any) => v.clone().add(delta, "jYear"));
  };

  const selectDay = (jd: number) => {
    const m = moment
      .utc()
      .jYear(view.jYear())
      .jMonth(view.jMonth())
      .jDate(jd)
      .startOf("day");
    const iso = toIso(m);

    let next: Range;
    if (!internal.from || (internal.from && internal.to)) {
      next = { from: iso, to: null };
    } else {
      const fromMoment = isoToMoment(internal.from)!;
      if (m.isBefore(fromMoment, "day")) {
        next = { from: iso, to: internal.from };
      } else {
        next = { from: internal.from, to: iso };
      }
    }
    setInternal(next);
    onChange?.(next);
  };

  const isSelected = (iso: string) =>
    internal.from === iso || internal.to === iso;

  const inRange = (iso: string) => {
    if (!internal.from || !internal.to) return false;
    const t = isoToMoment(iso)!.valueOf();
    return (
      t >= isoToMoment(internal.from)!.valueOf() &&
      t <= isoToMoment(internal.to)!.valueOf()
    );
  };

  return (
    <div className={(className ? className + " " : "") + "relative"} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full inline-flex items-center justify-between px-3 py-2 rounded-xl border border-gray-300 text-sm hover:bg-gray-50"
      >
        <span className="truncate text-right w-full">
          {pretty || "انتخاب بازه تاریخ"}
        </span>
        <svg
          className="w-4 h-4 text-gray-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                if (viewMode === "days") changeMonth(-1);
                else if (viewMode === "months") changeYear(-1);
                else if (viewMode === "years") changeYear(-12);
              }}
              className="p-1 rounded-lg hover:bg-gray-100"
              aria-label="prev"
            >
              ‹
            </button>
            <button
              onClick={() =>
                setViewMode(
                  viewMode === "days"
                    ? "months"
                    : viewMode === "months"
                    ? "years"
                    : "days"
                )
              }
              className="text-sm font-medium px-2 py-1 rounded-lg hover:bg-gray-100"
              aria-label="switch"
            >
              {titleText()}
            </button>
            <button
              onClick={() => {
                if (viewMode === "days") changeMonth(1);
                else if (viewMode === "months") changeYear(1);
                else if (viewMode === "years") changeYear(12);
              }}
              className="p-1 rounded-lg hover:bg-gray-100"
              aria-label="next"
            >
              ›
            </button>
          </div>

          {viewMode === "days" && (
            <>
              <div className="grid grid-cols-7 gap-1 mb-1 text-xs text-gray-500">
                {weekdaysFa.map((w) => (
                  <div key={w} className="h-6 flex items-center justify-center">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {dayCells.map((d, idx) => {
                  if (d === null) return <span key={`e-${idx}`} />;
                  const iso = toIso(
                    moment
                      .utc()
                      .jYear(view.jYear())
                      .jMonth(view.jMonth())
                      .jDate(d)
                      .startOf("day")
                  );
                  const selected = isSelected(iso);
                  const between = inRange(iso);
                  return (
                    <button
                      key={d}
                      onClick={() => selectDay(d)}
                      className={
                        "text-sm h-9 rounded-lg " +
                        (selected
                          ? "bg-teal-600 text-white"
                          : between
                          ? "bg-teal-50 text-teal-700"
                          : "hover:bg-gray-100 text-gray-700")
                      }
                    >
                      {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(d)}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {viewMode === "months" && (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => i).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setView((v: any) => v.clone().jMonth(m));
                    setViewMode("days");
                  }}
                  className="text-sm h-10 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  {monthNamesFa[m]}
                </button>
              ))}
            </div>
          )}

          {viewMode === "years" && (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => view.jYear() - 6 + i).map((y) => (
                <button
                  key={y}
                  onClick={() => {
                    setView((v: any) => v.clone().jYear(y));
                    setViewMode("months");
                  }}
                  className="text-sm h-10 rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  {new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(y)}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <button
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={() => {
                const cleared = { from: null, to: null };
                setInternal(cleared);
                onChange?.(cleared);
              }}
            >
              پاک کردن
            </button>
            <button
              className="px-3 py-1.5 text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-700"
              onClick={() => setOpen(false)}
            >
              تایید
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

