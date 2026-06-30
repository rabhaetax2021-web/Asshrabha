type ChangeSummaryItem = {
  key: string
  titleEN: string
  titleAR: string
  oldValueEN: string
  oldValueAR: string
  newValueEN: string
  newValueAR: string
}

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function normalizeArabicValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function getObjectFieldLabels(field: string) {
  switch (field) {
    case 'label':
      return { en: 'Address label', ar: 'تسمية العنوان' }
    case 'fullName':
      return { en: 'Full name', ar: 'الاسم الكامل' }
    case 'mobile':
      return { en: 'Phone', ar: 'الهاتف' }
    case 'addressLine':
      return { en: 'Address line', ar: 'سطر العنوان' }
    case 'city':
      return { en: 'City', ar: 'المدينة' }
    case 'area':
      return { en: 'Area', ar: 'المنطقة' }
    case 'landmark':
      return { en: 'Landmark', ar: 'المعلم' }
    case 'isDefault':
      return { en: 'Default address', ar: 'العنوان الافتراضي' }
    case 'locationId':
      return { en: 'Governorate', ar: 'المحافظة' }
    default:
      return { en: field, ar: field }
  }
}

function getFieldLabel(field: string) {
  switch (field) {
    case 'nameEN':
      return { en: 'Name (EN)', ar: 'الاسم (EN)' }
    case 'nameAR':
      return { en: 'Name (AR)', ar: 'الاسم (AR)' }
    case 'mobile':
      return { en: 'Mobile', ar: 'رقم الهاتف' }
    case 'email':
      return { en: 'Email', ar: 'البريد الإلكتروني' }
    case 'avatar':
      return { en: 'Avatar', ar: 'الصورة' }
    case 'label':
      return { en: 'Label', ar: 'التسمية' }
    case 'fullName':
      return { en: 'Full name', ar: 'الاسم الكامل' }
    case 'addressLine':
      return { en: 'Address line', ar: 'سطر العنوان' }
    case 'city':
      return { en: 'City', ar: 'المدينة' }
    case 'area':
      return { en: 'Area', ar: 'المنطقة' }
    case 'landmark':
      return { en: 'Landmark', ar: 'المعلم' }
    case 'isDefault':
      return { en: 'Default address', ar: 'العنوان الافتراضي' }
    case 'defaultAddress':
      return { en: 'Default address', ar: 'العنوان الافتراضي' }
    default:
      return { en: field, ar: field }
  }
}

function getProviderFieldLabel(field: string) {
  switch (field) {
    case 'shopNameEN':
      return { en: 'Shop name (EN)', ar: 'اسم المتجر (EN)' }
    case 'shopNameAR':
      return { en: 'Shop name (AR)', ar: 'اسم المتجر (AR)' }
    case 'descriptionEN':
      return { en: 'Description (EN)', ar: 'الوصف (EN)' }
    case 'descriptionAR':
      return { en: 'Description (AR)', ar: 'الوصف (AR)' }
    case 'locationAddress':
      return { en: 'Location address', ar: 'عنوان الموقع' }
    case 'locationLat':
      return { en: 'Location latitude', ar: 'خط العرض' }
    case 'locationLng':
      return { en: 'Location longitude', ar: 'خط الطول' }
    case 'logo':
      return { en: 'Logo', ar: 'الشعار' }
    case 'banner':
      return { en: 'Banner', ar: 'الصورة العريضة' }
    case 'locationId':
      return { en: 'Governorate', ar: 'المحافظة' }
    default:
      return getFieldLabel(field)
  }
}

export function buildCustomerEditChangeSummary(
  changes: Record<string, unknown> | null | undefined,
  currentUser?: Record<string, unknown> | null,
) {
  const items: ChangeSummaryItem[] = []
  const changeSource = changes || {}

  if (changeSource.user && typeof changeSource.user === 'object') {
    const userChanges = changeSource.user as Record<string, unknown>
    Object.entries(userChanges).forEach(([field, newValue]) => {
      const label = getFieldLabel(field)
      items.push({
        key: `user-${field}`,
        titleEN: label.en,
        titleAR: label.ar,
        oldValueEN: normalizeValue(currentUser?.[field]),
        oldValueAR: normalizeArabicValue(currentUser?.[field]),
        newValueEN: normalizeValue(newValue),
        newValueAR: normalizeArabicValue(newValue),
      })
    })
  }

  if (changeSource.type === 'address_change') {
    const action = changeSource.action
    const address = changeSource.address as Record<string, unknown> | undefined
    const addressLabel = action === 'delete' ? { en: 'Address deletion', ar: 'حذف العنوان' } : { en: 'Address creation', ar: 'إضافة عنوان' }

    if (action === 'delete') {
      items.push({
        key: `address-${String(action)}`,
        titleEN: addressLabel.en,
        titleAR: addressLabel.ar,
        oldValueEN: 'Saved address',
        oldValueAR: 'عنوان محفوظ',
        newValueEN: 'Removed',
        newValueAR: 'تم الحذف',
      })
    } else if (address) {
      Object.entries(address).forEach(([field, value]) => {
        const label = getObjectFieldLabels(field)
        items.push({
          key: `address-${field}`,
          titleEN: `${addressLabel.en}: ${label.en}`,
          titleAR: `${addressLabel.ar}: ${label.ar}`,
          oldValueEN: '—',
          oldValueAR: '—',
          newValueEN: normalizeValue(value),
          newValueAR: normalizeArabicValue(value),
        })
      })
    }
  } else if (changeSource.address && typeof changeSource.address === 'object') {
    const address = changeSource.address as Record<string, unknown>
    Object.entries(address).forEach(([field, value]) => {
      const label = getObjectFieldLabels(field)
      items.push({
        key: `address-inline-${field}`,
        titleEN: `Address update: ${label.en}`,
        titleAR: `تعديل العنوان: ${label.ar}`,
        oldValueEN: '—',
        oldValueAR: '—',
        newValueEN: normalizeValue(value),
        newValueAR: normalizeArabicValue(value),
      })
    })
  }

  return items
}

export function buildProviderEditChangeSummary(
  changes: Record<string, unknown> | null | undefined,
  currentProvider?: Record<string, unknown> | null,
  currentUser?: Record<string, unknown> | null,
) {
  const items: ChangeSummaryItem[] = []
  const changeSource = changes || {}

  if (changeSource.providerProfile && typeof changeSource.providerProfile === 'object') {
    const providerChanges = changeSource.providerProfile as Record<string, unknown>
    Object.entries(providerChanges).forEach(([field, newValue]) => {
      const label = getProviderFieldLabel(field)
      items.push({
        key: `providerProfile-${field}`,
        titleEN: label.en,
        titleAR: label.ar,
        oldValueEN: normalizeValue(currentProvider?.[field]),
        oldValueAR: normalizeArabicValue(currentProvider?.[field]),
        newValueEN: normalizeValue(newValue),
        newValueAR: normalizeArabicValue(newValue),
      })
    })
  }

  if (changeSource.user && typeof changeSource.user === 'object') {
    const userChanges = changeSource.user as Record<string, unknown>
    Object.entries(userChanges).forEach(([field, newValue]) => {
      const label = getFieldLabel(field)
      items.push({
        key: `user-${field}`,
        titleEN: label.en,
        titleAR: label.ar,
        oldValueEN: normalizeValue(currentUser?.[field]),
        oldValueAR: normalizeArabicValue(currentUser?.[field]),
        newValueEN: normalizeValue(newValue),
        newValueAR: normalizeArabicValue(newValue),
      })
    })
  }

  return items
}
