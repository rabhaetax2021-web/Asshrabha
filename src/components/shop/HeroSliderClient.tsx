"use client"
import dynamic from 'next/dynamic'
import React from 'react'

const HeroSlider = dynamic(() => import('./HeroSlider'), { ssr: false })

export default function HeroSliderClient(props: any) {
  return <HeroSlider {...props} />
}
