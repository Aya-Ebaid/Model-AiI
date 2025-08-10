// عناصر DOM
const xray = document.getElementById('xray');
const preview = document.getElementById('preview');
const previewWrap = document.getElementById('previewWrap');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const status = document.getElementById('status');
const aiResult = document.getElementById('aiResult');
const diagText = document.getElementById('diagText');
const treatmentText = document.getElementById('treatmentText');
const patientName = document.getElementById('patientName');
const symptoms = document.getElementById('symptoms');

const caseList = document.getElementById('caseList');
const modal = document.getElementById('modal');
const mName = document.getElementById('mName');
const mSymptoms = document.getElementById('mSymptoms');
const doctorDiag = document.getElementById('doctorDiag');
const doctorTreat = document.getElementById('doctorTreat');
const approveBtn = document.getElementById('approveBtn');
const rejectBtn = document.getElementById('rejectBtn');
const closeBtn = document.getElementById('closeBtn');

let pendingCases = []; // قائمة الحالات الوهمية
let currentCaseId = null;

// معاينة صورة
xray.addEventListener('change', e=>{
  const f = e.target.files[0];
  if(!f){ previewWrap.classList.add('hidden'); return; }
  const reader = new FileReader();
  reader.onload = ev=>{
    preview.src = ev.target.result;
    previewWrap.classList.remove('hidden');
  }
  reader.readAsDataURL(f);
});

// مسح الحقول
clearBtn.addEventListener('click', ()=>{
  patientName.value=''; symptoms.value=''; xray.value=''; preview.src=''; previewWrap.classList.add('hidden');
  status.textContent = 'تم مسح الحقول';
  aiResult.classList.add('hidden');
});

// محاكاة تحليل AI
analyzeBtn.addEventListener('click', async ()=>{
  const name = patientName.value.trim() || 'مجهول';
  const sym = symptoms.value.trim();
  if(!sym){
    alert('من فضلك اكتب الأعراض أولاً');
    return;
  }

  status.textContent = 'جاري تحليل الأعراض...';
  aiResult.classList.add('hidden');

  // محاكاة زمن المعالجة
  await delay(1300 + Math.random()*1400);

  // توليد نتيجة وهمية مبنية على كلمات مفتاحية بسيطة
  const lower = sym.toLowerCase();
  let diag = 'حالة عامة غير محددة — مطلوب مزيد من الفحص';
  let treat = 'نصائح عامة: راحة، ترطيب، مراجعة طبية إذا استمرت الأعراض.';

  if(lower.includes('سعال') || lower.includes('ضيق')){
    diag = 'احتمال التهاب رئوي أو تهيج / COVID-like';
    treat = '- راجع فحص بالأشعة\n- تناول مضاد حيوي حسب فحص الطبيب (إن لزم)\n- متابعة الأكسجين والحمى';
  } else if(lower.includes('صداع') && lower.includes('دوخة')){
    diag = 'أعراض عصبية محتملة أو صداع توتري';
    treat = '- راحة\n- مسكنات خفيفة\n- تقييم سريري لوضع الأعراض';
  } else if(lower.includes('الم') || lower.includes('المفاصل')){
    diag = 'عرض التهابي أو ميكانيكي للعضلات/المفاصل';
    treat = '- مضادات التهابات غير ستيرويدية\n- تمارين وتقوية حسب التوجيه الطبي';
  }

  // عرض النتيجة
  diagText.textContent = diag;
  treatmentText.textContent = treat;
  aiResult.classList.remove('hidden');
  status.textContent = 'انتهى التحليل — تم ارسال الحالة لمراجعة الطبيب.';

  // إضافة حالة إلى قائمة المراجعة (محاكاة)
  const caseObj = {
    id: Date.now().toString(),
    name, sym, diag, treat,
    status: 'pending'
  };
  pendingCases.unshift(caseObj);
  renderCaseList();
});

// دوال مساعدة
function delay(ms){ return new Promise(r=>setTimeout(r, ms)); }

function renderCaseList(){
  caseList.innerHTML = '';
  if(pendingCases.length === 0){
    caseList.innerHTML = '<div class="muted">لا توجد حالات قيد المراجعة.</div>';
    return;
  }

  pendingCases.forEach(c=>{
    const card = document.createElement('div');
    card.className = 'case-card';
    card.innerHTML = `
      <div>
        <div><strong>${escapeHtml(c.name)}</strong></div>
        <div class="case-meta">${escapeHtml(c.sym.slice(0,60))}${c.sym.length>60?'...':''}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn" data-id="${c.id}" onclick="openReview('${c.id}')">مراجعة</button>
        <span class="muted">${c.status}</span>
      </div>
    `;
    caseList.appendChild(card);
  });
}

// فتح نافذة المراجعة وملئها
window.openReview = function(id){
  const c = pendingCases.find(x=>x.id===id);
  if(!c) return;
  currentCaseId = id;
  mName.textContent = c.name;
  mSymptoms.textContent = c.sym;
  doctorDiag.value = c.diag;
  doctorTreat.value = c.treat;
  modal.classList.remove('hidden');
}

// أغلاق المودال
closeBtn.addEventListener('click', ()=>{ modal.classList.add('hidden'); currentCaseId=null; });

// موافقة الطبيب (اعتماد) — يحدث تحديث الحالة
approveBtn.addEventListener('click', ()=>{
  if(!currentCaseId) return;
  const c = pendingCases.find(x=>x.id===currentCaseId);
  c.diag = doctorDiag.value.trim();
  c.treat = doctorTreat.value.trim();
  c.status = 'approved';
  modal.classList.add('hidden');
  currentCaseId = null;
  renderCaseList();
  status.textContent = 'الطبيب وافق على الخطة العلاجية';
});

// رفض الطبيب
rejectBtn.addEventListener('click', ()=>{
  if(!currentCaseId) return;
  const c = pendingCases.find(x=>x.id===currentCaseId);
  c.status = 'rejected';
  modal.classList.add('hidden');
  currentCaseId = null;
  renderCaseList();
  status.textContent = 'الطبيب رفض الخطة العلاجية';
});

// أمان: تجنّب XSS في العرض
function escapeHtml(str){
  if(!str) return '';
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

// رندر أولي
renderCaseList();