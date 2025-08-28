// app/dashboard/page.jsx
"use client";

import Link from "next/link";

export default function DashboardHome() {
  // You can fetch real stats here if you have an API
  const stats = [
    { label: "Packages", value: 12 },
    { label: "Accounts", value: 34 },
    { label: "Withdrawals", value: 7 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-xl shadow p-5 border border-gray-200">
          <div className="text-sm text-gray-600">{s.label}</div>
          <div className="text-2xl font-semibold">{s.value}</div>
          <Link href="#" className="text-blue-600 text-sm hover:underline mt-2 inline-block">
            View details
          </Link>
        </div>
      ))}
    </div>
  );
}
