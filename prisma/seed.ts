import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Seeding database...')

  // Step 1: Delete all existing data in reverse dependency order
  console.log('🗑️  Cleaning existing data...')
  await db.vendorInstallmentPayment.deleteMany()
  await db.vendorContract.deleteMany()
  await db.vendorPayment.deleteMany()
  await db.payment.deleteMany()
  await db.contract.deleteMany()
  await db.inventoryItem.deleteMany()
  await db.customer.deleteMany()
  await db.vendor.deleteMany()
  await db.user.deleteMany()
  console.log('✅ Existing data cleaned.')

  // Step 2: Create User
  console.log('👤 Creating user...')
  await db.user.create({
    data: {
      uid: 'user_demo',
      email: 'demo@hafizmobiles.com',
      displayName: 'Hafiz Mobiles',
      role: 'admin',
    },
  })

  // Step 3: Create Vendors
  console.log('🏪 Creating vendors...')
  const vendor1 = await db.vendor.create({
    data: {
      name: 'Arslan Mahmood',
      company: 'Samsung Plaza Lahore',
      phone: '+92 300 1234567',
      address: 'Hall Road, Lahore',
      totalPurchases: 350000,
      totalPaid: 350000,
    },
  })

  const vendor2 = await db.vendor.create({
    data: {
      name: 'Zubair Ahmad',
      company: 'Xiaomi Official Distribution',
      phone: '+92 321 9876543',
      address: 'Katchery Road, Multan',
      totalPurchases: 480000,
      totalPaid: 300000,
    },
  })

  const vendor3 = await db.vendor.create({
    data: {
      name: 'Hamza Ali',
      company: 'Airlink Communications Ltd',
      phone: '+92 333 4567890',
      address: 'Blue Area, Islamabad',
      totalPurchases: 1200000,
      totalPaid: 850000,
    },
  })

  // Step 4: Create Inventory Items
  console.log('📱 Creating inventory items...')
  const inventory1 = await db.inventoryItem.create({
    data: {
      brand: 'Samsung',
      model: 'Galaxy S24 Ultra',
      variant: '12GB RAM / 512GB',
      color: 'Titanium Gray',
      ram: '12GB',
      storage: '512GB',
      imei1: '358920110482910',
      imei2: '358920110482911',
      purchasePrice: 290000,
      salePrice: 360000,
      minSalePrice: 345000,
      supplier: 'Samsung Plaza Lahore',
      vendorId: vendor1.id,
      purchaseDate: '2026-05-10',
      status: 'Sold',
      type: 'Mobile',
    },
  })

  const inventory2 = await db.inventoryItem.create({
    data: {
      brand: 'Xiaomi',
      model: 'Redmi Note 13 Pro',
      variant: '8GB RAM / 256GB',
      color: 'Midnight Black',
      ram: '8GB',
      storage: '256GB',
      imei1: '864120150937402',
      imei2: '864120150937403',
      purchasePrice: 55000,
      salePrice: 75000,
      minSalePrice: 72000,
      supplier: 'Xiaomi Official Distribution',
      vendorId: vendor2.id,
      purchaseDate: '2026-05-15',
      status: 'Sold',
      type: 'Mobile',
    },
  })

  const inventory3 = await db.inventoryItem.create({
    data: {
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      variant: '256GB Gold',
      color: 'Natural Titanium',
      ram: '8GB',
      storage: '256GB',
      imei1: '352345112233440',
      imei2: '352345112233441',
      purchasePrice: 310000,
      salePrice: 395000,
      minSalePrice: 380000,
      supplier: 'Airlink Communications Ltd',
      vendorId: vendor3.id,
      purchaseDate: '2026-05-20',
      status: 'Available',
      type: 'Mobile',
    },
  })

  const inventory4 = await db.inventoryItem.create({
    data: {
      brand: 'Realme',
      model: 'Realme 12 Pro+',
      variant: '12GB RAM / 256GB',
      color: 'Submarine Blue',
      ram: '12GB',
      storage: '256GB',
      imei1: '860455010619280',
      imei2: '860455010619281',
      purchasePrice: 88000,
      salePrice: 115000,
      minSalePrice: 110000,
      supplier: 'Airlink Communications Ltd',
      vendorId: vendor3.id,
      purchaseDate: '2026-05-24',
      status: 'Available',
      type: 'Mobile',
    },
  })

  // Step 5: Create Customers
  console.log('🧑 Creating customers...')
  const customer1 = await db.customer.create({
    data: {
      fullName: 'Muhammad Ali',
      fatherName: 'Iftikhar Ali',
      cnic: '35201-1234567-9',
      phone: '+92 301 5556677',
      address: 'Model Town, House 14-B',
      city: 'Lahore',
      occupation: 'School Teacher',
      income: 75000,
      guarantorName: 'Kamran Sajid',
      guarantorPhone: '+92 300 4443322',
      status: 'Active',
    },
  })

  const customer2 = await db.customer.create({
    data: {
      fullName: 'Sajjad Ahmed',
      fatherName: 'Bashir Ahmed',
      cnic: '36302-9876543-1',
      phone: '+92 322 7778899',
      address: 'Shalimar Link Road',
      city: 'Lahore',
      occupation: 'Shopkeeper',
      income: 120000,
      guarantorName: 'Tariq Mahmood',
      guarantorPhone: '+92 321 5554123',
      status: 'Active',
    },
  })

  // Step 6: Create Contracts
  console.log('📝 Creating contracts...')
  const contract1 = await db.contract.create({
    data: {
      contractNumber: 'MT-2026-1001',
      customerId: customer1.id,
      itemId: inventory1.id,
      saleDate: '2026-05-12',
      purchasePrice: 290000,
      totalPrice: 420000,
      totalProfit: 130000,
      downPayment: 120000,
      remainingAmount: 300000,
      installmentsCount: 6,
      installmentAmount: 50000,
      profitPerInstallment: 21666,
      principalPerInstallment: 28334,
      frequency: 'Monthly',
      nextDueDate: '2026-06-12',
      totalPaid: 50000,
      status: 'Running',
    },
  })

  const contract2 = await db.contract.create({
    data: {
      contractNumber: 'MT-2026-1002',
      customerId: customer2.id,
      itemId: inventory2.id,
      saleDate: '2026-05-16',
      purchasePrice: 55000,
      totalPrice: 95000,
      totalProfit: 40000,
      downPayment: 35000,
      remainingAmount: 60000,
      installmentsCount: 4,
      installmentAmount: 15000,
      profitPerInstallment: 10000,
      principalPerInstallment: 5000,
      frequency: 'Monthly',
      nextDueDate: '2026-06-16',
      totalPaid: 15000,
      status: 'Running',
    },
  })

  // Step 7: Create Payments
  console.log('💰 Creating payments...')
  await db.payment.create({
    data: {
      contractId: contract1.id,
      customerId: customer1.id,
      amount: 50000,
      date: '2026-05-25',
      method: 'Cash',
      receivedBy: 'Hafiz Mobiles Store',
      receiptNumber: 'R-10901',
      nextDueDateSet: '2026-06-12',
    },
  })

  await db.payment.create({
    data: {
      contractId: contract2.id,
      customerId: customer2.id,
      amount: 15000,
      date: '2026-05-27',
      method: 'EasyPaisa',
      receivedBy: 'Hafiz Mobiles Store',
      receiptNumber: 'R-10902',
      nextDueDateSet: '2026-06-16',
    },
  })

  console.log('🎉 Seeding completed successfully!')
  console.log(`
  Summary:
  - 1 User (admin)
  - 3 Vendors
  - 4 Inventory Items (2 Sold, 2 Available)
  - 2 Customers
  - 2 Contracts (both Running)
  - 2 Payments
  `)
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await db.$disconnect()
    process.exit(1)
  })
