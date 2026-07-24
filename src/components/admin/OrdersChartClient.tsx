"use client"
import dynamic from 'next/dynamic'
import React from 'react'

const OrdersChart = dynamic(() => import('./OrdersChart'), { ssr: false })

export default function OrdersChartClient(props: any) {
  return <OrdersChart {...props} />
}
