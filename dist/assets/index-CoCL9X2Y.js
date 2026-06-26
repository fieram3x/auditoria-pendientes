(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))s(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function a(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(r){if(r.ep)return;r.ep=!0;const n=a(r);fetch(r.href,n)}})();const Oe=3,ye=e=>Math.min(1e3*2**e,3e4),Ge=[520,503],Te=["GET","HEAD","OPTIONS"];var _e=class extends Error{constructor(e){super(e.message),this.name="PostgrestError",this.details=e.details,this.hint=e.hint,this.code=e.code}toJSON(){return{name:this.name,message:this.message,details:this.details,hint:this.hint,code:this.code}}};function Se(e,t){return new Promise(a=>{if(t?.aborted){a();return}const s=setTimeout(()=>{t?.removeEventListener("abort",r),a()},e);function r(){clearTimeout(s),a()}t?.addEventListener("abort",r)})}function Ke(e,t,a,s){return!(!s||a>=Oe||!Te.includes(e)||!Ge.includes(t))}var Ye=class{constructor(e){var t,a,s,r,n;this.shouldThrowOnError=!1,this.retryEnabled=!0,this.method=e.method,this.url=e.url,this.headers=new Headers(e.headers),this.schema=e.schema,this.body=e.body,this.shouldThrowOnError=(t=e.shouldThrowOnError)!==null&&t!==void 0?t:!1,this.signal=e.signal,this.isMaybeSingle=(a=e.isMaybeSingle)!==null&&a!==void 0?a:!1,this.shouldStripNulls=(s=e.shouldStripNulls)!==null&&s!==void 0?s:!1,this.urlLengthLimit=(r=e.urlLengthLimit)!==null&&r!==void 0?r:8e3,this.retryEnabled=(n=e.retry)!==null&&n!==void 0?n:!0,e.fetch?this.fetch=e.fetch:this.fetch=fetch}throwOnError(){return this.shouldThrowOnError=!0,this}stripNulls(){if(this.headers.get("Accept")==="text/csv")throw new Error("stripNulls() cannot be used with csv()");return this.shouldStripNulls=!0,this}setHeader(e,t){return this.headers=new Headers(this.headers),this.headers.set(e,t),this}retry(e){return this.retryEnabled=e,this}then(e,t){var a=this;if(this.schema===void 0||(["GET","HEAD"].includes(this.method)?this.headers.set("Accept-Profile",this.schema):this.headers.set("Content-Profile",this.schema)),this.method!=="GET"&&this.method!=="HEAD"&&this.headers.set("Content-Type","application/json"),this.shouldStripNulls){const i=this.headers.get("Accept");i==="application/vnd.pgrst.object+json"?this.headers.set("Accept","application/vnd.pgrst.object+json;nulls=stripped"):(!i||i==="application/json")&&this.headers.set("Accept","application/vnd.pgrst.array+json;nulls=stripped")}const s=this.fetch;let n=(async()=>{let i=0;for(;;){const u={};a.headers.forEach((d,m)=>{u[m]=d}),i>0&&(u["X-Retry-Count"]=String(i));let h;try{h=await s(a.url.toString(),{method:a.method,headers:u,body:JSON.stringify(a.body,(d,m)=>typeof m=="bigint"?m.toString():m),signal:a.signal})}catch(d){if(d?.name==="AbortError"||d?.code==="ABORT_ERR"||!Te.includes(a.method))throw d;if(a.retryEnabled&&i<Oe){const m=ye(i);i++,await Se(m,a.signal);continue}throw d}if(Ke(a.method,h.status,i,a.retryEnabled)){var c,p;const d=(c=(p=h.headers)===null||p===void 0?void 0:p.get("Retry-After"))!==null&&c!==void 0?c:null,m=d!==null?Math.max(0,parseInt(d,10)||0)*1e3:ye(i);await h.text(),i++,await Se(m,a.signal);continue}return await a.processResponse(h)}})();return this.shouldThrowOnError||(n=n.catch(i=>{var c;let p="",u="",h="";const d=i?.cause;if(d){var m,b,$,y;const ie=(m=d?.message)!==null&&m!==void 0?m:"",$e=(b=d?.code)!==null&&b!==void 0?b:"";p=`${($=i?.name)!==null&&$!==void 0?$:"FetchError"}: ${i?.message}`,p+=`

Caused by: ${(y=d?.name)!==null&&y!==void 0?y:"Error"}: ${ie}`,$e&&(p+=` (${$e})`),d?.stack&&(p+=`
${d.stack}`)}else{var _;p=(_=i?.stack)!==null&&_!==void 0?_:""}const L=this.url.toString().length;return i?.name==="AbortError"||i?.code==="ABORT_ERR"?(h="",u="Request was aborted (timeout or manual cancellation)",L>this.urlLengthLimit&&(u+=`. Note: Your request URL is ${L} characters, which may exceed server limits. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [many IDs])), consider using an RPC function to pass values server-side.`)):(d?.name==="HeadersOverflowError"||d?.code==="UND_ERR_HEADERS_OVERFLOW")&&(h="",u="HTTP headers exceeded server limits (typically 16KB)",L>this.urlLengthLimit&&(u+=`. Your request URL is ${L} characters. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [200+ IDs])), consider using an RPC function instead.`)),{success:!1,error:{message:`${(c=i?.name)!==null&&c!==void 0?c:"FetchError"}: ${i?.message}`,details:p,hint:u,code:h},data:null,count:null,status:0,statusText:""}})),n.then(e,t)}async processResponse(e){var t=this;let a=null,s=null,r=null,n=e.status,i=e.statusText;if(e.ok){var c,p;if(t.method!=="HEAD"){var u;const m=await e.text();if(m!=="")if(t.headers.get("Accept")==="text/csv")s=m;else if(t.headers.get("Accept")&&(!((u=t.headers.get("Accept"))===null||u===void 0)&&u.includes("application/vnd.pgrst.plan+text")))s=m;else try{s=JSON.parse(m)}catch{if(a={message:m},s=null,t.shouldThrowOnError)throw new _e({message:m,details:"",hint:"",code:""})}}const h=(c=t.headers.get("Prefer"))===null||c===void 0?void 0:c.match(/count=(exact|planned|estimated)/),d=(p=e.headers.get("content-range"))===null||p===void 0?void 0:p.split("/");h&&d&&d.length>1&&(r=parseInt(d[1])),t.isMaybeSingle&&Array.isArray(s)&&(s.length>1?(a={code:"PGRST116",details:`Results contain ${s.length} rows, application/vnd.pgrst.object+json requires 1 row`,hint:null,message:"JSON object requested, multiple (or no) rows returned"},s=null,r=null,n=406,i="Not Acceptable"):s.length===1?s=s[0]:s=null)}else{const h=await e.text();try{a=JSON.parse(h),Array.isArray(a)&&e.status===404&&(s=[],a=null,n=200,i="OK")}catch{e.status===404&&h===""?(n=204,i="No Content"):a={message:h}}if(a&&t.shouldThrowOnError)throw new _e(a)}return{success:a===null,error:a,data:s,count:r,status:n,statusText:i}}returns(){return this}overrideTypes(){return this}},Je=class extends Ye{throwOnError(){return super.throwOnError()}select(e){let t=!1;const a=(e??"*").split("").map(s=>/\s/.test(s)&&!t?"":(s==='"'&&(t=!t),s)).join("");return this.url.searchParams.set("select",a),this.headers.append("Prefer","return=representation"),this}order(e,{ascending:t=!0,nullsFirst:a,foreignTable:s,referencedTable:r=s}={}){const n=r?`${r}.order`:"order",i=this.url.searchParams.get(n);return this.url.searchParams.set(n,`${i?`${i},`:""}${e}.${t?"asc":"desc"}${a===void 0?"":a?".nullsfirst":".nullslast"}`),this}limit(e,{foreignTable:t,referencedTable:a=t}={}){const s=typeof a>"u"?"limit":`${a}.limit`;return this.url.searchParams.set(s,`${e}`),this}range(e,t,{foreignTable:a,referencedTable:s=a}={}){const r=typeof s>"u"?"offset":`${s}.offset`,n=typeof s>"u"?"limit":`${s}.limit`;return this.url.searchParams.set(r,`${e}`),this.url.searchParams.set(n,`${t-e+1}`),this}abortSignal(e){return this.signal=e,this}single(){return this.headers.set("Accept","application/vnd.pgrst.object+json"),this}maybeSingle(){return this.isMaybeSingle=!0,this}csv(){return this.headers.set("Accept","text/csv"),this}geojson(){return this.headers.set("Accept","application/geo+json"),this}explain({analyze:e=!1,verbose:t=!1,settings:a=!1,buffers:s=!1,wal:r=!1,format:n="text"}={}){var i;const c=[e?"analyze":null,t?"verbose":null,a?"settings":null,s?"buffers":null,r?"wal":null].filter(Boolean).join("|"),p=(i=this.headers.get("Accept"))!==null&&i!==void 0?i:"application/json";return this.headers.set("Accept",`application/vnd.pgrst.plan+${n}; for="${p}"; options=${c};`),n==="json"?this:this}rollback(){return this.headers.append("Prefer","tx=rollback"),this}returns(){return this}maxAffected(e){return this.headers.append("Prefer","handling=strict"),this.headers.append("Prefer",`max-affected=${e}`),this}};const we=new RegExp("[,()]");var q=class extends Je{throwOnError(){return super.throwOnError()}eq(e,t){return this.url.searchParams.append(e,`eq.${t}`),this}neq(e,t){return this.url.searchParams.append(e,`neq.${t}`),this}gt(e,t){return this.url.searchParams.append(e,`gt.${t}`),this}gte(e,t){return this.url.searchParams.append(e,`gte.${t}`),this}lt(e,t){return this.url.searchParams.append(e,`lt.${t}`),this}lte(e,t){return this.url.searchParams.append(e,`lte.${t}`),this}like(e,t){return this.url.searchParams.append(e,`like.${t}`),this}likeAllOf(e,t){return this.url.searchParams.append(e,`like(all).{${t.join(",")}}`),this}likeAnyOf(e,t){return this.url.searchParams.append(e,`like(any).{${t.join(",")}}`),this}ilike(e,t){return this.url.searchParams.append(e,`ilike.${t}`),this}ilikeAllOf(e,t){return this.url.searchParams.append(e,`ilike(all).{${t.join(",")}}`),this}ilikeAnyOf(e,t){return this.url.searchParams.append(e,`ilike(any).{${t.join(",")}}`),this}regexMatch(e,t){return this.url.searchParams.append(e,`match.${t}`),this}regexIMatch(e,t){return this.url.searchParams.append(e,`imatch.${t}`),this}is(e,t){return this.url.searchParams.append(e,`is.${t}`),this}isDistinct(e,t){return this.url.searchParams.append(e,`isdistinct.${t}`),this}in(e,t){const a=Array.from(new Set(t)).map(s=>typeof s=="string"&&we.test(s)?`"${s}"`:`${s}`).join(",");return this.url.searchParams.append(e,`in.(${a})`),this}notIn(e,t){const a=Array.from(new Set(t)).map(s=>typeof s=="string"&&we.test(s)?`"${s}"`:`${s}`).join(",");return this.url.searchParams.append(e,`not.in.(${a})`),this}contains(e,t){return typeof t=="string"?this.url.searchParams.append(e,`cs.${t}`):Array.isArray(t)?this.url.searchParams.append(e,`cs.{${t.join(",")}}`):this.url.searchParams.append(e,`cs.${JSON.stringify(t)}`),this}containedBy(e,t){return typeof t=="string"?this.url.searchParams.append(e,`cd.${t}`):Array.isArray(t)?this.url.searchParams.append(e,`cd.{${t.join(",")}}`):this.url.searchParams.append(e,`cd.${JSON.stringify(t)}`),this}rangeGt(e,t){return this.url.searchParams.append(e,`sr.${t}`),this}rangeGte(e,t){return this.url.searchParams.append(e,`nxl.${t}`),this}rangeLt(e,t){return this.url.searchParams.append(e,`sl.${t}`),this}rangeLte(e,t){return this.url.searchParams.append(e,`nxr.${t}`),this}rangeAdjacent(e,t){return this.url.searchParams.append(e,`adj.${t}`),this}overlaps(e,t){return typeof t=="string"?this.url.searchParams.append(e,`ov.${t}`):this.url.searchParams.append(e,`ov.{${t.join(",")}}`),this}textSearch(e,t,{config:a,type:s}={}){let r="";s==="plain"?r="pl":s==="phrase"?r="ph":s==="websearch"&&(r="w");const n=a===void 0?"":`(${a})`;return this.url.searchParams.append(e,`${r}fts${n}.${t}`),this}match(e){return Object.entries(e).filter(([t,a])=>a!==void 0).forEach(([t,a])=>{this.url.searchParams.append(t,`eq.${a}`)}),this}not(e,t,a){return this.url.searchParams.append(e,`not.${t}.${a}`),this}or(e,{foreignTable:t,referencedTable:a=t}={}){const s=a?`${a}.or`:"or";return this.url.searchParams.append(s,`(${e})`),this}filter(e,t,a){return this.url.searchParams.append(e,`${t}.${a}`),this}},We=class{constructor(e,{headers:t={},schema:a,fetch:s,urlLengthLimit:r=8e3,retry:n}){this.url=e,this.headers=new Headers(t),this.schema=a,this.fetch=s,this.urlLengthLimit=r,this.retry=n}cloneRequestState(){return{url:new URL(this.url.toString()),headers:new Headers(this.headers)}}select(e,t){const{head:a=!1,count:s}=t??{},r=a?"HEAD":"GET";let n=!1;const i=(e??"*").split("").map(u=>/\s/.test(u)&&!n?"":(u==='"'&&(n=!n),u)).join(""),{url:c,headers:p}=this.cloneRequestState();return c.searchParams.set("select",i),s&&p.append("Prefer",`count=${s}`),new q({method:r,url:c,headers:p,schema:this.schema,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}insert(e,{count:t,defaultToNull:a=!0}={}){var s;const r="POST",{url:n,headers:i}=this.cloneRequestState();if(t&&i.append("Prefer",`count=${t}`),a||i.append("Prefer","missing=default"),Array.isArray(e)){const c=e.reduce((p,u)=>p.concat(Object.keys(u)),[]);if(c.length>0){const p=[...new Set(c)].map(u=>`"${u}"`);n.searchParams.set("columns",p.join(","))}}return new q({method:r,url:n,headers:i,schema:this.schema,body:e,fetch:(s=this.fetch)!==null&&s!==void 0?s:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}upsert(e,{onConflict:t,ignoreDuplicates:a=!1,count:s,defaultToNull:r=!0}={}){var n;const i="POST",{url:c,headers:p}=this.cloneRequestState();if(p.append("Prefer",`resolution=${a?"ignore":"merge"}-duplicates`),t!==void 0&&c.searchParams.set("on_conflict",t),s&&p.append("Prefer",`count=${s}`),r||p.append("Prefer","missing=default"),Array.isArray(e)){const u=e.reduce((h,d)=>h.concat(Object.keys(d)),[]);if(u.length>0){const h=[...new Set(u)].map(d=>`"${d}"`);c.searchParams.set("columns",h.join(","))}}return new q({method:i,url:c,headers:p,schema:this.schema,body:e,fetch:(n=this.fetch)!==null&&n!==void 0?n:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}update(e,{count:t}={}){var a;const s="PATCH",{url:r,headers:n}=this.cloneRequestState();return t&&n.append("Prefer",`count=${t}`),new q({method:s,url:r,headers:n,schema:this.schema,body:e,fetch:(a=this.fetch)!==null&&a!==void 0?a:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}delete({count:e}={}){var t;const a="DELETE",{url:s,headers:r}=this.cloneRequestState();return e&&r.append("Prefer",`count=${e}`),new q({method:a,url:s,headers:r,schema:this.schema,fetch:(t=this.fetch)!==null&&t!==void 0?t:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};function B(e){"@babel/helpers - typeof";return B=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},B(e)}function Ze(e,t){if(B(e)!="object"||!e)return e;var a=e[Symbol.toPrimitive];if(a!==void 0){var s=a.call(e,t);if(B(s)!="object")return s;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function Qe(e){var t=Ze(e,"string");return B(t)=="symbol"?t:t+""}function Xe(e,t,a){return(t=Qe(t))in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function Ae(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);t&&(s=s.filter(function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable})),a.push.apply(a,s)}return a}function J(e){for(var t=1;t<arguments.length;t++){var a=arguments[t]!=null?arguments[t]:{};t%2?Ae(Object(a),!0).forEach(function(s){Xe(e,s,a[s])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):Ae(Object(a)).forEach(function(s){Object.defineProperty(e,s,Object.getOwnPropertyDescriptor(a,s))})}return e}var et=class je{constructor(t,{headers:a={},schema:s,fetch:r,timeout:n,urlLengthLimit:i=8e3,retry:c}={}){this.url=t,this.headers=new Headers(a),this.schemaName=s,this.urlLengthLimit=i;const p=r??globalThis.fetch;n!==void 0&&n>0?this.fetch=(u,h)=>{const d=new AbortController,m=setTimeout(()=>d.abort(),n),b=h?.signal;if(b){if(b.aborted)return clearTimeout(m),p(u,h);const $=()=>{clearTimeout(m),d.abort()};return b.addEventListener("abort",$,{once:!0}),p(u,J(J({},h),{},{signal:d.signal})).finally(()=>{clearTimeout(m),b.removeEventListener("abort",$)})}return p(u,J(J({},h),{},{signal:d.signal})).finally(()=>clearTimeout(m))}:this.fetch=p,this.retry=c}from(t){if(!t||typeof t!="string"||t.trim()==="")throw new Error("Invalid relation name: relation must be a non-empty string.");return new We(new URL(`${this.url}/${t}`),{headers:new Headers(this.headers),schema:this.schemaName,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}schema(t){return new je(this.url,{headers:this.headers,schema:t,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}rpc(t,a={},{head:s=!1,get:r=!1,count:n}={}){var i;let c;const p=new URL(`${this.url}/rpc/${t}`);let u;const h=b=>b!==null&&typeof b=="object"&&(!Array.isArray(b)||b.some(h)),d=s&&Object.values(a).some(h);d?(c="POST",u=a):s||r?(c=s?"HEAD":"GET",Object.entries(a).filter(([b,$])=>$!==void 0).map(([b,$])=>[b,Array.isArray($)?`{${$.join(",")}}`:`${$}`]).forEach(([b,$])=>{p.searchParams.append(b,$)})):(c="POST",u=a);const m=new Headers(this.headers);return d?m.set("Prefer",n?`count=${n},return=minimal`:"return=minimal"):n&&m.set("Prefer",`count=${n}`),new q({method:c,url:p,headers:m,schema:this.schemaName,body:u,fetch:(i=this.fetch)!==null&&i!==void 0?i:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};const tt="https://plqszwbcgsoxfaufudgn.supabase.co",Pe="sb_publishable_a34RnPQKgZS_TgHSp0CfBg_5BR3FFJi",j=["Pendiente","En proceso","En espera de respuesta","Escalado","Resuelto","Cerrado"],w=["Resuelto","Cerrado"],te=["Baja","Media","Alta","Crítica"],ue=["Administrador","Supervisor","Auditor","Consulta"],pe=["Activo","Inactivo"],oe=["No","Sí"],at={Crítica:1,Critica:1,Alta:2,Media:3,Baja:5},U="auditoriaPendientes.session",st="x-app-session-token",rt="id, username, display_name, role, status, last_access_at, failed_attempts, blocked, must_change_password, created_at, updated_at",ke="********",F=["#2563eb","#16a34a","#f59e0b","#ef4444","#8b5cf6","#0f766e","#64748b"],Ne={División:["5910 - PPRL","5911 - ZEL","5917 - MPCB","5918 - MCB","5930 - PGC"],Departamento:["Recepción","Reservas","A&B","Spa","Contabilidad","IT","Club Meliá","Auditoría Nocturna","Auditoría Diurna"],"Área Responsable":["Operaciones","Finanzas","Contabilidad","Revenue","Sistemas","Auditoría"],"Tipo de Incidencia":["Cobro no realizado","Routing incorrecto","Check-in mal procesado","Rate Code incorrecto","Factura no volcada a SAP","Diferencia POS vs PMS","Resort Credit incorrecto","HTC incorrecto","Falta de soporte","Incidencia IT"],Impacto:["Operativo","Financiero","Contable","Cliente","Sistema"],Prioridad:te,Estatus:j,"Causa raíz":["Error operativo","Falta de soporte","Configuración incorrecta","Proceso incompleto","Incidencia de sistema"],"Acción tomada":["Corrección en PMS","Corrección contable","Escalamiento a IT","Capacitación al equipo","Validación documental"]},K=document.querySelector("#app");let g=xe();const l={session:null,profile:null,page:"dashboard",loading:!0,incidents:[],audit:[],profiles:[],catalogs:[],filters:{hotel:"",department:"",priority:"",status:"",responsible:"",type:"",search:""},userFilters:{search:"",role:"",status:""}};function xe(e=""){const t={apikey:Pe,Authorization:`Bearer ${Pe}`};return e&&(t[st]=e),new et(`${tt}/rest/v1`,{headers:t,schema:"public"})}const o=e=>String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"),S=e=>String(e??"").trim(),le=e=>S(e).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""),nt=e=>S(e).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"sin-dato",D=(e,t=!1)=>{if(!e)return"";const a=new Date(e);return Number.isNaN(a.getTime())?String(e):new Intl.DateTimeFormat("es-DO",{day:"2-digit",month:"2-digit",year:"numeric",...t?{hour:"2-digit",minute:"2-digit"}:{}}).format(a)},it=()=>new Date().toISOString().slice(0,10),H=()=>new Date().toISOString(),P=(e,t="")=>`<span class="badge ${nt(e)} ${t}">${o(e||"Sin dato")}</span>`,z=(e,t=120)=>S(e).length>t?`${S(e).slice(0,t-3)}...`:S(e),V=()=>l.profile?.role||"Auditor",me=()=>V()==="Administrador",Re=()=>V()==="Supervisor",Ie=()=>me(),ot=()=>me()||Re(),G=e=>e?"Sí":"No",Q=e=>["si","sí","true","1","yes"].includes(le(e)),lt=e=>({...e,password_mask:ke});function ct(){try{const e=JSON.parse(localStorage.getItem(U)||"null");return!e?.token||!e?.expires_at?null:new Date(e.expires_at).getTime()<=Date.now()?(localStorage.removeItem(U),null):{token:e.token,expires_at:e.expires_at}}catch{return localStorage.removeItem(U),null}}function dt(e){if(!e?.token){localStorage.removeItem(U);return}localStorage.setItem(U,JSON.stringify({token:e.token,expires_at:e.expires_at}))}function R(e){l.session=e,g=xe(e?.token||""),dt(e)}function C(){return l.session?.token||""}function ut(){return`INC-${new Date().toISOString().replace(/[-:TZ.]/g,"").slice(0,14)}-${Math.random().toString(16).slice(2,6).toUpperCase()}`}function he(e,t=new Date){const a=new Date(t),s=at[e]??3;return a.setDate(a.getDate()+s),a.toISOString().slice(0,10)}function k(e){const t=S(e.status),a=e.actual_due_at||e.due_at||he(e.priority||"Media",e.created_at),s=new Date(`${a}T00:00:00`);if(w.includes(t)){if(!e.closed_at||Number.isNaN(s.getTime()))return{label:"Cerrado",days:null,met:!0,cls:"cerrado"};const c=new Date(e.closed_at)<=new Date(`${a}T23:59:59`);return{label:c?"Cerrado en SLA":"Cerrado fuera SLA",days:null,met:c,cls:c?"cerrado":"vencido"}}const r=new Date(`${it()}T00:00:00`),n=Math.ceil((s-r)/864e5);return n<0?{label:`Vencido ${Math.abs(n)}d`,days:n,met:!1,cls:"vencido"}:n===0?{label:"Vence hoy",days:n,met:!0,cls:"media"}:n===1?{label:"Vence en 1d",days:n,met:!0,cls:"media"}:{label:`En tiempo (${n}d)`,days:n,met:!0,cls:"baja"}}function E(e,t="edit"){if(me())return!0;if(Re())return["edit","comment","close","reopen","status"].includes(t);if(V()==="Consulta")return!1;if(t==="create"||t==="comment")return!0;if(!["edit","status"].includes(t)||!e)return!1;const a=l.profile?.id;return e.created_by===a||e.assigned_to===a}function pt(e){return w.includes(e.status)?j.filter(t=>w.includes(t)||E(e,"reopen")):j.filter(t=>!w.includes(t)||E(e,"close"))}function x(e){const t=e==="División"?["División","Hotel"]:[e],a=l.catalogs.filter(s=>t.includes(s.category)).map(s=>s.value).filter(Boolean);return a.length?[...new Set(a)].sort():Ne[e]||[]}function mt(e){return e==="Hotel"?"División":e}function ae(e,t=""){return[...new Set([t,...e].filter(Boolean))].map(s=>`<option value="${o(s)}" ${s===t?"selected":""}>${o(s)}</option>`).join("")}function v(e){const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),2600)}async function A(e,t="No se pudo completar la operación."){if(e.error)throw new Error(e.error.message||t);return e.data}function Me(e){const t=String(e?.reason||e?.message||"").toLowerCase();return t.includes("inactive")?"Usuario inactivo. Contacte al administrador.":t.includes("blocked")?"Usuario bloqueado. Contacte al administrador.":t.includes("weak_password")?"La nueva contraseña debe tener al menos 8 caracteres.":"Usuario o contraseña incorrectos."}function ht(e){const t=String(e?.message||"");return t.toLowerCase().includes("sesión")?"La sesión venció. Inicie sesión nuevamente.":t.toLowerCase().includes("inactivo")?"Usuario inactivo. Contacte al administrador.":t.toLowerCase().includes("bloqueado")?"Usuario bloqueado. Contacte al administrador.":"No fue posible cargar el sistema. Intente nuevamente o contacte al administrador."}function ft(e){const t=String(e?.message||e?.reason||"").trim(),a=t.toLowerCase();return a.includes("duplicate_username")?"Ya existe un usuario con ese nombre de usuario.":a.includes("weak_password")?"La contraseña inicial debe tener al menos 8 caracteres.":a.includes("legacy_user")?"Falta actualizar la tabla audit_log en Supabase. Ejecuta el SQL actualizado y vuelve a intentar.":a.includes("forbidden")?"No tienes permisos para guardar usuarios.":t?`No fue posible guardar el usuario: ${t}`:"No fue posible guardar el usuario. Verifica los datos e intenta nuevamente."}function fe(){l.session=null,l.profile=null,l.incidents=[],l.audit=[],l.profiles=[]}async function bt(){if(!g){vt();return}const e=ct();if(!e){l.loading=!1,X();return}R(e);try{if(await Fe(),l.profile?.must_change_password){l.loading=!1,ee();return}await se(),Y()}catch(t){console.error(t),R(null),fe(),X(ht(t))}}function vt(){K.innerHTML=`
    <main class="config-shell">
      <section class="config-card">
        <div class="brand-row">
          <div class="brand-mark">🛡️</div>
          <div>
            <h1>Falta configuración</h1>
            <p class="muted">No fue posible cargar la conexión de datos.</p>
          </div>
        </div>
        <div class="error">Contacte al administrador para completar la configuración del sistema.</div>
      </section>
    </main>
  `}function X(e=""){K.innerHTML=`
    <main class="login-shell">
      <section class="login-card">
        <div class="brand-row">
          <div class="brand-mark">🛡️</div>
          <div>
            <h1>Auditoría Pendientes</h1>
            <p class="muted">Control y seguimiento de incidencias</p>
          </div>
        </div>
        ${e?`<div class="error">${o(e)}</div>`:""}
        <form id="loginForm" class="form-grid" autocomplete="off">
          <div class="field form-full">
            <label>Usuario</label>
            <input name="login" type="text" required value="" placeholder="Inserte su usuario" autocomplete="off" autocapitalize="none" spellcheck="false">
          </div>
          <div class="field form-full">
            <label>Contraseña</label>
            <input name="password" type="password" required value="" placeholder="Inserte su contraseña" autocomplete="new-password">
          </div>
          <button class="btn primary form-full" type="submit">Entrar</button>
        </form>
      </section>
    </main>
  `,document.querySelector("#loginForm").addEventListener("submit",async t=>{t.preventDefault();const a=new FormData(t.currentTarget);try{await gt(a.get("login"),a.get("password"))}catch(s){console.warn("Login failed",s),R(null),fe(),X(Me(s))}})}function ee(e=""){K.innerHTML=`
    <main class="login-shell">
      <section class="login-card">
        <div class="brand-row">
          <div class="brand-mark">🛡️</div>
          <div>
            <h1>Cambiar contraseña</h1>
            <p class="muted">Actualice su contraseña para continuar.</p>
          </div>
        </div>
        ${e?`<div class="error">${o(e)}</div>`:""}
        <form id="passwordChangeForm" class="form-grid" autocomplete="off">
          <div class="field form-full">
            <label>Contraseña actual</label>
            <input name="current_password" type="password" required autocomplete="current-password">
          </div>
          <div class="field form-full">
            <label>Nueva contraseña</label>
            <input name="new_password" type="password" required autocomplete="new-password">
          </div>
          <div class="field form-full">
            <label>Confirmar contraseña</label>
            <input name="confirm_password" type="password" required autocomplete="new-password">
          </div>
          <button class="btn primary form-full" type="submit">Guardar contraseña</button>
          <button class="btn ghost form-full" type="button" id="passwordLogoutBtn">Cerrar sesión</button>
        </form>
      </section>
    </main>
  `,document.querySelector("#passwordLogoutBtn").addEventListener("click",qe),document.querySelector("#passwordChangeForm").addEventListener("submit",async t=>{t.preventDefault();const a=new FormData(t.currentTarget),s=String(a.get("new_password")||"");if(s!==String(a.get("confirm_password")||"")){ee("Las contraseñas no coinciden.");return}try{await $t(a.get("current_password"),s),v("Contraseña actualizada."),await se(),Y()}catch(r){console.warn("Password change failed",r),ee(Me(r))}})}async function gt(e,t){const a=await A(await g.rpc("app_login",{p_username:S(e),p_password:String(t||"")}),"No fue posible iniciar sesión.");if(!a?.ok){const s=new Error(a?.reason||"invalid_credentials");throw s.reason=a?.reason,s}if(R({token:a.token,expires_at:a.expires_at}),l.profile=a.profile,a.must_change_password||a.profile?.must_change_password){ee();return}await se(),Y()}async function $t(e,t){const a=await A(await g.rpc("app_change_password",{p_token:C(),p_current_password:String(e||""),p_new_password:String(t||"")}),"No fue posible cambiar la contraseña.");if(!a?.ok){const s=new Error(a?.reason||"invalid_credentials");throw s.reason=a?.reason,s}l.profile=a.profile,R({token:C(),expires_at:a.expires_at||l.session?.expires_at})}async function qe(){const e=C();try{e&&await g.rpc("app_logout",{p_token:e})}catch(t){console.warn("Logout failed",t)}R(null),fe(),X()}async function Fe(){if(!C())throw new Error("Sesión inválida.");const e=await A(await g.rpc("app_validate_session",{p_token:C()}),"No fue posible validar la sesión.");if(!e?.ok)throw new Error("Sesión inválida.");return l.profile=e.profile,R({token:C(),expires_at:e.expires_at}),l.profile}async function se(){l.loading=!0,await Fe();const[e,t,a,s]=await Promise.all([g.from("incidents").select("*").order("created_at",{ascending:!1}),g.from("audit_log").select("*").order("occurred_at",{ascending:!1}).limit(500),g.from("app_users").select(rt).order("display_name"),g.from("catalogs").select("*").order("category").order("value")]);l.incidents=await A(e),l.audit=await A(t),l.profiles=(await A(a)).map(lt),l.catalogs=await A(s),l.loading=!1}function Y(){const e={dashboard:{label:"Dashboard",icon:"📊"},incidents:{label:"Pendientes",icon:"📋"},kanban:{label:"Kanban",icon:"▦"},audit:{label:"Bitácora",icon:"🧾"},users:{label:"Usuarios",icon:"👥"},catalogs:{label:"Catálogos",icon:"⚙️"}},t=["dashboard","incidents","kanban","audit",...Ie()?["users"]:[],...ot()?["catalogs"]:[]];K.innerHTML=`
    <div class="app-layout">
      <aside class="sidebar">
        <div class="side-title">
          <div class="brand-mark">🛡️</div>
          <div><strong>Auditoría</strong><span>Panel de control</span></div>
        </div>
        <nav class="nav">
          ${t.map(a=>`<button data-page="${a}" class="${l.page===a?"active":""}"><span>${e[a].icon}</span>${e[a].label}</button>`).join("")}
        </nav>
        <div class="sidebar-footer">
          <span>${o(l.profile?.display_name||l.profile?.username||"Usuario")}</span>
          <span>${o(V())}</span>
          <button class="btn ghost" id="logoutBtn">Cerrar sesión</button>
        </div>
      </aside>
      <main class="content">
        <header class="topbar">
          <div>
            <h1>Auditoría Pendientes</h1>
            <div class="muted">Sistema de gestión de incidencias de auditoría</div>
          </div>
          <div class="user-chip">${o(l.profile?.display_name||"")} · ${o(V())}</div>
        </header>
        <section id="page"></section>
      </main>
    </div>
    <dialog class="modal" id="modal"></dialog>
  `,document.querySelectorAll("[data-page]").forEach(a=>{a.addEventListener("click",()=>{l.page=a.dataset.page,Y()})}),document.querySelector("#logoutBtn").addEventListener("click",qe),ce()}function ce(){const e=document.querySelector("#page");l.page==="dashboard"&&(e.innerHTML=yt()),l.page==="incidents"&&(e.innerHTML=Pt()),l.page==="kanban"&&(e.innerHTML=Et()),l.page==="audit"&&(e.innerHTML=Dt()),l.page==="users"&&(e.innerHTML=Ot()),l.page==="catalogs"&&(e.innerHTML=kt()),xt()}function re(){return l.incidents.filter(e=>{const t=l.filters,a=`${e.id} ${e.hotel} ${e.department} ${e.subject} ${e.incident_type} ${e.description} ${e.responsible}`.toLowerCase();return(!t.hotel||e.hotel===t.hotel)&&(!t.department||e.department===t.department)&&(!t.priority||e.priority===t.priority)&&(!t.status||e.status===t.status)&&(!t.responsible||e.responsible===t.responsible)&&(!t.type||e.incident_type===t.type)&&(!t.search||a.includes(t.search.toLowerCase()))})}function I(e,t,a=""){return`
    <div class="page-head">
      <div><h2>${o(e)}</h2><div class="muted">${o(t)}</div></div>
      ${a}
    </div>
  `}function be(){const e=l.filters,t=(a,s,r)=>`
    <div class="field">
      <label>${s}</label>
      <select data-filter="${a}">
        <option value="">Todos</option>
        ${ae(r,e[a])}
      </select>
    </div>
  `;return`
    <div class="filters">
      ${t("hotel","División",W("hotel"))}
      ${t("department","Departamento",W("department"))}
      ${t("type","Tipo",W("incident_type"))}
      ${t("priority","Prioridad",te)}
      ${t("status","Estatus",j)}
      ${t("responsible","Responsable",W("responsible"))}
      <div class="field"><label>Buscar</label><input data-filter="search" value="${o(e.search)}" placeholder="ID, asunto, descripción..."></div>
    </div>
  `}function W(e){return[...new Set(l.incidents.map(t=>S(t[e])).filter(Boolean))].sort()}function yt(){const e=re(),t=e.filter(u=>!w.includes(u.status)),a=e.filter(u=>w.includes(u.status)),s=t.filter(u=>k(u).days<0),r=e.filter(u=>["Crítica","Critica"].includes(u.priority)),n=a.filter(u=>D(u.closed_at).slice(3)===D(new Date).slice(3)),i=e.filter(u=>k(u).met).length,c=Le(t,"responsible")||"Sin asignar",p=Le(e,"department")||"-";return`
    ${I("Dashboard","Indicadores ejecutivos y comportamiento operativo.")}
    ${be()}
    <div class="kpi-grid">
      ${T("Total",e.length,"Incidencias filtradas")}
      ${T("Abiertas",t.length,`${de(t.length,e.length)}% del total`)}
      ${T("Vencidas",s.length,"Fuera de SLA")}
      ${T("Críticas",r.length,"Prioridad máxima")}
      ${T("Cerradas este mes",n.length,"Productividad mensual")}
      ${T("% Cumplimiento SLA",`${de(i,e.length)}%`,"Filtrado actual")}
      ${T("Responsable con más abiertas",c,"Carga operativa")}
      ${T("Departamento con más incidencias",p,"Concentración")}
    </div>
    <div class="dashboard-visuals">
      ${St("Tendencia mensual",e)}
      ${Ce("Cumplimiento SLA",i,e.length,"En SLA","Fuera SLA","#16a34a")}
      ${Ce("Cierre de incidencias",a.length,e.length,"Cerradas","Abiertas","#2563eb")}
    </div>
    <div class="dashboard-visuals dashboard-visuals-secondary">
      ${wt(e)}
      ${At(e)}
    </div>
    <div class="charts">
      ${Z("Incidencias por división",e,"hotel")}
      ${Z("Incidencias por departamento",e,"department")}
      ${Z("Incidencias por prioridad",e,"priority")}
      ${Z("Incidencias por estatus",e,"status")}
    </div>
  `}function T(e,t,a){return`<div class="kpi"><div class="label">${o(e)}</div><div class="value">${o(t)}</div><div class="sub">${o(a)}</div></div>`}function de(e,t){return t?(e/t*100).toFixed(1):"0.0"}function Le(e,t){const a=new Map;return e.forEach(s=>{const r=S(s[t])||"Sin asignar";a.set(r,(a.get(r)||0)+1)}),[...a.entries()].sort((s,r)=>r[1]-s[1])[0]?.[0]}function Ue(e,t,a=[]){const s=new Map;return e.forEach(r=>{const n=S(r[t])||"Sin dato";s.set(n,(s.get(n)||0)+1)}),a.length?a.map(r=>[r,s.get(r)||0]):[...s.entries()].sort((r,n)=>n[1]-r[1])}function Be(e){const t=e?new Date(e):new Date;return Number.isNaN(t.getTime())?"":`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}`}function _t(e=6){const t=new Intl.DateTimeFormat("es-DO",{month:"short"});return[...Array(e)].map((a,s)=>{const r=new Date;return r.setDate(1),r.setMonth(r.getMonth()-(e-s-1)),{key:Be(r),label:t.format(r).replace(".","")}})}function St(e,t){const a=_t(6),s=a.map(y=>t.filter(_=>Be(_.created_at)===y.key).length),r=Math.max(1,...s),n=360,i=170,c=34,p=138,u=292,h=92,d=s.length>1?u/(s.length-1):u,m=s.map((y,_)=>{const L=c+_*d,ie=p-y/r*h;return[L,ie]}),b=m.map(([y,_],L)=>`${L?"L":"M"} ${y.toFixed(1)} ${_.toFixed(1)}`).join(" "),$=`${b} L ${m.at(-1)?.[0].toFixed(1)||c} ${p} L ${c} ${p} Z`;return`
    <section class="panel chart-panel chart-wide">
      <div class="chart-head">
        <h3>${o(e)}</h3>
        <span>${o(t.length)} total</span>
      </div>
      <svg class="line-chart" viewBox="0 0 ${n} ${i}" role="img" aria-label="${o(e)}">
        <path class="line-area" d="${$}"></path>
        <path class="line-path" d="${b}"></path>
        ${[0,.5,1].map(y=>{const _=p-y*h;return`<line class="grid-line" x1="${c}" x2="${c+u}" y1="${_}" y2="${_}"></line>`}).join("")}
        ${m.map(([y,_],L)=>`
          <circle class="line-point" cx="${y.toFixed(1)}" cy="${_.toFixed(1)}" r="4"></circle>
          <text class="line-value" x="${y.toFixed(1)}" y="${(_-10).toFixed(1)}">${s[L]}</text>
          <text class="line-label" x="${y.toFixed(1)}" y="158">${o(a[L].label)}</text>
        `).join("")}
      </svg>
    </section>
  `}function Ce(e,t,a,s,r,n){const i=Number(de(t,a)),c=Math.max(0,a-t);return`
    <section class="panel chart-panel donut-panel">
      <div class="chart-head">
        <h3>${o(e)}</h3>
        <span>${o(a)} total</span>
      </div>
      <div class="donut-wrap">
        <div class="donut" style="--pct:${i};--donut-color:${n};"><span>${i.toFixed(1)}%</span></div>
        <div class="donut-legend">
          <span><b style="background:${n};"></b>${o(s)}: ${o(t)}</span>
          <span><b></b>${o(r)}: ${o(c)}</span>
        </div>
      </div>
    </section>
  `}function wt(e){const t=Ue(e,"status",j),a=Math.max(1,e.length);return`
    <section class="panel chart-panel">
      <div class="chart-head">
        <h3>Distribución por estatus</h3>
        <span>${o(e.length)} total</span>
      </div>
      <div class="status-stack">
        ${t.map(([s,r],n)=>`
          <span title="${o(s)}: ${o(r)}" style="width:${r/a*100}%;background:${F[n%F.length]};"></span>
        `).join("")}
      </div>
      <div class="status-list">
        ${t.map(([s,r],n)=>`
          <div>
            <span><b style="background:${F[n%F.length]};"></b>${o(s)}</span>
            <strong>${o(r)}</strong>
          </div>
        `).join("")}
      </div>
    </section>
  `}function At(e){const t=Ue(e,"priority",te),a=Math.max(1,...t.map(([,s])=>s));return`
    <section class="panel chart-panel">
      <div class="chart-head">
        <h3>Prioridad</h3>
        <span>Volumen por nivel</span>
      </div>
      <div class="vertical-chart">
        ${t.map(([s,r],n)=>`
          <div class="vertical-item">
            <span>${o(r)}</span>
            <div class="vertical-track">
              <div class="vertical-fill" style="height:${r/a*100}%;background:${F[n%F.length]};"></div>
            </div>
            <b>${o(s)}</b>
          </div>
        `).join("")}
      </div>
    </section>
  `}function Z(e,t,a){const s=new Map;t.forEach(i=>{const c=S(i[a])||"Sin dato";s.set(c,(s.get(c)||0)+1)});const r=Math.max(1,...s.values()),n=[...s.entries()].sort((i,c)=>c[1]-i[1]).slice(0,10);return`
    <section class="panel">
      <h3>${o(e)}</h3>
      ${n.length?n.map(([i,c])=>`
        <div class="bar-row">
          <span>${o(i)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${c/r*100}%"></div></div>
          <b>${c}</b>
        </div>
      `).join(""):'<div class="empty">Sin datos</div>'}
    </section>
  `}function Pt(){const e=re(),t=E(null,"create")?'<button class="btn primary" data-action="new-incident">Nueva incidencia</button>':"";return`
    ${I("Incidencias","Tabla tipo Excel, filtros, acciones y cierre formal.",t)}
    ${be()}
    <div class="toolbar">
      <strong>${e.length} registro(s)</strong>
      <button class="btn" data-action="export-csv">Exportar CSV</button>
    </div>
    ${Lt(e)}
  `}function Lt(e){const t=[["actions","Abrir"],["id","ID"],["created_at","Fecha"],["hotel","División"],["department","Departamento"],["subject","Asunto"],["incident_type","Tipo"],["priority","Prioridad"],["status","Estatus"],["responsible","Responsable"],["sla","SLA"],["due_at","Compromiso"],["description","Descripción"]];return`
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr>${t.map(([,a])=>`<th>${o(a)}</th>`).join("")}</tr></thead>
          <tbody>
            ${e.length?e.map(a=>`
              <tr>
                ${t.map(([s])=>`<td>${Ct(a,s)}</td>`).join("")}
              </tr>
            `).join(""):`<tr><td colspan="${t.length}" class="empty">No hay incidencias con los filtros seleccionados.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `}function Ct(e,t){if(t==="id")return o(e.id);if(t==="actions")return`<button class="btn tiny" data-action="open-incident" data-id="${o(e.id)}">Abrir</button>`;if(t==="created_at"||t==="due_at")return o(D(e[t]));if(t==="priority")return P(e.priority);if(t==="status")return P(e.status);if(t==="sla"){const a=k(e);return P(a.label,a.cls)}return o(t==="subject"?z(e.subject,90):t==="description"?z(e.description,130):e[t]||"")}function Et(){const e=re();return`
    ${I("Kanban","Seguimiento por estatus con cambio rápido.")}
    ${be()}
    <div class="kanban">
      ${j.map(t=>{const a=e.filter(s=>s.status===t);return`
          <section class="kanban-col">
            <div class="kanban-head"><span>${o(t)}</span><b>${a.length}</b></div>
            ${a.map(s=>`
              <article class="kanban-card">
                <button class="row-button" data-action="open-incident" data-id="${o(s.id)}">${o(s.id)}</button>
                <span class="muted">${o(s.hotel||"")} · ${o(s.department||"")}</span>
                <span>${P(s.priority)} ${P(k(s).label,k(s).cls)}</span>
                <strong>${o(z(s.subject||s.description,95))}</strong>
                <select data-status-change="${o(s.id)}" ${!E(s,"status")&&!E(s,"reopen")?"disabled":""}>
                  ${ae(pt(s),s.status)}
                </select>
              </article>
            `).join("")||'<div class="empty">Sin incidencias.</div>'}
          </section>
        `}).join("")}
    </div>
  `}function Dt(){return`
    ${I("Bitácora","Historial completo de cambios y comentarios.")}
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Incidencia</th><th>Acción</th><th>Campo</th><th>Anterior</th><th>Nuevo</th><th>Comentario</th></tr></thead>
          <tbody>
            ${l.audit.map(e=>`
              <tr>
                <td>${o(D(e.occurred_at,!0))}</td>
                <td>${o(Nt(e))}</td>
                <td>${o(e.incident_id||"")}</td>
                <td>${o(e.action||"")}</td>
                <td>${o(e.changed_field||"")}</td>
                <td>${o(e.old_value||"")}</td>
                <td>${o(e.new_value||"")}</td>
                <td>${o(e.comment||"")}</td>
              </tr>
            `).join("")||'<tr><td colspan="8" class="empty">Sin movimientos.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function Ot(){if(!Ie())return`
      ${I("Usuarios","Administración de accesos.")}
      <div class="error">No tienes permisos para administrar usuarios.</div>
    `;const e=Tt();return`
    ${I("Usuarios","Administración de accesos, roles y estados.",'<button class="btn primary" data-action="new-user">Nuevo usuario</button>')}
    ${jt()}
    <div class="toolbar">
      <strong>${e.length} usuario(s)</strong>
      <span class="muted">Los cambios quedan registrados en bitácora.</span>
    </div>
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr><th>Usuario</th><th>Password</th><th>Nombre</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th>Intentos fallidos</th><th>Bloqueado</th><th>Debe cambiar password</th><th>Acciones</th></tr></thead>
          <tbody>
            ${e.map(t=>`
              <tr>
                <td>${o(t.username||"")}</td>
                <td>${o(t.password_mask||ke)}</td>
                <td>${o(t.display_name||"")}</td>
                <td>${P(t.role||"Auditor")}</td>
                <td>${P(t.status||"Activo")}</td>
                <td>${o(D(t.last_access_at,!0))}</td>
                <td>${o(t.failed_attempts??0)}</td>
                <td>${P(G(!!t.blocked))}</td>
                <td>${P(G(!!t.must_change_password))}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn tiny" data-action="edit-user" data-id="${o(t.id)}">Editar</button>
                    <button class="btn tiny" data-action="toggle-user" data-id="${o(t.id)}">${t.status==="Activo"?"Desactivar":"Activar"}</button>
                    <button class="btn tiny" data-action="toggle-blocked" data-id="${o(t.id)}">${t.blocked?"Desbloquear":"Bloquear"}</button>
                    <button class="btn tiny" data-action="password-user" data-id="${o(t.id)}">Contraseña</button>
                    <button class="btn tiny" data-action="audit-user" data-id="${o(t.id)}">Bitácora</button>
                  </div>
                </td>
              </tr>
            `).join("")||'<tr><td colspan="10" class="empty">No hay usuarios con los filtros seleccionados.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function Tt(){const e=l.userFilters;return l.profiles.filter(t=>{const a=`${t.username||""} ${t.display_name||""}`.toLowerCase();return(!e.search||a.includes(e.search.toLowerCase()))&&(!e.role||t.role===e.role)&&(!e.status||t.status===e.status)})}function jt(){const e=l.userFilters,t=(a,s,r)=>`
    <div class="field">
      <label>${s}</label>
      <select data-user-filter="${a}">
        <option value="">Todos</option>
        ${ae(r,e[a])}
      </select>
    </div>
  `;return`
    <div class="filters user-filters">
      <div class="field"><label>Buscar</label><input data-user-filter="search" value="${o(e.search)}" placeholder="Usuario o nombre"></div>
      ${t("role","Rol",ue)}
      ${t("status","Estado",pe)}
    </div>
  `}function kt(){return`
    ${I("Catálogos","Valores usados por formularios y filtros.",'<button class="btn primary" data-action="new-catalog">Nuevo valor</button>')}
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr><th>Categoría</th><th>Valor</th></tr></thead>
          <tbody>
            ${l.catalogs.map(e=>`<tr><td>${o(mt(e.category))}</td><td>${o(e.value)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function Nt(e){return l.profiles.find(t=>t.id===e.user_id)?.display_name||e.legacy_user||""}function xt(){document.querySelectorAll("[data-filter]").forEach(e=>{e.addEventListener("input",()=>{l.filters[e.dataset.filter]=e.value,ce()})}),document.querySelectorAll("[data-user-filter]").forEach(e=>{e.addEventListener("input",()=>{l.userFilters[e.dataset.userFilter]=e.value,ce()})}),document.querySelectorAll("[data-status-change]").forEach(e=>{e.addEventListener("change",async()=>{const t=l.incidents.find(s=>s.id===e.dataset.statusChange),a=e.value;if(!(!t||a===t.status)){if(w.includes(a)&&!w.includes(t.status)){ze(t);return}if(w.includes(t.status)&&!w.includes(a)){Ve(t);return}await ne(t,{status:a},"Cambio de estatus",`Estatus cambiado a ${a}.`)}})}),document.querySelectorAll("[data-action]").forEach(e=>{e.addEventListener("click",()=>{He(e.dataset.action,e.dataset.id).catch(t=>{console.error(t),v("No fue posible completar la acción.")})})})}async function He(e,t){const a=l.incidents.find(r=>r.id===t),s=l.profiles.find(r=>r.id===t);e==="new-incident"&&Ee(),e==="edit"&&Ee(a),(e==="open-incident"||e==="detail")&&zt(a),e==="comment"&&Vt(a),e==="close"&&ze(a),e==="reopen"&&Ve(a),e==="export-csv"&&Kt(re()),e==="new-catalog"&&Gt(),e==="new-user"&&De(),e==="edit-user"&&De(s),e==="toggle-user"&&await Mt(s),e==="toggle-blocked"&&await qt(s),e==="password-user"&&Ft(s),e==="audit-user"&&Bt(s)}function O(e,t,a=""){const s=document.querySelector("#modal");return s.innerHTML=`
    <div class="modal-body">
      <div class="modal-head"><h3>${o(e)}</h3><button class="btn ghost" data-modal-close>Cerrar</button></div>
      ${t}
      ${a}
    </div>
  `,s.showModal(),s.querySelector("[data-modal-close]").addEventListener("click",()=>s.close()),s}function Ee(e=null){const t=!!e,a=`
    <form id="incidentForm" class="form-grid">
      ${f("hotel","División",e?.hotel,"select",x("División"))}
      ${f("department","Departamento",e?.department,"select",x("Departamento"))}
      ${f("responsible_area","Área responsable",e?.responsible_area,"select",x("Área Responsable"))}
      ${f("incident_type","Tipo de incidencia",e?.incident_type,"select",x("Tipo de Incidencia"))}
      ${f("impact","Impacto",e?.impact,"select",x("Impacto"))}
      ${f("priority","Prioridad",e?.priority||"Media","select",te)}
      ${f("status","Estatus",e?.status||"Pendiente","select",j)}
      ${f("responsible","Responsable",e?.responsible)}
      ${f("due_at","Fecha compromiso",e?.due_at||he(e?.priority||"Media"),"date")}
      ${f("subject","Asunto",e?.subject,"text",[],"form-full")}
      ${f("description","Descripción",e?.description,"textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">${t?"Guardar cambios":"Crear incidencia"}</button>
    </form>
  `,s=O(t?`Editar ${e.id}`:"Nueva incidencia",a);s.querySelector("#incidentForm").addEventListener("submit",async r=>{r.preventDefault();const n=M(r.currentTarget);if(!n.hotel||!n.department||!n.incident_type||!n.priority||!n.subject||!n.description){v("Completa división, departamento, tipo, prioridad, asunto y descripción.");return}t?await ne(e,n,"Actualización de incidencia","Incidencia actualizada."):await Ht(n),s.close()})}function f(e,t,a="",s="text",r=[],n=""){return s==="select"?`<div class="field ${n}"><label>${o(t)}</label><select name="${e}">${ae(r,a)}</select></div>`:s==="textarea"?`<div class="field ${n}"><label>${o(t)}</label><textarea name="${e}">${o(a||"")}</textarea></div>`:`<div class="field ${n}"><label>${o(t)}</label><input name="${e}" type="${s}" value="${o(a||"")}"></div>`}function M(e){return Object.fromEntries([...new FormData(e).entries()].map(([t,a])=>[t,S(a)]))}function Rt(e,t,a,s=!1){return l.profiles.filter(r=>{const n=r.id===e?t:r.role,i=r.id===e?a:r.status,c=r.id===e?s:!!r.blocked;return n==="Administrador"&&i==="Activo"&&!c}).length}function ve(e,t=null){if(!e.username||!e.display_name||!e.role||!e.status)return"Usuario, nombre, rol y estado son obligatorios.";if(!t&&S(e.password).length<8)return"La contraseña inicial debe tener al menos 8 caracteres.";if(!ue.includes(e.role))return"Selecciona un rol válido.";if(!pe.includes(e.status))return"Selecciona un estado válido.";if(l.profiles.find(r=>r.id!==t?.id&&le(r.username)===le(e.username)))return"Ya existe un usuario con ese nombre de usuario.";const s=Q(e.blocked);if(t?.id===l.profile?.id&&t.role==="Administrador"){if(e.status!=="Activo")return"No puedes desactivar tu propio usuario administrador.";if(e.role!=="Administrador")return"No puedes quitarte el rol Administrador desde tu propia sesión.";if(s)return"No puedes bloquear tu propio usuario administrador."}return t&&Rt(t.id,e.role,e.status,s)<1?"Debe quedar al menos un administrador activo.":""}function De(e=null){const t=!!e,a=`
    <form id="userForm" class="form-grid">
      ${t?"":`
        <div class="field form-full">
          <label>Contraseña inicial</label>
          <input name="password" type="password" required autocomplete="new-password">
        </div>
      `}
      ${f("username","Usuario",e?.username||"")}
      ${f("display_name","Nombre",e?.display_name||"")}
      ${f("role","Rol",e?.role||"Auditor","select",ue)}
      ${f("status","Estado",e?.status||"Activo","select",pe)}
      ${f("blocked","Bloqueado",G(!!e?.blocked),"select",oe)}
      ${f("must_change_password","Debe cambiar password",G(e?!!e.must_change_password:!0),"select",oe)}
      <button class="btn primary form-full" type="submit">${t?"Guardar cambios":"Crear usuario"}</button>
    </form>
  `,s=O(t?`Editar ${e.username||"usuario"}`:"Nuevo usuario",a);s.querySelector("#userForm").addEventListener("submit",async r=>{r.preventDefault();const n=M(r.currentTarget),i=ve(n,e);if(i){v(i);return}try{await It(n,e),s.close()}catch(c){console.error(c),v(ft(c))}})}async function It(e,t=null){const a={username:e.username,display_name:e.display_name,role:e.role,status:e.status,blocked:Q(e.blocked),must_change_password:Q(e.must_change_password)};t||(a.password=e.password);const s=await A(await g.rpc("app_save_user",{p_token:C(),p_user_id:t?.id||null,p_user:a}),t?"No se pudo actualizar el usuario.":"No se pudo crear el usuario.");if(!s?.ok)throw new Error(s?.reason||"No se pudo guardar el usuario.");v(t?"Usuario actualizado.":"Usuario creado."),await N()}async function Mt(e){if(!e)return;const t=e.status==="Activo"?"Inactivo":"Activo",a=ve({...e,status:t},e);if(a){v(a);return}try{const s=await A(await g.rpc("app_toggle_user_status",{p_token:C(),p_user_id:e.id}),"No se pudo cambiar el estado.");if(!s?.ok)throw new Error(s?.reason||"No se pudo cambiar el estado.");v(`Usuario ${t.toLowerCase()}.`),await N()}catch(s){console.error(s),v("No fue posible cambiar el estado del usuario.")}}async function qt(e){if(!e)return;const t=!e.blocked,a=ve({...e,blocked:G(t)},e);if(a){v(a);return}try{const s=await A(await g.rpc("app_toggle_user_blocked",{p_token:C(),p_user_id:e.id}),"No se pudo cambiar el bloqueo.");if(!s?.ok)throw new Error(s?.reason||"No se pudo cambiar el bloqueo.");v(t?"Usuario bloqueado.":"Usuario desbloqueado."),await N()}catch(s){console.error(s),v("No fue posible cambiar el bloqueo del usuario.")}}function Ft(e){if(!e)return;O(`Contraseña de ${e.username||"usuario"}`,`
    <form id="resetPasswordForm" class="form-grid" autocomplete="off">
      <div class="field form-full">
        <label>Nueva contraseña temporal</label>
        <input name="password" type="password" required autocomplete="new-password">
      </div>
      ${f("must_change_password","Debe cambiar password","Sí","select",oe,"form-full")}
      <button class="btn primary form-full" type="submit">Restablecer contraseña</button>
    </form>
  `).querySelector("#resetPasswordForm").addEventListener("submit",a=>{a.preventDefault();const s=M(a.currentTarget);Ut(e,s.password,Q(s.must_change_password)).catch(r=>{console.error(r),v("No fue posible registrar el restablecimiento.")})})}async function Ut(e,t="",a=!0){if(!e)return;if(S(t).length<8){v("La contraseña temporal debe tener al menos 8 caracteres.");return}const s=await A(await g.rpc("app_admin_reset_password",{p_token:C(),p_user_id:e.id,p_new_password:t,p_must_change_password:a}),"No se pudo restablecer la contraseña.");if(!s?.ok)throw new Error(s?.reason||"No se pudo restablecer la contraseña.");document.querySelector("#modal")?.close(),v("Contraseña restablecida."),await N()}function Bt(e){if(!e)return;const t=l.audit.filter(a=>S(a.changed_field).includes(`Usuario: ${e.username}`));O(`Bitácora de ${e.username||"usuario"}`,`
    <div class="timeline">
      ${t.map(a=>`
        <div class="timeline-item">
          <b>${o(a.action)}</b> · <span class="muted">${o(D(a.occurred_at,!0))}</span>
          <p>${o(a.comment||"")}</p>
          <p class="muted">${o(z(a.old_value,140))} → ${o(z(a.new_value,140))}</p>
        </div>
      `).join("")||'<div class="empty">Sin movimientos registrados para este usuario.</div>'}
    </div>
  `)}async function Ht(e){const t=e.due_at||he(e.priority),a={id:ut(),...e,due_at:t,actual_due_at:t,created_by:l.profile?.id,updated_by:l.profile?.id,created_at:H(),updated_at:H()};await A(await g.from("incidents").insert(a),"No se pudo crear la incidencia."),await ge(a.id,"Creación","Incidencia","","Creada","Incidencia creada.",a),v("Incidencia creada."),await N()}async function ne(e,t,a,s){if(!e)return;const r={...t,updated_by:l.profile?.id,updated_at:H()};r.status&&w.includes(r.status)&&!e.closed_at&&(r.closed_at=H()),r.status&&!w.includes(r.status)&&(r.closed_at=null),await A(await g.from("incidents").update(r).eq("id",e.id),"No se pudo actualizar.");for(const[n,i]of Object.entries(t))String(e[n]??"")!==String(i??"")&&await ge(e.id,a,n,e[n],i,s,{...e,...r});v("Cambios guardados."),await N()}async function ge(e,t,a,s,r,n,i){await g.from("audit_log").insert({incident_id:e,user_id:l.profile?.id,legacy_user:l.profile?.display_name||l.profile?.username||"Usuario",action:t,changed_field:a,old_value:s??"",new_value:r??"",comment:n,hotel:i?.hotel||"",status:i?.status||""})}function zt(e){if(!e)return;const t=O(e.subject||`Detalle ${e.id}`,`
    <div class="selected-card">
      <div>${P(e.priority)} ${P(e.status)} ${P(k(e).label,k(e).cls)}</div>
      <p><b>ID:</b> ${o(e.id||"")}</p>
      <p><b>División:</b> ${o(e.hotel||"")}</p>
      <p><b>Departamento:</b> ${o(e.department||"")}</p>
      <p><b>Tipo:</b> ${o(e.incident_type||"")}</p>
      <p><b>Área responsable:</b> ${o(e.responsible_area||"")}</p>
      <p><b>Responsable:</b> ${o(e.responsible||"Sin asignar")}</p>
      <p><b>Asunto:</b> ${o(e.subject||"")}</p>
      <p><b>Descripción:</b><br>${o(e.description||"")}</p>
      <p><b>Fecha compromiso:</b> ${o(D(e.due_at))}</p>
      <p><b>Causa raíz:</b> ${o(e.root_cause||"")}</p>
      <p><b>Acción tomada:</b> ${o(e.action_taken||"")}</p>
      <p><b>Comentario final:</b> ${o(e.final_comment||"")}</p>
    </div>
    <div class="actions">
      <button class="btn" data-detail-action="comment" ${E(e,"comment")?"":"disabled"}>Comentar</button>
      <button class="btn" data-detail-action="edit" ${E(e,"edit")?"":"disabled"}>Editar</button>
      ${w.includes(e.status)?`<button class="btn primary" data-detail-action="reopen" ${E(e,"reopen")?"":"disabled"}>Reabrir</button>`:`<button class="btn primary" data-detail-action="close" ${E(e,"close")?"":"disabled"}>Cerrar</button>`}
    </div>
    <h3>Bitácora</h3>
    <div class="timeline">
      ${l.audit.filter(a=>a.incident_id===e.id).map(a=>`
        <div class="timeline-item">
          <b>${o(a.action)}</b> · <span class="muted">${o(D(a.occurred_at,!0))}</span>
          <p>${o(a.changed_field||"General")}: ${o(a.old_value||"")} → ${o(a.new_value||"")}</p>
          <p>${o(a.comment||"")}</p>
        </div>
      `).join("")||'<div class="empty">Sin movimientos.</div>'}
    </div>
  `);t.querySelectorAll("[data-detail-action]").forEach(a=>{a.addEventListener("click",()=>{t.close(),He(a.dataset.detailAction,e.id).catch(s=>{console.error(s),v("No fue posible completar la acción.")})})})}function Vt(e){const t=O(`Comentar ${e.id}`,`
    <form id="commentForm" class="form-grid">
      ${f("comment","Comentario","","textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">Guardar comentario</button>
    </form>
  `);t.querySelector("#commentForm").addEventListener("submit",async a=>{a.preventDefault();const s=M(a.currentTarget);await ge(e.id,"Comentario","Comentario","",s.comment,s.comment,e),v("Comentario guardado."),t.close(),await N()})}function ze(e){const t=O(`Cerrar ${e.id}`,`
    <form id="closeForm" class="form-grid">
      ${f("root_cause","Causa raíz",e.root_cause,"select",x("Causa raíz"))}
      ${f("action_taken","Acción tomada",e.action_taken,"select",x("Acción tomada"))}
      ${f("close_reason","Motivo de cierre",e.close_reason)}
      ${f("final_comment","Comentario final",e.final_comment,"textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">Cerrar incidencia</button>
    </form>
  `);t.querySelector("#closeForm").addEventListener("submit",async a=>{a.preventDefault();const s=M(a.currentTarget);if(!s.root_cause||!s.action_taken||!s.final_comment){v("Causa raíz, acción tomada y comentario final son obligatorios.");return}await ne(e,{...s,status:"Cerrado",closed_at:H()},"Cierre formal",s.final_comment),t.close()})}function Ve(e){const t=O(`Reabrir ${e.id}`,`
    <form id="reopenForm" class="form-grid">
      ${f("status","Nuevo estatus","En proceso","select",j.filter(a=>!w.includes(a)))}
      ${f("comment","Motivo de reapertura","","textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">Reabrir incidencia</button>
    </form>
  `);t.querySelector("#reopenForm").addEventListener("submit",async a=>{a.preventDefault();const s=M(a.currentTarget);if(!s.comment){v("El motivo es obligatorio.");return}await ne(e,{status:s.status,closed_at:null},"Reapertura",s.comment),t.close()})}function Gt(){const e=O("Nuevo valor de catálogo",`
    <form id="catalogForm" class="form-grid">
      ${f("category","Categoría","","select",Object.keys(Ne))}
      ${f("value","Valor","")}
      <button class="btn primary form-full" type="submit">Guardar</button>
    </form>
  `);e.querySelector("#catalogForm").addEventListener("submit",async t=>{t.preventDefault();const a=M(t.currentTarget);await A(await g.from("catalogs").insert(a),"No se pudo guardar el catálogo."),v("Catálogo guardado."),e.close(),await N()})}function Kt(e){const a=[["ID","Fecha","División","Departamento","Asunto","Tipo","Prioridad","Estatus","Responsable","SLA","Descripción"].join(","),...e.map(i=>[i.id,D(i.created_at),i.hotel,i.department,i.subject,i.incident_type,i.priority,i.status,i.responsible,k(i).label,i.description].map(c=>`"${String(c??"").replaceAll('"','""')}"`).join(","))],s=new Blob([a.join(`
`)],{type:"text/csv;charset=utf-8"}),r=URL.createObjectURL(s),n=document.createElement("a");n.href=r,n.download="incidencias_filtradas.csv",n.click(),URL.revokeObjectURL(r)}async function N(){await se(),Y()}bt().catch(e=>{console.error(e),K.innerHTML=`<main class="config-shell"><section class="config-card"><div class="error">${o(e.message)}</div></section></main>`});
