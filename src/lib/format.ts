export const inr = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");

export const inrCompact = (n: number) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000
      ? `₹${(n / 1000).toFixed(1)}k`
      : `₹${Math.round(n)}`;

export const timeStr = (ts: number) =>
  new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

export const shortTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
