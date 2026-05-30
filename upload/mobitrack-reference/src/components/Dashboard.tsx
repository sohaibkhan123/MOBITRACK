import React, { useState } from 'react';
import { 
  Users, Smartphone, Wallet, DollarSign, AlertTriangle, 
  TrendingUp, TrendingDown, Clock, CheckCircle, Search, Calendar as CalendarIcon, MapPin, SearchCheck, Zap, ShoppingBag
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { useInventory, useCustomers, useContracts, usePayments } from '../hooks/useData';
import { formatCurrency, formatDate } from '../lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'];

export default function Dashboard() {
  const { customers } = useCustomers();
  const { contracts } = useContracts();
  const { payments } = usePayments();
  const { items } = useInventory();

  // Metrics
  const activeContracts = contracts.filter(c => c.status === 'Running' || c.status === 'Overdue');
  const activeCustomers = new Set(activeContracts.map(c => c.customerId)).size;
  
  const totalOutstanding = activeContracts.reduce((acc, c) => acc + c.remainingAmount, 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const collectedThisMonth = payments
    .filter(p => {
      const d = new Date(p.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, p) => acc + p.amount, 0);

  const overdueContracts = contracts.filter(c => c.status === 'Overdue');
  const overdueAmount = overdueContracts.reduce((acc, c) => acc + c.remainingAmount, 0);

  // Chart Data: Collection Overview
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const collectionData = last7Days.map(date => {
    const dailyTotal = payments
      .filter(p => p.date && p.date.startsWith(date))
      .reduce((acc, p) => acc + p.amount, 0);
    return {
      date: new Date(date).toLocaleDateString('default', { month: 'short', day: 'numeric' }),
      amount: dailyTotal
    };
  });

  // Chart Data: Overdue Summary
  const overdueSummary = [
    { name: '0 - 7 Days', value: Math.floor(overdueAmount * 0.3) },
    { name: '7 - 30 Days', value: Math.floor(overdueAmount * 0.4) },
    { name: '30+ Days', value: overdueAmount - Math.floor(overdueAmount * 0.3) - Math.floor(overdueAmount * 0.4) },
  ];

  // Upcomings
  const upcomingPayments = contracts
    .filter(c => c.status === 'Running' && c.nextDueDate)
    .sort((a, b) => new Date(a.nextDueDate!).getTime() - new Date(b.nextDueDate!).getTime())
    .slice(0, 4);

  // Defaulters
  const topDefaulters = overdueContracts
    .sort((a, b) => b.remainingAmount - a.remainingAmount)
    .slice(0, 5);

  // Status Summary
  const completedCount = contracts.filter(c => c.status === 'Completed').length;
  const statusSummary = [
    { name: 'Active', value: activeContracts.length - overdueContracts.length, color: '#10b981' },
    { name: 'Completed', value: completedCount, color: '#3b82f6' },
    { name: 'Defaulted', value: overdueContracts.length, color: '#ef4444' },
  ];

  // Recent Activity
  const recentActivity = payments
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  // Filtered Sales Performance
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const filteredContracts = contracts.filter(c => {
    if (!c.saleDate) return false;
    const d = new Date(c.saleDate);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const totalPurchaseFiltered = filteredContracts.reduce((acc, c) => {
    const item = items.find(i => i.id === c.itemId);
    const cost = c.purchasePrice || item?.purchasePrice || 0;
    return acc + cost;
  }, 0);
  
  const totalSaleFiltered = filteredContracts.reduce((acc, c) => acc + (c.totalPrice || 0), 0);
  const totalProfitFiltered = filteredContracts.reduce((acc, c) => acc + (c.totalProfit || 0), 0);

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const yearsList = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  const salesPerformanceData = [
    {
      name: `${monthsList[selectedMonth]} ${selectedYear}`,
      Purchase: totalPurchaseFiltered,
      Sale: totalSaleFiltered,
      Profit: totalProfitFiltered,
    }
  ];

  return (
    <div className="space-y-6 bg-gray-50/50 p-2 text-gray-800 min-h-full font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of your installment business</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 shadow-sm">
            <CalendarIcon size={16} className="text-gray-400" />
            <span>May 1 – May 31, 2024</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 shadow-sm">
            <MapPin size={16} className="text-gray-400" />
            <span>All Branches</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
               <Users className="text-indigo-600" size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Active Customers</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{activeCustomers}</h3>
              <p className="text-[10px] text-emerald-600 flex items-center font-medium mt-1">
                <TrendingUp size={12} className="mr-1" /> 12.5% <span className="text-gray-400 ml-1 font-normal">from last month</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
               <Smartphone className="text-emerald-600" size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Active Installments</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{activeContracts.length}</h3>
              <p className="text-[10px] text-emerald-600 flex items-center font-medium mt-1">
                <TrendingUp size={12} className="mr-1" /> 8.3% <span className="text-gray-400 ml-1 font-normal">from last month</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
               <Wallet className="text-amber-500" size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Outstanding</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalOutstanding)}</h3>
              <p className="text-[10px] text-red-500 flex items-center font-medium mt-1">
                <TrendingDown size={12} className="mr-1" /> 5.8% <span className="text-gray-400 ml-1 font-normal">from last month</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
               <DollarSign className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Collected This Month</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(collectedThisMonth)}</h3>
              <p className="text-[10px] text-emerald-600 flex items-center font-medium mt-1">
                <TrendingUp size={12} className="mr-1" /> 15.2% <span className="text-gray-400 ml-1 font-normal">from last month</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 5 */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
               <AlertTriangle className="text-red-500" size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Overdue Amount</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(overdueAmount)}</h3>
              <p className="text-[10px] text-emerald-600 flex items-center font-medium mt-1">
                <TrendingUp size={12} className="mr-1" /> 7.3% <span className="text-gray-400 ml-1 font-normal">from last month</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <h3 className="font-bold text-gray-900 text-[15px] flex items-center gap-2">
            <ShoppingBag className="text-blue-600" size={18} />
            Financial Overview
          </h3>
          <div className="flex items-center gap-2">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-[11px] font-medium px-3 py-1.5 bg-gray-50 text-gray-700 rounded border border-gray-200 outline-none cursor-pointer"
            >
              {monthsList.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-[11px] font-medium px-3 py-1.5 bg-gray-50 text-gray-700 rounded border border-gray-200 outline-none cursor-pointer"
            >
              {yearsList.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50/50 p-5 rounded-lg border border-blue-100/50 flex flex-col justify-center">
            <p className="text-[12px] text-blue-600 font-semibold mb-1">Total Purchase</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{formatCurrency(totalPurchaseFiltered)}</p>
          </div>
          <div className="bg-emerald-50/50 p-5 rounded-lg border border-emerald-100/50 flex flex-col justify-center">
            <p className="text-[12px] text-emerald-600 font-semibold mb-1">Total Sale</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{formatCurrency(totalSaleFiltered)}</p>
          </div>
          <div className="bg-purple-50/50 p-5 rounded-lg border border-purple-100/50 flex flex-col justify-center">
            <p className="text-[12px] text-purple-600 font-semibold mb-1">Total Profit</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{formatCurrency(totalProfitFiltered)}</p>
          </div>
        </div>

        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesPerformanceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={60}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dx={-10} tickFormatter={(val) => `Rs${val / 1000}k`} />
              <RechartsTooltip 
                cursor={{ fill: '#f8f9ff' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
              <Bar dataKey="Purchase" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Sale" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Profit" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Collection Overview */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm lg:col-span-1 xl:col-span-1">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-bold text-gray-900 text-[15px]">Collection Overview</h3>
            <select className="text-[11px] border-none bg-transparent font-medium text-gray-500 outline-none cursor-pointer">
              <option>This Month</option>
            </select>
          </div>
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-[11px] text-gray-400 font-medium mb-1">Total Collected</p>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{formatCurrency(collectedThisMonth)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-400 font-medium mb-1">Collection Rate</p>
              <p className="text-2xl font-bold text-emerald-500 tracking-tight">82.6%</p>
            </div>
          </div>
          <div className="h-48 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={collectionData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af' }} dy={10} minTickGap={20} />
                <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                <RechartsTooltip 
                  cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', padding: '8px 12px' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overdue Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 text-[15px] mb-6">Overdue Summary</h3>
          <div className="flex items-center justify-between">
            <div className="w-[160px] h-[160px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overdueSummary}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#fbbf24" />
                    <Cell fill="#f97316" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[9px] text-gray-400 font-semibold tracking-wider">SAR</span>
                <span className="text-xl font-bold text-gray-900 leading-none mt-1 tracking-tight">{formatCurrency(overdueAmount).replace(/[^0-9KBM]/g, '')}</span>
                <span className="text-[10px] text-gray-400 font-medium mt-1">Total</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1" />
                <div>
                  <p className="text-[11px] font-semibold text-gray-700">0 - 7 Days</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{formatCurrency(overdueSummary[0].value)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1" />
                <div>
                  <p className="text-[11px] font-semibold text-gray-700">7 - 30 Days</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{formatCurrency(overdueSummary[1].value)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1" />
                <div>
                  <p className="text-[11px] font-semibold text-gray-700">30+ Days</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{formatCurrency(overdueSummary[2].value)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-between items-center bg-red-50/50 p-3 rounded-lg border border-red-100">
            <div className="flex items-center gap-2 text-red-600 text-[11px] font-semibold">
              <AlertTriangle size={14} className="stroke-[2.5]" />
              {overdueContracts.length} accounts are overdue
            </div>
            <button className="text-[11px] font-semibold text-gray-700 bg-white px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">View All</button>
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 text-[15px]">Upcoming Payments</h3>
            <button className="text-[11px] text-blue-600 font-semibold hover:underline">View All</button>
          </div>
          
          <div className="flex-1 flex flex-col justify-between">
            {upcomingPayments.length > 0 ? upcomingPayments.map((contract, i) => {
              const customer = customers.find(c => c.id === contract.customerId);
              const item = items.find(i => i.id === contract.itemId);
              
              const isToday = contract.nextDueDate === new Date().toISOString().split('T')[0];
              let dateText = isToday ? 'Today' : formatDate(contract.nextDueDate || '');
              if (!isToday && contract.nextDueDate) {
                  const tmr = new Date(); tmr.setDate(tmr.getDate()+1);
                  if (contract.nextDueDate === tmr.toISOString().split('T')[0]) dateText = 'Tomorrow';
                  else {
                      const d = new Date(contract.nextDueDate);
                      dateText = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                  }
              }

              return (
                <div key={i} className="flex items-center justify-between group cursor-pointer border-b border-gray-50 last:border-0 pb-3 last:pb-0 mb-3 last:mb-0">
                  <div className="flex items-center gap-3">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(customer?.fullName || 'User')}&background=f3f4f6&color=4b5563`} alt="avatar" className="w-9 h-9 rounded-full shrink-0 border border-gray-100" />
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{customer?.fullName || 'Unknown'}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{item?.brand} {item?.model} – {contract.installmentsCount} Months</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-semibold ${isToday ? 'text-red-500' : isToday === false && dateText === 'Tomorrow' ? 'text-orange-500' : 'text-gray-400'}`}>{dateText}</p>
                    <p className="text-[13px] font-bold text-red-500 mt-1">{formatCurrency(contract.installmentAmount)}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400">No upcoming payments</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Defaulters */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 text-[15px]">Top Defaulters</h3>
            <button className="text-[11px] text-blue-600 font-semibold hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {topDefaulters.length > 0 ? topDefaulters.map((contract, i) => {
              const customer = customers.find(c => c.id === contract.customerId);
              const overdueDays = contract.nextDueDate 
                 ? Math.floor((new Date().getTime() - new Date(contract.nextDueDate).getTime()) / (1000 * 3600 * 24))
                 : 0;

              return (
                <div key={i} className="flex items-center justify-between border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center gap-3">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(customer?.fullName || 'User')}&background=ef4444&color=ffffff`} alt="avatar" className="w-8 h-8 rounded-full shrink-0 border border-gray-100" />
                    <p className="text-[13px] font-semibold text-gray-800">{customer?.fullName || 'Unknown'}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="text-[11px] font-medium text-gray-400">{overdueDays} days overdue</p>
                    <p className="text-[13px] font-bold text-red-500">{formatCurrency(contract.remainingAmount)}</p>
                  </div>
                </div>
              );
            }) : (
               <div className="text-center text-gray-400 text-sm py-4">No defaulters found</div>
            )}
          </div>
        </div>

        {/* Installment Status */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 text-[15px] mb-6">Installment Status</h3>
          <div className="flex items-center justify-between">
            <div className="w-[150px] h-[150px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusSummary}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusSummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 leading-none tracking-tight">{contracts.length}</span>
                <span className="text-[10px] text-gray-400 font-medium mt-1">Total</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {statusSummary.map((status, i) => (
                <div key={i} className="flex items-start justify-between gap-6 w-full min-w-[120px]">
                  <div className="flex items-start gap-2 pt-0.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                    <div>
                      <p className="text-[11px] font-semibold text-gray-700">{status.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{status.value} ({contracts.length ? ((status.value/contracts.length)*100).toFixed(1) : 0}%)</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 text-[15px]">Recent Activity</h3>
            <button className="text-[11px] text-blue-600 font-semibold hover:underline">View All</button>
          </div>
          <div className="space-y-0 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-0 md:before:translate-x-[15px] before:h-full before:w-0.5 before:bg-gray-100 pl-8 md:pl-0">
            {recentActivity.length > 0 ? recentActivity.map((activity, i) => {
              const customer = customers.find(c => c.id === activity.customerId);
              const time = new Date(activity.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              
              let Icon = CheckCircle;
              let iconColor = "text-emerald-500";
              let borderColor = "border-emerald-500";
              let title = "Payment received";
              let colorAmount = "text-emerald-500";
              
              if (i === 1) { // fake variation for UI
                 Icon = Wallet;
                 iconColor = "text-blue-500";
                 borderColor = "border-blue-500";
                 title = "New installment created";
                 colorAmount = "text-blue-500";
              }

              return (
                <div key={i} className="relative flex items-center justify-between pb-6 last:pb-0 group">
                  <div className={`absolute left-0 md:left-[15px] top-1 -ml-3.5 w-[26px] h-[26px] rounded-full bg-white border-[2px] ${borderColor} flex items-center justify-center shadow-sm z-10`}>
                    <Icon size={12} className={iconColor} />
                  </div>
                  <div className="w-full pl-10 pr-2 pb-1 border-b border-gray-50 flex items-start justify-between">
                    <div>
                        <p className="text-[12px] font-medium text-gray-800">{title} <span className="text-gray-500 font-normal">from {customer?.fullName || 'Unknown'}</span></p>
                        <p className="text-[10px] text-gray-400 mt-1">{isTodayDate(activity.date) ? 'Today' : formatDate(activity.date)}, {time}</p>
                    </div>
                    <div>
                        <p className={`text-[12px] font-bold ${colorAmount}`}>{formatCurrency(activity.amount)}</p>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center text-sm text-gray-400 mt-8">No recent activity</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

function isTodayDate(dateStr: string) {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
}


function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
