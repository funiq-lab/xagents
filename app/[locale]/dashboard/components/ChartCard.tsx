'use client'

import * as echarts from 'echarts'
import { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'

export interface ChartPoint {
  label: string
  value: number
}

interface ChartCardProps {
  title: string
  data: ChartPoint[]
  color?: string
  unit?: string
}

export function ChartCard({
  title,
  data,
  color = 'var(--chart-1)',
  unit = '',
}: ChartCardProps) {
  const chartRef = useRef<HTMLDivElement | null>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  const resolveColor = () => {
    if (typeof window === 'undefined')
      return color
    if (!color.startsWith('var('))
      return color

    const varName = color.slice(4, -1).trim()
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName)
    return value.trim() || color
  }

  useEffect(() => {
    if (!chartRef.current)
      return

    chartInstance.current = echarts.init(chartRef.current)
    const resize = () => chartInstance.current?.resize()
    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      chartInstance.current?.dispose()
      chartInstance.current = null
    }
  }, [])

  useEffect(() => {
    if (!chartInstance.current)
      return

    const resolvedColor = resolveColor()

    const option: echarts.EChartsOption = {
      grid: { left: 12, right: 12, top: 20, bottom: 20, containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: '#d5dbde',
        textStyle: { color: '#2c3e50', fontSize: 12 },
        formatter: (params) => {
          const point = Array.isArray(params) ? params[0] : params
          const value = typeof point?.value === 'number'
            ? point.value
            : Array.isArray(point?.value)
              ? Number(point.value[1])
              : 0
          return `${point?.name} : ${value.toFixed(1)}${unit}`
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map(point => point.label),
        axisLine: { lineStyle: { color: '#d5dbde' } },
        axisTick: { show: false },
        axisLabel: { color: '#7f8c8d', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#e0e4e7', type: 'dashed' } },
        axisLabel: { color: '#7f8c8d', fontSize: 10 },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          data: data.map(point => point.value),
          lineStyle: { color: resolvedColor, width: 2 },
          itemStyle: { color: resolvedColor },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: resolvedColor },
              { offset: 1, color: 'rgba(255,255,255,0)' },
            ]),
          },
          showSymbol: false,
        },
      ],
    }

    chartInstance.current.setOption(option, { notMerge: true })
  }, [data, color, unit])

  return (
    <Card className="p-4 rounded-(--radius-card) border border-border" style={{ backgroundColor: 'var(--card)' }}>
      <div className="mb-4" style={{ color: 'var(--card-foreground)' }}>{title}</div>
      <div ref={chartRef} className="h-52 w-full" />
    </Card>
  )
}
