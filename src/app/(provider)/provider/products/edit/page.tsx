import { redirect } from 'next/navigation'

export default function EditIndexPage() {
  // Redirect bare /provider/products/edit/ to the provider products list
  redirect('/provider/products')
}
