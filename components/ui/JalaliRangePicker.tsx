"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Range = { from: string | null; to: string | null };

// Utilities for Gregorian <-> Jalali conversion (dependency-free)
// Based on the widely used jalaali-js algorithms (MIT)
function floorDiv(a: number, b: number) { return Math.floor(a / b); }

function isJalaliLeapYear(jy: number): boolean {
  return jalaliLeap(jy) === 0;
}

function jalaliLeap(jy: number) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
    1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  let bl = breaks.length;
  let jp = breaks[0];
  let jump = 0;
  let jm = 1;
  let N = 0;
  if (jy < jp || jy >= breaks[bl - 1]) return -1;
  for (let i = 1; i < bl; i += 1) {
    const jm2 = breaks[i];
    jump = jm2 - jp;
    if (jy < jm2) break;
    jp = jm2;
    jm += floorDiv(jump, 33) * 8 + floorDiv(jump % 33, 4);
  }
  N = jy - jp;
  jm += floorDiv(N, 33) * 8 + floorDiv((N % 33) + 3, 4);
  if ((jump % 33) === 4 && (jump - N) === 4) jm += 1;
  const leapJ = ((N + 1) % 33) - 1;
  if (leapJ < 0) return 4 - leapJ;
  return (leapJ < 4) ? leapJ : 0;
}

function jalaliToGregorian(jy: number, jm: number, jd: number) {
  jy += 1595;
  let days = -355668 + (365 * jy) + floorDiv(jy, 33) * 8 + floorDiv(((jy % 33) + 3), 4)
    + jd + (jm < 7 ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  let gy = 400 * floorDiv(days, 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * floorDiv(--days, 36524);
    days %= 36524;
    if (days >= 365) days += 1;
  }
  gy += 4 * floorDiv(days, 1461);
  days %= 1461;
  if (days > 365) {
    gy += floorDiv(days - 1, 365);
    days = (days - 1) % 365;
  }
  const gd = days + 1;
  const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (gm = 1; gm <= 12; gm += 1) {
    const v = sal_a[gm];
    if (gd <= v) break;
    (days as any) = (gd as any) - v; // not used later
  }
  // Recompute month/day properly
  let daySum = gd;
  gm = 1;
  while (daySum > sal_a[gm]) { daySum -= sal_a[gm]; gm += 1; }
  return { year: gy, month: gm, day: daySum };
}

function gregorianToJalali(gy: number, gm: number, gd: number) {
  let g_d_m = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gy2 = gy - 1600;
  let gm2 = gm - 1;
  let gd2 = gd - 1;
  let g_day_no = 365 * gy2 + floorDiv((gy2 + 3), 4) - floorDiv((gy2 + 99), 100) + floorDiv((gy2 + 399), 400);
  for (let i = 0; i < gm2; ++i) g_day_no += g_d_m[i];
  g_day_no += gd2;
  let j_day_no = g_day_no - 79;
  let j_np = floorDiv(j_day_no, 12053);
  j_day_no %= 12053;
  let jy = 979 + 33 * j_np + 4 * floorDiv(j_day_no, 1461);
  j_day_no %= 1461;
  if (j_day_no >= 366) {
    jy += floorDiv((j_day_no - 1), 365);
    j_day_no = (j_day_no - 1) % 365;
  }
  let jm = (j_day_no < 186) ? 1 + floorDiv(j_day_no, 31) : 7 + floorDiv((j_day_no - 186), 30);
  let jd = 1 + ((j_day_no < 186) ? (j_day_no % 31) : ((j_day_no - 186) % 30));
  return { year: jy, month: jm, day: jd };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function toGregorianStringFromJalali(jy: number, jm: number, jd: number) {
  const { year, month, day } = jalaliToGregorian(jy, jm, jd);
  return `${year}-${pad(month)}-${pad(day)}`;
}

function toJalaliFromGregorianString(iso: string) {
  const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  const { year, month, day } = gregorianToJalali(y, m, d);
  return { year, month, day };
}

function formatJalali(jy: number, jm: number, jd: number) {
  const f = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "2-digit", day: "2-digit" });
  const g = jalaliToGregorian(jy, jm, jd);
  const dt = new Date(g.year, g.month - 1, g.day);
  return f.format(dt);
}

function getMonthLengthJalali(jy: number, jm: number) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

type Props = {
  value?: Range;
  onChange?: (range: Range) => void;
  className?: string;
};

