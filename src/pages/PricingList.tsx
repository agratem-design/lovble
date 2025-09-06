import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MultiSelect from '@/components/ui/multi-select';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PRICING, CustomerType, CUSTOMERS } from '@/data/pricing';

function normalize(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const num = Number(String(val).replace(/[^\d.-]/g, ''));
  return isNaN(num) ? null : num;
}

const lsKey = 'pricing_overrides_v1';

type MonthKeyAll = 'شهر واحد' | '2 أشهر' | '3 أشهر' | '6 أشهر' | 'سنة كاملة' | 'يوم واحد';

type OverrideMap = Record<string, Partial<Record<MonthKeyAll, number>>>; // key = `${level}__${size}__${customer}`

const MONTH_OPTIONS = [
  { key: 'شهر واحد', label: 'شهرياً', months: 1 },
  { key: '2 أشهر', label: 'كل شهرين', months: 2 },
  { key: '3 أشهر', label: 'كل 3 أشهر', months: 3 },
  { key: '6 أشهر', label: 'كل 6 أشهر', months: 6 },
  { key: 'سنة كاملة', label: 'سنوي', months: 12 },
] as const;

type MonthKey = typeof MONTH_OPTIONS[number]['key'];

const PRIMARY_CUSTOMERS: string[] = ['عادي', 'مسوق', 'شركات'];
const extraCustomersLsKey = 'pricing_extra_customers_v1';
const customSizesLsKey = 'pricing_custom_sizes_v1';

export default function PricingList() {
  const allLevels = useMemo(() => Array.from(new Set(PRICING.map(p => p['المستوى']))), []);
  const allSizes = useMemo(() => Array.from(new Set(PRICING.map(p => p['المقاس']))), []);

  const [selectedLevel, setSelectedLevel] = useState<string>(allLevels[0] || 'A');
  const [selectedMonthKey, setSelectedMonthKey] = useState<MonthKey>('شهر واحد');
  const [sizeFilter, setSizeFilter] = useState<string[]>([]);
  const [otherCustomer, setOtherCustomer] = useState<string>('');

  const [extraCustomers, setExtraCustomers] = useState<string[]>(() => {
    try { const raw = localStorage.getItem(extraCustomersLsKey); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [customSizes, setCustomSizes] = useState<Record<string, string[]>>(() => {
    try { const raw = localStorage.getItem(customSizesLsKey); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  });

  const [overrides, setOverrides] = useState<OverrideMap>(() => {
    try {
      const raw = localStorage.getItem(lsKey);
      return raw ? (JSON.parse(raw) as OverrideMap) : {};
    } catch {
      return {};
    }
  });
  const [editing, setEditing] = useState<{ key: string; month: MonthKeyAll } | null>(null);

  const sizesForLevel = useMemo(() => {
    const set = new Set(
      PRICING.filter(r => r['المستوى'] === selectedLevel).map(r => r['المقاس'])
    );
    (customSizes[selectedLevel] || []).forEach(s => set.add(s));
    const arr = Array.from(set);
    return sizeFilter.length ? arr.filter(s => sizeFilter.includes(s)) : arr;
  }, [selectedLevel, sizeFilter, customSizes]);

  const keyFor = (size: string, customer: CustomerType) => `${selectedLevel}__${size}__${customer}`;

  const getBase = (size: string, customer: CustomerType, month: MonthKeyAll): number | null => {
    const row = PRICING.find(r => r['المقاس'] === size && r['المستوى'] === selectedLevel && r['الزبون'] === customer);
    return row ? normalize((row as any)[month]) : null;
  };

  const getVal = (size: string, customer: CustomerType, month: MonthKeyAll): number | null => {
    const k = keyFor(size, customer);
    const o = overrides[k]?.[month];
    return o ?? getBase(size, customer, month);
  };

  const setVal = (size: string, customer: CustomerType, month: MonthKeyAll, value: number | null) => {
    const k = keyFor(size, customer);
    setOverrides(prev => {
      const next: OverrideMap = { ...prev, [k]: { ...(prev[k] || {}) } };
      if (value == null || isNaN(value as any)) delete next[k][month]; else next[k][month] = value;
      localStorage.setItem(lsKey, JSON.stringify(next));
      return next;
    });
  };

  const priceFor = (size: string, customer: CustomerType): string => {
    const v = getVal(size, customer, selectedMonthKey);
    return v == null ? '—' : `${v.toLocaleString()} د.ل`;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-0 shadow-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">الأسعار</CardTitle>
              <p className="text-muted-foreground text-sm">إدارة أسعار الخدمات الإعلانية حسب فئة العميل</p>
            </div>
            <div className="flex items-center gap-2">
              {MONTH_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-fast ${selectedMonthKey === opt.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'}`}
                  onClick={() => setSelectedMonthKey(opt.key)}
                >
                  {opt.months === 1 ? 'شهرياً' : opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400/40 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 bg-amber-500 text-white font-semibold rounded-lg px-3 py-1 shadow-sm">مستوى {selectedLevel}</span>
              <span className="text-sm text-muted-foreground">أسعار الأحجام حسب فئة العميل</span>
            </div>
            <div className="flex items-center gap-2">
              {allLevels.map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-fast ${lvl === selectedLevel ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'}`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <MultiSelect options={allSizes.map(s => ({ label: s, value: s }))} value={sizeFilter} onChange={setSizeFilter} placeholder="تصفية الأحجام" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="bg-muted/50 border-b">
                  {CUSTOMERS.map(c => (
                    <th key={c} className="p-3 font-medium">{c}</th>
                  ))}
                  <th className="p-3 text-center w-24 bg-amber-50 dark:bg-white/5">��لحجم</th>
                </tr>
              </thead>
              <tbody>
                {sizesForLevel.map(size => (
                  <tr key={size} className="border-b hover:bg-background/50">
                    {CUSTOMERS.map(c => {
                      const k = keyFor(size, c);
                      const isEditing = editing && editing.key === k && editing.month === selectedMonthKey;
                      const current = getVal(size, c, selectedMonthKey);
                      return (
                        <td key={c} className="p-3">
                          {isEditing ? (
                            <input
                              autoFocus
                              type="number"
                              className="w-24 rounded-md border px-2 py-1 bg-background"
                              defaultValue={current ?? ''}
                              onBlur={(e) => { const v = e.target.value.trim(); setVal(size, c, selectedMonthKey, v === '' ? null : Number(v)); setEditing(null); }}
                              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(null); }}
                            />
                          ) : (
                            <button className="text-right w-full" onClick={() => setEditing({ key: k, month: selectedMonthKey })}>
                              {priceFor(size, c)}
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-center font-semibold bg-amber-50 dark:bg-white/5">{size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
