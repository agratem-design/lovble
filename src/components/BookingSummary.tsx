import { Billboard } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, ShoppingCart, Calculator, Printer } from 'lucide-react';
import { CUSTOMERS, CustomerType, getPriceFor } from '@/data/pricing';
import { useState } from 'react';
import type { Billboard } from '@/types';
import { buildAlFaresOfferHtml } from '@/components/Invoice/printTemplates';

interface BookingSummaryProps {
  selectedBillboards: Billboard[];
  onRemoveBillboard: (billboardId: string) => void;
  onSubmitBooking: () => void;
  isOpen: boolean;
}

function buildPrintHtml(items: Billboard[], months: number, customer: CustomerType) {
  const rows = items.map((b, i) => {
    const unit = getPriceFor((b as any).Size || (b as any).size, (b as any).Level || (b as any).level, customer, months) ?? 0;
    const city = (b as any).City || (b as any).city || '';
    const district = (b as any).District || (b as any).district || '';
    const landmark = (b as any).Nearest_Landmark || (b as any).location || '';
    return `<tr>
      <td>${i + 1}</td>
      <td>${b.Billboard_Name || b.id || b.ID}</td>
      <td>${city}</td>
      <td>${district}</td>
      <td>${landmark}</td>
      <td>${(b as any).Size || (b as any).size || ''}</td>
      <td>${unit.toLocaleString('ar-LY')} د.ل</td>
    </tr>`;
  }).join('');
  const grand = items.reduce((s,b)=> s + (getPriceFor((b as any).Size || (b as any).size, (b as any).Level || (b as any).level, customer, months) ?? 0), 0);
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>عرض سعر</title>
  <style>body{font-family:'Cairo','Tajawal',system-ui,sans-serif;padding:16px;color:#111}table{width:100%;border-collapse:collapse}th,td{border:1px solid #eee;padding:8px;text-align:right}th{background:#faf6e8;font-weight:800}</style></head>
  <body>
    <h2>عرض سعر للوحات المختارة</h2>
    <div>المدة: ${months === 12 ? 'سنة كاملة' : months + ' شهر'}</div>
    <div>فئة العميل: ${customer}</div>
    <table><thead><tr><th>#</th><th>اللوحة</th><th>المدينة</th><th>المنطقة</th><th>نقطة دالة</th><th>المقاس</th><th>السعر</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="6" style="text-align:left">الإجمالي</td><td>${grand.toLocaleString('ar-LY')} د.ل</td></tr></tfoot>
    </table>
    <script>window.onload=()=>window.print()</script>
  </body></html>`;
}

export function BookingSummary({
  selectedBillboards,
  onRemoveBillboard,
  onSubmitBooking,
  isOpen
}: BookingSummaryProps) {
  const [months, setMonths] = useState<number>(1);
  const [customer, setCustomer] = useState<CustomerType>(CUSTOMERS[0]);

  const totalCost = selectedBillboards.reduce((sum, b) => {
    const price = getPriceFor((b as any).Size || (b as any).size, (b as any).Level || (b as any).level, customer, months) ?? 0;
    return sum + price;
  }, 0);

  if (!isOpen || selectedBillboards.length === 0) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[70vh] overflow-hidden shadow-luxury border-primary/20 bg-card/95 backdrop-blur-sm z-50">
      <CardHeader className="bg-gradient-primary text-primary-foreground pb-3">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          ملخص الحجز ({selectedBillboards.length} لوحة)
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 max-h-64 overflow-y-auto">
        <div className="space-y-3">
          {selectedBillboards.map((billboard) => (
            <div key={billboard.ID} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex-1">
                <div className="font-medium text-sm">{billboard.Billboard_Name || `لوحة ${billboard.ID}`}</div>
                <div className="text-xs text-muted-foreground">
                  {billboard.Size} - {billboard.District || billboard.City}
                </div>
                <div className="text-xs text-primary font-medium">
                  {billboard.Price || '0'} د.ل
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveBillboard(billboard.ID.toString())}
                className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>

      <Separator />

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Select value={String(months)} onValueChange={(v)=>setMonths(parseInt(v))}>
            <SelectTrigger>
              <SelectValue placeholder="المدة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">شهر واحد</SelectItem>
              <SelectItem value="2">شهران</SelectItem>
              <SelectItem value="3">3 أشهر</SelectItem>
              <SelectItem value="6">6 أشهر</SelectItem>
              <SelectItem value="12">سنة كاملة</SelectItem>
            </SelectContent>
          </Select>
          <Select value={customer} onValueChange={(v)=>setCustomer(v as CustomerType)}>
            <SelectTrigger>
              <SelectValue placeholder="فئة العميل" />
            </SelectTrigger>
            <SelectContent>
              {CUSTOMERS.map(c=> (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between text-lg font-bold text-primary">
          <span className="flex items-center gap-1">
            <Calculator className="h-4 w-4" />
            الإجمالي:
          </span>
          <span>{totalCost.toLocaleString('ar-LY')} د.ل</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onSubmitBooking}
            variant="hero"
            className="w-full font-semibold"
          >
            إرسال طلب الحجز
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              const win = window.open('', '_blank');
              if (!win) return;
              win.document.write(buildAlFaresOfferHtml(selectedBillboards as any, { months, customer }));
              win.document.close();
              win.focus();
            }}
          >
            <Printer className="h-4 w-4 ml-2" /> طباعة
          </Button>
        </div>
      </div>
    </Card>
  );
}
