// Custom hybrid Database Layer supporting BOTH local browser memory ("Offline Mode") and external MySQL proxies ("Cloud Mode")
export const db = { type: 'db' };
export const auth = { currentUser: null as any };

// Seed data generator for fully operational offline mock experience
const SEED_DATA: Record<string, any[]> = {
  users: [
    {
      id: "user_demo",
      uid: "user_demo",
      email: "demo@hafizmobiles.com",
      displayName: "Hafiz Mobiles",
      role: "admin",
      createdAt: "1716990000000"
    }
  ],
  vendors: [
    {
      id: "vendor_1",
      name: "Arslan Mahmood",
      company: "Samsung Plaza Lahore",
      phone: "+92 300 1234567",
      address: "Hall Road, Lahore",
      totalPurchases: 350000,
      totalPaid: 350000
    },
    {
      id: "vendor_2",
      name: "Zubair Ahmad",
      company: "Xiaomi Official Distribution",
      phone: "+92 321 9876543",
      address: "Katchery Road, Multan",
      totalPurchases: 480000,
      totalPaid: 300000
    },
    {
      id: "vendor_3",
      name: "Hamza Ali",
      company: "Airlink Communications Ltd",
      phone: "+92 333 4567890",
      address: "Blue Area, Islamabad",
      totalPurchases: 1200000,
      totalPaid: 850000
    }
  ],
  inventory: [
    {
      id: "inv_1",
      brand: "Samsung",
      model: "Galaxy S24 Ultra",
      variant: "12GB RAM / 512GB",
      color: "Titanium Gray",
      ram: "12GB",
      storage: "512GB",
      imei1: "358920110482910",
      imei2: "358920110482911",
      purchasePrice: 290000,
      salePrice: 360000,
      minSalePrice: 345000,
      supplier: "Samsung Plaza Lahore",
      vendorId: "vendor_1",
      purchaseDate: "2026-05-10",
      status: "Sold",
      type: "Mobile"
    },
    {
      id: "inv_2",
      brand: "Xiaomi",
      model: "Redmi Note 13 Pro",
      variant: "8GB RAM / 256GB",
      color: "Midnight Black",
      ram: "8GB",
      storage: "256GB",
      imei1: "864120150937402",
      imei2: "864120150937403",
      purchasePrice: 55000,
      salePrice: 75000,
      minSalePrice: 72000,
      supplier: "Xiaomi Official Distribution",
      vendorId: "vendor_2",
      purchaseDate: "2026-05-15",
      status: "Sold",
      type: "Mobile"
    },
    {
      id: "inv_3",
      brand: "Apple",
      model: "iPhone 15 Pro",
      variant: "256GB Gold",
      color: "Natural Titanium",
      ram: "8GB",
      storage: "256GB",
      imei1: "352345112233440",
      imei2: "352345112233441",
      purchasePrice: 310000,
      salePrice: 395000,
      minSalePrice: 380000,
      supplier: "Airlink Communications Ltd",
      vendorId: "vendor_3",
      purchaseDate: "2026-05-20",
      status: "Available",
      type: "Mobile"
    },
    {
      id: "inv_4",
      brand: "Realme",
      model: "Realme 12 Pro+",
      variant: "12GB RAM / 256GB",
      color: "Submarine Blue",
      ram: "12GB",
      storage: "256GB",
      imei1: "860455010619280",
      imei2: "860455010619281",
      purchasePrice: 88000,
      salePrice: 115000,
      minSalePrice: 110000,
      supplier: "Airlink Communications Ltd",
      vendorId: "vendor_3",
      purchaseDate: "2026-05-24",
      status: "Available",
      type: "Mobile"
    }
  ],
  customers: [
    {
      id: "cust_1",
      fullName: "Muhammad Ali",
      fatherName: "Iftikhar Ali",
      cnic: "35201-1234567-9",
      phone: "+92 301 5556677",
      address: "Model Town, House 14-B",
      city: "Lahore",
      occupation: "School Teacher",
      income: 75000,
      guarantorName: "Kamran Sajid",
      guarantorPhone: "+92 300 4443322",
      status: "Active",
      createdAt: "1716990000000"
    },
    {
      id: "cust_2",
      fullName: "Sajjad Ahmed",
      fatherName: "Bashir Ahmed",
      cnic: "36302-9876543-1",
      phone: "+92 322 7778899",
      address: "Shalimar Link Road",
      city: "Lahore",
      occupation: "Shopkeeper",
      income: 120000,
      guarantorName: "Tariq Mahmood",
      guarantorPhone: "+92 321 5554123",
      status: "Active",
      createdAt: "1717076400000"
    }
  ],
  contracts: [
    {
      id: "cont_1",
      contractNumber: "MT-2026-1001",
      customerId: "cust_1",
      itemId: "inv_1",
      saleDate: "2026-05-12",
      purchasePrice: 290000,
      totalPrice: 420000,
      totalProfit: 130000,
      downPayment: 120000,
      remainingAmount: 300000,
      installmentsCount: 6,
      installmentAmount: 50000,
      profitPerInstallment: 21666,
      principalPerInstallment: 28334,
      frequency: "Monthly",
      nextDueDate: "2026-06-12",
      totalPaid: 50000,
      status: "Running"
    },
    {
      id: "cont_2",
      contractNumber: "MT-2026-1002",
      customerId: "cust_2",
      itemId: "inv_2",
      saleDate: "2026-05-16",
      purchasePrice: 55000,
      totalPrice: 95000,
      totalProfit: 40000,
      downPayment: 35000,
      remainingAmount: 60000,
      installmentsCount: 4,
      installmentAmount: 15000,
      profitPerInstallment: 10000,
      principalPerInstallment: 5000,
      frequency: "Monthly",
      nextDueDate: "2026-06-16",
      totalPaid: 15000,
      status: "Running"
    }
  ],
  payments: [
    {
      id: "pay_1",
      contractId: "cont_1",
      customerId: "cust_1",
      amount: 50000,
      date: "2026-05-25",
      method: "Cash",
      receivedBy: "Hafiz Mobiles Store",
      receiptNumber: "R-10901",
      nextDueDateSet: "2026-06-12"
    },
    {
      id: "pay_2",
      contractId: "cont_2",
      customerId: "cust_2",
      amount: 15000,
      date: "2026-05-27",
      method: "EasyPaisa",
      receivedBy: "Hafiz Mobiles Store",
      receiptNumber: "R-10902",
      nextDueDateSet: "2026-06-16"
    }
  ],
  vendorContracts: [],
  vendorInstallments: [],
  vendorPayments: []
};

