"use client"
import { useTranslations } from 'next-intl'

export default function IntlText({ ns, id, values }: { ns: string; id: string; values?: Record<string, string | number | Date> }) {
  const t = useTranslations(ns)
  let translated = id
  try {
    translated = t(id, values as Record<string, string | number | Date>)
  } catch {
    translated = id
  }
  return <>{translated}</>
}
