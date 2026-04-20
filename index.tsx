import { useState, useEffect, useRef } from "react";

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const CURRENCIES = ["USD", "GBP", "EUR", "HKD", "SGD", "MYR"];
const CURRENCY_SYMBOLS = { USD: "$", GBP: "£", EUR: "€", HKD: "HK$", SGD: "S$", MYR: "RM" };

const INITIAL_ACCOUNTS = [
  { id: "SLP-10023", handle: "acmeshop", name: "Acme Global Ltd", nickname: "", country: "US", currency: "USD", subId: "SUB-001", available: 84320.5, pending: 3200.0, pendingPayout: 1800.0, inTransit: 1200.0, reserve: 5000.0, status: "active" },
  { id: "SLP-10024", handle: "acmeshop", name: "Acme Global Ltd", nickname: "Acme – US Sub", country: "US", currency: "USD", subId: "SUB-002", available: 12000.0, pending: 500.0, pendingPayout: 300.0, inTransit: 0, reserve: 1000.0, status: "active" },
  { id: "SLP-20011", handle: "novatech", name: "NovaTech Ltd", nickname: "Nova UK", country: "GB", currency: "GBP", subId: "SUB-001", available: 22100.0, pending: 800.0, pendingPayout: 600.0, inTransit: 400.0, reserve: 2000.0, status: "active" },
  { id: "SLP-30045", handle: "sunsetgoods", name: "Sunset Goods Inc", nickname: "", country: "CA", currency: "CAD", subId: "SUB-001", available: 5400.75, pending: 0, pendingPayout: 0, inTransit: 0, reserve: 600.0, status: "restricted" },
  { id: "SLP-40099", handle: "orionpay", name: "Orion Payments GmbH", nickname: "Orion DE", country: "DE", currency: "EUR", subId: "SUB-001", available: 130900.2, pending: 12400.0, pendingPayout: 8200.0, inTransit: 3000.0, reserve: 15000.0, status: "active" },
  { id: "SLP-50012", handle: "blazeretail", name: "Blaze Retail Pty", nickname: "", country: "AU", currency: "AUD", subId: "SUB-001", available: 9870.0, pending: 450.0, pendingPayout: 220.0, inTransit: 0, reserve: 1000.0, status: "pending" },
];

const MOCK_DISPUTES = [
  { id: "CB-2024-001", handle: "acmeshop", accountId: "SLP-10023", txId: "TXN-88821", orderNo: "1001", amount: 320.0, currency: "USD", type: "Chargeback", status: "Pending Response", created: "2024-04-10", dueDate: "2024-04-17", reason: "Item not received" },
  { id: "CB-2024-002", handle: "novatech", accountId: "SLP-20011", txId: "TXN-77712", orderNo: "2043", amount: 850.0, currency: "GBP", type: "Pre-chargeback", status: "Under Review", created: "2024-04-09", dueDate: "2024-04-16", reason: "Unauthorized transaction" },
  { id: "CB-2024-003", handle: "orionpay", accountId: "SLP-40099", txId: "TXN-66234", orderNo: "3187", amount: 1200.0, currency: "EUR", type: "Chargeback", status: "Won", created: "2024-04-01", dueDate: "2024-04-08", reason: "Product not as described" },
  { id: "CB-2024-004", handle: "blazeretail", accountId: "SLP-50012", txId: "TXN-55093", orderNo: "4011", amount: 95.0, currency: "AUD", type: "Retrieval", status: "Pending Response", created: "2024-04-11", dueDate: "2024-04-18", reason: "Retrieval request" },
  { id: "CB-2024-005", handle: "acmeshop", accountId: "SLP-10024", txId: "TXN-44187", orderNo: "1087", amount: 540.0, currency: "USD", type: "Chargeback", status: "Lost", created: "2024-03-28", dueDate: "2024-04-04", reason: "Credit not processed" },
];

const INITIAL_EMPLOYEES = [
  { id: 1, name: "Sarah Chen", email: "sarah@company.com", status: "active", permissions: ["view-account-list","view-balances","view-dispute-list","manage-reports"], accounts: "all" },
  { id: 2, name: "Marcus Lee", email: "marcus@company.com", status: "active", permissions: ["view-account-list","view-dispute-list","process-disputes"], accounts: ["SLP-10023","SLP-20011"] },
  { id: 3, name: "Priya Singh", email: "priya@company.com", status: "inactive", permissions: ["view-account-list","manage-reports"], accounts: "all" },
];

const PERMISSION_POINTS = [
  { key: "view-account-list",   label: "View Account List",              desc: "View the list of connected accounts" },
  { key: "view-balances",       label: "View Account Balances",          desc: "View balance data for connected accounts" },
  { key: "set-nickname",        label: "Set Account Nickname",           desc: "Set or edit custom nicknames for accounts" },
  { key: "link-accounts",       label: "Link Accounts",                  desc: "Connect new HonchoPay store accounts" },
  { key: "unlink-accounts",     label: "Unlink Accounts",                desc: "Remove connected store accounts" },
  { key: "view-staff-list",     label: "View Staff List",                desc: "View the employee list" },
  { key: "edit-staff",          label: "Edit Staff",                     desc: "Add, edit, or remove employees and permissions" },
  { key: "view-dispute-list",   label: "View Dispute List",              desc: "View disputes across accounts" },
  { key: "process-disputes",    label: "Process / Manage Disputes",      desc: "Accept or challenge disputes on behalf of stores" },
  { key: "manage-settings",     label: "Manage Multi-Account Settings",  desc: "Configure payout and bank account settings" },
  { key: "manage-reports",      label: "Manage Reports",                 desc: "Generate and download reports" },
];

const REPORTS = [
  { id: 1, name: "Settlement Batch Report", desc: "View batch settlement records across accounts", icon: "📊" },
  { id: 2, name: "Transaction Record Report", desc: "Filter by date range, order date, or settlement batch", icon: "📋" },
  { id: 3, name: "Payout Balance Report", desc: "Payout records with account type selection", icon: "💳" },
  { id: 4, name: "1099K Form", desc: "US tax form (requires US entity)", icon: "📄" },
];

// ─── I18N ──────────────────────────────────────────────────────────────────────
const LANGS = [{ code:"en",label:"English",flag:"🇺🇸" },{ code:"zh",label:"中文",flag:"🇨🇳" },{ code:"es",label:"Español",flag:"🇪🇸" },{ code:"ja",label:"日本語",flag:"🇯🇵" }];
const T = {
  en: {
    accountList:"Account List",disputes:"Dispute Processing",reports:"Report Management",settings:"Multi-Account Settings",employees:"Employee Management",security:"Security Center",signOut:"Sign Out",
    limitedFree:"⭐ Limited-Time Free",downloadCenter:"⬇ Download Center",live:"Live",
    balanceOverview:"Balance Overview",accountCount:"Accounts",subAccounts:"sub-accounts",availablePayout:"Available to Payout",withdrawable:"Withdrawable balance",pendingSettlement:"Pending Settlement",pendingProcessing:"Pending Processing",reserveBalance:"Reserve Balance",
    searchAccounts:"Search by Handle, Account ID, Account Name, or Nickname",exportBalance:"⬇ Export Balance Data",connectAccount:"+ Connect Account",
    handle:"Handle",accountId:"Account ID",accountName:"Account Name",nickname:"Nickname",country:"Country",currency:"Currency",subAccountId:"Sub-Account ID",pendingPayout:"Pending Payout",status:"Status",disconnect:"Disconnect",rowsPerPage:"Rows per page",showing:"Showing",of:"of",
    all:"All",chargeback:"Chargeback",preChargeback:"Pre-chargeback",retrieval:"Retrieval",searchDisputes:"Search by Handle or Account ID",
    disputeId:"Dispute ID",txId:"Transaction ID",orderNo:"Order No.",amount:"Amount",type:"Type",reason:"Reason",created:"Created",dueDate:"Due Date",
    backToDisputes:"← Back to Disputes",acceptDispute:"Accept Dispute",challengeDispute:"Challenge Dispute",submitChallenge:"Submit Challenge",confirmAccept:"Confirm — Accept Dispute",
    connectTitle:"Connect HonchoPay Account",enterHandle:"Enter Handle",selectMyStores:"Select from My Stores",storeHandle:"Store Handle",cancel:"Cancel",connect:"Connect → (opens store site)",
    operationGuide:"Operation Guide",getStarted:"Get started in 2 steps",
    noAccounts:"No HonchoPay accounts are connected yet. Follow the steps below to set up your dashboard.",
    noAccountsEmpty:"No accounts connected yet",noAccountsDesc:"Balance data and account details will appear here once you connect a HonchoPay store.",
    step1Title:"Connect Account",step1Desc:"Link your HonchoPay store to manage balances, disputes, and payouts from one place.",
    step2Title:"Add Employee",step2Desc:"Invite team members and assign granular permissions.",
  },
  zh: {
    accountList:"账户列表",disputes:"争议处理",reports:"报告管理",settings:"多账户设置",employees:"员工管理",security:"安全中心",signOut:"退出登录",
    limitedFree:"⭐ 限时免费",downloadCenter:"⬇ 下载中心",live:"实时",
    balanceOverview:"余额概览",accountCount:"账户数量",subAccounts:"子账户",availablePayout:"可提现余额",withdrawable:"可提现",pendingSettlement:"待结算",pendingProcessing:"处理中",reserveBalance:"备用金余额",
    searchAccounts:"按 Handle、账户ID、账户名称或昵称搜索",exportBalance:"⬇ 导出余额数据",connectAccount:"+ 关联账户",
    handle:"Handle",accountId:"账户ID",accountName:"账户名称",nickname:"昵称",country:"国家",currency:"币种",subAccountId:"子账户ID",pendingPayout:"待付款",status:"状态",disconnect:"断开连接",rowsPerPage:"每页行数",showing:"显示",of:"/",
    all:"全部",chargeback:"拒付",preChargeback:"预拒付",retrieval:"调单",searchDisputes:"按 Handle 或账户ID 搜索",
    disputeId:"争议ID",txId:"交易ID",orderNo:"订单号",amount:"金额",type:"类型",reason:"原因",created:"创建时间",dueDate:"截止日期",
    backToDisputes:"← 返回争议列表",acceptDispute:"接受争议",challengeDispute:"提出异议",submitChallenge:"提交异议",confirmAccept:"确认 — 接受争议",
    connectTitle:"关联 HonchoPay 账户",enterHandle:"输入 Handle",selectMyStores:"从我的店铺中选择",storeHandle:"店铺 Handle",cancel:"取消",connect:"连接 → （跳转至店铺）",
    operationGuide:"操作指引",getStarted:"两步完成设置",noAccounts:"尚未关联任何 HonchoPay 账户。",noAccountsEmpty:"暂无账户",noAccountsDesc:"关联店铺后余额数据将显示在此处。",
    step1Title:"关联账户",step1Desc:"关联您的 HonchoPay 店铺，统一管理余额、争议和提现。",step2Title:"添加员工",step2Desc:"邀请团队成员并分配权限。",
  },
  es: {
    accountList:"Lista de Cuentas",disputes:"Gestión de Disputas",reports:"Gestión de Reportes",settings:"Configuración Multi-cuenta",employees:"Gestión de Empleados",security:"Centro de Seguridad",signOut:"Cerrar sesión",
    limitedFree:"⭐ Gratis por tiempo limitado",downloadCenter:"⬇ Centro de descargas",live:"En vivo",
    balanceOverview:"Resumen de saldo",accountCount:"Cuentas",subAccounts:"subcuentas",availablePayout:"Disponible para pago",withdrawable:"Saldo retirable",pendingSettlement:"Liquidación pendiente",pendingProcessing:"En procesamiento",reserveBalance:"Saldo de reserva",
    searchAccounts:"Buscar por Handle, ID, nombre de cuenta o apodo",exportBalance:"⬇ Exportar datos",connectAccount:"+ Conectar cuenta",
    handle:"Handle",accountId:"ID de cuenta",accountName:"Nombre de cuenta",nickname:"Apodo",country:"País",currency:"Moneda",subAccountId:"ID subcuenta",pendingPayout:"Pago pendiente",status:"Estado",disconnect:"Desconectar",rowsPerPage:"Filas por página",showing:"Mostrando",of:"de",
    all:"Todos",chargeback:"Contracargo",preChargeback:"Pre-contracargo",retrieval:"Recuperación",searchDisputes:"Buscar por Handle o ID de cuenta",
    disputeId:"ID de disputa",txId:"ID de transacción",orderNo:"N.° de pedido",amount:"Importe",type:"Tipo",reason:"Motivo",created:"Creado",dueDate:"Fecha límite",
    backToDisputes:"← Volver a disputas",acceptDispute:"Aceptar disputa",challengeDispute:"Disputar cargo",submitChallenge:"Enviar impugnación",confirmAccept:"Confirmar — Aceptar disputa",
    connectTitle:"Conectar cuenta HonchoPay",enterHandle:"Ingresar Handle",selectMyStores:"Seleccionar de mis tiendas",storeHandle:"Handle de tienda",cancel:"Cancelar",connect:"Conectar → (abre sitio de tienda)",
    operationGuide:"Guía de operación",getStarted:"Comienza en 2 pasos",noAccounts:"Aún no hay cuentas HonchoPay conectadas.",noAccountsEmpty:"Sin cuentas conectadas",noAccountsDesc:"Los datos de saldo aparecerán aquí una vez que conectes una tienda.",
    step1Title:"Conectar cuenta",step1Desc:"Vincula tu tienda HonchoPay.",step2Title:"Añadir empleado",step2Desc:"Invita a miembros del equipo.",
  },
  ja: {
    accountList:"アカウント一覧",disputes:"紛争処理",reports:"レポート管理",settings:"マルチアカウント設定",employees:"従業員管理",security:"セキュリティセンター",signOut:"ログアウト",
    limitedFree:"⭐ 期間限定無料",downloadCenter:"⬇ ダウンロードセンター",live:"ライブ",
    balanceOverview:"残高概要",accountCount:"アカウント数",subAccounts:"サブアカウント",availablePayout:"出金可能残高",withdrawable:"引き出し可能",pendingSettlement:"決済待ち",pendingProcessing:"処理中",reserveBalance:"準備金残高",
    searchAccounts:"Handle・ID・アカウント名・ニックネームで検索",exportBalance:"⬇ 残高データをエクスポート",connectAccount:"+ アカウント連携",
    handle:"Handle",accountId:"アカウントID",accountName:"アカウント名",nickname:"ニックネーム",country:"国",currency:"通貨",subAccountId:"サブアカウントID",pendingPayout:"支払い待ち",status:"ステータス",disconnect:"接続解除",rowsPerPage:"行/ページ",showing:"表示中",of:"/",
    all:"すべて",chargeback:"チャージバック",preChargeback:"プレチャージバック",retrieval:"照会",searchDisputes:"HandleまたはアカウントIDで検索",
    disputeId:"紛争ID",txId:"取引ID",orderNo:"注文番号",amount:"金額",type:"種類",reason:"理由",created:"作成日",dueDate:"期限",
    backToDisputes:"← 紛争一覧へ戻る",acceptDispute:"紛争を受け入れる",challengeDispute:"異議を申し立てる",submitChallenge:"異議を提出",confirmAccept:"確認 — 紛争を受け入れる",
    connectTitle:"HonchoPayアカウントを連携",enterHandle:"Handleを入力",selectMyStores:"ストアから選択",storeHandle:"ストアHandle",cancel:"キャンセル",connect:"連携 →（ストアサイトを開く）",
    operationGuide:"操作ガイド",getStarted:"2ステップで始める",noAccounts:"HonchoPayアカウントがまだ連携されていません。",noAccountsEmpty:"アカウント未連携",noAccountsDesc:"ストアを連携すると残高データが表示されます。",
    step1Title:"アカウントを連携",step1Desc:"HonchoPayストアを連携。",step2Title:"従業員を追加",step2Desc:"チームメンバーを招待し権限を設定。",
  },
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const fmt = (n, cur = "USD") => `${CURRENCY_SYMBOLS[cur] || "$"}${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const FX_TO_USD = { USD:1, GBP:1.27, EUR:1.08, HKD:0.128, SGD:0.74, MYR:0.21, CAD:0.73, AUD:0.65 };
const convertAmt = (amount, from, to) => from === to ? amount : (amount * (FX_TO_USD[from]||1)) / (FX_TO_USD[to]||1);

const Badge = ({ status }) => {
  const map = { active:["#d1fae5","#065f46"], restricted:["#fef3c7","#92400e"], pending:["#dbeafe","#1e40af"], won:["#d1fae5","#065f46"], lost:["#fee2e2","#991b1b"], "under review":["#fef3c7","#92400e"], "pending response":["#fce7f3","#9d174d"], inactive:["#f3f4f6","#6b7280"] };
  const [bg,color] = map[status.toLowerCase()]||["#f3f4f6","#6b7280"];
  return <span style={{ background:bg, color, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{status}</span>;
};

const Tooltip = ({ text, children }) => {
  const [show,setShow] = useState(false);
  return (
    <span style={{ position:"relative", display:"inline-flex", alignItems:"center" }} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      {children}
      {show && <div style={{ position:"absolute", bottom:"calc(100% + 6px)", left:"50%", transform:"translateX(-50%)", background:"#1e293b", color:"#e2e8f0", fontSize:11, padding:"6px 10px", borderRadius:6, whiteSpace:"nowrap", zIndex:99, maxWidth:260, lineHeight:1.5, textAlign:"center" }}>{text}</div>}
    </span>
  );
};

const Modal = ({ title, onClose, children, width=480 }) => (
  <div style={{ position:"fixed", inset:0, background:"#00000066", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:width, maxHeight:"90vh", overflow:"auto", boxShadow:"0 20px 60px #0003" }}>
      <div style={{ padding:"20px 24px", borderBottom:"1px solid #e5e7eb", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:15, fontWeight:700, color:"#111827" }}>{title}</span>
        <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#9ca3af", lineHeight:1 }}>×</button>
      </div>
      <div style={{ padding:24 }}>{children}</div>
    </div>
  </div>
);

const Input = ({ label, value, onChange, placeholder, type="text", hint, error }) => (
  <div style={{ marginBottom:14 }}>
    {label && <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#374151", marginBottom:5 }}>{label}</label>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${error?"#f87171":"#d1d5db"}`, borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit", color:"#111827" }} />
    {hint && <div style={{ fontSize:11, color:"#9ca3af", marginTop:3 }}>{hint}</div>}
    {error && <div style={{ fontSize:11, color:"#dc2626", marginTop:3 }}>{error}</div>}
  </div>
);

