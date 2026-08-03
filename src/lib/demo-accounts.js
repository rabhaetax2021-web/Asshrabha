const demoAccounts = [
  {
    key: 'admin',
    mobile: '01094056919',
    password: '2463',
    role: 'ROOT_ADMIN',
    status: 'APPROVED',
    customerType: 'CUSTOMER',
    nameAR: 'مدير النظام',
    nameEN: 'System Admin',
  },
  {
    key: 'admin2',
    mobile: '01091201789',
    password: '12345',
    role: 'ROOT_ADMIN',
    status: 'APPROVED',
    customerType: 'CUSTOMER',
    nameAR: 'مدير ثان',
    nameEN: 'Admin 2',
  },
  {
    key: 'provider',
    mobile: '01094056918',
    password: '2463',
    role: 'PROVIDER',
    status: 'APPROVED',
    customerType: 'CUSTOMER',
    nameAR: 'المورد التجريبي',
    nameEN: 'Demo Provider',
  },
  {
    key: 'retail',
    mobile: '01094056917',
    password: '2463',
    role: 'CUSTOMER',
    status: 'APPROVED',
    customerType: 'CUSTOMER',
    nameAR: 'عميل تجزئة',
    nameEN: 'Retail Customer',
  },
  {
    key: 'wholesale',
    mobile: '01094056916',
    password: '2463',
    role: 'CUSTOMER',
    status: 'APPROVED',
    customerType: 'SHOP',
    nameAR: 'عميل جملة',
    nameEN: 'Wholesale Customer',
  },
];

function getDemoAccounts() {
  return demoAccounts.map((account) => ({ ...account }));
}

function getDemoAccountByMobile(mobile) {
  const normalized = String(mobile || '').replace(/\D/g, '');
  return demoAccounts.find((account) => account.mobile === normalized) || null;
}

module.exports = {
  demoAccounts,
  getDemoAccounts,
  getDemoAccountByMobile,
};