// Mode detector
export function getStorageMode(): 'offline' | 'mysql' {
  const mode = localStorage.getItem('mobitrack_storage_mode');
  if (!mode) {
    // Default to offline sandbox as requested right now
    localStorage.setItem('mobitrack_storage_mode', 'offline');
    return 'offline';
  }
  return mode === 'mysql' ? 'mysql' : 'offline';
}

export function setStorageMode(mode: 'offline' | 'mysql') {
  localStorage.setItem('mobitrack_storage_mode', mode);
  window.dispatchEvent(new Event('storage-mode-change'));
}

// Local Storage Helper to fetch mock store state
function getLocalStorageCollection(name: string): any[] {
  const key = `mobitrack_local_db_${name}`;
  const raw = localStorage.getItem(key);
  if (!raw) {
    const defaultData = SEED_DATA[name] || [];
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveLocalStorageCollection(name: string, data: any[]) {
  const key = `mobitrack_local_db_${name}`;
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new Event('db-updated-' + name));
}

export function initializeApp() {
  return { name: 'MobiTrack-App' };
}

export function getFirestore() {
  return db;
}

export function getAuth() {
  return auth;
}

// References
export function collection(dbInstance: any, name: string) {
  return { type: 'collection', name };
}

export function doc(dbInstance: any, collectionName: string, id: string) {
  return { type: 'doc', collection: collectionName, id };
}

// Read One
export async function getDoc(docRef: any) {
  const mode = getStorageMode();
  if (mode === 'offline') {
    const list = getLocalStorageCollection(docRef.collection);
    const found = list.find((item: any) => item.id === docRef.id);
    return {
      exists: () => !!found,
      data: () => found || null
    };
  }

  try {
    const res = await fetch(`/api/db/get?collection=${docRef.collection}&id=${docRef.id}`);
    if (!res.ok) {
      return { exists: () => false, data: () => null };
    }
    const data = await res.json();
    return {
      exists: () => !!data,
      data: () => data
    };
  } catch (e) {
    return { exists: () => false, data: () => null };
  }
}

// Overwrite/Set
export async function setDoc(docRef: any, data: any) {
  const mode = getStorageMode();
  const finalData = { ...data, id: docRef.id };
  
  if (mode === 'offline') {
    const list = getLocalStorageCollection(docRef.collection);
    const filtered = list.filter((item: any) => item.id !== docRef.id);
    filtered.push(finalData);
    saveLocalStorageCollection(docRef.collection, filtered);
    return finalData;
  }

  const res = await fetch('/api/db/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection: docRef.collection, id: docRef.id, data: finalData })
  });
  return res.json();
}

