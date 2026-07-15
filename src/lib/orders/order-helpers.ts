export type OrderListSortBy = 'createdAt' | 'totalAmount' | 'status'
export type OrderListSortDir = 'asc' | 'desc'

export type OrderListFilterParams = {
  search?: string
  status?: string
  sortBy?: OrderListSortBy
  sortDir?: OrderListSortDir
}

export function filterAndSortOrders<T extends Record<string, any>>(orders: T[], params: OrderListFilterParams = {}) {
  const search = (params.search || '').trim().toLowerCase()
  const status = (params.status || '').trim().toUpperCase()
  const sortBy = params.sortBy || 'createdAt'
  const sortDir = params.sortDir || 'desc'

  const filtered = orders.filter((order) => {
    if (status && String(order.status || '').toUpperCase() !== status) return false

    if (!search) return true

    const customer = order.customer || {}
    const provider = order.provider || {}
    const productNames = (order.items || []).map((item: any) => {
      const catalog = item?.providerProduct?.catalogProduct || {}
      return `${catalog.nameEN || ''} ${catalog.nameAR || ''}`.trim()
    }).join(' ')

    const haystack = [
      order.orderNumber,
      customer.nameEN,
      customer.nameAR,
      customer.mobile,
      provider.shopNameEN,
      provider.shopNameAR,
      provider.user?.mobile,
      productNames,
    ].filter(Boolean).join(' ').toLowerCase()

    return haystack.includes(search)
  })

  const sorted = [...filtered].sort((a, b) => {
    const direction = sortDir === 'asc' ? 1 : -1

    if (sortBy === 'totalAmount') {
      return (Number(a.totalAmount || 0) - Number(b.totalAmount || 0)) * direction
    }

    if (sortBy === 'status') {
      return String(a.status || '').localeCompare(String(b.status || '')) * direction
    }

    return (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()) * direction
  })

  return sorted
}