const SortIcon = ({ col, sortCol, sortDir }) => (
  <span style={{ display:"inline-flex", flexDirection:"column", marginLeft:4, gap:1, verticalAlign:"middle" }}>
    <svg width="7" height="5" viewBox="0 0 7 5"><path d="M3.5 0L7 5H0z" fill={sortCol===col&&sortDir==="asc"?"#3b82f6":"#d1d5db"} /></svg>
    <svg width="7" height="5" viewBox="0 0 7 5"><path d="M3.5 5L0 0h7z" fill={sortCol===col&&sortDir==="desc"?"#3b82f6":"#d1d5db"} /></svg>
  </span>
);

// ─── AUTH LAYOUT ───────────────────────────────────────────────────────────────
const AuthLayout = ({ children, title, subtitle, step, totalSteps }) => (
  <div style={{ minHeight:"100vh", display:"flex", fontFamily:"'DM Sans',system-ui,sans-serif", background:"#f8fafc" }}>
    <div style={{ width:"42%", background:"linear-gradient(160deg,#020617 0%,#0c1445 60%,#0f1f6e 100%)", display:"flex", flexDirection:"column", justifyContent:"center", padding:"60px 52px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 20% 20%,#3b82f622 0%,transparent 50%),radial-gradient(circle at 80% 80%,#06b6d422 0%,transparent 50%)" }} />
      <div style={{ position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:52 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#3b82f6,#06b6d4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⚡</div>
          <div><div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>HonchoPay</div><div style={{ fontSize:10, color:"#64748b", letterSpacing:1.5, textTransform:"uppercase" }}>Multi-Account Ops</div></div>
        </div>
        <div style={{ fontSize:30, fontWeight:800, color:"#fff", lineHeight:1.25, letterSpacing:-0.8, marginBottom:16 }}>
          Manage all your<br /><span style={{ background:"linear-gradient(90deg,#60a5fa,#22d3ee)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>payment accounts</span><br />in one place
        </div>
        <div style={{ fontSize:14, color:"#94a3b8", lineHeight:1.7, marginBottom:44 }}>Connect multiple HonchoPay stores, manage balances, disputes, and payouts — all from a single unified dashboard.</div>
        {["Multi-store OAuth connection","Batch balance & payout settings","Dispute management across accounts","Employee roles & permissions"].map((f,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <div style={{ width:18, height:18, borderRadius:5, background:"#3b82f622", border:"1px solid #3b82f644", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="9" height="9" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#60a5fa" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ fontSize:13, color:"#94a3b8" }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:48 }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        {step && <div style={{ display:"flex", gap:5, marginBottom:28 }}>{Array.from({length:totalSteps}).map((_,i)=><div key={i} style={{ flex:1, height:3, borderRadius:3, background:i<step?"#3b82f6":"#e5e7eb", transition:"background 0.3s" }}/>)}</div>}
        <div style={{ marginBottom:28 }}>
          <h2 style={{ fontSize:24, fontWeight:800, color:"#111827", margin:"0 0 6px", letterSpacing:-0.4 }}>{title}</h2>
          <p style={{ fontSize:14, color:"#6b7280", margin:0 }}>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  </div>
);

// ─── SIGN UP ───────────────────────────────────────────────────────────────────
const SignUp = ({ onGoSignIn, onSuccess }) => {
  const [step,setStep] = useState(1);
  const [form,setForm] = useState({ name:"", email:"", password:"", confirm:"", code:"", storeHandle:"", storeRole:"" });
  const [errs,setErrs] = useState({});
  const [loading,setLoading] = useState(false);
  const [codeSent,setCodeSent] = useState(false);
  const [countdown,setCountdown] = useState(0);
  const set = k => e => setForm(f=>({...f,[k]:typeof e==="string"?e:e.target.value}));
  useEffect(()=>{ if(countdown>0){const t=setTimeout(()=>setCountdown(c=>c-1),1000);return()=>clearTimeout(t);} },[countdown]);
  const pwValid = p=>/[A-Z]/.test(p)&&/[a-z]/.test(p)&&/[^A-Za-z0-9]/.test(p)&&p.length>=8&&p.length<=20;
  const validate1 = ()=>{const e={};if(!form.name.trim())e.name="Full name is required";if(!form.email.includes("@"))e.email="Valid email required";if(!codeSent)e.code="Please send the verification code first";else if(form.code!=="123456")e.code="Invalid code. Use 123456 for demo";if(!pwValid(form.password))e.password="8–20 chars, uppercase, lowercase & special symbol";if(form.password!==form.confirm)e.confirm="Passwords don't match";setErrs(e);return Object.keys(e).length===0;};
  const validate2 = ()=>{const e={};if(!form.storeHandle.trim())e.storeHandle="Store handle is required";if(!form.storeRole)e.storeRole="Please confirm your role";if(form.storeRole&&form.storeRole!=="owner")e.storeRole="Only store owners can register for this platform";setErrs(e);return Object.keys(e).length===0;};
  const sendCode = ()=>{ if(!form.email.includes("@")){setErrs({email:"Enter a valid email first"});return;} setCodeSent(true);setCountdown(60); };
  const handleStep1 = async()=>{ if(!validate1())return;setLoading(true);await new Promise(r=>setTimeout(r,700));setLoading(false);setStep(2); };
  const handleStep2 = async()=>{ if(!validate2())return;setLoading(true);await new Promise(r=>setTimeout(r,800));setLoading(false);setStep(3); };
  return (
    <AuthLayout title={["Create your account","Owner Verification","You're all set!"][step-1]} subtitle={["Register with your email to get started","This platform is for store owners only",""][step-1]} step={step} totalSteps={3}>
      {step===1&&(
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:28 }}>
          <Input label="Full Name" value={form.name} onChange={set("name")} placeholder="Your full name" error={errs.name}/>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>Email Address</label>
            <div style={{ display:"flex", gap:8 }}>
              <input type="email" value={form.email} onChange={set("email")} placeholder="you@company.com" style={{ flex:1, padding:"9px 12px", border:`1.5px solid ${errs.email?"#f87171":"#d1d5db"}`, borderRadius:8, fontSize:13, outline:"none", fontFamily:"inherit" }}/>
              <button onClick={sendCode} disabled={countdown>0} style={{ padding:"9px 14px", background:countdown>0?"#e5e7eb":"#3b82f6", color:countdown>0?"#9ca3af":"#fff", border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:countdown>0?"not-allowed":"pointer", whiteSpace:"nowrap" }}>{countdown>0?`${countdown}s`:"Send Code"}</button>
            </div>
            {errs.email&&<div style={{ fontSize:11, color:"#dc2626", marginTop:3 }}>{errs.email}</div>}
            {codeSent&&<div style={{ fontSize:11, color:"#16a34a", marginTop:3 }}>Code sent! (Demo: 123456)</div>}
          </div>
          <Input label="Verification Code" value={form.code} onChange={set("code")} placeholder="6-digit code" error={errs.code}/>
          <Input label="Password" type="password" value={form.password} onChange={set("password")} placeholder="8–20 chars, uppercase + special symbol" hint="Must contain uppercase, lowercase, and a special character." error={errs.password}/>
          <Input label="Confirm Password" type="password" value={form.confirm} onChange={set("confirm")} placeholder="Repeat password" error={errs.confirm}/>
          <button onClick={handleStep1} disabled={loading} style={{ width:"100%", padding:"11px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", marginTop:4, opacity:loading?0.7:1 }}>{loading?"Verifying…":"Continue →"}</button>
          <div style={{ textAlign:"center", marginTop:14, fontSize:13, color:"#6b7280" }}>Already have an account?{" "}<button onClick={onGoSignIn} style={{ background:"none", border:"none", color:"#3b82f6", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Sign in</button></div>
        </div>
      )}
      {step===2&&(
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:28 }}>
          <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:"12px 14px", marginBottom:20, display:"flex", gap:10 }}>
            <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>🔒</span>
            <div><div style={{ fontSize:13, fontWeight:700, color:"#92400e", marginBottom:3 }}>Store Owner Access Only</div><div style={{ fontSize:12, color:"#a16207", lineHeight:1.6 }}>HonchoPay Multi-Account Ops is available exclusively to store owners.</div></div>
          </div>
          <Input label="Your Store Handle" value={form.storeHandle} onChange={set("storeHandle")} placeholder="e.g. acmeshop" hint="The handle of the primary HonchoPay store you own." error={errs.storeHandle}/>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:8 }}>Your Role in this Store</label>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[{val:"owner",label:"Store Owner",desc:"I own this HonchoPay store and have full admin access.",icon:"👑"},{val:"staff",label:"Staff / Manager",desc:"I manage the store but am not the owner.",icon:"👤"}].map(opt=>(
                <label key={opt.val} onClick={()=>{set("storeRole")(opt.val);setErrs(e=>({...e,storeRole:""}));}} style={{ display:"flex", gap:12, padding:"12px 14px", border:`1.5px solid ${form.storeRole===opt.val?(opt.val==="owner"?"#3b82f6":"#f87171"):"#e5e7eb"}`, borderRadius:10, cursor:"pointer", background:form.storeRole===opt.val?(opt.val==="owner"?"#eff6ff":"#fff5f5"):"#fff" }}>
                  <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${form.storeRole===opt.val?(opt.val==="owner"?"#3b82f6":"#f87171"):"#d1d5db"}`, background:form.storeRole===opt.val?(opt.val==="owner"?"#3b82f6":"#f87171"):"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 }}>
                    {form.storeRole===opt.val&&<div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }}/>}
                  </div>
                  <div><div style={{ fontSize:13, fontWeight:700, color:"#111827" }}><span>{opt.icon}</span> {opt.label}</div><div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>{opt.desc}</div></div>
                </label>
              ))}
            </div>
            {errs.storeRole&&<div style={{ marginTop:8, background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 12px", fontSize:12, color:"#dc2626", display:"flex", gap:8 }}><span style={{ fontSize:16, flexShrink:0 }}>⛔</span><div><strong>Registration not permitted.</strong> Only store owners can create an account. Staff members can be invited from within the dashboard.</div></div>}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setStep(1)} style={{ flex:1, padding:"10px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer" }}>← Back</button>
            <button onClick={handleStep2} disabled={loading} style={{ flex:2, padding:"11px", background:form.storeRole==="owner"?"#3b82f6":"#e5e7eb", color:form.storeRole==="owner"?"#fff":"#9ca3af", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor:loading||form.storeRole!=="owner"?"not-allowed":"pointer", opacity:loading?0.7:1 }}>{loading?"Verifying…":"Create Account →"}</button>
          </div>
        </div>
      )}
      {step===3&&(
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:36, textAlign:"center" }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🎉</div>
          <div style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>Account created!</div>
          <div style={{ fontSize:13, color:"#6b7280", marginBottom:6, lineHeight:1.7 }}>Welcome, <strong>{form.name}</strong>. Your owner account is ready.</div>
          <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#15803d", marginBottom:24, lineHeight:1.6 }}>✅ Verified as owner of <strong>{form.storeHandle}</strong></div>
          <button onClick={()=>onSuccess({name:form.name,email:form.email,role:"Owner"})} style={{ width:"100%", padding:"11px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor:"pointer" }}>Go to Dashboard →</button>
        </div>
      )}
    </AuthLayout>
  );
};

// ─── SIGN IN ───────────────────────────────────────────────────────────────────
const SignIn = ({ onSuccess, onForgotPassword, onGoSignUp }) => {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [showPw,setShowPw] = useState(false);
  const [err,setErr] = useState("");
  const [loading,setLoading] = useState(false);
  const handleLogin = async()=>{ setErr(""); if(!email||!password){setErr("Please fill in all fields.");return;} setLoading(true); await new Promise(r=>setTimeout(r,800)); if(email==="admin@honchopay.com"&&password==="Demo@1234"){onSuccess({name:"Alex Morgan",email:"admin@honchopay.com",role:"Owner"});}else{setErr("Invalid credentials. Use admin@honchopay.com / Demo@1234");} setLoading(false); };
  return (
    <AuthLayout title="Sign in to your account" subtitle="Welcome back to HonchoPay Multi-Account Ops">
      <div style={{ background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:10, padding:"12px 16px", marginBottom:20 }}>
        <div style={{ fontSize:12, color:"#0369a1", marginBottom:4, fontWeight:600 }}>Quick Login Detected</div>
        <div style={{ fontSize:13, color:"#0c4a6e", marginBottom:10 }}>Continue as <strong>admin@honchopay.com</strong></div>
        <button onClick={()=>onSuccess({name:"Alex Morgan",email:"admin@honchopay.com",role:"Owner"})} style={{ width:"100%", padding:"7px 0", background:"#0369a1", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer" }}>Log in with this account</button>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}><div style={{ flex:1, height:1, background:"#e5e7eb" }}/><span style={{ fontSize:12, color:"#9ca3af" }}>or sign in manually</span><div style={{ flex:1, height:1, background:"#e5e7eb" }}/></div>
      {err&&<div style={{ background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#dc2626", marginBottom:14 }}>{err}</div>}
      <Input label="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com"/>
      <div style={{ marginBottom:6 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <label style={{ fontSize:13, fontWeight:600, color:"#374151" }}>Password</label>
          <button onClick={onForgotPassword} style={{ background:"none", border:"none", color:"#3b82f6", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Forgot password?</button>
        </div>
        <div style={{ position:"relative" }}>
          <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{ width:"100%", padding:"9px 44px 9px 12px", border:"1.5px solid #d1d5db", borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
          <button onClick={()=>setShowPw(p=>!p)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", fontSize:12, color:"#9ca3af", cursor:"pointer", fontFamily:"inherit" }}>{showPw?"Hide":"Show"}</button>
        </div>
      </div>
      <button onClick={handleLogin} disabled={loading} style={{ width:"100%", padding:"11px", background:loading?"#93c5fd":"#3b82f6", color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", marginTop:16 }}>{loading?"Signing in…":"Sign in →"}</button>
      <div style={{ textAlign:"center", marginTop:16, fontSize:13, color:"#6b7280" }}>Don't have an account?{" "}<button onClick={onGoSignUp} style={{ background:"none", border:"none", color:"#3b82f6", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Create one</button></div>
      <div style={{ marginTop:12, background:"#f9fafb", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#9ca3af", border:"1px solid #f3f4f6" }}><strong style={{ color:"#6b7280" }}>Demo:</strong> admin@honchopay.com / Demo@1234</div>
    </AuthLayout>
  );
};

// ─── CONNECT ACCOUNT MODAL ─────────────────────────────────────────────────────
const STORES_FOR_EMAIL = [
  {handle:"acmeshop",accountNo:"SLP-10023",company:"Acme Global Ltd",country:"US"},
  {handle:"acmeshop",accountNo:"SLP-10024",company:"Acme Global Ltd",country:"US"},
  {handle:"novatech",accountNo:"SLP-20011",company:"NovaTech Ltd",country:"GB"},
  {handle:"sunsetgoods",accountNo:"SLP-30045",company:"Sunset Goods Inc",country:"CA"},
  {handle:"orionpay",accountNo:"SLP-40099",company:"Orion Payments GmbH",country:"DE"},
  {handle:"blazeretail",accountNo:"SLP-50012",company:"Blaze Retail Pty",country:"AU"},
];
const ConnectAccountModal = ({ onClose, onConnected, t }) => {
  const [method,setMethod] = useState("handle");
  const [handle,setHandle] = useState("");
  const [selectedStore,setSelectedStore] = useState(null);
  const [err,setErr] = useState("");
  const [redirected,setRedirected] = useState(false);
  const activeHandle = method==="email-stores"&&selectedStore?selectedStore.handle:handle;
  const oauthLink = activeHandle?`https://${activeHandle}.store.com/admin/slpayment/oauth?client_id=honchopay&scope=balance:rw,dispute:rw,report:r,setting:w&expires_in=3600&nonce=abc123xyz`:"";
  if(redirected) return (
    <Modal title="Redirecting to Store" onClose={onClose} width={480}>
      <div style={{ textAlign:"center", padding:"8px 0 16px" }}>
        <div style={{ fontSize:44, marginBottom:14 }}>🏪</div>
        <div style={{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:8 }}>Opening <span style={{ color:"#3b82f6" }}>{activeHandle}.store.com</span></div>
        <div style={{ background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, padding:"10px 14px", marginBottom:20, textAlign:"left" }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>Destination</div>
          <div style={{ fontFamily:"monospace", fontSize:11, color:"#374151", wordBreak:"break-all" }}>{oauthLink}</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={()=>setRedirected(false)} style={{ flex:1, padding:"10px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer" }}>← Back</button>
          <button onClick={()=>{onConnected(activeHandle);onClose();}} style={{ flex:2, padding:"10px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>✓ Simulate Connection Complete</button>
        </div>
      </div>
    </Modal>
  );
  return (
    <Modal title={t.connectTitle} onClose={onClose} width={540}>
      <div style={{ fontSize:13, color:"#6b7280", marginBottom:18, lineHeight:1.6 }}>Enter a store handle or choose from stores your email has access to.</div>
      <div style={{ display:"flex", background:"#f3f4f6", borderRadius:9, padding:3, marginBottom:18, gap:4 }}>
        {[{id:"handle",label:t.enterHandle},{id:"email-stores",label:t.selectMyStores}].map(m=>(
          <button key={m.id} onClick={()=>{setMethod(m.id);setErr("");setSelectedStore(null);setHandle("");}} style={{ flex:1, padding:"7px 0", background:method===m.id?"#fff":"transparent", border:"none", borderRadius:7, fontSize:12, fontWeight:method===m.id?600:400, color:method===m.id?"#111827":"#6b7280", cursor:"pointer" }}>{m.label}</button>
        ))}
      </div>
      {err&&<div style={{ background:"#fee2e2", borderRadius:7, padding:"8px 12px", fontSize:13, color:"#dc2626", marginBottom:12 }}>{err}</div>}
      {method==="handle"&&<Input label={t.storeHandle} value={handle} onChange={e=>{setHandle(e.target.value);setErr("");}} placeholder="e.g. mystore" hint={handle?`→ ${handle}.store.com/admin/slpayment/oauth/...`:"e.g. mystore → mystore.store.com/admin/slpayment/oauth/..."}/>}
      {method==="email-stores"&&(
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Stores accessible by your email</div>
          <div style={{ border:"1px solid #e5e7eb", borderRadius:8, overflow:"hidden", maxHeight:240, overflowY:"auto" }}>
            {STORES_FOR_EMAIL.map((store,i)=>{const sel=selectedStore?.accountNo===store.accountNo;return(
              <div key={store.accountNo} onClick={()=>setSelectedStore(store)} style={{ padding:"10px 14px", borderBottom:i<STORES_FOR_EMAIL.length-1?"1px solid #f3f4f6":"none", cursor:"pointer", background:sel?"#eff6ff":"#fff", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${sel?"#3b82f6":"#d1d5db"}`, background:sel?"#3b82f6":"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{sel&&<div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }}/>}</div>
                <div><div style={{ fontSize:13, fontWeight:600 }}>{store.handle}</div><div style={{ fontSize:11, color:"#9ca3af" }}>{store.accountNo} · {store.company} · {store.country}</div></div>
              </div>
            );})}
          </div>
        </div>
      )}
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onClose} style={{ flex:1, padding:"10px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer" }}>{t.cancel}</button>
        <button onClick={()=>{if(!activeHandle.trim()){setErr(method==="handle"?"Please enter a store handle":"Please select a store");return;}setErr("");setRedirected(true);}} style={{ flex:2, padding:"10px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>{t.connect}</button>
      </div>
    </Modal>
  );
};

// ─── SIDEBAR ───────────────────────────────────────────────────────────────────
const Sidebar = ({ tab, setTab, user, onSignOut, t }) => {
  const [userMenu,setUserMenu] = useState(false);
  const navItems = [{id:"accounts",icon:"◫",label:t.accountList},{id:"disputes",icon:"⚖",label:t.disputes},{id:"reports",icon:"📊",label:t.reports},{id:"settings",icon:"⚙",label:t.settings},{id:"employees",icon:"👥",label:t.employees}];
  return (
    <nav style={{ width:232, background:"#0f172a", display:"flex", flexDirection:"column", flexShrink:0, minHeight:"100vh" }}>
      <div style={{ padding:"18px 16px 14px", borderBottom:"1px solid #1e293b" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#3b82f6,#06b6d4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⚡</div>
          <div><div style={{ fontSize:14, fontWeight:800, color:"#f1f5f9" }}>HonchoPay</div><div style={{ fontSize:9, color:"#475569", letterSpacing:1.2, textTransform:"uppercase" }}>Multi-Account Ops</div></div>
        </div>
      </div>
      <div style={{ padding:"8px 0", flex:1 }}>
        {navItems.map(item=>(
          <button key={item.id} onClick={()=>setTab(item.id)} style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 16px", width:"100%", border:"none", background:tab===item.id?"#1e3a5f33":"transparent", color:tab===item.id?"#60a5fa":"#94a3b8", borderLeft:tab===item.id?"2px solid #3b82f6":"2px solid transparent", cursor:"pointer", fontSize:13, fontWeight:tab===item.id?600:400, textAlign:"left" }}>
            <span style={{ fontSize:14 }}>{item.icon}</span> {item.label}
          </button>
        ))}
      </div>
      <div style={{ borderTop:"1px solid #1e293b", padding:"12px 10px", position:"relative" }}>
        <button onClick={()=>setUserMenu(p=>!p)} style={{ width:"100%", display:"flex", alignItems:"center", gap:9, background:"#1e293b", border:"none", borderRadius:9, padding:"9px 10px", cursor:"pointer" }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#3b82f6,#06b6d4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0 }}>{user.name[0]}</div>
          <div style={{ flex:1, textAlign:"left", overflow:"hidden" }}><div style={{ fontSize:12, fontWeight:600, color:"#e2e8f0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.email}</div><div style={{ fontSize:10, color:"#64748b" }}>{user.role}</div></div>
          <span style={{ color:"#475569", fontSize:10 }}>▲</span>
        </button>
        {userMenu&&(
          <div style={{ position:"absolute", bottom:"calc(100% + 4px)", left:10, right:10, background:"#1e293b", border:"1px solid #334155", borderRadius:10, overflow:"hidden", boxShadow:"0 8px 24px #0005" }}>
            <div style={{ padding:"10px 14px", borderBottom:"1px solid #334155" }}><div style={{ fontSize:12, fontWeight:600, color:"#e2e8f0" }}>{user.name}</div><div style={{ fontSize:11, color:"#64748b" }}>{user.email}</div></div>
            <button onClick={()=>{setUserMenu(false);setTab("security");}} style={{ width:"100%", padding:"9px 14px", background:"none", border:"none", color:"#94a3b8", fontSize:13, cursor:"pointer", textAlign:"left", fontFamily:"inherit" }}>🔐 {t.security}</button>
            <button onClick={onSignOut} style={{ width:"100%", padding:"9px 14px", background:"none", border:"none", color:"#f87171", fontSize:13, cursor:"pointer", textAlign:"left", fontFamily:"inherit" }}>{t.signOut}</button>
          </div>
        )}
      </div>
    </nav>
  );
};

// ─── TOP BAR ───────────────────────────────────────────────────────────────────
const TopBar = ({ tab, pulse, lang, setLang, t, onPricing }) => {
  const [langOpen,setLangOpen] = useState(false);
  const titles = { accounts:t.accountList, disputes:t.disputes, reports:t.reports, settings:t.settings, employees:t.employees, security:t.security };
  const current = LANGS.find(l=>l.code===lang);
  return (
    <header style={{ background:"#fff", borderBottom:"1px solid #e5e7eb", padding:"10px 24px", display:"flex", alignItems:"center", gap:14 }}>
      <div style={{ flex:1 }}><div style={{ fontSize:17, fontWeight:700, letterSpacing:-0.3, color:"#111827" }}>{titles[tab]||"Dashboard"}</div></div>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <button onClick={onPricing} style={{ display:"flex", alignItems:"center", gap:0, background:"none", border:"none", padding:0, cursor:"pointer", borderRadius:22, overflow:"hidden", boxShadow:"0 1px 6px #f59e0b44" }}>
          <div style={{ background:"linear-gradient(90deg,#f59e0b,#fbbf24)", padding:"5px 11px", display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ fontSize:12 }}>⭐</span><span style={{ fontSize:11, fontWeight:800, color:"#fff", letterSpacing:0.2, whiteSpace:"nowrap" }}>LIMITED-TIME FREE</span>
          </div>
          <div style={{ background:"#fffbeb", padding:"5px 10px", borderLeft:"1px solid #fde68a", display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#92400e", whiteSpace:"nowrap" }}>Premium Plan</span><span style={{ fontSize:10, color:"#b45309" }}>▾</span>
          </div>
        </button>
        <button style={{ padding:"6px 12px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, color:"#374151", cursor:"pointer" }}>{t.downloadCenter}</button>
        <button style={{ padding:"6px 10px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, color:"#374151", cursor:"pointer" }}>❓</button>
        <div style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:20, fontSize:11, color:"#15803d", fontWeight:600 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#16a34a", opacity:pulse?1:0.3, transition:"opacity 0.6s" }}/> {t.live}
        </div>
        <div style={{ position:"relative" }}>
          <button onClick={()=>setLangOpen(o=>!o)} style={{ padding:"5px 10px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, color:"#374151", cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontFamily:"inherit" }}>
            <span>{current.flag}</span><span style={{ fontWeight:600 }}>{current.label}</span><span style={{ fontSize:10, color:"#9ca3af" }}>▾</span>
          </button>
          {langOpen&&(
            <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, boxShadow:"0 8px 24px #0002", zIndex:200, minWidth:150, overflow:"hidden" }}>
              {LANGS.map(l=>(
                <button key={l.code} onClick={()=>{setLang(l.code);setLangOpen(false);}} style={{ width:"100%", padding:"9px 14px", background:l.code===lang?"#eff6ff":"#fff", border:"none", textAlign:"left", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:10, color:l.code===lang?"#1d4ed8":"#374151", fontWeight:l.code===lang?600:400, fontFamily:"inherit" }}>
                  <span style={{ fontSize:16 }}>{l.flag}</span><span>{l.label}</span>{l.code===lang&&<span style={{ marginLeft:"auto", color:"#3b82f6" }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// ─── EMPTY STATE ───────────────────────────────────────────────────────────────
const InitializationGuide = ({ onConnectAccount, onGoEmployees, t }) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"40px 24px" }}>
    <div style={{ width:"100%", maxWidth:700, background:"linear-gradient(135deg,#0f172a,#1e3a5f)", borderRadius:16, padding:"28px 32px", marginBottom:32, color:"#fff" }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#60a5fa", letterSpacing:1.2, textTransform:"uppercase", marginBottom:8 }}>{t.operationGuide}</div>
      <div style={{ fontSize:20, fontWeight:800, color:"#f1f5f9", marginBottom:6 }}>{t.getStarted}</div>
      <div style={{ fontSize:13, color:"#94a3b8", marginBottom:28, lineHeight:1.6 }}>{t.noAccounts}</div>
      <div style={{ display:"flex", gap:16 }}>
        {[{num:1,title:t.step1Title,desc:t.step1Desc,onClick:onConnectAccount,primary:true,icon:"🔗"},{num:2,title:t.step2Title,desc:t.step2Desc,onClick:onGoEmployees,primary:false,icon:"👥"}].map(s=>(
          <div key={s.num} style={{ flex:1, background:"#ffffff0d", border:"1px solid #ffffff14", borderRadius:12, padding:"20px 20px 16px", display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:s.primary?"#3b82f6":"#334155", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", flexShrink:0 }}>{s.num}</div>
              <span style={{ fontSize:22 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9", marginBottom:6 }}>{s.title}</div>
            <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6, marginBottom:16, flex:1 }}>{s.desc}</div>
            <button onClick={s.onClick} style={{ padding:"9px 0", background:s.primary?"#3b82f6":"transparent", color:s.primary?"#fff":"#60a5fa", border:s.primary?"none":"1px solid #3b82f644", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", width:"100%" }}>{s.title} →</button>
          </div>
        ))}
      </div>
    </div>
    <div style={{ width:"100%", maxWidth:700, background:"#fff", border:"2px dashed #e5e7eb", borderRadius:16, padding:"52px 24px", textAlign:"center" }}>
      <div style={{ fontSize:52, marginBottom:14, opacity:0.4 }}>📊</div>
      <div style={{ fontSize:16, fontWeight:700, color:"#9ca3af", marginBottom:8 }}>{t.noAccountsEmpty}</div>
      <div style={{ fontSize:13, color:"#d1d5db", marginBottom:24 }}>{t.noAccountsDesc}</div>
      <button onClick={onConnectAccount} style={{ padding:"10px 24px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer" }}>+ {t.step1Title}</button>
    </div>
  </div>
);

// ─── NICKNAME EDIT CELL ────────────────────────────────────────────────────────
const NicknameCell = ({ account, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(account.nickname || "");
  const inputRef = useRef();
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  const commit = () => { onSave(account.id, val.trim()); setEditing(false); };
  if (editing) return (
    <div style={{ display:"flex", alignItems:"center", gap:4, minWidth:140 }}>
      <input ref={inputRef} value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter")commit(); if(e.key==="Escape"){setVal(account.nickname||"");setEditing(false);} }}
        placeholder="Add nickname…" style={{ flex:1, padding:"4px 8px", border:"1.5px solid #3b82f6", borderRadius:6, fontSize:12, outline:"none", fontFamily:"inherit", minWidth:0 }}/>
      <button onClick={commit} style={{ padding:"4px 7px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:5, fontSize:11, cursor:"pointer", fontWeight:700 }}>✓</button>
      <button onClick={()=>{setVal(account.nickname||"");setEditing(false);}} style={{ padding:"4px 7px", background:"#f3f4f6", border:"none", borderRadius:5, fontSize:11, cursor:"pointer" }}>✕</button>
    </div>
  );
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", minWidth:120 }} onClick={()=>setEditing(true)}>
      {account.nickname
        ? <span style={{ fontSize:12, color:"#374151", fontWeight:500, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:5, padding:"2px 7px" }}>{account.nickname}</span>
        : <span style={{ fontSize:11, color:"#d1d5db", fontStyle:"italic" }}>Add nickname…</span>}
      <span style={{ fontSize:10, color:"#9ca3af", opacity:0, transition:"opacity 0.15s" }} className="edit-icon">✎</span>
    </div>
  );
};

// ─── ACCOUNTS TAB ─────────────────────────────────────────────────────────────
const AccountsTabContent = ({ onConnectAccount, t }) => {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [currency, setCurrency] = useState("USD");
  const [search, setSearch] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("all");
  const [disconnectModal, setDisconnectModal] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const handleNicknameSave = (id, nickname) => setAccounts(accs => accs.map(a => a.id === id ? { ...a, nickname } : a));
  const availableCurrencies = [...new Set(accounts.map(a=>a.currency))].sort();
  const handleSort = col => { if(sortCol===col)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortCol(col);setSortDir("asc");} };

  const columns = [
    { key:"handle", label:t.handle, sortFn:a=>a.handle },
    { key:"id", label:t.accountId, sortFn:a=>a.id },
    { key:"name", label:t.accountName, sortFn:a=>a.name },
    { key:"nickname", label:t.nickname, sortFn:a=>a.nickname||"" },
    { key:"country", label:t.country, sortFn:a=>a.country },
    { key:"currency", label:t.currency, sortFn:a=>a.currency },
    { key:"subId", label:t.subAccountId, sortFn:a=>a.subId },
    { key:"available", label:t.availablePayout, sortFn:a=>convertAmt(a.available,a.currency,currency) },
    { key:"pending", label:t.pendingSettlement, sortFn:a=>convertAmt(a.pending,a.currency,currency) },
    { key:"pendingPayout", label:t.pendingPayout, sortFn:a=>convertAmt(a.pendingPayout,a.currency,currency) },
    { key:"inTransit", label:t.pendingProcessing, sortFn:a=>convertAmt(a.inTransit,a.currency,currency) },
    { key:"reserve", label:t.reserveBalance, sortFn:a=>convertAmt(a.reserve,a.currency,currency) },
    { key:"status", label:t.status, sortFn:a=>a.status },
  ];

  const base = accounts.filter(a =>
    (filterCurrency==="all"||a.currency===filterCurrency) &&
    (a.handle.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase()) || (a.nickname||"").toLowerCase().includes(search.toLowerCase()))
  );
  const sorted = sortCol ? [...base].sort((a,b) => {
    const col = columns.find(c=>c.key===sortCol);
    const va=col.sortFn(a), vb=col.sortFn(b);
    const cmp = typeof va==="string"?va.localeCompare(vb):va-vb;
    return sortDir==="asc"?cmp:-cmp;
  }) : base;
  const paged = sorted.slice(0, pageSize);

  const totals = {available:0,pending:0,pendingPayout:0,inTransit:0,reserve:0};
  accounts.forEach(a=>{totals.available+=convertAmt(a.available,a.currency,currency);totals.pending+=convertAmt(a.pending,a.currency,currency);totals.pendingPayout+=convertAmt(a.pendingPayout,a.currency,currency);totals.inTransit+=convertAmt(a.inTransit,a.currency,currency);totals.reserve+=convertAmt(a.reserve,a.currency,currency);});

  return (
    <div>
      <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a5f)", borderRadius:14, padding:"20px 24px", marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:"#94a3b8" }}>{t.balanceOverview}</div>
            <div style={{ fontSize:11, color:"#475569", marginTop:3 }}>⚠️ All balances are estimated amounts converted at current exchange rates and may differ from actual settled values.</div>
          </div>
          <select value={currency} onChange={e=>setCurrency(e.target.value)} style={{ background:"#1e293b", color:"#e2e8f0", border:"1px solid #334155", borderRadius:7, padding:"4px 10px", fontSize:12, cursor:"pointer" }}>
            {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12 }}>
          {[
            { label:t.accountCount, value:accounts.length, sub:`${accounts.filter(a=>a.subId).length} ${t.subAccounts}` },
            { label:t.availablePayout, value:fmt(totals.available,currency), sub:t.withdrawable },
            { label:t.pendingSettlement, value:fmt(totals.pending,currency), tip:"Will enter the withdrawable balance after settlement is completed." },
            { label:t.pendingPayout, value:fmt(totals.pendingPayout,currency), tip:"Funds queued for payout, pending final transfer to your bank account." },
            { label:t.pendingProcessing, value:fmt(totals.inTransit,currency), tip:"Estimated settlement balance based on the order payment currency." },
            { label:t.reserveBalance, value:fmt(totals.reserve,currency), tip:"Includes rolling reserve collected for each transaction and fixed reserve balance." },
          ].map(({label,value,sub,tip})=>(
            <div key={label} style={{ background:"#ffffff0d", borderRadius:10, padding:"12px 14px", border:"1px solid #ffffff14" }}>
              <div style={{ fontSize:11, color:"#64748b", marginBottom:4, display:"flex", alignItems:"center", gap:4 }}>
                {label}{tip&&<Tooltip text={tip}><span style={{ width:14, height:14, borderRadius:"50%", background:"#334155", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:9, cursor:"help" }}>?</span></Tooltip>}
              </div>
              <div style={{ fontSize:18, fontWeight:700, color:"#f1f5f9", letterSpacing:-0.3 }}>{value}</div>
              {sub&&<div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>{sub}</div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af", fontSize:13 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.searchAccounts}
            style={{ width:"100%", padding:"8px 10px 8px 32px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:12, color:"#6b7280", whiteSpace:"nowrap" }}>Filter by:</span>
          <select value={filterCurrency} onChange={e=>setFilterCurrency(e.target.value)} style={{ padding:"7px 10px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, outline:"none", background:"#fff", color:"#374151", cursor:"pointer" }}>
            <option value="all">All Currencies</option>
            {availableCurrencies.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button style={{ padding:"8px 14px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, color:"#374151", cursor:"pointer" }}>{t.exportBalance}</button>
        <button onClick={onConnectAccount} style={{ padding:"8px 16px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>{t.connectAccount}</button>
      </div>

      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#f9fafb", borderBottom:"1px solid #e5e7eb" }}>
                {columns.map(col=>(
                  <th key={col.key} onClick={()=>handleSort(col.key)}
                    style={{ padding:"9px 12px", textAlign:"left", fontSize:10, fontWeight:700, color:sortCol===col.key?"#1d4ed8":"#6b7280", letterSpacing:0.4, textTransform:"uppercase", whiteSpace:"nowrap", cursor:"pointer", userSelect:"none", background:sortCol===col.key?"#eff6ff":"transparent" }}>
                    {col.label}<SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir}/>
                  </th>
                ))}
                <th style={{ padding:"9px 12px" }}></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((acct,i)=>(
                <tr key={acct.id} style={{ borderBottom:i<paged.length-1?"1px solid #f3f4f6":"none" }} onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <td style={{ padding:"11px 12px", fontWeight:600, color:"#3b82f6" }}>{acct.handle}</td>
                  <td style={{ padding:"11px 12px", fontFamily:"monospace", fontSize:12, color:"#6b7280" }}>{acct.id}</td>
                  <td style={{ padding:"11px 12px" }}>{acct.name}</td>
                  <td style={{ padding:"6px 12px" }}><NicknameCell account={acct} onSave={handleNicknameSave}/></td>
                  <td style={{ padding:"11px 12px", color:"#6b7280" }}>{acct.country}</td>
                  <td style={{ padding:"11px 12px" }}><span style={{ background:"#eff6ff", color:"#1d4ed8", borderRadius:4, padding:"2px 7px", fontSize:11, fontWeight:700 }}>{acct.currency}</span></td>
                  <td style={{ padding:"11px 12px", fontFamily:"monospace", fontSize:12, color:"#6b7280" }}>{acct.subId}</td>
                  {["available","pending","pendingPayout","inTransit","reserve"].map((field,fi)=>(
                    <td key={field} style={{ padding:"11px 12px", color:["#059669","#d97706","#0369a1","#7c3aed","#6b7280"][fi] }}>
                      <div>{fmt(acct[field],acct.currency)}</div>
                      {acct.currency!==currency&&<div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>≈ {fmt(convertAmt(acct[field],acct.currency,currency),currency)}</div>}
                    </td>
                  ))}
                  <td style={{ padding:"11px 12px" }}><Badge status={acct.status}/></td>
                  <td style={{ padding:"11px 12px" }}><button onClick={()=>setDisconnectModal(acct)} style={{ fontSize:11, color:"#dc2626", background:"#fee2e2", border:"none", borderRadius:5, padding:"3px 9px", cursor:"pointer", fontWeight:600 }}>{t.disconnect}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:"10px 16px", borderTop:"1px solid #f3f4f6", display:"flex", alignItems:"center", gap:10, fontSize:12, color:"#9ca3af" }}>
          <span>{t.rowsPerPage}:</span>
          {[10,20,50].map(n=><button key={n} onClick={()=>setPageSize(n)} style={{ padding:"2px 8px", background:pageSize===n?"#eff6ff":"#f9fafb", border:`1px solid ${pageSize===n?"#bfdbfe":"#e5e7eb"}`, borderRadius:5, fontSize:12, color:pageSize===n?"#1d4ed8":"#6b7280", cursor:"pointer" }}>{n}</button>)}
          <span style={{ marginLeft:"auto" }}>{t.showing} {Math.min(pageSize,sorted.length)} {t.of} {sorted.length}</span>
          {sortCol&&<button onClick={()=>{setSortCol(null);setSortDir("asc");}} style={{ fontSize:11, color:"#6b7280", background:"#f3f4f6", border:"1px solid #e5e7eb", borderRadius:5, padding:"2px 8px", cursor:"pointer" }}>✕ Clear sort</button>}
        </div>
      </div>

      {disconnectModal&&(
        <Modal title="Disconnect Account" onClose={()=>setDisconnectModal(null)} width={400}>
          <div style={{ fontSize:14, color:"#374151", marginBottom:20, lineHeight:1.6 }}>If disconnected, you will no longer be able to process <strong>{disconnectModal.name}</strong>'s data via the Multi-Account Operations App.</div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setDisconnectModal(null)} style={{ flex:1, padding:"10px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer" }}>Cancel</button>
            <button onClick={()=>setDisconnectModal(null)} style={{ flex:1, padding:"10px", background:"#dc2626", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>Confirm Disconnect</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── DISPUTE DETAIL ────────────────────────────────────────────────────────────
const DisputeDetail = ({ dispute, onBack, onResolved, t }) => {
  const [action,setAction] = useState(null);
  const [challengeFiles,setChallengeFiles] = useState([]);
  const [challengeNote,setChallengeNote] = useState("");
  const [submitted,setSubmitted] = useState(false);
  const [loading,setLoading] = useState(false);
  const fileRef = useRef();
  const canAct = dispute.status==="Pending Response"||dispute.status==="Under Review";
  const handleAccept = async()=>{ setLoading(true);await new Promise(r=>setTimeout(r,900));setLoading(false);setSubmitted("accepted");onResolved(dispute.id,"Lost"); };
  const handleChallenge = async()=>{ if(!challengeNote.trim())return;setLoading(true);await new Promise(r=>setTimeout(r,1000));setLoading(false);setSubmitted("challenged");onResolved(dispute.id,"Under Review"); };
  const infoRow = (label,value,mono=false,link=null)=>(
    <div style={{ display:"flex", padding:"11px 0", borderBottom:"1px solid #f3f4f6" }}>
      <div style={{ width:200, fontSize:13, color:"#6b7280", flexShrink:0 }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:500, color:"#111827", fontFamily:mono?"monospace":"inherit" }}>
        {link?<button onClick={()=>window.open(link,"_blank")} style={{ background:"none", border:"none", color:"#3b82f6", cursor:"pointer", padding:0, fontSize:13, fontFamily:mono?"monospace":"inherit" }}>{value} ↗</button>:value}
      </div>
    </div>
  );
  if(submitted) return (
    <div>
      <button onClick={onBack} style={{ fontSize:13, color:"#3b82f6", background:"none", border:"none", cursor:"pointer", marginBottom:20, fontWeight:600, padding:0 }}>{t.backToDisputes}</button>
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:48, textAlign:"center", maxWidth:520, margin:"0 auto" }}>
        <div style={{ fontSize:52, marginBottom:16 }}>{submitted==="accepted"?"🏳️":"⚔️"}</div>
        <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>{submitted==="accepted"?t.acceptDispute:t.challengeDispute}</div>
        <div style={{ fontSize:13, color:"#6b7280", lineHeight:1.7, marginBottom:24 }}>{submitted==="accepted"?`Accepted dispute ${dispute.id}. ${fmt(dispute.amount,dispute.currency)} will be deducted.`:`Challenge for ${dispute.id} submitted. Card network review takes 30–75 days.`}</div>
        <button onClick={onBack} style={{ padding:"10px 28px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>{t.backToDisputes}</button>
      </div>
    </div>
  );
  return (
    <div>
      <button onClick={onBack} style={{ fontSize:13, color:"#3b82f6", background:"none", border:"none", cursor:"pointer", marginBottom:20, fontWeight:600, padding:0 }}>{t.backToDisputes}</button>
      <div style={{ display:"flex", gap:20, alignItems:"flex-start" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:"20px 24px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
              <div>
                <div style={{ fontSize:11, color:"#9ca3af", fontFamily:"monospace", marginBottom:4 }}>{dispute.id}</div>
                <div style={{ fontSize:20, fontWeight:800, color:"#111827" }}>{dispute.reason}</div>
                <div style={{ display:"flex", gap:8, marginTop:8 }}><Badge status={dispute.status}/><span style={{ fontSize:11, fontWeight:600, color:"#7c3aed", background:"#ede9fe", padding:"2px 8px", borderRadius:4 }}>{dispute.type}</span></div>
              </div>
              <div style={{ textAlign:"right" }}><div style={{ fontSize:24, fontWeight:800 }}>{fmt(dispute.amount,dispute.currency)}</div>{canAct&&<div style={{ fontSize:12, color:"#dc2626", fontWeight:600, marginTop:4 }}>Respond by {dispute.dueDate}</div>}</div>
            </div>
            {infoRow("Handle",dispute.handle)}{infoRow("Account ID",dispute.accountId,true)}{infoRow("Transaction ID",dispute.txId,true)}
            {infoRow("Order No.",`#${dispute.orderNo}`,false,`https://${dispute.handle}.store.com/admin/orders/${dispute.orderNo}`)}
            {infoRow("Type",dispute.type)}{infoRow("Reason",dispute.reason)}{infoRow("Created",dispute.created)}{infoRow("Due Date",dispute.dueDate)}{infoRow("Status",<Badge status={dispute.status}/>)}
          </div>
        </div>
        <div style={{ width:300, flexShrink:0 }}>
          {canAct&&!action&&(
            <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:20 }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>Respond to Dispute</div>
              <div style={{ fontSize:12, color:"#6b7280", marginBottom:18 }}>Respond before <strong style={{ color:"#dc2626" }}>{dispute.dueDate}</strong>.</div>
              {[{a:"accept",icon:"🏳️",bg:"#fee2e2",title:t.acceptDispute,desc:"Agree to the chargeback."},{a:"challenge",icon:"⚔️",bg:"#eff6ff",title:t.challengeDispute,desc:"Submit evidence to contest."}].map(opt=>(
                <div key={opt.a} onClick={()=>setAction(opt.a)} style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:14, marginBottom:10, cursor:"pointer", display:"flex", gap:10 }} onMouseEnter={e=>e.currentTarget.style.borderColor=opt.a==="accept"?"#fca5a5":"#93c5fd"} onMouseLeave={e=>e.currentTarget.style.borderColor="#e5e7eb"}>
                  <div style={{ width:32, height:32, borderRadius:8, background:opt.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{opt.icon}</div>
                  <div><div style={{ fontSize:13, fontWeight:700, marginBottom:3 }}>{opt.title}</div><div style={{ fontSize:11, color:"#6b7280" }}>{opt.desc}</div></div>
                </div>
              ))}
            </div>
          )}
          {canAct&&action==="accept"&&(
            <div style={{ background:"#fff", border:"1px solid #fca5a5", borderRadius:14, padding:20 }}>
              <button onClick={()=>setAction(null)} style={{ background:"none", border:"none", color:"#9ca3af", cursor:"pointer", fontSize:12, padding:0, marginBottom:12 }}>← Back</button>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>{t.acceptDispute}</div>
              <div style={{ background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 12px", fontSize:12, color:"#991b1b", marginBottom:16 }}>⚠️ <strong>{fmt(dispute.amount,dispute.currency)}</strong> will be deducted. This cannot be undone.</div>
              <button onClick={handleAccept} disabled={loading} style={{ width:"100%", padding:"11px", background:loading?"#fca5a5":"#dc2626", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>{loading?"Submitting…":t.confirmAccept}</button>
            </div>
          )}
          {canAct&&action==="challenge"&&(
            <div style={{ background:"#fff", border:"1px solid #bfdbfe", borderRadius:14, padding:20 }}>
              <button onClick={()=>setAction(null)} style={{ background:"none", border:"none", color:"#9ca3af", cursor:"pointer", fontSize:12, padding:0, marginBottom:12 }}>← Back</button>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>{t.challengeDispute}</div>
              <div style={{ fontSize:11, color:"#6b7280", marginBottom:14 }}>Upload evidence and explain why this charge is valid.</div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>Evidence Files</div>
                <div onClick={()=>fileRef.current?.click()} style={{ border:"2px dashed #bfdbfe", borderRadius:8, padding:"16px 12px", textAlign:"center", cursor:"pointer", background:"#f8faff" }}><div style={{ fontSize:20, marginBottom:4 }}>📎</div><div style={{ fontSize:12, color:"#6b7280" }}>Click to upload files</div></div>
                <input ref={fileRef} type="file" multiple style={{ display:"none" }} onChange={e=>setChallengeFiles(f=>[...f,...Array.from(e.target.files).map(f=>f.name)])}/>
                {challengeFiles.map((f,i)=><div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#f0f9ff", borderRadius:6, padding:"5px 10px", fontSize:12, color:"#0369a1", marginTop:4 }}><span>📄 {f}</span><button onClick={()=>setChallengeFiles(files=>files.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:"#9ca3af", cursor:"pointer", fontSize:14 }}>×</button></div>)}
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>Response Note <span style={{ color:"#dc2626" }}>*</span></div>
                <textarea value={challengeNote} onChange={e=>setChallengeNote(e.target.value)} placeholder="Explain why this transaction is valid." style={{ width:"100%", height:100, padding:"9px 10px", border:`1.5px solid ${challengeNote?"#bfdbfe":"#e5e7eb"}`, borderRadius:8, fontSize:12, outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }}/>
              </div>
              <button onClick={handleChallenge} disabled={loading||!challengeNote.trim()} style={{ width:"100%", padding:"11px", background:loading||!challengeNote.trim()?"#93c5fd":"#3b82f6", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:loading||!challengeNote.trim()?"not-allowed":"pointer" }}>{loading?"Submitting…":t.submitChallenge}</button>
            </div>
          )}
          {!canAct&&<div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:20 }}><div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>Dispute Status</div><Badge status={dispute.status}/><div style={{ fontSize:12, color:"#6b7280", marginTop:10, lineHeight:1.6 }}>{dispute.status==="Won"&&"Resolved in your favor."}{dispute.status==="Lost"&&"Resolved against you."}{dispute.status==="Under Review"&&"Under review — results in 30–75 days."}</div></div>}
        </div>
      </div>
    </div>
  );
};

// ─── DISPUTES TAB ──────────────────────────────────────────────────────────────
const DisputesTab = ({ t }) => {
  const [filterKey,setFilterKey] = useState("all");
  const [search,setSearch] = useState("");
  const [selected,setSelected] = useState(null);
  const [disputes,setDisputes] = useState(MOCK_DISPUTES);
  const typeFilters = [{key:"all",label:t.all,raw:"All"},{key:"chargeback",label:t.chargeback,raw:"Chargeback"},{key:"preChargeback",label:t.preChargeback,raw:"Pre-chargeback"},{key:"retrieval",label:t.retrieval,raw:"Retrieval"}];
  const activeRaw = typeFilters.find(f=>f.key===filterKey)?.raw||"All";
  const filtered = disputes.filter(d=>(activeRaw==="All"||d.type===activeRaw)&&(d.handle.includes(search)||d.accountId.toLowerCase().includes(search.toLowerCase())||d.id.includes(search)));
  const handleResolved = (id,s)=>setDisputes(ds=>ds.map(d=>d.id===id?{...d,status:s}:d));
  if(selected) return <DisputeDetail dispute={selected} onBack={()=>setSelected(null)} onResolved={(id,s)=>{handleResolved(id,s);setSelected(d=>({...d,status:s}));}} t={t}/>;
  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:14, alignItems:"center" }}>
        <div style={{ display:"flex", gap:4, background:"#f3f4f6", borderRadius:9, padding:3 }}>
          {typeFilters.map(f=><button key={f.key} onClick={()=>setFilterKey(f.key)} style={{ padding:"5px 14px", background:filterKey===f.key?"#fff":"transparent", border:"none", borderRadius:7, fontSize:12, fontWeight:filterKey===f.key?600:400, color:filterKey===f.key?"#111827":"#6b7280", cursor:"pointer" }}>{f.label}</button>)}
        </div>
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af", fontSize:13 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.searchDisputes} style={{ width:"100%", padding:"7px 10px 7px 30px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box" }}/>
        </div>
      </div>
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ background:"#f9fafb", borderBottom:"1px solid #e5e7eb" }}>{[t.disputeId,t.handle,t.accountId,t.txId,t.orderNo,t.amount,t.type,t.reason,t.status,t.created,t.dueDate].map((h,i)=><th key={i} style={{ padding:"9px 12px", textAlign:"left", fontSize:10, fontWeight:700, color:"#6b7280", letterSpacing:0.4, textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((d,i)=>(
              <tr key={d.id} style={{ borderBottom:i<filtered.length-1?"1px solid #f3f4f6":"none" }} onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                <td style={{ padding:"11px 12px" }}><button onClick={()=>setSelected(d)} style={{ background:"none", border:"none", color:"#3b82f6", cursor:"pointer", fontFamily:"monospace", fontSize:12, fontWeight:700, padding:0, textDecoration:"underline", textDecorationStyle:"dotted" }}>{d.id}</button></td>
                <td style={{ padding:"11px 12px", fontWeight:600 }}>{d.handle}</td>
                <td style={{ padding:"11px 12px", fontFamily:"monospace", fontSize:12, color:"#6b7280" }}>{d.accountId}</td>
                <td style={{ padding:"11px 12px", fontFamily:"monospace", fontSize:12, color:"#6b7280" }}>{d.txId}</td>
                <td style={{ padding:"11px 12px" }}><button onClick={()=>window.open(`https://${d.handle}.store.com/admin/orders/${d.orderNo}`,"_blank")} style={{ background:"none", border:"none", color:"#3b82f6", cursor:"pointer", fontSize:13, padding:0 }}>#{d.orderNo} ↗</button></td>
                <td style={{ padding:"11px 12px", fontWeight:600 }}>{fmt(d.amount,d.currency)}</td>
                <td style={{ padding:"11px 12px" }}><span style={{ fontSize:11, fontWeight:600, color:"#7c3aed", background:"#ede9fe", padding:"2px 8px", borderRadius:4 }}>{d.type}</span></td>
                <td style={{ padding:"11px 12px", color:"#6b7280", maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.reason}</td>
                <td style={{ padding:"11px 12px" }}><Badge status={d.status}/></td>
                <td style={{ padding:"11px 12px", fontSize:12, color:"#9ca3af" }}>{d.created}</td>
                <td style={{ padding:"11px 12px", fontSize:12, color:d.status==="Pending Response"?"#dc2626":"#9ca3af", fontWeight:d.status==="Pending Response"?600:400 }}>{d.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── REPORTS TAB ───────────────────────────────────────────────────────────────
const ReportsTab = () => {
  const [generateModal,setGenerateModal] = useState(null);
  const [selectedAccounts,setSelectedAccounts] = useState([]);
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {REPORTS.map(r=>(
          <div key={r.id} style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:20, display:"flex", gap:14 }}>
            <div style={{ fontSize:32 }}>{r.icon}</div>
            <div style={{ flex:1 }}><div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>{r.name}</div><div style={{ fontSize:12, color:"#6b7280", marginBottom:14 }}>{r.desc}</div><button onClick={()=>{setGenerateModal(r);setSelectedAccounts([]);}} style={{ padding:"7px 16px", background:"#eff6ff", color:"#1d4ed8", border:"1px solid #bfdbfe", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer" }}>Generate Report</button></div>
          </div>
        ))}
      </div>
      {generateModal&&(
        <Modal title={`Generate: ${generateModal.name}`} onClose={()=>setGenerateModal(null)} width={520}>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Select Accounts</div>
            <div style={{ border:"1px solid #e5e7eb", borderRadius:8, overflow:"hidden" }}>
              <div style={{ padding:"8px 12px", background:"#f9fafb", borderBottom:"1px solid #e5e7eb", display:"flex", alignItems:"center", gap:8 }}>
                <input type="checkbox" checked={selectedAccounts.length===INITIAL_ACCOUNTS.length} onChange={()=>setSelectedAccounts(s=>s.length===INITIAL_ACCOUNTS.length?[]:INITIAL_ACCOUNTS.map(a=>a.id))}/>
                <span style={{ fontSize:12, fontWeight:600 }}>Select All</span>
              </div>
              {INITIAL_ACCOUNTS.map(a=>(
                <div key={a.id} style={{ padding:"8px 12px", borderBottom:"1px solid #f3f4f6", display:"flex", alignItems:"center", gap:8 }}>
                  <input type="checkbox" checked={selectedAccounts.includes(a.id)} onChange={()=>setSelectedAccounts(s=>s.includes(a.id)?s.filter(x=>x!==a.id):[...s,a.id])}/>
                  <span style={{ fontSize:13 }}><strong>{a.handle}</strong>{a.nickname&&<span style={{ marginLeft:6, fontSize:11, color:"#15803d", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:4, padding:"1px 5px" }}>{a.nickname}</span>} · <span style={{ fontFamily:"monospace", fontSize:11, color:"#9ca3af" }}>{a.id}</span></span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:7, padding:"8px 12px", fontSize:12, color:"#92400e", marginBottom:16 }}>📦 Output compressed as <strong>Report_{new Date().toISOString().slice(0,10)}.zip</strong>.</div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setGenerateModal(null)} style={{ flex:1, padding:"10px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer" }}>Cancel</button>
            <button onClick={()=>setGenerateModal(null)} style={{ flex:2, padding:"10px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>Generate & Queue Download</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── SETTINGS TAB ──────────────────────────────────────────────────────────────
const SettingsTab = () => {
  const [payoutModal,setPayoutModal] = useState(false);
  const [currency,setCurrency] = useState("USD");
  const [minAmount,setMinAmount] = useState("");
  const [reserveFunds,setReserveFunds] = useState("");
  const [selectedAccounts,setSelectedAccounts] = useState([]);
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:20 }}><div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>Auto-Payout Settings</div><div style={{ fontSize:13, color:"#6b7280", marginBottom:16 }}>Configure minimum payout amounts and reserve funds across all accounts by currency.</div><button onClick={()=>setPayoutModal(true)} style={{ padding:"9px 18px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>Configure Payout Settings</button></div>
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:20 }}><div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>Bank Account Settings</div><div style={{ fontSize:13, color:"#6b7280", marginBottom:16 }}>Manage payout bank accounts for all connected stores in batch.</div><button style={{ padding:"9px 18px", background:"#f9fafb", color:"#374151", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>Manage Bank Accounts</button></div>
      </div>
      {payoutModal&&(
        <Modal title="Auto-Payout Settings" onClose={()=>setPayoutModal(false)} width={560}>
          <div style={{ marginBottom:16 }}><label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>Currency</label><select value={currency} onChange={e=>setCurrency(e.target.value)} style={{ width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, outline:"none", background:"#fff" }}>{CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
            <div><label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>Min Payout ({CURRENCY_SYMBOLS[currency]})</label><input value={minAmount} onChange={e=>setMinAmount(e.target.value)} placeholder={`e.g. ${CURRENCY_SYMBOLS[currency]}100.00`} style={{ width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box" }}/></div>
            <div><label style={{ fontSize:13, fontWeight:600, display:"block", marginBottom:6 }}>Reserve Funds ({CURRENCY_SYMBOLS[currency]})</label><input value={reserveFunds} onChange={e=>setReserveFunds(e.target.value)} placeholder={`e.g. ${CURRENCY_SYMBOLS[currency]}500.00`} style={{ width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box" }}/></div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setPayoutModal(false)} style={{ flex:1, padding:"10px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer" }}>Cancel</button>
            <button onClick={()=>setPayoutModal(false)} style={{ flex:2, padding:"10px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>Save & Apply to {selectedAccounts.length} Account{selectedAccounts.length!==1?"s":""}</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── EMPLOYEES TAB ─────────────────────────────────────────────────────────────
const EmployeesTab = () => {
  const [employees,setEmployees] = useState(INITIAL_EMPLOYEES);
  const [addModal,setAddModal] = useState(false);
  const [deleteModal,setDeleteModal] = useState(null);
  const [form,setForm] = useState({name:"",email:"",permissions:[],accounts:"all"});
  const set = k=>v=>setForm(f=>({...f,[k]:v}));
  const togglePerm = key=>setForm(f=>({...f,permissions:f.permissions.includes(key)?f.permissions.filter(p=>p!==key):[...f.permissions,key]}));
  const handleAdd = ()=>{if(!form.name||!form.email)return;setEmployees(e=>[...e,{id:Date.now(),name:form.name,email:form.email,status:"inactive",permissions:form.permissions,accounts:form.accounts}]);setAddModal(false);setForm({name:"",email:"",permissions:[],accounts:"all"});};
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14 }}>
        <button onClick={()=>setAddModal(true)} style={{ padding:"8px 16px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>+ Add Employee</button>
      </div>
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ background:"#f9fafb", borderBottom:"1px solid #e5e7eb" }}>{["Employee Name","Email","Permissions","Account Scope","Status","Actions"].map(h=><th key={h} style={{ padding:"9px 16px", textAlign:"left", fontSize:10, fontWeight:700, color:"#6b7280", letterSpacing:0.4, textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
          <tbody>
            {employees.map((emp,i)=>(
              <tr key={emp.id} style={{ borderBottom:i<employees.length-1?"1px solid #f3f4f6":"none" }}>
                <td style={{ padding:"13px 16px", fontWeight:600 }}>{emp.name}</td>
                <td style={{ padding:"13px 16px", color:"#6b7280" }}>{emp.email}</td>
                <td style={{ padding:"13px 16px" }}>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {emp.permissions.slice(0,3).map(p=>{const pt=PERMISSION_POINTS.find(pp=>pp.key===p);return <span key={p} style={{ fontSize:10, background:"#eff6ff", color:"#1d4ed8", borderRadius:4, padding:"2px 6px", fontWeight:600 }}>{pt?.label||p}</span>;})}
                    {emp.permissions.length>3&&<span style={{ fontSize:10, color:"#9ca3af" }}>+{emp.permissions.length-3}</span>}
                  </div>
                </td>
                <td style={{ padding:"13px 16px", fontSize:12, color:"#6b7280" }}>{emp.accounts==="all"?"All accounts":`${emp.accounts.length} accounts`}</td>
                <td style={{ padding:"13px 16px" }}><Badge status={emp.status}/></td>
                <td style={{ padding:"13px 16px" }}>{emp.status==="active"?<div style={{ display:"flex", gap:6 }}><button style={{ padding:"4px 10px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:6, fontSize:11, cursor:"pointer" }}>Edit</button><button onClick={()=>setDeleteModal(emp)} style={{ padding:"4px 10px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:6, fontSize:11, cursor:"pointer", fontWeight:600 }}>Delete</button></div>:<button style={{ padding:"4px 10px", background:"#eff6ff", color:"#1d4ed8", border:"none", borderRadius:6, fontSize:11, cursor:"pointer", fontWeight:600 }}>Resend Invite</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addModal&&(
        <Modal title="Add Employee" onClose={()=>setAddModal(false)} width={580}>
          <Input label="Employee Name" value={form.name} onChange={e=>set("name")(e.target.value)} placeholder="Full name"/>
          <Input label="Email Address" type="email" value={form.email} onChange={e=>set("email")(e.target.value)} placeholder="employee@company.com" hint="An invitation link will be sent (valid 3 days)."/>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#374151", marginBottom:4 }}>Permission Points</div>
            <div style={{ fontSize:11, color:"#9ca3af", marginBottom:10 }}>Select the actions this employee is allowed to perform.</div>
            <div style={{ border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden" }}>
              <div style={{ padding:"10px 14px", background:"#f9fafb", borderBottom:"1px solid #e5e7eb", display:"flex", alignItems:"center", gap:10 }}>
                <input type="checkbox" id="perm-all" checked={form.permissions.length===PERMISSION_POINTS.length} onChange={()=>set("permissions")(form.permissions.length===PERMISSION_POINTS.length?[]:PERMISSION_POINTS.map(p=>p.key))}/>
                <label htmlFor="perm-all" style={{ fontSize:12, fontWeight:700, color:"#374151", cursor:"pointer" }}>Select All Permissions</label>
                <span style={{ marginLeft:"auto", fontSize:11, color:"#9ca3af" }}>{form.permissions.length}/{PERMISSION_POINTS.length} selected</span>
              </div>
              {PERMISSION_POINTS.map((p,idx)=>{
                const checked = form.permissions.includes(p.key);
                return (
                  <label key={p.key} onClick={()=>togglePerm(p.key)} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"11px 14px", borderBottom:idx<PERMISSION_POINTS.length-1?"1px solid #f3f4f6":"none", cursor:"pointer", background:checked?"#f0f9ff":"#fff", transition:"background 0.1s" }}>
                    <div style={{ width:16, height:16, borderRadius:4, border:`1.5px solid ${checked?"#3b82f6":"#d1d5db"}`, background:checked?"#3b82f6":"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                      {checked&&<svg width="9" height="7" viewBox="0 0 9 7"><path d="M1 3.5l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:checked?600:400, color:checked?"#1d4ed8":"#111827" }}>
                        <span style={{ fontSize:10, fontWeight:700, color:"#9ca3af", marginRight:6 }}>{String(idx+1).padStart(2,"0")}</span>
                        {p.label}
                      </div>
                      <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{p.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#374151", marginBottom:6 }}>Account Data Scope</div>
            <div style={{ display:"flex", gap:8 }}>
              {[{val:"all",title:"All Accounts",sub:"Includes future accounts"},{val:[],title:"Specific Accounts",sub:"Select from list"}].map(opt=>(
                <label key={opt.title} style={{ flex:1, display:"flex", gap:7, padding:"9px 12px", border:`1.5px solid ${(form.accounts==="all")===(opt.val==="all")?"#3b82f6":"#e5e7eb"}`, borderRadius:7, cursor:"pointer", background:(form.accounts==="all")===(opt.val==="all")?"#eff6ff":"#fff", alignItems:"center" }}>
                  <input type="radio" checked={(form.accounts==="all")===(opt.val==="all")} onChange={()=>set("accounts")(opt.val)}/>
                  <div><div style={{ fontSize:12, fontWeight:600 }}>{opt.title}</div><div style={{ fontSize:11, color:"#9ca3af" }}>{opt.sub}</div></div>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setAddModal(false)} style={{ flex:1, padding:"10px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer" }}>Cancel</button>
            <button onClick={handleAdd} style={{ flex:2, padding:"10px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>Add & Send Invite</button>
          </div>
        </Modal>
      )}

      {deleteModal&&(
        <Modal title="Remove Employee" onClose={()=>setDeleteModal(null)} width={380}>
          <div style={{ fontSize:14, color:"#374151", marginBottom:20 }}>Remove <strong>{deleteModal.name}</strong> ({deleteModal.email})?</div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setDeleteModal(null)} style={{ flex:1, padding:"10px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer" }}>Cancel</button>
            <button onClick={()=>{setEmployees(e=>e.filter(x=>x.id!==deleteModal.id));setDeleteModal(null);}} style={{ flex:1, padding:"10px", background:"#dc2626", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>Remove</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── SECURITY CENTER ───────────────────────────────────────────────────────────
const SecurityCenter = () => (
  <div style={{ maxWidth:540 }}>
    <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:24, marginBottom:14 }}>
      <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Two-Factor Authentication (2FA)</div>
      <div style={{ fontSize:13, color:"#6b7280", marginBottom:16 }}>Protect your account with an authenticator app or SMS verification.</div>
      <div style={{ display:"flex", gap:10 }}>
        <button style={{ padding:"8px 18px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>Enable Authenticator App</button>
        <button style={{ padding:"8px 18px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer" }}>Enable SMS Code</button>
      </div>
    </div>
    <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:24 }}>
      <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Change Password</div>
      <div style={{ fontSize:13, color:"#6b7280", marginBottom:16 }}>8–20 characters with uppercase, lowercase, and special symbols.</div>
      <Input label="Current Password" type="password" placeholder="••••••••"/>
      <Input label="New Password" type="password" placeholder="8–20 chars, uppercase + special symbol"/>
      <Input label="Confirm New Password" type="password" placeholder="Repeat new password"/>
      <button style={{ padding:"9px 20px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>Update Password</button>
    </div>
  </div>
);

// ─── PRICING PAGE ──────────────────────────────────────────────────────────────
const PricingPage = ({ onClose }) => {
  const tiers = [
    {
      name:"Starter", tag:null, price:"$0", period:"USD/month", strikePrice:null,
      desc:"For small operators getting started with multi-account management.",
      stores:"Up to 3 accounts", employees:"Up to 5 employees",
      features:["Account balance overview","Dispute management","Report generation","Email support"],
      cta:"Downgrade to Starter", ctaStyle:"secondary", isCurrent:false, activeBadge:null,
      activationNote:null,
    },
    {
      name:"Premium", tag:"Most Popular", price:"$0", period:"USD/month", strikePrice:"$19.98 USD/month",
      desc:"For growing teams managing multiple stores and staff.",
      stores:"Up to 30 accounts", employees:"Up to 50 employees",
      features:["Everything in Starter","Batch payout settings","Employee permissions (11 points)","Priority support","Auto-payout configuration"],
      cta:"Currently Active", ctaStyle:"active", isCurrent:true, activeBadge:"Active",
      activationNote:"Expiration date: TBD — enjoying for free during the promotional period.",
    },
    {
      name:"Enterprise", tag:"Custom Pricing", price:"Custom", period:null, strikePrice:null,
      desc:"For large-scale operators with complex, high-volume needs.",
      stores:"30+ accounts", employees:"30+ employees",
      features:["Everything in Premium","Dedicated Merchant Success Manager","Custom API integrations","SLA-backed uptime guarantee","Onboarding & team training","Advanced analytics & reporting"],
      cta:"Contact Your MS to Activate", ctaStyle:"enterprise", isCurrent:false, activeBadge:null,
      activationNote:"Please contact your Merchant Success Manager to activate this plan.",
    },
  ];

  return (
    <div style={{ position:"fixed", inset:0, background:"#00000077", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:"#f8fafc", borderRadius:20, width:"100%", maxWidth:940, maxHeight:"92vh", overflow:"auto", boxShadow:"0 24px 80px #0005" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a5f)", padding:"32px 36px 28px", borderRadius:"20px 20px 0 0", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:18, right:18, background:"#ffffff22", border:"none", borderRadius:"50%", width:32, height:32, fontSize:18, cursor:"pointer", color:"#94a3b8", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          <div style={{ fontSize:11, fontWeight:700, color:"#60a5fa", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>⭐ Limited-Time Free</div>
          <div style={{ fontSize:26, fontWeight:800, color:"#f1f5f9", letterSpacing:-0.5, marginBottom:6 }}>Simple, transparent pricing</div>
          <div style={{ fontSize:14, color:"#94a3b8" }}>Choose the plan that fits your operation. Upgrade or downgrade anytime.</div>
        </div>

        {/* Current plan notice */}
        <div style={{ margin:"24px 28px 0", background:"#fff", border:"1.5px solid #e5e7eb", borderRadius:14, overflow:"hidden" }}>
          <div style={{ height:4, background:"linear-gradient(90deg,#f59e0b,#fbbf24)" }}/>
          <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#fef3c7,#fde68a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>⭐</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#111827", marginBottom:3 }}>You're currently on the <span style={{ color:"#d97706" }}>Premium plan</span> — free for a limited time</div>
              <div style={{ fontSize:12, color:"#6b7280", lineHeight:1.6 }}>All Premium features are available at no cost during the promotional period. Expiration date: <strong style={{ color:"#374151" }}>TBD</strong>. We'll notify you before any billing begins.</div>
            </div>
            <div style={{ flexShrink:0 }}><div style={{ background:"#fef3c7", border:"1px solid #fde68a", color:"#92400e", borderRadius:20, padding:"5px 14px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>🎁 Free Trial Active</div></div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"20px 28px 0" }}>
          <div style={{ flex:1, height:1, background:"#e5e7eb" }}/>
          <span style={{ fontSize:11, fontWeight:600, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1 }}>Subscription Plans</span>
          <div style={{ flex:1, height:1, background:"#e5e7eb" }}/>
        </div>

        {/* Tier cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, padding:"16px 28px 28px" }}>
          {tiers.map(tier=>(
            <div key={tier.name} style={{ background:"#fff", border:`2px solid ${tier.isCurrent?"#3b82f6":tier.name==="Enterprise"?"#7c3aed22":"#e5e7eb"}`, borderRadius:16, padding:"24px 22px", display:"flex", flexDirection:"column", position:"relative", boxShadow:tier.isCurrent?"0 8px 32px #3b82f622":tier.name==="Enterprise"?"0 4px 16px #7c3aed0f":"none" }}>
              {/* Tag badge */}
              {tier.tag&&<div style={{ position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)", background:tier.isCurrent?"#3b82f6":"#7c3aed", color:"#fff", fontSize:10, fontWeight:700, padding:"4px 14px", borderRadius:20, whiteSpace:"nowrap" }}>{tier.tag}</div>}
              {/* Active indicator */}
              {tier.isCurrent&&<div style={{ position:"absolute", top:14, right:14, display:"flex", alignItems:"center", gap:4, background:"#d1fae5", borderRadius:20, padding:"3px 8px" }}><div style={{ width:6, height:6, borderRadius:"50%", background:"#10b981" }}/><span style={{ fontSize:10, fontWeight:700, color:"#065f46" }}>Active</span></div>}

              <div style={{ fontSize:13, fontWeight:800, color:tier.isCurrent?"#1d4ed8":tier.name==="Enterprise"?"#7c3aed":"#374151", marginBottom:10, textTransform:"uppercase", letterSpacing:0.6 }}>{tier.name}</div>

              {/* Price */}
              <div style={{ marginBottom:6 }}>
                {tier.strikePrice&&(
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                    <span style={{ fontSize:13, color:"#9ca3af", textDecoration:"line-through", textDecorationColor:"#ef4444", textDecorationThickness:2, fontWeight:500 }}>{tier.strikePrice}</span>
                    <span style={{ fontSize:10, fontWeight:700, color:"#ef4444", background:"#fee2e2", borderRadius:4, padding:"1px 6px", whiteSpace:"nowrap" }}>Was this price</span>
                  </div>
                )}
                <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                  <span style={{ fontSize:tier.price==="Custom"?26:34, fontWeight:800, color:tier.isCurrent?"#059669":tier.name==="Enterprise"?"#7c3aed":"#111827", letterSpacing:-1 }}>{tier.price}</span>
                  {tier.period&&<span style={{ fontSize:12, color:"#9ca3af", fontWeight:500 }}>{tier.period}</span>}
                </div>
                {tier.isCurrent&&<div style={{ fontSize:11, color:"#059669", fontWeight:600, marginTop:3, display:"flex", alignItems:"center", gap:4 }}><span>✓</span> Currently free — expiration TBD</div>}
              </div>

              <div style={{ fontSize:12, color:"#6b7280", marginBottom:16, lineHeight:1.6 }}>{tier.desc}</div>

              {/* Limits */}
              <div style={{ background:tier.isCurrent?"#eff6ff":tier.name==="Enterprise"?"#f5f3ff":"#f9fafb", borderRadius:9, padding:"10px 12px", marginBottom:16, border:`1px solid ${tier.isCurrent?"#bfdbfe":tier.name==="Enterprise"?"#ede9fe":"#f3f4f6"}` }}>
                <div style={{ fontSize:12, fontWeight:600, color:tier.isCurrent?"#1d4ed8":tier.name==="Enterprise"?"#7c3aed":"#374151", marginBottom:4 }}>🏪 {tier.stores}</div>
                <div style={{ fontSize:12, fontWeight:600, color:tier.isCurrent?"#1d4ed8":tier.name==="Enterprise"?"#7c3aed":"#374151" }}>👥 {tier.employees}</div>
              </div>

              {/* Features */}
              <div style={{ flex:1, marginBottom:16 }}>
                {tier.features.map(f=>(
                  <div key={f} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:7 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink:0, marginTop:1 }}>
                      <circle cx="7" cy="7" r="7" fill={tier.isCurrent?"#3b82f6":tier.name==="Enterprise"?"#7c3aed":"#e5e7eb"}/>
                      <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize:12, color:"#374151", lineHeight:1.5 }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* Activation note */}
              {tier.activationNote&&(
                <div style={{ background:tier.isCurrent?"#fffbeb":"#f5f3ff", border:`1px solid ${tier.isCurrent?"#fde68a":"#ddd6fe"}`, borderRadius:8, padding:"8px 10px", fontSize:11, color:tier.isCurrent?"#92400e":"#6d28d9", lineHeight:1.6, marginBottom:14 }}>
                  {tier.isCurrent?"⏳":"💬"} {tier.activationNote}
                </div>
              )}

              {/* CTA */}
              <button disabled={tier.isCurrent}
                style={{ width:"100%", padding:"11px 0", borderRadius:9, fontSize:13, fontWeight:700, cursor:tier.isCurrent?"default":"pointer", border:"none",
                  background:tier.isCurrent?"#d1fae5":tier.name==="Enterprise"?"#7c3aed":"#f3f4f6",
                  color:tier.isCurrent?"#065f46":tier.name==="Enterprise"?"#fff":"#374151",
                  boxShadow:tier.name==="Enterprise"?"0 2px 8px #7c3aed33":"none" }}>
                {tier.isCurrent?"✓ Currently Active":tier.cta}
              </button>
            </div>
          ))}
        </div>

        <div style={{ padding:"0 28px 24px", textAlign:"center", fontSize:12, color:"#9ca3af" }}>
          No credit card required for Starter. Contact your Merchant Success Manager for Enterprise activation.
        </div>
      </div>
    </div>
  );
};

// ─── MAIN PORTAL ───────────────────────────────────────────────────────────────
const Portal = ({ user, onSignOut }) => {
  const [tab,setTab] = useState("accounts");
  const [connectModal,setConnectModal] = useState(false);
  const [pricingModal,setPricingModal] = useState(false);
  const [pulse,setPulse] = useState(false);
  const [lang,setLang] = useState("en");
  const [hasAccounts,setHasAccounts] = useState(false);
  const t = T[lang]||T.en;
  useEffect(()=>{ const timer=setInterval(()=>setPulse(p=>!p),1800);return()=>clearInterval(timer); },[]);
  const handleConnected = ()=>{ setHasAccounts(true);setTab("accounts"); };
  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'DM Sans',system-ui,sans-serif", background:"#f1f5f9" }}>
      <Sidebar tab={tab} setTab={setTab} user={user} onSignOut={onSignOut} t={t}/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <TopBar tab={tab} pulse={pulse} lang={lang} setLang={setLang} t={t} onPricing={()=>setPricingModal(true)}/>
        <div style={{ flex:1, overflow:"auto", padding:24 }}>
          {tab==="accounts"&&!hasAccounts&&<InitializationGuide onConnectAccount={()=>setConnectModal(true)} onGoEmployees={()=>setTab("employees")} t={t}/>}
          {tab==="accounts"&&hasAccounts&&<AccountsTabContent onConnectAccount={()=>setConnectModal(true)} t={t}/>}
          {tab==="disputes"&&<DisputesTab t={t}/>}
          {tab==="reports"&&<ReportsTab/>}
          {tab==="settings"&&<SettingsTab/>}
          {tab==="employees"&&<EmployeesTab/>}
          {tab==="security"&&<SecurityCenter/>}
        </div>
      </div>
      {connectModal&&<ConnectAccountModal onClose={()=>setConnectModal(false)} onConnected={handleConnected} t={t}/>}
      {pricingModal&&<PricingPage onClose={()=>setPricingModal(false)}/>}
    </div>
  );
};

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen] = useState("signup");
  const [user,setUser] = useState(null);
  if(screen==="portal"&&user) return <Portal user={user} onSignOut={()=>{setUser(null);setScreen("signup");}}/>;
  if(screen==="signin") return <SignIn onSuccess={u=>{setUser(u);setScreen("portal");}} onForgotPassword={()=>setScreen("forgot")} onGoSignUp={()=>setScreen("signup")}/>;
  if(screen==="forgot") return (
    <AuthLayout title="Reset Password" subtitle="Enter your email to receive a verification code">
      <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:28 }}>
        <Input label="Email Address" type="email" placeholder="you@company.com"/>
        <Input label="Verification Code" placeholder="Enter code from email"/>
        <Input label="New Password" type="password" placeholder="8–20 chars, uppercase + special symbol"/>
        <button style={{ width:"100%", padding:"11px", background:"#3b82f6", color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:12 }}>Reset Password</button>
        <div style={{ textAlign:"center" }}><button onClick={()=>setScreen("signin")} style={{ background:"none", border:"none", color:"#3b82f6", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>← Back to Sign In</button></div>
      </div>
    </AuthLayout>
  );
  return <SignUp onGoSignIn={()=>setScreen("signin")} onSuccess={u=>{setUser(u);setScreen("portal");}}/>;
}