export default function JalaliRangePicker({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ jy: number; jm: number }>(() => {
    const today = new Date();
    const j = toJalaliFromGregorianString(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
    return { jy: j.year, jm: j.month };
  });
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const [internal, setInternal] = useState<Range>(() => ({ from: value?.from ?? null, to: value?.to ?? null }));
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  useEffect(() => {
    setInternal({ from: value?.from ?? null, to: value?.to ?? null });
  }, [value?.from, value?.to]);

  const pretty = useMemo(() => {
    const fmt = (iso: string | null) => {
      if (!iso) return "";
      const j = toJalaliFromGregorianString(iso);
      return formatJalali(j.year, j.month, j.day);
    };
    return `${fmt(internal.from)} — ${fmt(internal.to)}`.trim();
  }, [internal]);

  function changeMonth(delta: number) {
    setView((v) => {
      let jm = v.jm + delta;
      let jy = v.jy;
      while (jm < 1) { jm += 12; jy -= 1; }
      while (jm > 12) { jm -= 12; jy += 1; }
      return { jy, jm };
    });
  }

  function changeYear(delta: number) {
    setView((v) => ({ ...v, jy: v.jy + delta }));
  }

  function monthNameFa(jm: number) {
    const names = [
      'فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
      'مهر','آبان','آذر','دی','بهمن','اسفند'
    ];
    return names[jm - 1] || '';
  }

  function titleText() {
  const noGroup = new Intl.NumberFormat('fa-IR', { useGrouping: false });
  if (viewMode === 'months') return `${noGroup.format(view.jy)} - انتخاب ماه`;
  if (viewMode === 'years') return 'انتخاب سال';
  return `${monthNameFa(view.jm)} ${noGroup.format(view.jy)}`;
  }

  function selectDay(jy: number, jm: number, jd: number) {
    const g = toGregorianStringFromJalali(jy, jm, jd);
    let next: Range;
    if (!internal.from || (internal.from && internal.to)) {
      next = { from: g, to: null };
    } else {
      if (new Date(g) < new Date(internal.from)) {
        next = { from: g, to: internal.from };
      } else {
        next = { from: internal.from, to: g };
      }
    }
    setInternal(next);
    onChange?.(next);
  }

  const days = useMemo(() => {
    const len = getMonthLengthJalali(view.jy, view.jm);
    return Array.from({ length: len }, (_, i) => i + 1);
  }, [view]);

  const firstDayOffset = useMemo(() => {
    // Compute weekday via Gregorian date in UTC
    const g = jalaliToGregorian(view.jy, view.jm, 1);
    const js = new Date(Date.UTC(g.year, g.month - 1, g.day));
    const jsDay = js.getUTCDay(); // 0=Sun ... 6=Sat
    // Map to Saturday-first index: Sat=0, Sun=1, Mon=2, ... Fri=6
    return (jsDay + 1) % 7;
  }, [view]);

  const dayCells = useMemo<(number | null)[]>(() => {
    return [
      ...Array(firstDayOffset).fill(null),
      ...days.map((d) => d),
    ];
  }, [firstDayOffset, days]);

  const inRange = (iso: string) => {
    if (!internal.from || !internal.to) return false;
    const t = new Date(iso).getTime();
    return t >= new Date(internal.from).getTime() && t <= new Date(internal.to).getTime();
  };

  return (
    <div className={(className ? className + " " : "") + "relative"} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full inline-flex items-center justify-between px-3 py-2 rounded-xl border border-gray-300 text-sm hover:bg-gray-50"
      >
        <span className="truncate text-right w-full">{pretty || "انتخاب بازه تاریخ"}</span>
        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-white border border-gray-200 rounded-2xl shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                if (viewMode === 'days') changeMonth(-1);
                else if (viewMode === 'months') changeYear(-1);
                else if (viewMode === 'years') changeYear(-12);
              }}
              className="p-1 rounded-lg hover:bg-gray-100" aria-label="prev"
            >
              ‹
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'days' ? 'months' : viewMode === 'months' ? 'years' : 'days')}
              className="text-sm font-medium px-2 py-1 rounded-lg hover:bg-gray-100"
              aria-label="switch"
            >
              {titleText()}
            </button>
            <button
              onClick={() => {
                if (viewMode === 'days') changeMonth(1);
                else if (viewMode === 'months') changeYear(1);
                else if (viewMode === 'years') changeYear(12);
              }}
              className="p-1 rounded-lg hover:bg-gray-100" aria-label="next"
            >
              ›
            </button>
          </div>

          {viewMode === 'days' && (
            <>
              <div className="grid grid-cols-7 gap-1 mb-1 text-xs text-gray-500">
                {['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'].map((w) => (
                  <div key={w} className="h-6 flex items-center justify-center">{w}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {dayCells.map((d, idx) => {
                  if (d === null) return <span key={`e-${idx}`} />;
                  const iso = toGregorianStringFromJalali(view.jy, view.jm, d);
                  const selected = internal.from === iso || internal.to === iso;
                  const between = inRange(iso);
                  return (
                    <button
                      key={d}
                      onClick={() => selectDay(view.jy, view.jm, d)}
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

          {viewMode === 'months' && (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <button
                  key={m}
                  onClick={() => { setView((v) => ({ ...v, jm: m })); setViewMode('days'); }}
                  className={"text-sm h-10 rounded-lg hover:bg-gray-100 text-gray-700"}
                >
                  {monthNameFa(m)}
                </button>
              ))}
            </div>
          )}

          {viewMode === 'years' && (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => view.jy - 6 + i).map((y) => (
                <button
                  key={y}
                  onClick={() => { setView((v) => ({ ...v, jy: y })); setViewMode('months'); }}
                  className={"text-sm h-10 rounded-lg hover:bg-gray-100 text-gray-700"}
                >
                  {new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(y)}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-3">
            <button
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={() => {
                setInternal({ from: null, to: null });
                onChange?.({ from: null, to: null });
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


