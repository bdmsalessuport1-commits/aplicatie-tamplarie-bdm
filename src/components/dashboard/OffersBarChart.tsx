"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { DashboardByDay, DashboardByProduct } from "@/types";

interface Props {
  byDay: DashboardByDay[];
  byProduct: DashboardByProduct[];
}

export default function OffersBarChart({ byDay, byProduct }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Offers per day */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Oferte pe Zile</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(value: number, name: string) =>
                name === "value" ? formatCurrency(value) : value
              }
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend formatter={(v) => (v === "count" ? "Nr. Oferte" : "Valoare RON")} />
            <Bar dataKey="count" name="count" fill="#2563eb" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* By product */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Breakdown pe Produs</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={byProduct}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis dataKey="productName" type="category" tick={{ fontSize: 10 }} width={100} />
            <Tooltip
              formatter={(value: number, name: string) =>
                name === "value" ? formatCurrency(value) : value
              }
            />
            <Legend formatter={(v) => (v === "count" ? "Nr. Oferte" : "Valoare RON")} />
            <Bar dataKey="count" name="count" fill="#2563eb" radius={[0, 3, 3, 0]} />
            <Bar dataKey="value" name="value" fill="#16a34a" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
