"use client"
import React from 'react'
import { useTranslations } from 'next-intl'

export default function IntlText({ ns, id, values }: { ns: string; id: string; values?: Record<string, any> }) {
  const t = useTranslations(ns)
  try {
    return <>{t(id, values)}</>
  } catch (e) {
    return <>{id}</>
  }
}
