import { Card } from '@/components/ui/card'

interface StatsCardProps {
  label: string
  value: string | number
  helperText?: string
}

export function StatsCard({ label, value, helperText }: StatsCardProps) {
  return (
    <Card className="p-4 rounded-(--radius-card) border border-border">
      <div className="space-y-1">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold">
          {value}
        </div>
        {helperText && (
          <div className="text-xs text-muted-foreground">
            {helperText}
          </div>
        )}
      </div>
    </Card>
  )
}
