import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Billboard } from '@/types';
import { CustomerType, CUSTOMERS, getPriceFor } from '@/data/pricing';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: Billboard[];
  monthsById: Record<string, number>;
  customerById: Record<string, CustomerType>;
};

function format(n: number | null | undefined) {
  return (n ?? 0).toLocaleString();
}

function buildInvoiceHtml(props: Props) {
  const { items, monthsById, customerById } = props;
  const rows = items.map((b) => {
    const months = monthsById[b.id] || 1;
    const customer = customerById[b.id] || CUSTOMERS[0];
    const unit = getPriceFor(b.size, (b as any).level, customer, months) ?? 0;
    const total = unit; // الأسعار لدينا حسب الباقة كاملة
    return { b, months, customer, unit, total };
  });
  const grand = rows.reduce((s, r) => s + r.total, 0);

  const rowsHtml = rows.map(({ b, months, customer, unit, total }) => `
    <tr>
      <td class="cell">${b.id}</td>
      <td class="cell"><img src="${b.image || '/placeholder.svg'}" alt="${b.name}" class="thumb" /></td>
      <td class="cell">${(b as any).municipality || ''}</td>
      <td class="cell">${(b as any).district || ''}</td>
      <td class="cell">${b.location || ''}</td>
      <td class="cell">${b.size}${(b as any).level ? ' / ' + (b as any).level : ''}</td>
      <td class="cell">${(b as any).faces ?? '—'}</td>
      <td class="cell">${(b as any).direction ?? '—'}</td>
      <td class="cell">${format(unit)} د.ل</td>
      <td class="cell">${(b as any).expiryDate || '—'}</td>
      <td class="cell">${b.status === 'rented' ? 'محجوز' : b.status === 'maintenance' ? 'صيانة' : 'متاح'}</td>
    </tr>
  `).join('');

  return `<!doctype html>
  <html lang="ar" dir="rtl"><head>
    <meta charset="utf-8" />
    <title>فاتورة اللوحات</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body{font-family:'Cairo','Tajawal',system-ui,sans-serif;color:#111}
      .container{max-width:1100px;margin:24px auto;padding:16px}
      .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
      .title{font-weight:800;font-size:26px;letter-spacing:.5px}
      .brand{display:flex;align-items:center;gap:12px}
      .brand-mark{width:52px;height:52px;border-radius:12px;background:linear-gradient(135deg,#d4af37,#b8860b)}
      table{width:100%;border-collapse:collapse}
      th{background:#f7f3e3;color:#000;padding:10px 8px;text-align:right;border-bottom:2px solid #e6d698;font-weight:700}
      td.cell{padding:8px;border-bottom:1px solid #eee;text-align:right;vertical-align:middle}
      .thumb{height:64px;border-radius:8px}
      tfoot td{font-weight:700}
      .meta{color:#666;font-size:12px}
      .actions{margin-top:16px}
    </style>
  </head><body>
    <div class="container">
      <div class="header">
        <div class="title">فاتورة اللوحات المختارة</div>
        <div class="meta">التاريخ: ${new Date().toLocaleDateString('ar-LY')}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>رقم اللوحة</th>
            <th>صورة اللوحة</th>
            <th>البلدية</th>
            <th>المنطقة</th>
            <th>أقرب نقطة دالة</th>
            <th>المقاس</th>
            <th>عدد الأوجه</th>
            <th>الوجهة</th>
            <th>السعر</th>
            <th>تاريخ الإنتهاء</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="10" style="padding:8px;text-align:left">الإجمالي الكلي</td>
            <td style="padding:8px;text-align:right">${format(grand)} د.ل</td>
          </tr>
        </tfoot>
      </table>
      <div class="actions">
        <button onclick="window.print()" style="padding:8px 16px;border:1px solid #ddd;border-radius:8px;background:#111;color:#fff">طباعة</button>
      </div>
    </div>
  </body></html>`;
}

export default function InvoiceDialog(props: Props) {
  const { open, onOpenChange, items } = props;
  const grand = items.reduce((s, b) => s + 0, 0);
  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(buildInvoiceHtml(props));
    win.document.close();
    win.focus();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>فاتور�� اللوحات المختارة</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <div className="text-sm text-muted-foreground mb-3">راجع تفاصيل اللوحات ثم اطبع الفاتورة.</div>
          <Button onClick={handlePrint} className="bg-primary text-primary-foreground">طباعة</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
