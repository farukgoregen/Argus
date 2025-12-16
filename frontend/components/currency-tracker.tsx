"use client"

import { TrendingUp, TrendingDown } from "lucide-react"

const currencyData = [
  { name: "USD", symbol: "$", value: "1.00", change: 0.0, isUp: true },
  { name: "EUR", symbol: "€", value: "0.92", change: -0.5, isUp: false },
  { name: "CNY", symbol: "¥", value: "7.24", change: 0.3, isUp: true },
  { name: "Gold", symbol: "", value: "$2,045", change: 1.2, isUp: true },
  { name: "Oil", symbol: "", value: "$73.50", change: -0.8, isUp: false },
]

export function CurrencyTracker() {
  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-lg border border-gray-700 shadow-lg">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 p-4 min-w-max">
          {currencyData.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors min-w-[140px]"
            >
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-medium">{item.name}</span>
                <span className="text-base font-bold text-white">
                  {item.symbol}
                  {item.value}
                </span>
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                  item.isUp ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                }`}
              >
                {item.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(item.change)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
