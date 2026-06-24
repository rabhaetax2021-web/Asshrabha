"use client"
import React from 'react'

export default function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={(props.className ? props.className + ' ' : '') + 'input'} />
  )
}
