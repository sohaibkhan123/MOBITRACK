import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { Vendor, VendorPayment, InventoryItem, Customer, Contract, Payment, VendorContract, VendorInstallmentPayment } from '../types';

export function useVendorContracts() {
  const [vendorContracts, setVendorContracts] = useState<VendorContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, 'vendorContracts');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorContract));
      setVendorContracts(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { vendorContracts, loading };
}

export function useVendorInstallments() {
  const [vendorInstallments, setVendorInstallments] = useState<VendorInstallmentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, 'vendorInstallments');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorInstallmentPayment));
      setVendorInstallments(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { vendorInstallments, loading };
}

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, 'vendors');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vendor));
      setVendors(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { vendors, loading };
}

export function useVendorPayments() {
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, 'vendorPayments');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorPayment));
      setPayments(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { payments, loading };
}

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, 'inventory');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      setItems(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { items, loading };
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, 'customers');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { customers, loading };
}

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, 'contracts');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));
      setContracts(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { contracts, loading };
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, 'payments');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      setPayments(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { payments, loading };
}
