'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, type SectorProps, Tooltip } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export interface ChartPoint {
  label: string
  value: number
  fill?: string
}

interface ChartCardProps {
  title: string
  data: ChartPoint[]
  unit?: string
  totalValue: string | number
  helperText?: string
  isExpanded?: boolean
  onToggleExpand?: () => void
}

const COLORS = [
  '#3498db', // Blue
  '#e74c3c', // Red
  '#f39c12', // Orange
  '#2ecc71', // Green
  '#9b59b6', // Purple
  '#1abc9c', // Turquoise
  '#e67e22', // Carrot
  '#34495e', // Dark Gray
  '#95a5a6', // Gray
  '#16a085', // Green Sea
]

interface PieSectorData {
  percent?: number
  name?: string | number
  midAngle?: number
  middleRadius?: number
  value?: number
  paddingAngle?: number
  dataKey?: string
  payload?: any
}

type PieSectorDataItem = React.SVGProps<SVGPathElement> & Partial<SectorProps> & PieSectorData

function renderActiveShape({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  fill,
  payload,
  percent,
  value,
}: PieSectorDataItem, unit: string) {
  const RADIAN = Math.PI / 180
  const sin = Math.sin(-RADIAN * (midAngle ?? 1))
  const cos = Math.cos(-RADIAN * (midAngle ?? 1))
  const sx = (cx ?? 0) + ((outerRadius ?? 0) + 10) * cos
  const sy = (cy ?? 0) + ((outerRadius ?? 0) + 10) * sin
  const mx = (cx ?? 0) + ((outerRadius ?? 0) + 18) * cos
  const my = (cy ?? 0) + ((outerRadius ?? 0) + 18) * sin
  const ex = mx + (cos >= 0 ? 1 : -1) * 12
  const ey = my
  const textAnchor = cos >= 0 ? 'start' : 'end'

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill="currentColor" className="text-sm font-medium">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={(outerRadius ?? 0) + 6}
        outerRadius={(outerRadius ?? 0) + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 8}
        y={ey}
        textAnchor={textAnchor}
        fill="currentColor"
        className="text-sm font-medium"
      >
        {`${value?.toFixed(2)}${unit}`}
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 8}
        y={ey}
        dy={16}
        textAnchor={textAnchor}
        fill="currentColor"
        className="text-xs opacity-60"
      >
        {`${((percent ?? 0) * 100).toFixed(1)}%`}
      </text>
    </g>
  )
}

export function ChartCard({
  title,
  data,
  unit = '',
  totalValue,
  helperText,
  isExpanded = false,
  onToggleExpand,
}: ChartCardProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  // Filter out items with zero values
  const filteredData = data.filter(item => item.value > 0)

  // Add colors to data points and rename label to name for recharts
  const chartData = filteredData.map((item, index) => ({
    name: item.label, // recharts uses 'name' property
    value: item.value,
    fill: item.fill || COLORS[index % COLORS.length],
  }))

  const hasData = chartData.length > 0

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const onPieLeave = () => {
    setActiveIndex(undefined)
  }

  return (
    <Card className="p-4 rounded-(--radius-card) border border-border">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="text-2xl font-semibold">
            {totalValue}
          </div>
          {helperText && (
            <div className="text-xs text-muted-foreground">
              {helperText}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onToggleExpand}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-4">
          {hasData
            ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart
                    margin={{
                      top: 20,
                      right: 60,
                      bottom: 20,
                      left: 60,
                    }}
                  >
                    <Pie
                      activeIndex={activeIndex}
                      activeShape={(props: any) => renderActiveShape(props, unit)}
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius="50%"
                      outerRadius="70%"
                      dataKey="value"
                      onMouseEnter={onPieEnter}
                      onMouseLeave={onPieLeave}
                    >
                      {chartData.map(entry => (
                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={() => null} />
                  </PieChart>
                </ResponsiveContainer>
              )
            : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground text-sm">
                  No data available
                </div>
              )}
        </div>
      )}
    </Card>
  )
}
