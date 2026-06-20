"use client"
import './toast.css'

export function showToast(message: string, kind: 'info' | 'success' | 'error' = 'info') {
  const id = 'app-toast-root'
  let root = document.getElementById(id)
  if (!root) {
    root = document.createElement('div')
    root.id = id
    document.body.appendChild(root)
  }

  const el = document.createElement('div')
  el.className = `app-toast ${kind}`
  el.textContent = message
  root.appendChild(el)

  // show then remove
  requestAnimationFrame(() => el.classList.add('show'))
  setTimeout(() => el.classList.remove('show'), 3000)
  setTimeout(() => { try { root?.removeChild(el) } catch (e) {} }, 3400)
}

export default function ToastPlaceholder() { return null }
