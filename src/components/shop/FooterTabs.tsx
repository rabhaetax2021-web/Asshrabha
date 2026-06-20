"use client"
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import './footer-tabs.css'

function Icon({ name }: { name: string }) {
  switch (name) {
    case 'home': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'category': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'cart': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6h15l-1.5 9h-12L6 6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="20" r="1" fill="currentColor"/><circle cx="18" cy="20" r="1" fill="currentColor"/></svg>
    case 'orders': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15V6a2 2 0 0 0-2-2H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 8h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 21v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'profile': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'search': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    default: return null
  }
}

export default function FooterTabs() {
  const path = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const content = (
    <nav className="footer-tabs">
      <Link href="/shop" className={path === '/shop' ? 'tab active' : 'tab'} title="Home"><Icon name="home"/><span>Home</span></Link>
      <Link href="/shop/search" className={path?.startsWith('/shop/search') ? 'tab active' : 'tab'} title="Search"><Icon name="search"/><span>Search</span></Link>
      <a
        className={path?.startsWith('/shop/category') ? 'tab active' : 'tab'}
        title="Categories"
        onClick={async (e) => {
          e.preventDefault()
          try {
            const res = await fetch('/api/shop/categories')
            if (!res.ok) return router.push('/shop/category')
            const j = await res.json()
            const cats = j.categories || []
            if (cats.length === 0) return router.push('/shop/category')
            const pick = cats[Math.floor(Math.random() * cats.length)]
            const slug = pick.slug || pick.id
            router.push(`/shop/category/${slug}`)
          } catch (err) {
            router.push('/shop/category')
          }
        }}
      ><Icon name="category"/><span>Categories</span></a>
      <Link href="/shop/cart" className={path === '/shop/cart' ? 'tab active' : 'tab'} title="Cart"><Icon name="cart"/><span>Cart</span></Link>
      <Link href="/shop/orders" className={path === '/shop/orders' ? 'tab active' : 'tab'} title="Orders"><Icon name="orders"/><span>Orders</span></Link>
      <Link href="/shop/profile" className={path === '/shop/profile' ? 'tab active' : 'tab'} title="Profile"><Icon name="profile"/><span>Profile</span></Link>
    </nav>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}
