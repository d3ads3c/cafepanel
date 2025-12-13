"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import momentOrig from "moment-jalaali";

const moment: any = momentOrig;
moment.loadPersian({ usePersianDigits: false, dialect: "persian-modern" });

type Props = {
  value?: string; // ISO date string (YYYY-MM-DD)
  onChange?: (date: string) => void; // Returns ISO date string
  className?: string;
  placeholder?: string;
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
  // moment: Sunday=0 ... Saturday=6; we want Saturday=0
  const jsDay = m.day();
  return (jsDay + 1) % 7;
};

export default function JalaliDatePicker({
  value,
  onChange,
  className,
  placeholder = "انتخاب تاریخ",
}: Props) {
  const initialMoment = value ? isoToMoment(value) || moment.utc() : moment.utc();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<any>(() => initialMoment.clone());
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");
  const [selectedDate, setSelectedDate] = useState<string | null>(value || null);
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
    if (value) {
      const m = isoToMoment(value);
      if (m) {
        setSelectedDate(value);
        setView(m.clone());
      }
    }
  }, [value]);

  const pretty = useMemo(() => isoToPretty(selectedDate), [selectedDate]);

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
    const jm = view.jMonth(); // 0-based
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
    setSelectedDate(iso);
    onChange?.(iso);
    setOpen(false);
  };

  const isSelected = (jd: number) => {
    if (!selectedDate) return false;
    const m = isoToMoment(selectedDate);
    if (!m) return false;
    return (
      m.jYear() === view.jYear() &&
      m.jMonth() === view.jMonth() &&
      m.jDate() === jd
    );
  };

  return (
    <div className={(className ? className + " " : "") + "relative"} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full inline-flex items-center justify-between px-3 py-2 rounded-xl border border-gray-300 text-sm hover:bg-gray-50 text-right"
      >
        <span className="truncate w-full">{pretty || placeholder}</span>
        <svg
          className="w-4 h-4 text-gray-500 flex-shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => {
                if (viewMode === "days") changeMonth(-1);
                else if (viewMode === "months") changeYear(-1);
                else if (viewMode === "years") changeYear(-12);
              }}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              ‹
            </button>
            <button
              type="button"
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
            >
              {titleText()}
            </button>
            <button
              type="button"
              onClick={() => {
                if (viewMode === "days") changeMonth(1);
                else if (viewMode === "months") changeYear(1);
                else if (viewMode === "years") changeYear(12);
              }}
              className="p-1 rounded-lg hover:bg-gray-100"
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
                  const selected = isSelected(d);
                  return (
                    <button
                      type="button"
                      key={d}
                      onClick={() => selectDay(d)}
                      className={
                        "text-sm h-9 rounded-lg " +
                        (selected
                          ? "bg-teal-600 text-white"
                          : "hover:bg-gray-100 text-gray-700")
                      }
                    >
                      {new Intl.NumberFormat("fa-IR", {
                        useGrouping: false,
                      }).format(d)}
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
                  type="button"
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
              {Array.from({ length: 12 }, (_, i) => view.jYear() - 6 + i).map(
                (y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setView((v: any) => v.clone().jYear(y));
                      setViewMode("months");
                    }}
                    className="text-sm h-10 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    {new Intl.NumberFormat("fa-IR", {
                      useGrouping: false,
                    }).format(y)}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

