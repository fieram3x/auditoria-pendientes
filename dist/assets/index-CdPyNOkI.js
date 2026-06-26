(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))a(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const n of r.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&a(n)}).observe(document,{childList:!0,subtree:!0});function s(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(i){if(i.ep)return;i.ep=!0;const r=s(i);fetch(i.href,r)}})();const Le=3,me=e=>Math.min(1e3*2**e,3e4),xe=[520,503],Ee=["GET","HEAD","OPTIONS"];var fe=class extends Error{constructor(e){super(e.message),this.name="PostgrestError",this.details=e.details,this.hint=e.hint,this.code=e.code}toJSON(){return{name:this.name,message:this.message,details:this.details,hint:this.hint,code:this.code}}};function be(e,t){return new Promise(s=>{if(t?.aborted){s();return}const a=setTimeout(()=>{t?.removeEventListener("abort",i),s()},e);function i(){clearTimeout(a),s()}t?.addEventListener("abort",i)})}function Fe(e,t,s,a){return!(!a||s>=Le||!Ee.includes(e)||!xe.includes(t))}var Ue=class{constructor(e){var t,s,a,i,r;this.shouldThrowOnError=!1,this.retryEnabled=!0,this.method=e.method,this.url=e.url,this.headers=new Headers(e.headers),this.schema=e.schema,this.body=e.body,this.shouldThrowOnError=(t=e.shouldThrowOnError)!==null&&t!==void 0?t:!1,this.signal=e.signal,this.isMaybeSingle=(s=e.isMaybeSingle)!==null&&s!==void 0?s:!1,this.shouldStripNulls=(a=e.shouldStripNulls)!==null&&a!==void 0?a:!1,this.urlLengthLimit=(i=e.urlLengthLimit)!==null&&i!==void 0?i:8e3,this.retryEnabled=(r=e.retry)!==null&&r!==void 0?r:!0,e.fetch?this.fetch=e.fetch:this.fetch=fetch}throwOnError(){return this.shouldThrowOnError=!0,this}stripNulls(){if(this.headers.get("Accept")==="text/csv")throw new Error("stripNulls() cannot be used with csv()");return this.shouldStripNulls=!0,this}setHeader(e,t){return this.headers=new Headers(this.headers),this.headers.set(e,t),this}retry(e){return this.retryEnabled=e,this}then(e,t){var s=this;if(this.schema===void 0||(["GET","HEAD"].includes(this.method)?this.headers.set("Accept-Profile",this.schema):this.headers.set("Content-Profile",this.schema)),this.method!=="GET"&&this.method!=="HEAD"&&this.headers.set("Content-Type","application/json"),this.shouldStripNulls){const n=this.headers.get("Accept");n==="application/vnd.pgrst.object+json"?this.headers.set("Accept","application/vnd.pgrst.object+json;nulls=stripped"):(!n||n==="application/json")&&this.headers.set("Accept","application/vnd.pgrst.array+json;nulls=stripped")}const a=this.fetch;let r=(async()=>{let n=0;for(;;){const u={};s.headers.forEach((c,m)=>{u[m]=c}),n>0&&(u["X-Retry-Count"]=String(n));let h;try{h=await a(s.url.toString(),{method:s.method,headers:u,body:JSON.stringify(s.body,(c,m)=>typeof m=="bigint"?m.toString():m),signal:s.signal})}catch(c){if(c?.name==="AbortError"||c?.code==="ABORT_ERR"||!Ee.includes(s.method))throw c;if(s.retryEnabled&&n<Le){const m=me(n);n++,await be(m,s.signal);continue}throw c}if(Fe(s.method,h.status,n,s.retryEnabled)){var d,p;const c=(d=(p=h.headers)===null||p===void 0?void 0:p.get("Retry-After"))!==null&&d!==void 0?d:null,m=c!==null?Math.max(0,parseInt(c,10)||0)*1e3:me(n);await h.text(),n++,await be(m,s.signal);continue}return await s.processResponse(h)}})();return this.shouldThrowOnError||(r=r.catch(n=>{var d;let p="",u="",h="";const c=n?.cause;if(c){var m,v,y,Z;const qe=(m=c?.message)!==null&&m!==void 0?m:"",he=(v=c?.code)!==null&&v!==void 0?v:"";p=`${(y=n?.name)!==null&&y!==void 0?y:"FetchError"}: ${n?.message}`,p+=`

Caused by: ${(Z=c?.name)!==null&&Z!==void 0?Z:"Error"}: ${qe}`,he&&(p+=` (${he})`),c?.stack&&(p+=`
${c.stack}`)}else{var Q;p=(Q=n?.stack)!==null&&Q!==void 0?Q:""}const U=this.url.toString().length;return n?.name==="AbortError"||n?.code==="ABORT_ERR"?(h="",u="Request was aborted (timeout or manual cancellation)",U>this.urlLengthLimit&&(u+=`. Note: Your request URL is ${U} characters, which may exceed server limits. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [many IDs])), consider using an RPC function to pass values server-side.`)):(c?.name==="HeadersOverflowError"||c?.code==="UND_ERR_HEADERS_OVERFLOW")&&(h="",u="HTTP headers exceeded server limits (typically 16KB)",U>this.urlLengthLimit&&(u+=`. Your request URL is ${U} characters. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [200+ IDs])), consider using an RPC function instead.`)),{success:!1,error:{message:`${(d=n?.name)!==null&&d!==void 0?d:"FetchError"}: ${n?.message}`,details:p,hint:u,code:h},data:null,count:null,status:0,statusText:""}})),r.then(e,t)}async processResponse(e){var t=this;let s=null,a=null,i=null,r=e.status,n=e.statusText;if(e.ok){var d,p;if(t.method!=="HEAD"){var u;const m=await e.text();if(m!=="")if(t.headers.get("Accept")==="text/csv")a=m;else if(t.headers.get("Accept")&&(!((u=t.headers.get("Accept"))===null||u===void 0)&&u.includes("application/vnd.pgrst.plan+text")))a=m;else try{a=JSON.parse(m)}catch{if(s={message:m},a=null,t.shouldThrowOnError)throw new fe({message:m,details:"",hint:"",code:""})}}const h=(d=t.headers.get("Prefer"))===null||d===void 0?void 0:d.match(/count=(exact|planned|estimated)/),c=(p=e.headers.get("content-range"))===null||p===void 0?void 0:p.split("/");h&&c&&c.length>1&&(i=parseInt(c[1])),t.isMaybeSingle&&Array.isArray(a)&&(a.length>1?(s={code:"PGRST116",details:`Results contain ${a.length} rows, application/vnd.pgrst.object+json requires 1 row`,hint:null,message:"JSON object requested, multiple (or no) rows returned"},a=null,i=null,r=406,n="Not Acceptable"):a.length===1?a=a[0]:a=null)}else{const h=await e.text();try{s=JSON.parse(h),Array.isArray(s)&&e.status===404&&(a=[],s=null,r=200,n="OK")}catch{e.status===404&&h===""?(r=204,n="No Content"):s={message:h}}if(s&&t.shouldThrowOnError)throw new fe(s)}return{success:s===null,error:s,data:a,count:i,status:r,statusText:n}}returns(){return this}overrideTypes(){return this}},Be=class extends Ue{throwOnError(){return super.throwOnError()}select(e){let t=!1;const s=(e??"*").split("").map(a=>/\s/.test(a)&&!t?"":(a==='"'&&(t=!t),a)).join("");return this.url.searchParams.set("select",s),this.headers.append("Prefer","return=representation"),this}order(e,{ascending:t=!0,nullsFirst:s,foreignTable:a,referencedTable:i=a}={}){const r=i?`${i}.order`:"order",n=this.url.searchParams.get(r);return this.url.searchParams.set(r,`${n?`${n},`:""}${e}.${t?"asc":"desc"}${s===void 0?"":s?".nullsfirst":".nullslast"}`),this}limit(e,{foreignTable:t,referencedTable:s=t}={}){const a=typeof s>"u"?"limit":`${s}.limit`;return this.url.searchParams.set(a,`${e}`),this}range(e,t,{foreignTable:s,referencedTable:a=s}={}){const i=typeof a>"u"?"offset":`${a}.offset`,r=typeof a>"u"?"limit":`${a}.limit`;return this.url.searchParams.set(i,`${e}`),this.url.searchParams.set(r,`${t-e+1}`),this}abortSignal(e){return this.signal=e,this}single(){return this.headers.set("Accept","application/vnd.pgrst.object+json"),this}maybeSingle(){return this.isMaybeSingle=!0,this}csv(){return this.headers.set("Accept","text/csv"),this}geojson(){return this.headers.set("Accept","application/geo+json"),this}explain({analyze:e=!1,verbose:t=!1,settings:s=!1,buffers:a=!1,wal:i=!1,format:r="text"}={}){var n;const d=[e?"analyze":null,t?"verbose":null,s?"settings":null,a?"buffers":null,i?"wal":null].filter(Boolean).join("|"),p=(n=this.headers.get("Accept"))!==null&&n!==void 0?n:"application/json";return this.headers.set("Accept",`application/vnd.pgrst.plan+${r}; for="${p}"; options=${d};`),r==="json"?this:this}rollback(){return this.headers.append("Prefer","tx=rollback"),this}returns(){return this}maxAffected(e){return this.headers.append("Prefer","handling=strict"),this.headers.append("Prefer",`max-affected=${e}`),this}};const ve=new RegExp("[,()]");var j=class extends Be{throwOnError(){return super.throwOnError()}eq(e,t){return this.url.searchParams.append(e,`eq.${t}`),this}neq(e,t){return this.url.searchParams.append(e,`neq.${t}`),this}gt(e,t){return this.url.searchParams.append(e,`gt.${t}`),this}gte(e,t){return this.url.searchParams.append(e,`gte.${t}`),this}lt(e,t){return this.url.searchParams.append(e,`lt.${t}`),this}lte(e,t){return this.url.searchParams.append(e,`lte.${t}`),this}like(e,t){return this.url.searchParams.append(e,`like.${t}`),this}likeAllOf(e,t){return this.url.searchParams.append(e,`like(all).{${t.join(",")}}`),this}likeAnyOf(e,t){return this.url.searchParams.append(e,`like(any).{${t.join(",")}}`),this}ilike(e,t){return this.url.searchParams.append(e,`ilike.${t}`),this}ilikeAllOf(e,t){return this.url.searchParams.append(e,`ilike(all).{${t.join(",")}}`),this}ilikeAnyOf(e,t){return this.url.searchParams.append(e,`ilike(any).{${t.join(",")}}`),this}regexMatch(e,t){return this.url.searchParams.append(e,`match.${t}`),this}regexIMatch(e,t){return this.url.searchParams.append(e,`imatch.${t}`),this}is(e,t){return this.url.searchParams.append(e,`is.${t}`),this}isDistinct(e,t){return this.url.searchParams.append(e,`isdistinct.${t}`),this}in(e,t){const s=Array.from(new Set(t)).map(a=>typeof a=="string"&&ve.test(a)?`"${a}"`:`${a}`).join(",");return this.url.searchParams.append(e,`in.(${s})`),this}notIn(e,t){const s=Array.from(new Set(t)).map(a=>typeof a=="string"&&ve.test(a)?`"${a}"`:`${a}`).join(",");return this.url.searchParams.append(e,`not.in.(${s})`),this}contains(e,t){return typeof t=="string"?this.url.searchParams.append(e,`cs.${t}`):Array.isArray(t)?this.url.searchParams.append(e,`cs.{${t.join(",")}}`):this.url.searchParams.append(e,`cs.${JSON.stringify(t)}`),this}containedBy(e,t){return typeof t=="string"?this.url.searchParams.append(e,`cd.${t}`):Array.isArray(t)?this.url.searchParams.append(e,`cd.{${t.join(",")}}`):this.url.searchParams.append(e,`cd.${JSON.stringify(t)}`),this}rangeGt(e,t){return this.url.searchParams.append(e,`sr.${t}`),this}rangeGte(e,t){return this.url.searchParams.append(e,`nxl.${t}`),this}rangeLt(e,t){return this.url.searchParams.append(e,`sl.${t}`),this}rangeLte(e,t){return this.url.searchParams.append(e,`nxr.${t}`),this}rangeAdjacent(e,t){return this.url.searchParams.append(e,`adj.${t}`),this}overlaps(e,t){return typeof t=="string"?this.url.searchParams.append(e,`ov.${t}`):this.url.searchParams.append(e,`ov.{${t.join(",")}}`),this}textSearch(e,t,{config:s,type:a}={}){let i="";a==="plain"?i="pl":a==="phrase"?i="ph":a==="websearch"&&(i="w");const r=s===void 0?"":`(${s})`;return this.url.searchParams.append(e,`${i}fts${r}.${t}`),this}match(e){return Object.entries(e).filter(([t,s])=>s!==void 0).forEach(([t,s])=>{this.url.searchParams.append(t,`eq.${s}`)}),this}not(e,t,s){return this.url.searchParams.append(e,`not.${t}.${s}`),this}or(e,{foreignTable:t,referencedTable:s=t}={}){const a=s?`${s}.or`:"or";return this.url.searchParams.append(a,`(${e})`),this}filter(e,t,s){return this.url.searchParams.append(e,`${t}.${s}`),this}},He=class{constructor(e,{headers:t={},schema:s,fetch:a,urlLengthLimit:i=8e3,retry:r}){this.url=e,this.headers=new Headers(t),this.schema=s,this.fetch=a,this.urlLengthLimit=i,this.retry=r}cloneRequestState(){return{url:new URL(this.url.toString()),headers:new Headers(this.headers)}}select(e,t){const{head:s=!1,count:a}=t??{},i=s?"HEAD":"GET";let r=!1;const n=(e??"*").split("").map(u=>/\s/.test(u)&&!r?"":(u==='"'&&(r=!r),u)).join(""),{url:d,headers:p}=this.cloneRequestState();return d.searchParams.set("select",n),a&&p.append("Prefer",`count=${a}`),new j({method:i,url:d,headers:p,schema:this.schema,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}insert(e,{count:t,defaultToNull:s=!0}={}){var a;const i="POST",{url:r,headers:n}=this.cloneRequestState();if(t&&n.append("Prefer",`count=${t}`),s||n.append("Prefer","missing=default"),Array.isArray(e)){const d=e.reduce((p,u)=>p.concat(Object.keys(u)),[]);if(d.length>0){const p=[...new Set(d)].map(u=>`"${u}"`);r.searchParams.set("columns",p.join(","))}}return new j({method:i,url:r,headers:n,schema:this.schema,body:e,fetch:(a=this.fetch)!==null&&a!==void 0?a:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}upsert(e,{onConflict:t,ignoreDuplicates:s=!1,count:a,defaultToNull:i=!0}={}){var r;const n="POST",{url:d,headers:p}=this.cloneRequestState();if(p.append("Prefer",`resolution=${s?"ignore":"merge"}-duplicates`),t!==void 0&&d.searchParams.set("on_conflict",t),a&&p.append("Prefer",`count=${a}`),i||p.append("Prefer","missing=default"),Array.isArray(e)){const u=e.reduce((h,c)=>h.concat(Object.keys(c)),[]);if(u.length>0){const h=[...new Set(u)].map(c=>`"${c}"`);d.searchParams.set("columns",h.join(","))}}return new j({method:n,url:d,headers:p,schema:this.schema,body:e,fetch:(r=this.fetch)!==null&&r!==void 0?r:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}update(e,{count:t}={}){var s;const a="PATCH",{url:i,headers:r}=this.cloneRequestState();return t&&r.append("Prefer",`count=${t}`),new j({method:a,url:i,headers:r,schema:this.schema,body:e,fetch:(s=this.fetch)!==null&&s!==void 0?s:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}delete({count:e}={}){var t;const s="DELETE",{url:a,headers:i}=this.cloneRequestState();return e&&i.append("Prefer",`count=${e}`),new j({method:s,url:a,headers:i,schema:this.schema,fetch:(t=this.fetch)!==null&&t!==void 0?t:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};function k(e){"@babel/helpers - typeof";return k=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},k(e)}function Ve(e,t){if(k(e)!="object"||!e)return e;var s=e[Symbol.toPrimitive];if(s!==void 0){var a=s.call(e,t);if(k(a)!="object")return a;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function ze(e){var t=Ve(e,"string");return k(t)=="symbol"?t:t+""}function Ge(e,t,s){return(t=ze(t))in e?Object.defineProperty(e,t,{value:s,enumerable:!0,configurable:!0,writable:!0}):e[t]=s,e}function ge(e,t){var s=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter(function(i){return Object.getOwnPropertyDescriptor(e,i).enumerable})),s.push.apply(s,a)}return s}function B(e){for(var t=1;t<arguments.length;t++){var s=arguments[t]!=null?arguments[t]:{};t%2?ge(Object(s),!0).forEach(function(a){Ge(e,a,s[a])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(s)):ge(Object(s)).forEach(function(a){Object.defineProperty(e,a,Object.getOwnPropertyDescriptor(s,a))})}return e}var Ke=class Ce{constructor(t,{headers:s={},schema:a,fetch:i,timeout:r,urlLengthLimit:n=8e3,retry:d}={}){this.url=t,this.headers=new Headers(s),this.schemaName=a,this.urlLengthLimit=n;const p=i??globalThis.fetch;r!==void 0&&r>0?this.fetch=(u,h)=>{const c=new AbortController,m=setTimeout(()=>c.abort(),r),v=h?.signal;if(v){if(v.aborted)return clearTimeout(m),p(u,h);const y=()=>{clearTimeout(m),c.abort()};return v.addEventListener("abort",y,{once:!0}),p(u,B(B({},h),{},{signal:c.signal})).finally(()=>{clearTimeout(m),v.removeEventListener("abort",y)})}return p(u,B(B({},h),{},{signal:c.signal})).finally(()=>clearTimeout(m))}:this.fetch=p,this.retry=d}from(t){if(!t||typeof t!="string"||t.trim()==="")throw new Error("Invalid relation name: relation must be a non-empty string.");return new He(new URL(`${this.url}/${t}`),{headers:new Headers(this.headers),schema:this.schemaName,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}schema(t){return new Ce(this.url,{headers:this.headers,schema:t,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}rpc(t,s={},{head:a=!1,get:i=!1,count:r}={}){var n;let d;const p=new URL(`${this.url}/rpc/${t}`);let u;const h=v=>v!==null&&typeof v=="object"&&(!Array.isArray(v)||v.some(h)),c=a&&Object.values(s).some(h);c?(d="POST",u=s):a||i?(d=a?"HEAD":"GET",Object.entries(s).filter(([v,y])=>y!==void 0).map(([v,y])=>[v,Array.isArray(y)?`{${y.join(",")}}`:`${y}`]).forEach(([v,y])=>{p.searchParams.append(v,y)})):(d="POST",u=s);const m=new Headers(this.headers);return c?m.set("Prefer",r?`count=${r},return=minimal`:"return=minimal"):r&&m.set("Prefer",`count=${r}`),new j({method:d,url:p,headers:m,schema:this.schemaName,body:u,fetch:(n=this.fetch)!==null&&n!==void 0?n:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};const Ye="https://plqszwbcgsoxfaufudgn.supabase.co",$e="sb_publishable_a34RnPQKgZS_TgHSp0CfBg_5BR3FFJi",D=["Pendiente","En proceso","En espera de respuesta","Escalado","Resuelto","Cerrado"],_=["Resuelto","Cerrado"],se=["Baja","Media","Alta","Crítica"],ae=["Administrador","Supervisor","Auditor","Consulta"],ie=["Activo","Inactivo"],X=["No","Sí"],Je={Crítica:1,Critica:1,Alta:2,Media:3,Baja:5},ye="auditoriaPendientes.session",We="x-app-session-token",Oe="direct-admin-bootstrap",Ze="id, username, display_name, role, status, last_access_at, failed_attempts, blocked, must_change_password, created_at, updated_at",we="********",Te={Hotel:["5910 - PPRL","5911 - ZEL","5917 - MPCB","5918 - MCB","5930 - PGC"],Departamento:["Recepción","Reservas","A&B","Spa","Contabilidad","IT","Club Meliá","Auditoría Nocturna","Auditoría Diurna"],"Área Responsable":["Operaciones","Finanzas","Contabilidad","Revenue","Sistemas","Auditoría"],"Tipo de Incidencia":["Cobro no realizado","Routing incorrecto","Check-in mal procesado","Rate Code incorrecto","Factura no volcada a SAP","Diferencia POS vs PMS","Resort Credit incorrecto","HTC incorrecto","Falta de soporte","Incidencia IT"],Impacto:["Operativo","Financiero","Contable","Cliente","Sistema"],Prioridad:se,Estatus:D,"Causa raíz":["Error operativo","Falta de soporte","Configuración incorrecta","Proceso incompleto","Incidencia de sistema"],"Acción tomada":["Corrección en PMS","Corrección contable","Escalamiento a IT","Capacitación al equipo","Validación documental"]},re=document.querySelector("#app");let g=Re();const K={id:null,username:"admin-directo",display_name:"Administrador Directo",role:"Administrador",status:"Activo",hotel:null,department:null,last_access_at:null,failed_attempts:0,blocked:!1,must_change_password:!1,created_at:null,updated_at:null},l={session:null,profile:null,page:"dashboard",loading:!0,incidents:[],audit:[],profiles:[],catalogs:[],selectedIncidentId:null,filters:{hotel:"",department:"",priority:"",status:"",responsible:"",type:"",search:""},userFilters:{search:"",role:"",status:""}};function Re(e=""){const t={apikey:$e,Authorization:`Bearer ${$e}`};return e&&(t[We]=e),new Ke(`${Ye}/rest/v1`,{headers:t,schema:"public"})}const o=e=>String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"),S=e=>String(e??"").trim(),ee=e=>S(e).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""),Qe=e=>S(e).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"sin-dato",w=(e,t=!1)=>{if(!e)return"";const s=new Date(e);return Number.isNaN(s.getTime())?String(e):new Intl.DateTimeFormat("es-DO",{day:"2-digit",month:"2-digit",year:"numeric",...t?{hour:"2-digit",minute:"2-digit"}:{}}).format(s)},Xe=()=>new Date().toISOString().slice(0,10),M=()=>new Date().toISOString(),$=(e,t="")=>`<span class="badge ${Qe(e)} ${t}">${o(e||"Sin dato")}</span>`,z=(e,t=120)=>S(e).length>t?`${S(e).slice(0,t-3)}...`:S(e),q=()=>l.profile?.role||"Auditor",ne=()=>q()==="Administrador",De=()=>q()==="Supervisor",Ie=()=>ne(),et=()=>ne()||De(),x=e=>e?"Sí":"No",G=e=>["si","sí","true","1","yes"].includes(ee(e)),tt=e=>({...e,password_mask:we});function st(e){if(!e?.token){localStorage.removeItem(ye);return}localStorage.setItem(ye,JSON.stringify({token:e.token,expires_at:e.expires_at}))}function oe(e){l.session=e,g=Re(e?.token||""),st(e)}function O(){return l.session?.token||""}function Ne(){const e=new Date;return e.setFullYear(e.getFullYear()+1),{token:Oe,expires_at:e.toISOString()}}function je(){return O()===Oe}function at(){return`INC-${new Date().toISOString().replace(/[-:TZ.]/g,"").slice(0,14)}-${Math.random().toString(16).slice(2,6).toUpperCase()}`}function le(e,t=new Date){const s=new Date(t),a=Je[e]??3;return s.setDate(s.getDate()+a),s.toISOString().slice(0,10)}function L(e){const t=S(e.status),s=e.actual_due_at||e.due_at||le(e.priority||"Media",e.created_at),a=new Date(`${s}T00:00:00`);if(_.includes(t)){if(!e.closed_at||Number.isNaN(a.getTime()))return{label:"Cerrado",days:null,met:!0,cls:"cerrado"};const d=new Date(e.closed_at)<=new Date(`${s}T23:59:59`);return{label:d?"Cerrado en SLA":"Cerrado fuera SLA",days:null,met:d,cls:d?"cerrado":"vencido"}}const i=new Date(`${Xe()}T00:00:00`),r=Math.ceil((a-i)/864e5);return r<0?{label:`Vencido ${Math.abs(r)}d`,days:r,met:!1,cls:"vencido"}:r===0?{label:"Vence hoy",days:r,met:!0,cls:"media"}:r===1?{label:"Vence en 1d",days:r,met:!0,cls:"media"}:{label:`En tiempo (${r}d)`,days:r,met:!0,cls:"baja"}}function P(e,t="edit"){if(ne())return!0;if(De())return["edit","comment","close","reopen","status"].includes(t);if(q()==="Consulta")return!1;if(t==="create"||t==="comment")return!0;if(!["edit","status"].includes(t)||!e)return!1;const s=l.profile?.id;return e.created_by===s||e.assigned_to===s}function it(e){return _.includes(e.status)?D.filter(t=>_.includes(t)||P(e,"reopen")):D.filter(t=>!_.includes(t)||P(e,"close"))}function R(e){const t=l.catalogs.filter(s=>s.category===e).map(s=>s.value).filter(Boolean);return t.length?[...new Set(t)].sort():Te[e]||[]}function Y(e,t=""){return[...new Set([t,...e].filter(Boolean))].map(a=>`<option value="${o(a)}" ${a===t?"selected":""}>${o(a)}</option>`).join("")}function b(e){const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),2600)}async function A(e,t="No se pudo completar la operación."){if(e.error)throw new Error(e.error.message||t);return e.data}async function rt(){if(!g){nt();return}{oe(Ne()),l.profile={...K},l.page="users",await ce(),F();return}}function nt(){re.innerHTML=`
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
  `}async function ot(){{oe(Ne()),l.profile={...K},l.page="users",await ce(),F();return}}async function lt(){if(je())return l.profile={...K},l.profile;if(!O())throw new Error("Sesión inválida.");const e=await A(await g.rpc("app_validate_session",{p_token:O()}),"No fue posible validar la sesión.");if(!e?.ok)throw new Error("Sesión inválida.");return l.profile=e.profile,oe({token:O(),expires_at:e.expires_at}),l.profile}async function ce(){l.loading=!0,je()?l.profile={...K}:await lt();const[e,t,s,a]=await Promise.all([g.from("incidents").select("*").order("created_at",{ascending:!1}),g.from("audit_log").select("*").order("occurred_at",{ascending:!1}).limit(500),g.from("app_users").select(Ze).order("display_name"),g.from("catalogs").select("*").order("category").order("value")]);l.incidents=await A(e),l.audit=await A(t),l.profiles=(await A(s)).map(tt),l.catalogs=await A(a),!l.selectedIncidentId&&l.incidents[0]&&(l.selectedIncidentId=l.incidents[0].id),l.loading=!1}function F(){const e={dashboard:{label:"Dashboard",icon:"📊"},incidents:{label:"Pendientes",icon:"📋"},kanban:{label:"Kanban",icon:"▦"},audit:{label:"Bitácora",icon:"🧾"},users:{label:"Usuarios",icon:"👥"},catalogs:{label:"Catálogos",icon:"⚙️"}},t=["dashboard","incidents","kanban","audit",...Ie()?["users"]:[],...et()?["catalogs"]:[]];re.innerHTML=`
    <div class="app-layout">
      <aside class="sidebar">
        <div class="side-title">
          <div class="brand-mark">🛡️</div>
          <div><strong>Auditoría</strong><span>Panel de control</span></div>
        </div>
        <nav class="nav">
          ${t.map(s=>`<button data-page="${s}" class="${l.page===s?"active":""}"><span>${e[s].icon}</span>${e[s].label}</button>`).join("")}
        </nav>
        <div class="sidebar-footer">
          <span>${o(l.profile?.display_name||l.profile?.username||"Usuario")}</span>
          <span>${o(q())}</span>
          <span class="muted">Modo directo temporal</span>
        </div>
      </aside>
      <main class="content">
        <header class="topbar">
          <div>
            <h1>Auditoría Pendientes</h1>
            <div class="muted">Sistema de gestión de incidencias de auditoría</div>
          </div>
          <div class="user-chip">${o(l.profile?.display_name||"")} · ${o(q())}</div>
        </header>
        <section id="page"></section>
      </main>
    </div>
    <dialog class="modal" id="modal"></dialog>
  `,document.querySelectorAll("[data-page]").forEach(s=>{s.addEventListener("click",()=>{l.page=s.dataset.page,F()})}),document.querySelector("#logoutBtn")?.addEventListener("click",ot),te()}function te(){const e=document.querySelector("#page");l.page==="dashboard"&&(e.innerHTML=ct()),l.page==="incidents"&&(e.innerHTML=dt()),l.page==="kanban"&&(e.innerHTML=mt()),l.page==="audit"&&(e.innerHTML=ft()),l.page==="users"&&(e.innerHTML=bt()),l.page==="catalogs"&&(e.innerHTML=$t()),_t()}function J(){return l.incidents.filter(e=>{const t=l.filters,s=`${e.id} ${e.hotel} ${e.department} ${e.incident_type} ${e.description} ${e.responsible}`.toLowerCase();return(!t.hotel||e.hotel===t.hotel)&&(!t.department||e.department===t.department)&&(!t.priority||e.priority===t.priority)&&(!t.status||e.status===t.status)&&(!t.responsible||e.responsible===t.responsible)&&(!t.type||e.incident_type===t.type)&&(!t.search||s.includes(t.search.toLowerCase()))})}function I(e,t,s=""){return`
    <div class="page-head">
      <div><h2>${o(e)}</h2><div class="muted">${o(t)}</div></div>
      ${s}
    </div>
  `}function de(){const e=l.filters,t=(s,a,i)=>`
    <div class="field">
      <label>${a}</label>
      <select data-filter="${s}">
        <option value="">Todos</option>
        ${Y(i,e[s])}
      </select>
    </div>
  `;return`
    <div class="filters">
      ${t("hotel","Hotel",H("hotel"))}
      ${t("department","Departamento",H("department"))}
      ${t("type","Tipo",H("incident_type"))}
      ${t("priority","Prioridad",se)}
      ${t("status","Estatus",D)}
      ${t("responsible","Responsable",H("responsible"))}
      <div class="field"><label>Buscar</label><input data-filter="search" value="${o(e.search)}" placeholder="ID, descripción..."></div>
    </div>
  `}function H(e){return[...new Set(l.incidents.map(t=>S(t[e])).filter(Boolean))].sort()}function ct(){const e=J(),t=e.filter(u=>!_.includes(u.status)),s=e.filter(u=>_.includes(u.status)),a=t.filter(u=>L(u).days<0),i=e.filter(u=>["Crítica","Critica"].includes(u.priority)),r=s.filter(u=>w(u.closed_at).slice(3)===w(new Date).slice(3)),n=e.filter(u=>L(u).met).length,d=Se(t,"responsible")||"Sin asignar",p=Se(e,"department")||"-";return`
    ${I("Dashboard","Indicadores ejecutivos y comportamiento operativo.")}
    ${de()}
    <div class="kpi-grid">
      ${C("Total",e.length,"Incidencias filtradas")}
      ${C("Abiertas",t.length,`${_e(t.length,e.length)}% del total`)}
      ${C("Vencidas",a.length,"Fuera de SLA")}
      ${C("Críticas",i.length,"Prioridad máxima")}
      ${C("Cerradas este mes",r.length,"Productividad mensual")}
      ${C("% Cumplimiento SLA",`${_e(n,e.length)}%`,"Filtrado actual")}
      ${C("Responsable con más abiertas",d,"Carga operativa")}
      ${C("Departamento con más incidencias",p,"Concentración")}
    </div>
    <div class="charts">
      ${V("Incidencias por hotel",e,"hotel")}
      ${V("Incidencias por departamento",e,"department")}
      ${V("Incidencias por prioridad",e,"priority")}
      ${V("Incidencias por estatus",e,"status")}
    </div>
  `}function C(e,t,s){return`<div class="kpi"><div class="label">${o(e)}</div><div class="value">${o(t)}</div><div class="sub">${o(s)}</div></div>`}function _e(e,t){return t?(e/t*100).toFixed(1):"0.0"}function Se(e,t){const s=new Map;return e.forEach(a=>{const i=S(a[t])||"Sin asignar";s.set(i,(s.get(i)||0)+1)}),[...s.entries()].sort((a,i)=>i[1]-a[1])[0]?.[0]}function V(e,t,s){const a=new Map;t.forEach(n=>{const d=S(n[s])||"Sin dato";a.set(d,(a.get(d)||0)+1)});const i=Math.max(1,...a.values()),r=[...a.entries()].sort((n,d)=>d[1]-n[1]).slice(0,10);return`
    <section class="panel">
      <h3>${o(e)}</h3>
      ${r.length?r.map(([n,d])=>`
        <div class="bar-row">
          <span>${o(n)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${d/i*100}%"></div></div>
          <b>${d}</b>
        </div>
      `).join(""):'<div class="empty">Sin datos</div>'}
    </section>
  `}function dt(){const e=J();!l.selectedIncidentId&&e[0]&&(l.selectedIncidentId=e[0].id);const t=e.find(a=>a.id===l.selectedIncidentId)||e[0];t&&(l.selectedIncidentId=t.id);const s=P(null,"create")?'<button class="btn primary" data-action="new-incident">Nueva incidencia</button>':"";return`
    ${I("Incidencias","Tabla tipo Excel, filtros, acciones y cierre formal.",s)}
    ${de()}
    <div class="toolbar">
      <strong>${e.length} registro(s)</strong>
      <button class="btn" data-action="export-csv">Exportar CSV</button>
    </div>
    <div class="split">
      ${ut(e)}
      <aside class="panel">${t?ht(t):'<div class="empty">Selecciona una incidencia.</div>'}</aside>
    </div>
  `}function ut(e){const t=[["id","ID"],["created_at","Fecha"],["hotel","Hotel"],["department","Departamento"],["incident_type","Tipo"],["priority","Prioridad"],["status","Estatus"],["responsible","Responsable"],["sla","SLA"],["due_at","Compromiso"],["description","Descripción"]];return`
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr>${t.map(([,s])=>`<th>${o(s)}</th>`).join("")}</tr></thead>
          <tbody>
            ${e.length?e.map(s=>`
              <tr data-select="${o(s.id)}" class="${s.id===l.selectedIncidentId?"selected":""}">
                ${t.map(([a])=>`<td>${pt(s,a)}</td>`).join("")}
              </tr>
            `).join(""):`<tr><td colspan="${t.length}" class="empty">No hay incidencias con los filtros seleccionados.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `}function pt(e,t){if(t==="id")return`<button class="row-button" data-select="${o(e.id)}">${o(e.id)}</button>`;if(t==="created_at"||t==="due_at")return o(w(e[t]));if(t==="priority")return $(e.priority);if(t==="status")return $(e.status);if(t==="sla"){const s=L(e);return $(s.label,s.cls)}return o(t==="description"?z(e.description,130):e[t]||"")}function ht(e){const t=L(e);return`
    <h3>${o(e.id)}</h3>
    <div class="selected-card">
      <div>${$(e.priority)} ${$(e.status)} ${$(t.label,t.cls)}</div>
      <strong>${o(e.hotel||"Sin hotel")}</strong>
      <span class="muted">${o(e.department||"Sin departamento")} · Responsable: ${o(e.responsible||"Sin asignar")}</span>
      <p>${o(e.description||"")}</p>
    </div>
    <div class="actions">
      <button class="btn" data-action="detail" data-id="${o(e.id)}">Detalle</button>
      <button class="btn" data-action="comment" data-id="${o(e.id)}" ${P(e,"comment")?"":"disabled"}>Comentar</button>
      <button class="btn" data-action="edit" data-id="${o(e.id)}" ${P(e,"edit")?"":"disabled"}>Editar</button>
      ${_.includes(e.status)?`<button class="btn" data-action="reopen" data-id="${o(e.id)}" ${P(e,"reopen")?"":"disabled"}>Reabrir</button>`:`<button class="btn primary" data-action="close" data-id="${o(e.id)}" ${P(e,"close")?"":"disabled"}>Cerrar</button>`}
    </div>
  `}function mt(){const e=J();return`
    ${I("Kanban","Seguimiento por estatus con cambio rápido.")}
    ${de()}
    <div class="kanban">
      ${D.map(t=>{const s=e.filter(a=>a.status===t);return`
          <section class="kanban-col">
            <div class="kanban-head"><span>${o(t)}</span><b>${s.length}</b></div>
            ${s.map(a=>`
              <article class="kanban-card">
                <button class="row-button" data-select="${o(a.id)}" data-page-link="incidents">${o(a.id)}</button>
                <span class="muted">${o(a.hotel||"")} · ${o(a.department||"")}</span>
                <span>${$(a.priority)} ${$(L(a).label,L(a).cls)}</span>
                <span>${o(z(a.description,95))}</span>
                <select data-status-change="${o(a.id)}" ${!P(a,"status")&&!P(a,"reopen")?"disabled":""}>
                  ${Y(it(a),a.status)}
                </select>
              </article>
            `).join("")||'<div class="empty">Sin incidencias.</div>'}
          </section>
        `}).join("")}
    </div>
  `}function ft(){return`
    ${I("Bitácora","Historial completo de cambios y comentarios.")}
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Incidencia</th><th>Acción</th><th>Campo</th><th>Anterior</th><th>Nuevo</th><th>Comentario</th></tr></thead>
          <tbody>
            ${l.audit.map(e=>`
              <tr>
                <td>${o(w(e.occurred_at,!0))}</td>
                <td>${o(yt(e))}</td>
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
  `}function bt(){if(!Ie())return`
      ${I("Usuarios","Administración de accesos.")}
      <div class="error">No tienes permisos para administrar usuarios.</div>
    `;const e=vt();return`
    ${I("Usuarios","Administración de accesos, roles y estados.",'<button class="btn primary" data-action="new-user">Nuevo usuario</button>')}
    ${gt()}
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
                <td>${o(t.password_mask||we)}</td>
                <td>${o(t.display_name||"")}</td>
                <td>${$(t.role||"Auditor")}</td>
                <td>${$(t.status||"Activo")}</td>
                <td>${o(w(t.last_access_at,!0))}</td>
                <td>${o(t.failed_attempts??0)}</td>
                <td>${$(x(!!t.blocked))}</td>
                <td>${$(x(!!t.must_change_password))}</td>
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
  `}function vt(){const e=l.userFilters;return l.profiles.filter(t=>{const s=`${t.username||""} ${t.display_name||""}`.toLowerCase();return(!e.search||s.includes(e.search.toLowerCase()))&&(!e.role||t.role===e.role)&&(!e.status||t.status===e.status)})}function gt(){const e=l.userFilters,t=(s,a,i)=>`
    <div class="field">
      <label>${a}</label>
      <select data-user-filter="${s}">
        <option value="">Todos</option>
        ${Y(i,e[s])}
      </select>
    </div>
  `;return`
    <div class="filters user-filters">
      <div class="field"><label>Buscar</label><input data-user-filter="search" value="${o(e.search)}" placeholder="Usuario o nombre"></div>
      ${t("role","Rol",ae)}
      ${t("status","Estado",ie)}
    </div>
  `}function $t(){return`
    ${I("Catálogos","Valores usados por formularios y filtros.",'<button class="btn primary" data-action="new-catalog">Nuevo valor</button>')}
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr><th>Categoría</th><th>Valor</th></tr></thead>
          <tbody>
            ${l.catalogs.map(e=>`<tr><td>${o(e.category)}</td><td>${o(e.value)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function yt(e){return l.profiles.find(t=>t.id===e.user_id)?.display_name||e.legacy_user||""}function _t(){document.querySelectorAll("[data-filter]").forEach(e=>{e.addEventListener("input",()=>{l.filters[e.dataset.filter]=e.value,te()})}),document.querySelectorAll("[data-user-filter]").forEach(e=>{e.addEventListener("input",()=>{l.userFilters[e.dataset.userFilter]=e.value,te()})}),document.querySelectorAll("[data-select]").forEach(e=>{e.addEventListener("click",()=>{l.selectedIncidentId=e.dataset.select,e.dataset.pageLink&&(l.page=e.dataset.pageLink),F()})}),document.querySelectorAll("[data-status-change]").forEach(e=>{e.addEventListener("change",async()=>{const t=l.incidents.find(a=>a.id===e.dataset.statusChange),s=e.value;if(!(!t||s===t.status)){if(_.includes(s)&&!_.includes(t.status)){ke(t);return}if(_.includes(t.status)&&!_.includes(s)){Me(t);return}await W(t,{status:s},"Cambio de estatus",`Estatus cambiado a ${s}.`)}})}),document.querySelectorAll("[data-action]").forEach(e=>{e.addEventListener("click",()=>{St(e.dataset.action,e.dataset.id).catch(t=>{console.error(t),b("No fue posible completar la acción.")})})})}async function St(e,t){const s=l.incidents.find(i=>i.id===t),a=l.profiles.find(i=>i.id===t);e==="new-incident"&&Ae(),e==="edit"&&Ae(s),e==="detail"&&Rt(s),e==="comment"&&Dt(s),e==="close"&&ke(s),e==="reopen"&&Me(s),e==="export-csv"&&Nt(J()),e==="new-catalog"&&It(),e==="new-user"&&Pe(),e==="edit-user"&&Pe(a),e==="toggle-user"&&await Lt(a),e==="toggle-blocked"&&await Et(a),e==="password-user"&&Ct(a),e==="audit-user"&&wt(a)}function E(e,t,s=""){const a=document.querySelector("#modal");return a.innerHTML=`
    <div class="modal-body">
      <div class="modal-head"><h3>${o(e)}</h3><button class="btn ghost" data-modal-close>Cerrar</button></div>
      ${t}
      ${s}
    </div>
  `,a.showModal(),a.querySelector("[data-modal-close]").addEventListener("click",()=>a.close()),a}function Ae(e=null){const t=!!e,s=`
    <form id="incidentForm" class="form-grid">
      ${f("hotel","Hotel",e?.hotel,"select",R("Hotel"))}
      ${f("department","Departamento",e?.department,"select",R("Departamento"))}
      ${f("responsible_area","Área responsable",e?.responsible_area,"select",R("Área Responsable"))}
      ${f("incident_type","Tipo de incidencia",e?.incident_type,"select",R("Tipo de Incidencia"))}
      ${f("impact","Impacto",e?.impact,"select",R("Impacto"))}
      ${f("priority","Prioridad",e?.priority||"Media","select",se)}
      ${f("status","Estatus",e?.status||"Pendiente","select",D)}
      ${f("responsible","Responsable",e?.responsible)}
      ${f("due_at","Fecha compromiso",e?.due_at||le(e?.priority||"Media"),"date")}
      ${f("description","Descripción",e?.description,"textarea",[],"form-full")}
      ${f("evidence_url","Evidencia URL",e?.evidence_url,"url",[],"form-full")}
      <button class="btn primary form-full" type="submit">${t?"Guardar cambios":"Crear incidencia"}</button>
    </form>
  `,a=E(t?`Editar ${e.id}`:"Nueva incidencia",s);a.querySelector("#incidentForm").addEventListener("submit",async i=>{i.preventDefault();const r=N(i.currentTarget);if(!r.hotel||!r.department||!r.incident_type||!r.priority||!r.description){b("Completa hotel, departamento, tipo, prioridad y descripción.");return}t?await W(e,r,"Actualización de incidencia","Incidencia actualizada."):await Tt(r),a.close()})}function f(e,t,s="",a="text",i=[],r=""){return a==="select"?`<div class="field ${r}"><label>${o(t)}</label><select name="${e}">${Y(i,s)}</select></div>`:a==="textarea"?`<div class="field ${r}"><label>${o(t)}</label><textarea name="${e}">${o(s||"")}</textarea></div>`:`<div class="field ${r}"><label>${o(t)}</label><input name="${e}" type="${a}" value="${o(s||"")}"></div>`}function N(e){return Object.fromEntries([...new FormData(e).entries()].map(([t,s])=>[t,S(s)]))}function At(e,t,s,a=!1){return l.profiles.filter(i=>{const r=i.id===e?t:i.role,n=i.id===e?s:i.status,d=i.id===e?a:!!i.blocked;return r==="Administrador"&&n==="Activo"&&!d}).length}function ue(e,t=null){if(!e.username||!e.display_name||!e.role||!e.status)return"Usuario, nombre, rol y estado son obligatorios.";if(!t&&S(e.password).length<8)return"La contraseña inicial debe tener al menos 8 caracteres.";if(!ae.includes(e.role))return"Selecciona un rol válido.";if(!ie.includes(e.status))return"Selecciona un estado válido.";if(l.profiles.find(i=>i.id!==t?.id&&ee(i.username)===ee(e.username)))return"Ya existe un usuario con ese nombre de usuario.";const a=G(e.blocked);if(t?.id===l.profile?.id&&t.role==="Administrador"){if(e.status!=="Activo")return"No puedes desactivar tu propio usuario administrador.";if(e.role!=="Administrador")return"No puedes quitarte el rol Administrador desde tu propia sesión.";if(a)return"No puedes bloquear tu propio usuario administrador."}return t&&At(t.id,e.role,e.status,a)<1?"Debe quedar al menos un administrador activo.":""}function Pe(e=null){const t=!!e,s=`
    <form id="userForm" class="form-grid">
      ${t?"":`
        <div class="field form-full">
          <label>Contraseña inicial</label>
          <input name="password" type="password" required autocomplete="new-password">
        </div>
      `}
      ${f("username","Usuario",e?.username||"")}
      ${f("display_name","Nombre",e?.display_name||"")}
      ${f("role","Rol",e?.role||"Auditor","select",ae)}
      ${f("status","Estado",e?.status||"Activo","select",ie)}
      ${f("blocked","Bloqueado",x(!!e?.blocked),"select",X)}
      ${f("must_change_password","Debe cambiar password",x(e?!!e.must_change_password:!0),"select",X)}
      <button class="btn primary form-full" type="submit">${t?"Guardar cambios":"Crear usuario"}</button>
    </form>
  `,a=E(t?`Editar ${e.username||"usuario"}`:"Nuevo usuario",s);a.querySelector("#userForm").addEventListener("submit",async i=>{i.preventDefault();const r=N(i.currentTarget),n=ue(r,e);if(n){b(n);return}try{await Pt(r,e),a.close()}catch(d){console.error(d),b("No fue posible guardar el usuario. Verifica los datos e intenta nuevamente.")}})}async function Pt(e,t=null){const s={username:e.username,display_name:e.display_name,role:e.role,status:e.status,blocked:G(e.blocked),must_change_password:G(e.must_change_password)};t||(s.password=e.password);const a=await A(await g.rpc("app_save_user",{p_token:O(),p_user_id:t?.id||null,p_user:s}),t?"No se pudo actualizar el usuario.":"No se pudo crear el usuario.");if(!a?.ok)throw new Error(a?.reason||"No se pudo guardar el usuario.");b(t?"Usuario actualizado.":"Usuario creado."),await T()}async function Lt(e){if(!e)return;const t=e.status==="Activo"?"Inactivo":"Activo",s=ue({...e,status:t},e);if(s){b(s);return}try{const a=await A(await g.rpc("app_toggle_user_status",{p_token:O(),p_user_id:e.id}),"No se pudo cambiar el estado.");if(!a?.ok)throw new Error(a?.reason||"No se pudo cambiar el estado.");b(`Usuario ${t.toLowerCase()}.`),await T()}catch(a){console.error(a),b("No fue posible cambiar el estado del usuario.")}}async function Et(e){if(!e)return;const t=!e.blocked,s=ue({...e,blocked:x(t)},e);if(s){b(s);return}try{const a=await A(await g.rpc("app_toggle_user_blocked",{p_token:O(),p_user_id:e.id}),"No se pudo cambiar el bloqueo.");if(!a?.ok)throw new Error(a?.reason||"No se pudo cambiar el bloqueo.");b(t?"Usuario bloqueado.":"Usuario desbloqueado."),await T()}catch(a){console.error(a),b("No fue posible cambiar el bloqueo del usuario.")}}function Ct(e){if(!e)return;E(`Contraseña de ${e.username||"usuario"}`,`
    <form id="resetPasswordForm" class="form-grid" autocomplete="off">
      <div class="field form-full">
        <label>Nueva contraseña temporal</label>
        <input name="password" type="password" required autocomplete="new-password">
      </div>
      ${f("must_change_password","Debe cambiar password","Sí","select",X,"form-full")}
      <button class="btn primary form-full" type="submit">Restablecer contraseña</button>
    </form>
  `).querySelector("#resetPasswordForm").addEventListener("submit",s=>{s.preventDefault();const a=N(s.currentTarget);Ot(e,a.password,G(a.must_change_password)).catch(i=>{console.error(i),b("No fue posible registrar el restablecimiento.")})})}async function Ot(e,t="",s=!0){if(!e)return;if(S(t).length<8){b("La contraseña temporal debe tener al menos 8 caracteres.");return}const a=await A(await g.rpc("app_admin_reset_password",{p_token:O(),p_user_id:e.id,p_new_password:t,p_must_change_password:s}),"No se pudo restablecer la contraseña.");if(!a?.ok)throw new Error(a?.reason||"No se pudo restablecer la contraseña.");document.querySelector("#modal")?.close(),b("Contraseña restablecida."),await T()}function wt(e){if(!e)return;const t=l.audit.filter(s=>S(s.changed_field).includes(`Usuario: ${e.username}`));E(`Bitácora de ${e.username||"usuario"}`,`
    <div class="timeline">
      ${t.map(s=>`
        <div class="timeline-item">
          <b>${o(s.action)}</b> · <span class="muted">${o(w(s.occurred_at,!0))}</span>
          <p>${o(s.comment||"")}</p>
          <p class="muted">${o(z(s.old_value,140))} → ${o(z(s.new_value,140))}</p>
        </div>
      `).join("")||'<div class="empty">Sin movimientos registrados para este usuario.</div>'}
    </div>
  `)}async function Tt(e){const t=e.due_at||le(e.priority),s={id:at(),...e,due_at:t,actual_due_at:t,created_by:l.profile?.id,updated_by:l.profile?.id,created_at:M(),updated_at:M()};await A(await g.from("incidents").insert(s),"No se pudo crear la incidencia."),await pe(s.id,"Creación","Incidencia","","Creada","Incidencia creada.",s),b("Incidencia creada."),await T()}async function W(e,t,s,a){if(!e)return;const i={...t,updated_by:l.profile?.id,updated_at:M()};i.status&&_.includes(i.status)&&!e.closed_at&&(i.closed_at=M()),i.status&&!_.includes(i.status)&&(i.closed_at=null),await A(await g.from("incidents").update(i).eq("id",e.id),"No se pudo actualizar.");for(const[r,n]of Object.entries(t))String(e[r]??"")!==String(n??"")&&await pe(e.id,s,r,e[r],n,a,{...e,...i});b("Cambios guardados."),await T()}async function pe(e,t,s,a,i,r,n){await g.from("audit_log").insert({incident_id:e,user_id:l.profile?.id,legacy_user:l.profile?.display_name||l.profile?.username||"Usuario",action:t,changed_field:s,old_value:a??"",new_value:i??"",comment:r,hotel:n?.hotel||"",status:n?.status||""})}function Rt(e){E(`Detalle ${e.id}`,`
    <div class="selected-card">
      <div>${$(e.priority)} ${$(e.status)} ${$(L(e).label,L(e).cls)}</div>
      <p><b>Hotel:</b> ${o(e.hotel||"")}</p>
      <p><b>Departamento:</b> ${o(e.department||"")}</p>
      <p><b>Responsable:</b> ${o(e.responsible||"Sin asignar")}</p>
      <p><b>Descripción:</b><br>${o(e.description||"")}</p>
      <p><b>Causa raíz:</b> ${o(e.root_cause||"")}</p>
      <p><b>Acción tomada:</b> ${o(e.action_taken||"")}</p>
      <p><b>Comentario final:</b> ${o(e.final_comment||"")}</p>
    </div>
    <h3>Bitácora</h3>
    <div class="timeline">
      ${l.audit.filter(t=>t.incident_id===e.id).map(t=>`
        <div class="timeline-item">
          <b>${o(t.action)}</b> · <span class="muted">${o(w(t.occurred_at,!0))}</span>
          <p>${o(t.changed_field||"General")}: ${o(t.old_value||"")} → ${o(t.new_value||"")}</p>
          <p>${o(t.comment||"")}</p>
        </div>
      `).join("")||'<div class="empty">Sin movimientos.</div>'}
    </div>
  `)}function Dt(e){const t=E(`Comentar ${e.id}`,`
    <form id="commentForm" class="form-grid">
      ${f("comment","Comentario","","textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">Guardar comentario</button>
    </form>
  `);t.querySelector("#commentForm").addEventListener("submit",async s=>{s.preventDefault();const a=N(s.currentTarget);await pe(e.id,"Comentario","Comentario","",a.comment,a.comment,e),b("Comentario guardado."),t.close(),await T()})}function ke(e){const t=E(`Cerrar ${e.id}`,`
    <form id="closeForm" class="form-grid">
      ${f("root_cause","Causa raíz",e.root_cause,"select",R("Causa raíz"))}
      ${f("action_taken","Acción tomada",e.action_taken,"select",R("Acción tomada"))}
      ${f("close_reason","Motivo de cierre",e.close_reason)}
      ${f("evidence_url","Evidencia URL",e.evidence_url,"url")}
      ${f("final_comment","Comentario final",e.final_comment,"textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">Cerrar incidencia</button>
    </form>
  `);t.querySelector("#closeForm").addEventListener("submit",async s=>{s.preventDefault();const a=N(s.currentTarget);if(!a.root_cause||!a.action_taken||!a.final_comment){b("Causa raíz, acción tomada y comentario final son obligatorios.");return}await W(e,{...a,status:"Cerrado",closed_at:M()},"Cierre formal",a.final_comment),t.close()})}function Me(e){const t=E(`Reabrir ${e.id}`,`
    <form id="reopenForm" class="form-grid">
      ${f("status","Nuevo estatus","En proceso","select",D.filter(s=>!_.includes(s)))}
      ${f("comment","Motivo de reapertura","","textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">Reabrir incidencia</button>
    </form>
  `);t.querySelector("#reopenForm").addEventListener("submit",async s=>{s.preventDefault();const a=N(s.currentTarget);if(!a.comment){b("El motivo es obligatorio.");return}await W(e,{status:a.status,closed_at:null},"Reapertura",a.comment),t.close()})}function It(){const e=E("Nuevo valor de catálogo",`
    <form id="catalogForm" class="form-grid">
      ${f("category","Categoría","","select",Object.keys(Te))}
      ${f("value","Valor","")}
      <button class="btn primary form-full" type="submit">Guardar</button>
    </form>
  `);e.querySelector("#catalogForm").addEventListener("submit",async t=>{t.preventDefault();const s=N(t.currentTarget);await A(await g.from("catalogs").insert(s),"No se pudo guardar el catálogo."),b("Catálogo guardado."),e.close(),await T()})}function Nt(e){const s=[["ID","Fecha","Hotel","Departamento","Tipo","Prioridad","Estatus","Responsable","SLA","Descripción"].join(","),...e.map(n=>[n.id,w(n.created_at),n.hotel,n.department,n.incident_type,n.priority,n.status,n.responsible,L(n).label,n.description].map(d=>`"${String(d??"").replaceAll('"','""')}"`).join(","))],a=new Blob([s.join(`
`)],{type:"text/csv;charset=utf-8"}),i=URL.createObjectURL(a),r=document.createElement("a");r.href=i,r.download="incidencias_filtradas.csv",r.click(),URL.revokeObjectURL(i)}async function T(){await ce(),F()}rt().catch(e=>{console.error(e),re.innerHTML=`<main class="config-shell"><section class="config-card"><div class="error">${o(e.message)}</div></section></main>`});
