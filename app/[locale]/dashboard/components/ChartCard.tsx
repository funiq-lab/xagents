'use client'

import { Card } from '@/components/ui/card'

export interface ChartPoint {
  label: string
  value: number
}

interface ChartCardProps {
  title: string
  data: ChartPoint[]
}

export function ChartCard({
  title,
}: ChartCardProps) {
  return (
    <Card className="p-4 rounded-(--radius-card) border border-border" style={{ backgroundColor: 'var(--card)' }}>
      <div className="mb-4" style={{ color: 'var(--card-foreground)' }}>{title}</div>
      {/* <div ref={chartRef} className="h-52 w-full" /> */}
    </Card>
  )
}