// Add/Create
export async function addDoc(collectionRef: any, data: any) {
  const mode = getStorageMode();
  const generatedId = 'doc_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  const finalData = { ...data, id: generatedId };

  if (mode === 'offline') {
    const list = getLocalStorageCollection(collectionRef.name);
    list.push(finalData);
    saveLocalStorageCollection(collectionRef.name, list);
    return finalData;
  }

  const res = await fetch('/api/db/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection: collectionRef.name, id: generatedId, data: finalData })
  });
  return res.json();
}

// Update
export async function updateDoc(docRef: any, data: any) {
  const mode = getStorageMode();

  if (mode === 'offline') {
    const list = getLocalStorageCollection(docRef.collection);
    const updated = list.map((item: any) => {
      if (item.id === docRef.id) {
        const merged = { ...item };
        for (const [key, val] of Object.entries(data)) {
          if (val && typeof val === 'object' && (val as any)._type === 'increment') {
            const originalVal = Number(merged[key]) || 0;
            merged[key] = originalVal + Number((val as any).value);
          } else {
            merged[key] = val;
          }
        }
        return merged;
      }
      return item;
    });
    saveLocalStorageCollection(docRef.collection, updated);
    return { success: true };
  }

  const res = await fetch('/api/db/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection: docRef.collection, id: docRef.id, data })
  });
  return res.json();
}

// Delete
export async function deleteDoc(docRef: any) {
  const mode = getStorageMode();

  if (mode === 'offline') {
    const list = getLocalStorageCollection(docRef.collection);
    const filtered = list.filter((item: any) => item.id !== docRef.id);
    saveLocalStorageCollection(docRef.collection, filtered);
    return { success: true };
  }

  const res = await fetch('/api/db/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection: docRef.collection, id: docRef.id })
  });
  return res.json();
}

// Query snapshots mimicking Firestore
export function onSnapshot(target: any, callback: (snapshot: any) => void) {
  const collectionName = target.type === 'collection' ? target.name : target.collection;
  
  const triggerCallback = (itemsList: any[]) => {
    const mappedDocs = itemsList.map((item: any) => ({
      id: item.id,
      data: () => item
    }));
    callback({
      docs: mappedDocs,
      forEach: (cb: any) => mappedDocs.forEach(cb)
    });
  };

  const mode = getStorageMode();
  if (mode === 'offline') {
    // Immediate load
    const currentList = getLocalStorageCollection(collectionName);
    triggerCallback(currentList);

    // Watcher function
    const localUpdatedHandler = () => {
      const refreshedList = getLocalStorageCollection(collectionName);
      triggerCallback(refreshedList);
    };

    window.addEventListener('db-updated-' + collectionName, localUpdatedHandler);
    window.addEventListener('storage-mode-change', localUpdatedHandler);

    return () => {
      window.removeEventListener('db-updated-' + collectionName, localUpdatedHandler);
      window.removeEventListener('storage-mode-change', localUpdatedHandler);
    };
  }

  const fetchAndTrigger = async () => {
    try {
      const res = await fetch(`/api/db/list?collection=${collectionName}`);
      if (res.ok) {
        const list = await res.json();
        triggerCallback(list);
      }
    } catch (e) {
      console.error('Polling error for collection: ' + collectionName, e);
    }
  };

  fetchAndTrigger();
  const intervalId = setInterval(fetchAndTrigger, 3000); 

  const storageChangeHandler = () => {
    fetchAndTrigger();
  };
  window.addEventListener('storage-mode-change', storageChangeHandler);

  return () => {
    clearInterval(intervalId);
    window.removeEventListener('storage-mode-change', storageChangeHandler);
  };
}

// Firestore-like increment support
export function increment(value: number) {
  return { _type: 'increment', value };
}

// Unused parameters
export function query(ref: any) { return ref; }
export function where() { return {}; }
export function getDocFromServer() {}

// Custom Authentication support
export class GoogleAuthProvider {}
export async function signInWithPopup() {}
export async function signOut() {
  localStorage.removeItem('mobitrack_user');
  window.dispatchEvent(new Event('auth-change'));
}

export function onAuthStateChanged(authInstance: any, callback: (user: any) => void) {
  const checkAuth = () => {
    const raw = localStorage.getItem('mobitrack_user');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        authInstance.currentUser = parsed;
        callback(parsed);
      } catch (e) {
        authInstance.currentUser = null;
        callback(null);
      }
    } else {
      // Add a fallback offline mock user so they do not get blocked by login
      const mockProfile = {
        uid: 'user_demo',
        email: 'demo@hafizmobiles.com',
        displayName: 'Hafiz Mobiles',
        role: 'admin'
      };
      localStorage.setItem('mobitrack_user', JSON.stringify(mockProfile));
      authInstance.currentUser = mockProfile;
      callback(mockProfile);
    }
  };

  checkAuth();
  window.addEventListener('auth-change', checkAuth);
  return () => window.removeEventListener('auth-change', checkAuth);
}
