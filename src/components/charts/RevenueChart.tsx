"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useStore } from "@/lib/store"
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"

type TimePeriod = "1m" | "3m" | "6m" | "12m" | "lifetime" | "custom"

export function RevenueChart() {
  const { invoices } = useStore()
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("12m")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [chartData, setChartData] = useState<any[]>([])

  const timePeriods = [
    { value: "1m" as TimePeriod, label: "1 Month" },
    { value: "3m" as TimePeriod, label: "3 Months" },
    { value: "6m" as TimePeriod, label: "6 Months" },
    { value: "12m" as TimePeriod, label: "12 Months" },
    { value: "lifetime" as TimePeriod, label: "Lifetime" },
    { value: "custom" as TimePeriod, label: "Custom Range" },
  ]

  const getDateRange = (period: TimePeriod) => {
    const now = new Date()
    
    switch (period) {
      case "1m":
        return { start: subMonths(now, 1), end: now }
      case "3m":
        return { start: subMonths(now, 3), end: now }
      case "6m":
        return { start: subMonths(now, 6), end: now }
      case "12m":
        return { start: subMonths(now, 12), end: now }
      case "lifetime":
        return { start: new Date(2020, 0, 1), end: now }
      case "custom":
        return { start: startDate, end: endDate }
      default:
        return { start: subMonths(now, 12), end: now }
    }
  }

  const generateChartData = () => {
    const { start, end } = getDateRange(selectedPeriod)
    
    if (!start || !end) {
      setChartData([])
      return
    }

    // Filter invoices within the date range
    const filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.issueDate)
      return isWithinInterval(invoiceDate, { start, end })
    })

    // Group by month
    const monthlyData = new Map<string, number>()
    
    filteredInvoices.forEach(invoice => {
      if (invoice.status === "paid") {
        const monthKey = format(new Date(invoice.issueDate), "yyyy-MM")
        const currentRevenue = monthlyData.get(monthKey) || 0
        monthlyData.set(monthKey, currentRevenue + invoice.total)
      }
    })

    // Generate data points for each month in the range
    const data = []
    let currentDate = startOfMonth(start)
    const endOfRange = endOfMonth(end)

    while (currentDate <= endOfRange) {
      const monthKey = format(currentDate, "yyyy-MM")
      const revenue = monthlyData.get(monthKey) || 0
      
      data.push({
        month: format(currentDate, "MMM yyyy"),
        revenue: revenue,
        date: currentDate.toISOString(),
      })

      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    }

    setChartData(data)
  }

  useEffect(() => {
    generateChartData()
  }, [invoices, selectedPeriod, startDate, endDate])

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period)
    if (period !== "custom") {
      setStartDate(undefined)
      setEndDate(undefined)
    }
  }

  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Chart</CardTitle>
        <div className="flex flex-wrap gap-2 mt-4">
          {timePeriods.map((period) => (
            <Button
              key={period.value}
              variant={selectedPeriod === period.value ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange(period.value)}
            >
              {period.label}
            </Button>
          ))}
        </div>
        
        {selectedPeriod === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <DatePicker
                date={startDate}
                onDateChange={setStartDate}
                placeholder="Select start date"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <DatePicker
                date={endDate}
                onDateChange={setEndDate}
                placeholder="Select end date"
                className="w-full"
              />
            </div>
          </div>
        )}
        
        <div className="text-2xl font-bold text-green-600 mt-4">
          Total Revenue: ${totalRevenue.toFixed(2)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#22c55e" 
                strokeWidth={3}
                dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#22c55e", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 