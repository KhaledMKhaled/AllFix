import { createHash } from "crypto";

export type ContractDetails = {
  customerName: string;
  taxCard?: string;
  nationalId?: string;
  commercialRegister?: string;
  address?: string;
  email: string;
  phone: string;
  planName: string;
  packagePrice: string;
  vat: string;
  discount: string;
  total: string;
  addons?: Array<{ sku?: string; name: string; quantity: number; lineTotalPiastres?: number; price?: string }>;
};

const CONTRACT_ASSETS = {
  wordmark: "/brand/mofawtar-badge-logo.png",
  stamp: "/brand/mofawtar-official-stamp.png",
  signature: "/brand/mofawtar-signature.png",
};

const escapeHtml = (value: string | undefined) => (value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[char] ?? char);
const fill = (value: string | undefined, fallback = "........................") => escapeHtml(value?.trim() ? value : fallback);

export function makeContractNumber(index: number, now = new Date()) {
  return `MOF-CON-${now.getUTCFullYear()}-${String(index).padStart(6, "0")}`;
}

export function buildDemoContractHtml(contractNumber: string, details: ContractDetails) {
  const today = new Intl.DateTimeFormat("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
  const planRows = [
    ["رواد الأعمال", "250 ج.م", "1 ملف", "24 نقطة"],
    ["الباقة الخاصة", "850 ج.م", "1 ملف", "9600 نقطة"],
    ["باقة المحترف", "500 ج.م", "10 ملفات", "24 نقطة"],
    ["باقة الخبير", "1000 ج.م", "25 ملفاً", "24 نقطة"],
    ["باقة الاستشاري", "1800 ج.م", "50 ملفاً", "24 نقطة"],
    ["باقة النخبة", "2500 ج.م", "100 ملف", "24 نقطة"],
  ].map(([name, price, files, points]) => `<tr class="${name === details.planName ? "chosen" : ""}"><td class="center">${name === details.planName ? "✓" : "○"}</td><td>${name}</td><td>${name === details.planName ? escapeHtml(details.packagePrice) : price}</td><td>${files}</td><td>${points}</td></tr>`).join("");

  const baseAddons = [
    { sku: "points", name: "شحن 9600 نقطة", defaultPrice: "600 ج.م" },
    { sku: "pos", name: "جهاز POS إضافي", defaultPrice: "500 ج.م" },
    { sku: "user", name: "مستخدم إضافي", defaultPrice: "50 ج.م" },
  ];

  const addonRows = baseAddons.map(base => {
    const found = details.addons?.find(a => a.sku === base.sku || a.name.includes(base.name) || base.name.includes(a.name));
    const isSelected = Boolean(found && found.quantity > 0);
    const count = isSelected ? `${found!.quantity}` : "....";
    const priceText = isSelected && found!.lineTotalPiastres ? `${(found!.lineTotalPiastres / 100).toLocaleString("ar-EG")} ج.م` : base.defaultPrice;
    return `<tr class="${isSelected ? "chosen" : ""}"><td class="center">${isSelected ? "✓" : "○"}</td><td class="small">${base.name}</td><td>${priceText}</td><td class="center">${count}</td></tr>`;
  }).join("");

  return `<style>
  .contract-document{color:#07081A;font-family:Tahoma,Arial,sans-serif;line-height:1.55;background:#fff;direction:rtl}.contract-page{width:210mm;min-height:297mm;box-sizing:border-box;position:relative;padding:15mm 15mm 22mm;background:#fff;page-break-after:always}.contract-page:last-child{page-break-after:auto}.contract-page *{box-sizing:border-box}.contract-header,.contract-footer,.signature-row,.contract-split{display:flex;justify-content:space-between;gap:18px}.contract-header{align-items:flex-start;margin-bottom:5mm}.contract-title{color:#4046B5;font-size:22px;font-weight:800;margin:0 0 2px}.contract-subtitle{font-family:Arial,sans-serif;font-size:12px;color:#697084;letter-spacing:.7px}.contract-logo{height:23mm;max-width:55mm;object-fit:contain}.contract-number{font-size:11px;border-bottom:1px dashed #9ba0af;padding-bottom:3px;min-width:44mm;text-align:left}.contract-intro,.contract-declaration{background:#ECECF7;border:1px solid rgba(64,70,181,.25);border-radius:8px;padding:10px 12px;font-size:11px;line-height:1.8}.contract-heading{color:#4046B5;font-size:14px;font-weight:800;margin:12px 0 7px}.contract-index{display:inline-grid;place-items:center;width:19px;height:19px;margin-left:7px;border-radius:50%;background:#4046B5;color:#fff;font-size:10px}.contract-document table{width:100%;border-collapse:collapse;margin:0 0 10px}.contract-document th,.contract-document td{border:1px solid #4046B5;padding:6px 8px;text-align:right;font-size:10px;vertical-align:middle}.contract-document th,.label-cell{background:#ECECF7;color:#4046B5;font-weight:800}.muted{color:#7b8190}.center{text-align:center!important}.small{font-size:9px!important}.chosen{background:#f5f5ff}.chosen td{font-weight:800;color:#252a8d}.contract-split{margin-top:11px}.contract-split>div:first-child{width:60%}.contract-split>div:last-child{width:40%}.contract-note{font-size:8px;color:#6b7280;margin:3px 0}.contract-total td:first-child{background:#4046B5;color:#fff;font-weight:800}.contract-total td:last-child{border:2px solid #4046B5;color:#4046B5;font-weight:800}.contract-footer{position:absolute;right:15mm;left:15mm;bottom:9mm;align-items:center;border-top:1.5px dashed #4046B5;padding-top:5px;color:#4046B5;font-size:9px}.footer-logo{height:9mm;max-width:30mm;object-fit:contain}.declaration{margin:0 0 13px}.terms{display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:9px;line-height:1.55}.terms>div{min-width:0}.term{border-bottom:1px dashed #ECECF7;padding:5px 0}.term strong{display:block;color:#4046B5;margin-bottom:1px}.approval{text-align:center;border-top:1px dashed #4046B5;margin-top:18px;padding-top:13px}.approval h4{margin:0;color:#4046B5;font-size:11px}.approval p{margin:5px 0 20px;color:#6b7280;font-family:Arial,sans-serif;font-size:9px}.signature-row{padding:0 28px;text-align:center}.signature-box{width:33%}.signature-box h5{font-size:11px;margin:0 0 5px}.signature-box p{font-size:9px;color:#6b7280;margin:0 0 14px}.party-mark{height:28mm;max-width:55mm;object-fit:contain;mix-blend-mode:multiply}.signature-line{border-top:1px dashed #9ca3af;padding-top:5px;color:#4046B5;font-size:9px;font-weight:800}.contract-stamp{position:absolute;left:20mm;bottom:24mm;width:38mm;height:auto;opacity:.92;object-fit:contain;mix-blend-mode:multiply}.hidden-print-note{font-size:8px;color:#697084;margin-top:4px}.pdf-page{background:#fff}@media print{.contract-page{margin:0;box-shadow:none;page-break-after:always}.contract-page:last-child{page-break-after:auto}}
  </style>
  <section class="pdf-page contract-page">
    <header class="contract-header"><div><h1 class="contract-title">عقد توفير خدمات المنصة</h1><div class="contract-subtitle" dir="ltr">SaaS Subscription Agreement</div></div><div><img class="contract-logo" src="${CONTRACT_ASSETS.wordmark}" alt="MOFAWTAR"/><div class="contract-number"><span class="muted">عقد رقم:</span> <strong dir="ltr">${contractNumber}</strong></div></div></header>
    <div class="contract-declaration"><strong>نسخة إثبات مفهوم:</strong> هذا المستند نموذج تجريبي لتوضيح رحلة التعاقد داخل PoC، ولا يُعد عقدًا نافذًا أو توقيعًا إلكترونيًا ملزمًا قبل المراجعة القانونية والتوقيع الفعلي.</div>
    <div class="contract-intro">إنه في يوم <strong>${today}</strong> الموافق <strong>${today}</strong><br>يُعرض هذا النموذج بين <strong>شركة "تاكس إجيبت للتطبيقات"</strong>، (س.ت: 190516)، ومقرها 8013 ش 9، المقطم، القاهرة، بصفتها المالكة لمنصة <strong>«مفوتر»</strong>، (ويشار إليها بـ <strong>الطرف الأول</strong>). وبين العميل الموضحة بياناته أدناه، (ويشار إليه بـ <strong>الطرف الثاني</strong>). وذلك لتقديم خدمات منصة مفوتر السحابية وفقاً للبيانات أدناه والشروط بالصفحة الثانية.</div>
    <h3 class="contract-heading"><span class="contract-index">1</span> البيانات التعاقدية (الطرف الثاني)</h3><table><tr><td class="label-cell">اسم المتعاقد</td><td>${fill(details.customerName)}</td><td class="label-cell">رقم البطاقة الضريبية</td><td>${fill(details.taxCard)}</td></tr><tr><td class="label-cell">الرقم القومي</td><td>${fill(details.nationalId)}</td><td class="label-cell">الاسم على البطاقة</td><td>${fill(details.customerName)}</td></tr><tr><td class="label-cell">رقم السجل التجاري</td><td>${fill(details.commercialRegister)}</td><td class="label-cell">جهة إصدار البطاقة</td><td>${fill(undefined)}</td></tr><tr><td class="label-cell">العنوان التفصيلي</td><td colspan="3">${fill(details.address, "................................................................................................")}</td></tr></table>
    <h3 class="contract-heading"><span class="contract-index">2</span> بيانات التواصل وتفعيل المنصة</h3><table><tr><td class="label-cell">البريد الإلكتروني</td><td colspan="3" dir="ltr">${fill(details.email)}</td></tr><tr><td class="label-cell">كلمة السر</td><td colspan="3" class="small">سيتم إنشاؤها تلقائيًا عند التفعيل وإرسالها للبريد المسجل، ويمكن تغييرها لاحقًا.</td></tr><tr><td class="label-cell">هاتف رئيسي</td><td dir="ltr">${fill(details.phone)}<br><span class="small" dir="rtl">☐ مفعل عليه واتساب</span></td><td class="label-cell">هاتف بديل</td><td>..................<br><span class="small">☐ مفعل عليه واتساب</span></td></tr></table>
    <div class="contract-split"><div><h3 class="contract-heading"><span class="contract-index">3</span> تفاصيل الباقة (سنوي)</h3><table><tr><th class="center">اختيار</th><th>اسم الباقة</th><th>السعر</th><th>الملفات</th><th>النقاط</th></tr>${planRows}</table></div><div><h3 class="contract-heading"><span class="contract-index">+</span> الإضافات</h3><table><tr><th class="center">اختيار</th><th>الإضافة</th><th>السعر</th><th>العدد</th></tr>${addonRows}</table><h3 class="contract-heading"><span class="contract-index">4</span> قيمة التعاقد</h3><table><tr><td class="label-cell small">المجموع الفرعي</td><td>${escapeHtml(details.packagePrice)}</td></tr><tr><td class="label-cell small">ضريبة القيمة المضافة 14%</td><td>${escapeHtml(details.vat)}</td></tr><tr><td class="label-cell small">الخصم</td><td>${escapeHtml(details.discount)}</td></tr><tr class="contract-total"><td class="small">الإجمالي المستحق</td><td>${escapeHtml(details.total)}</td></tr></table><p class="contract-note">* الأسعار سنوية. يصبح الاشتراك نافذاً بعد التوقيع وسداد المبلغ.</p></div></div>
    <footer class="contract-footer"><span dir="ltr">www.mofawtar.com</span><span>الصفحة 1 من 2</span><img class="footer-logo" src="${CONTRACT_ASSETS.wordmark}" alt="مفوتر"/></footer>
  </section>
  <section class="pdf-page contract-page">
    <header class="contract-header"><h1 class="contract-title" style="font-size:18px">الشروط والأحكام الخاصة بالخدمة</h1><img class="contract-logo" style="height:17mm" src="${CONTRACT_ASSETS.wordmark}" alt="مفوتر"/></header>
    <div class="contract-declaration"><strong>إقرار:</strong> يقر الطرف الثاني بصحة البيانات المدونة أعلاه، وبأن البريد الإلكتروني المسجل هو الوسيلة الرسمية المعتمدة لإنشاء الحساب وتلقي الإشعارات الفنية والمالية والقانونية. وأن كافة الخدمات تخضع للشروط والأحكام وسياسة الاستخدام المحدثة على موقع المنصة الرسمي والتي تعد جزءاً مكملاً للنموذج التجريبي.</div>
    <div class="terms"><div dir="rtl"><div class="term"><strong>توفير البيانات:</strong> يتم توفير البيانات المطلوبة لإعداد وتهيئة الحساب حسب الخدمة (التسجيل في البورتال، تفعيل الإيصال، ختم إلكتروني ساري).</div><div class="term"><strong>أمن الحساب:</strong> حماية بيانات الدخول والختم الإلكتروني، وإبلاغ الدعم فور الاشتباه في استخدام غير مصرح به.</div><div class="term"><strong>الاستخدام والسداد:</strong> استخدام المنصة بصورة مشروعة للخدمة المختارة، ويُحظر النسخ، إعادة البيع، أو الهندسة العكسية.</div><div class="term"><strong>حفظ البيانات:</strong> تنزيل التقارير والملفات قبل انتهاء الاشتراك أو طلب حذف الحساب، ويتحمل الطرف الثاني نتيجة الحذف النهائي.</div><div class="term"><strong>التفعيل:</strong> يتم التفعيل بحد أقصى يومي عمل بعد اكتمال البيانات والسداد، ما لم يوجد مانع خارجي.</div><div class="term"><strong>الدعم والتدريب:</strong> تقديم دعم فني عن بُعد خلال مواعيد العمل، وإتاحة مواد تعليمية للتشغيل الصحيح.</div><div class="term"><strong>الصيانة والدعم الفني:</strong> صيانة وتحديث المنصة دورياً. يشمل الدعم المجاني تهيئة الحساب ومعالجة الأعطال البرمجية للنظام الأصلي. عبر الإيميل: support@mofawter.com.</div><div class="term"><strong>الاسترداد والترقية:</strong> يحق طلب الاسترداد خلال 14 يوماً وفق الشروط. الباقات والأسعار يتم ترقيتها بدفع الفرق، وأي تغيير سعري يطبق عند التجديد.</div><div class="term"><strong>المسؤولية:</strong> المنصة أداة مساعدة لا تغني عن المحاسب، والطرف الثاني هو المسؤول الأول عن صحة قراراته وبياناته.</div><div class="term"><strong>القانون والاختصاص:</strong> يخضع العقد للقانون المصري، وتختص محاكم القاهرة بنظر المنازعات التي لم تُحل ودياً.</div></div><div dir="ltr"><div class="term"><strong>Data Provision:</strong> Clients must provide setup data (Portal registration, e-seal) based on the requested service.</div><div class="term"><strong>Security:</strong> Strictly secure login credentials & e-seals, and report unauthorized access immediately.</div><div class="term"><strong>Usage Constraints:</strong> Lawful use only. Copying, reselling, or reverse-engineering is strictly prohibited.</div><div class="term"><strong>Data Retention:</strong> Clients must download reports before expiry or deletion. The client bears full responsibility for requested deletions.</div><div class="term"><strong>Activation:</strong> Accounts are activated within 2 working days post-payment and data submission.</div><div class="term"><strong>Support & Training:</strong> Remote support is provided during business hours alongside operational materials.</div><div class="term"><strong>Maintenance & Support:</strong> Periodic updates and free remote technical bug resolution are provided via support@mofawter.com.</div><div class="term"><strong>Refunds & Upgrades:</strong> Refunds eligible within 14 days. Upgrades require paying the prorated difference. Price changes apply upon renewal.</div><div class="term"><strong>Liability:</strong> The platform is an assistive tool. Clients remain entirely responsible for their data accuracy and approved tax decisions.</div><div class="term"><strong>Governing Law:</strong> Governed by Egyptian Law. Unresolved disputes fall under the exclusive jurisdiction of Cairo courts.</div></div></div>
    <div class="approval"><h4>تم عرض هذا النموذج للمراجعة داخل بيئة إثبات المفهوم؛ ولا يبدأ نفاذ أي التزام قانوني من هذه الشاشة.</h4><p>This agreement has been read and approved by the legal representatives of both parties.</p><div class="signature-row"><div class="signature-box"><h5>الطرف الثاني (Second Party)</h5><p>العميل المشترك</p><div class="signature-line">التوقيع والختم (Signature & Stamp)</div></div><div class="signature-box"><h5>الطرف الأول (First Party)</h5><p>منصة مفوتر للحلول الرقمية</p><img class="party-mark" src="${CONTRACT_ASSETS.signature}" alt="توقيع مفوتر"/><div class="signature-line">التوقيع والختم (Signature & Stamp)</div></div></div></div><img class="contract-stamp" src="${CONTRACT_ASSETS.stamp}" alt="ختم مفوتر"/>
    <footer class="contract-footer"><span dir="ltr">www.mofawtar.com</span><span>الصفحة 2 من 2</span><img class="footer-logo" src="${CONTRACT_ASSETS.wordmark}" alt="مفوتر"/></footer>
  </section>`;
}

export function checksumHtml(html: string) {
  return createHash("sha256").update(html).digest("hex");
}
