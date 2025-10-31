import React from "react";

type Props = {
  headers?: string[];
  rows?: { label: string; cells: (string | number)[] }[];
};

export default function VerticalHeadTable({
  headers = ["قیمت", "درصد تغییر", "منبع"],
  rows = [
    { label: "محصول", cells: ["آیسد آمریکانو", "+2%", "اسنپ‌فود"] },
    { label: "حجم", cells: ["۳۵۰ میلی‌لیتر", "-", ""] },
    { label: "قیمت واحد", cells: ["۶۰,۰۰۰ تومان", "+1%", "اسنپ‌فود"] },
  ],
}: Props) {
  const changeHeaderKeys = new Set(["تغییر نسبت به دیروز", "درصد تغییر", "تغییر"]);

  const persianToLatin = (s: string) =>
    s
      .replace(/[۰]/g, "0")
      .replace(/[۱]/g, "1")
      .replace(/[۲]/g, "2")
      .replace(/[۳]/g, "3")
      .replace(/[۴]/g, "4")
      .replace(/[۵]/g, "5")
      .replace(/[۶]/g, "6")
      .replace(/[۷]/g, "7")
      .replace(/[۸]/g, "8")
      .replace(/[۹]/g, "9");

  const parseChangeValue = (raw: string | number) => {
    const s = String(raw).trim();
    if (!s) return NaN;
    // normalize Persian digits
    let normalized = persianToLatin(s);
    // remove percent sign and commas
    normalized = normalized.replace(/[%٪,٫،]/g, "");
    // normalize different minus chars to ASCII minus
    normalized = normalized.replace(/[−–—]/g, "-");

    // detect trailing sign like "1.4-" or "3+"
    let sign = 1;
    const trailing = normalized.match(/[+\-]$/);
    if (trailing) {
      sign = trailing[0] === "-" ? -1 : 1;
      normalized = normalized.slice(0, -1);
    }

    // try to find a signed or unsigned number
    const m = normalized.match(/[-+]?\d+(?:\.\d+)?/);
    if (!m) return NaN;
    return parseFloat(m[0]) * sign;
  };
  return (
    <div className="w-full overflow-x-auto bg-white rounded-2xl p-4 shadow-box">
      <table className="min-w-[600px] w-full text-sm border-collapse">
        <thead>
          <tr>
            {/* top-left empty cell */}
            <th className="w-12"></th>
            {headers.map((h, idx) => (
              <th key={idx} className="py-2 px-4 text-center font-semibold text-gray-700 border-b border-gray-100">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="align-middle w-12 py-4 px-0">
                {/* Vertical header cell */}
                <div className="h-full flex items-center justify-center">
                  <div className="transform  origin-center whitespace-nowrap text-gray-700 font-medium text-sm pl-4">
                    {row.label}
                  </div>
                </div>
              </td>
              {row.cells.map((cell, cIdx) => {
                const headerLabel = headers[cIdx] ?? "";
                let colorClass = "text-gray-700";
                if (changeHeaderKeys.has(headerLabel)) {
                  const val = parseChangeValue(cell);
                  if (Number.isFinite(val)) {
                    if (val > 0) colorClass = "text-emerald-600";
                    else if (val < 0) colorClass = "text-red-500";
                    else colorClass = "text-orange-500";
                  }
                }

                return (
                  <td key={cIdx} className={`py-3 px-4 text-center border-b border-gray-100 ${colorClass}`}>
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
