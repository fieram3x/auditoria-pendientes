(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const i of r)if(i.type==="childList")for(const n of i.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&a(n)}).observe(document,{childList:!0,subtree:!0});function s(r){const i={};return r.integrity&&(i.integrity=r.integrity),r.referrerPolicy&&(i.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?i.credentials="include":r.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(r){if(r.ep)return;r.ep=!0;const i=s(r);fetch(r.href,i)}})();const Ce=3,ve=e=>Math.min(1e3*2**e,3e4),Ue=[520,503],Ee=["GET","HEAD","OPTIONS"];var ge=class extends Error{constructor(e){super(e.message),this.name="PostgrestError",this.details=e.details,this.hint=e.hint,this.code=e.code}toJSON(){return{name:this.name,message:this.message,details:this.details,hint:this.hint,code:this.code}}};function ye(e,t){return new Promise(s=>{if(t?.aborted){s();return}const a=setTimeout(()=>{t?.removeEventListener("abort",r),s()},e);function r(){clearTimeout(a),s()}t?.addEventListener("abort",r)})}function Be(e,t,s,a){return!(!a||s>=Ce||!Ee.includes(e)||!Ue.includes(t))}var He=class{constructor(e){var t,s,a,r,i;this.shouldThrowOnError=!1,this.retryEnabled=!0,this.method=e.method,this.url=e.url,this.headers=new Headers(e.headers),this.schema=e.schema,this.body=e.body,this.shouldThrowOnError=(t=e.shouldThrowOnError)!==null&&t!==void 0?t:!1,this.signal=e.signal,this.isMaybeSingle=(s=e.isMaybeSingle)!==null&&s!==void 0?s:!1,this.shouldStripNulls=(a=e.shouldStripNulls)!==null&&a!==void 0?a:!1,this.urlLengthLimit=(r=e.urlLengthLimit)!==null&&r!==void 0?r:8e3,this.retryEnabled=(i=e.retry)!==null&&i!==void 0?i:!0,e.fetch?this.fetch=e.fetch:this.fetch=fetch}throwOnError(){return this.shouldThrowOnError=!0,this}stripNulls(){if(this.headers.get("Accept")==="text/csv")throw new Error("stripNulls() cannot be used with csv()");return this.shouldStripNulls=!0,this}setHeader(e,t){return this.headers=new Headers(this.headers),this.headers.set(e,t),this}retry(e){return this.retryEnabled=e,this}then(e,t){var s=this;if(this.schema===void 0||(["GET","HEAD"].includes(this.method)?this.headers.set("Accept-Profile",this.schema):this.headers.set("Content-Profile",this.schema)),this.method!=="GET"&&this.method!=="HEAD"&&this.headers.set("Content-Type","application/json"),this.shouldStripNulls){const n=this.headers.get("Accept");n==="application/vnd.pgrst.object+json"?this.headers.set("Accept","application/vnd.pgrst.object+json;nulls=stripped"):(!n||n==="application/json")&&this.headers.set("Accept","application/vnd.pgrst.array+json;nulls=stripped")}const a=this.fetch;let i=(async()=>{let n=0;for(;;){const u={};s.headers.forEach((c,h)=>{u[h]=c}),n>0&&(u["X-Retry-Count"]=String(n));let m;try{m=await a(s.url.toString(),{method:s.method,headers:u,body:JSON.stringify(s.body,(c,h)=>typeof h=="bigint"?h.toString():h),signal:s.signal})}catch(c){if(c?.name==="AbortError"||c?.code==="ABORT_ERR"||!Ee.includes(s.method))throw c;if(s.retryEnabled&&n<Ce){const h=ve(n);n++,await ye(h,s.signal);continue}throw c}if(Be(s.method,m.status,n,s.retryEnabled)){var d,p;const c=(d=(p=m.headers)===null||p===void 0?void 0:p.get("Retry-After"))!==null&&d!==void 0?d:null,h=c!==null?Math.max(0,parseInt(c,10)||0)*1e3:ve(n);await m.text(),n++,await ye(h,s.signal);continue}return await s.processResponse(m)}})();return this.shouldThrowOnError||(i=i.catch(n=>{var d;let p="",u="",m="";const c=n?.cause;if(c){var h,v,$,se;const Fe=(h=c?.message)!==null&&h!==void 0?h:"",be=(v=c?.code)!==null&&v!==void 0?v:"";p=`${($=n?.name)!==null&&$!==void 0?$:"FetchError"}: ${n?.message}`,p+=`

Caused by: ${(se=c?.name)!==null&&se!==void 0?se:"Error"}: ${Fe}`,be&&(p+=` (${be})`),c?.stack&&(p+=`
${c.stack}`)}else{var ae;p=(ae=n?.stack)!==null&&ae!==void 0?ae:""}const V=this.url.toString().length;return n?.name==="AbortError"||n?.code==="ABORT_ERR"?(m="",u="Request was aborted (timeout or manual cancellation)",V>this.urlLengthLimit&&(u+=`. Note: Your request URL is ${V} characters, which may exceed server limits. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [many IDs])), consider using an RPC function to pass values server-side.`)):(c?.name==="HeadersOverflowError"||c?.code==="UND_ERR_HEADERS_OVERFLOW")&&(m="",u="HTTP headers exceeded server limits (typically 16KB)",V>this.urlLengthLimit&&(u+=`. Your request URL is ${V} characters. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [200+ IDs])), consider using an RPC function instead.`)),{success:!1,error:{message:`${(d=n?.name)!==null&&d!==void 0?d:"FetchError"}: ${n?.message}`,details:p,hint:u,code:m},data:null,count:null,status:0,statusText:""}})),i.then(e,t)}async processResponse(e){var t=this;let s=null,a=null,r=null,i=e.status,n=e.statusText;if(e.ok){var d,p;if(t.method!=="HEAD"){var u;const h=await e.text();if(h!=="")if(t.headers.get("Accept")==="text/csv")a=h;else if(t.headers.get("Accept")&&(!((u=t.headers.get("Accept"))===null||u===void 0)&&u.includes("application/vnd.pgrst.plan+text")))a=h;else try{a=JSON.parse(h)}catch{if(s={message:h},a=null,t.shouldThrowOnError)throw new ge({message:h,details:"",hint:"",code:""})}}const m=(d=t.headers.get("Prefer"))===null||d===void 0?void 0:d.match(/count=(exact|planned|estimated)/),c=(p=e.headers.get("content-range"))===null||p===void 0?void 0:p.split("/");m&&c&&c.length>1&&(r=parseInt(c[1])),t.isMaybeSingle&&Array.isArray(a)&&(a.length>1?(s={code:"PGRST116",details:`Results contain ${a.length} rows, application/vnd.pgrst.object+json requires 1 row`,hint:null,message:"JSON object requested, multiple (or no) rows returned"},a=null,r=null,i=406,n="Not Acceptable"):a.length===1?a=a[0]:a=null)}else{const m=await e.text();try{s=JSON.parse(m),Array.isArray(s)&&e.status===404&&(a=[],s=null,i=200,n="OK")}catch{e.status===404&&m===""?(i=204,n="No Content"):s={message:m}}if(s&&t.shouldThrowOnError)throw new ge(s)}return{success:s===null,error:s,data:a,count:r,status:i,statusText:n}}returns(){return this}overrideTypes(){return this}},ze=class extends He{throwOnError(){return super.throwOnError()}select(e){let t=!1;const s=(e??"*").split("").map(a=>/\s/.test(a)&&!t?"":(a==='"'&&(t=!t),a)).join("");return this.url.searchParams.set("select",s),this.headers.append("Prefer","return=representation"),this}order(e,{ascending:t=!0,nullsFirst:s,foreignTable:a,referencedTable:r=a}={}){const i=r?`${r}.order`:"order",n=this.url.searchParams.get(i);return this.url.searchParams.set(i,`${n?`${n},`:""}${e}.${t?"asc":"desc"}${s===void 0?"":s?".nullsfirst":".nullslast"}`),this}limit(e,{foreignTable:t,referencedTable:s=t}={}){const a=typeof s>"u"?"limit":`${s}.limit`;return this.url.searchParams.set(a,`${e}`),this}range(e,t,{foreignTable:s,referencedTable:a=s}={}){const r=typeof a>"u"?"offset":`${a}.offset`,i=typeof a>"u"?"limit":`${a}.limit`;return this.url.searchParams.set(r,`${e}`),this.url.searchParams.set(i,`${t-e+1}`),this}abortSignal(e){return this.signal=e,this}single(){return this.headers.set("Accept","application/vnd.pgrst.object+json"),this}maybeSingle(){return this.isMaybeSingle=!0,this}csv(){return this.headers.set("Accept","text/csv"),this}geojson(){return this.headers.set("Accept","application/geo+json"),this}explain({analyze:e=!1,verbose:t=!1,settings:s=!1,buffers:a=!1,wal:r=!1,format:i="text"}={}){var n;const d=[e?"analyze":null,t?"verbose":null,s?"settings":null,a?"buffers":null,r?"wal":null].filter(Boolean).join("|"),p=(n=this.headers.get("Accept"))!==null&&n!==void 0?n:"application/json";return this.headers.set("Accept",`application/vnd.pgrst.plan+${i}; for="${p}"; options=${d};`),i==="json"?this:this}rollback(){return this.headers.append("Prefer","tx=rollback"),this}returns(){return this}maxAffected(e){return this.headers.append("Prefer","handling=strict"),this.headers.append("Prefer",`max-affected=${e}`),this}};const $e=new RegExp("[,()]");var R=class extends ze{throwOnError(){return super.throwOnError()}eq(e,t){return this.url.searchParams.append(e,`eq.${t}`),this}neq(e,t){return this.url.searchParams.append(e,`neq.${t}`),this}gt(e,t){return this.url.searchParams.append(e,`gt.${t}`),this}gte(e,t){return this.url.searchParams.append(e,`gte.${t}`),this}lt(e,t){return this.url.searchParams.append(e,`lt.${t}`),this}lte(e,t){return this.url.searchParams.append(e,`lte.${t}`),this}like(e,t){return this.url.searchParams.append(e,`like.${t}`),this}likeAllOf(e,t){return this.url.searchParams.append(e,`like(all).{${t.join(",")}}`),this}likeAnyOf(e,t){return this.url.searchParams.append(e,`like(any).{${t.join(",")}}`),this}ilike(e,t){return this.url.searchParams.append(e,`ilike.${t}`),this}ilikeAllOf(e,t){return this.url.searchParams.append(e,`ilike(all).{${t.join(",")}}`),this}ilikeAnyOf(e,t){return this.url.searchParams.append(e,`ilike(any).{${t.join(",")}}`),this}regexMatch(e,t){return this.url.searchParams.append(e,`match.${t}`),this}regexIMatch(e,t){return this.url.searchParams.append(e,`imatch.${t}`),this}is(e,t){return this.url.searchParams.append(e,`is.${t}`),this}isDistinct(e,t){return this.url.searchParams.append(e,`isdistinct.${t}`),this}in(e,t){const s=Array.from(new Set(t)).map(a=>typeof a=="string"&&$e.test(a)?`"${a}"`:`${a}`).join(",");return this.url.searchParams.append(e,`in.(${s})`),this}notIn(e,t){const s=Array.from(new Set(t)).map(a=>typeof a=="string"&&$e.test(a)?`"${a}"`:`${a}`).join(",");return this.url.searchParams.append(e,`not.in.(${s})`),this}contains(e,t){return typeof t=="string"?this.url.searchParams.append(e,`cs.${t}`):Array.isArray(t)?this.url.searchParams.append(e,`cs.{${t.join(",")}}`):this.url.searchParams.append(e,`cs.${JSON.stringify(t)}`),this}containedBy(e,t){return typeof t=="string"?this.url.searchParams.append(e,`cd.${t}`):Array.isArray(t)?this.url.searchParams.append(e,`cd.{${t.join(",")}}`):this.url.searchParams.append(e,`cd.${JSON.stringify(t)}`),this}rangeGt(e,t){return this.url.searchParams.append(e,`sr.${t}`),this}rangeGte(e,t){return this.url.searchParams.append(e,`nxl.${t}`),this}rangeLt(e,t){return this.url.searchParams.append(e,`sl.${t}`),this}rangeLte(e,t){return this.url.searchParams.append(e,`nxr.${t}`),this}rangeAdjacent(e,t){return this.url.searchParams.append(e,`adj.${t}`),this}overlaps(e,t){return typeof t=="string"?this.url.searchParams.append(e,`ov.${t}`):this.url.searchParams.append(e,`ov.{${t.join(",")}}`),this}textSearch(e,t,{config:s,type:a}={}){let r="";a==="plain"?r="pl":a==="phrase"?r="ph":a==="websearch"&&(r="w");const i=s===void 0?"":`(${s})`;return this.url.searchParams.append(e,`${r}fts${i}.${t}`),this}match(e){return Object.entries(e).filter(([t,s])=>s!==void 0).forEach(([t,s])=>{this.url.searchParams.append(t,`eq.${s}`)}),this}not(e,t,s){return this.url.searchParams.append(e,`not.${t}.${s}`),this}or(e,{foreignTable:t,referencedTable:s=t}={}){const a=s?`${s}.or`:"or";return this.url.searchParams.append(a,`(${e})`),this}filter(e,t,s){return this.url.searchParams.append(e,`${t}.${s}`),this}},Ve=class{constructor(e,{headers:t={},schema:s,fetch:a,urlLengthLimit:r=8e3,retry:i}){this.url=e,this.headers=new Headers(t),this.schema=s,this.fetch=a,this.urlLengthLimit=r,this.retry=i}cloneRequestState(){return{url:new URL(this.url.toString()),headers:new Headers(this.headers)}}select(e,t){const{head:s=!1,count:a}=t??{},r=s?"HEAD":"GET";let i=!1;const n=(e??"*").split("").map(u=>/\s/.test(u)&&!i?"":(u==='"'&&(i=!i),u)).join(""),{url:d,headers:p}=this.cloneRequestState();return d.searchParams.set("select",n),a&&p.append("Prefer",`count=${a}`),new R({method:r,url:d,headers:p,schema:this.schema,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}insert(e,{count:t,defaultToNull:s=!0}={}){var a;const r="POST",{url:i,headers:n}=this.cloneRequestState();if(t&&n.append("Prefer",`count=${t}`),s||n.append("Prefer","missing=default"),Array.isArray(e)){const d=e.reduce((p,u)=>p.concat(Object.keys(u)),[]);if(d.length>0){const p=[...new Set(d)].map(u=>`"${u}"`);i.searchParams.set("columns",p.join(","))}}return new R({method:r,url:i,headers:n,schema:this.schema,body:e,fetch:(a=this.fetch)!==null&&a!==void 0?a:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}upsert(e,{onConflict:t,ignoreDuplicates:s=!1,count:a,defaultToNull:r=!0}={}){var i;const n="POST",{url:d,headers:p}=this.cloneRequestState();if(p.append("Prefer",`resolution=${s?"ignore":"merge"}-duplicates`),t!==void 0&&d.searchParams.set("on_conflict",t),a&&p.append("Prefer",`count=${a}`),r||p.append("Prefer","missing=default"),Array.isArray(e)){const u=e.reduce((m,c)=>m.concat(Object.keys(c)),[]);if(u.length>0){const m=[...new Set(u)].map(c=>`"${c}"`);d.searchParams.set("columns",m.join(","))}}return new R({method:n,url:d,headers:p,schema:this.schema,body:e,fetch:(i=this.fetch)!==null&&i!==void 0?i:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}update(e,{count:t}={}){var s;const a="PATCH",{url:r,headers:i}=this.cloneRequestState();return t&&i.append("Prefer",`count=${t}`),new R({method:a,url:r,headers:i,schema:this.schema,body:e,fetch:(s=this.fetch)!==null&&s!==void 0?s:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}delete({count:e}={}){var t;const s="DELETE",{url:a,headers:r}=this.cloneRequestState();return e&&r.append("Prefer",`count=${e}`),new R({method:s,url:a,headers:r,schema:this.schema,fetch:(t=this.fetch)!==null&&t!==void 0?t:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};function M(e){"@babel/helpers - typeof";return M=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},M(e)}function Ge(e,t){if(M(e)!="object"||!e)return e;var s=e[Symbol.toPrimitive];if(s!==void 0){var a=s.call(e,t);if(M(a)!="object")return a;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function Ke(e){var t=Ge(e,"string");return M(t)=="symbol"?t:t+""}function Je(e,t,s){return(t=Ke(t))in e?Object.defineProperty(e,t,{value:s,enumerable:!0,configurable:!0,writable:!0}):e[t]=s,e}function _e(e,t){var s=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter(function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable})),s.push.apply(s,a)}return s}function G(e){for(var t=1;t<arguments.length;t++){var s=arguments[t]!=null?arguments[t]:{};t%2?_e(Object(s),!0).forEach(function(a){Je(e,a,s[a])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(s)):_e(Object(s)).forEach(function(a){Object.defineProperty(e,a,Object.getOwnPropertyDescriptor(s,a))})}return e}var Ye=class Oe{constructor(t,{headers:s={},schema:a,fetch:r,timeout:i,urlLengthLimit:n=8e3,retry:d}={}){this.url=t,this.headers=new Headers(s),this.schemaName=a,this.urlLengthLimit=n;const p=r??globalThis.fetch;i!==void 0&&i>0?this.fetch=(u,m)=>{const c=new AbortController,h=setTimeout(()=>c.abort(),i),v=m?.signal;if(v){if(v.aborted)return clearTimeout(h),p(u,m);const $=()=>{clearTimeout(h),c.abort()};return v.addEventListener("abort",$,{once:!0}),p(u,G(G({},m),{},{signal:c.signal})).finally(()=>{clearTimeout(h),v.removeEventListener("abort",$)})}return p(u,G(G({},m),{},{signal:c.signal})).finally(()=>clearTimeout(h))}:this.fetch=p,this.retry=d}from(t){if(!t||typeof t!="string"||t.trim()==="")throw new Error("Invalid relation name: relation must be a non-empty string.");return new Ve(new URL(`${this.url}/${t}`),{headers:new Headers(this.headers),schema:this.schemaName,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}schema(t){return new Oe(this.url,{headers:this.headers,schema:t,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}rpc(t,s={},{head:a=!1,get:r=!1,count:i}={}){var n;let d;const p=new URL(`${this.url}/rpc/${t}`);let u;const m=v=>v!==null&&typeof v=="object"&&(!Array.isArray(v)||v.some(m)),c=a&&Object.values(s).some(m);c?(d="POST",u=s):a||r?(d=a?"HEAD":"GET",Object.entries(s).filter(([v,$])=>$!==void 0).map(([v,$])=>[v,Array.isArray($)?`{${$.join(",")}}`:`${$}`]).forEach(([v,$])=>{p.searchParams.append(v,$)})):(d="POST",u=s);const h=new Headers(this.headers);return c?h.set("Prefer",i?`count=${i},return=minimal`:"return=minimal"):i&&h.set("Prefer",`count=${i}`),new R({method:d,url:p,headers:h,schema:this.schemaName,body:u,fetch:(n=this.fetch)!==null&&n!==void 0?n:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};const We="https://plqszwbcgsoxfaufudgn.supabase.co",Se="sb_publishable_a34RnPQKgZS_TgHSp0CfBg_5BR3FFJi",k=["Pendiente","En proceso","En espera de respuesta","Escalado","Resuelto","Cerrado"],_=["Resuelto","Cerrado"],oe=["Baja","Media","Alta","Crítica"],le=["Administrador","Supervisor","Auditor","Consulta"],ce=["Activo","Inactivo"],re=["No","Sí"],Qe={Crítica:1,Critica:1,Alta:2,Media:3,Baja:5},x="auditoriaPendientes.session",Ze="x-app-session-token",Xe="id, username, display_name, role, status, last_access_at, failed_attempts, blocked, must_change_password, created_at, updated_at",De="********",Te={División:["5910 - PPRL","5911 - ZEL","5917 - MPCB","5918 - MCB","5930 - PGC"],Departamento:["Recepción","Reservas","A&B","Spa","Contabilidad","IT","Club Meliá","Auditoría Nocturna","Auditoría Diurna"],"Área Responsable":["Operaciones","Finanzas","Contabilidad","Revenue","Sistemas","Auditoría"],"Tipo de Incidencia":["Cobro no realizado","Routing incorrecto","Check-in mal procesado","Rate Code incorrecto","Factura no volcada a SAP","Diferencia POS vs PMS","Resort Credit incorrecto","HTC incorrecto","Falta de soporte","Incidencia IT"],Impacto:["Operativo","Financiero","Contable","Cliente","Sistema"],Prioridad:oe,Estatus:k,"Causa raíz":["Error operativo","Falta de soporte","Configuración incorrecta","Proceso incompleto","Incidencia de sistema"],"Acción tomada":["Corrección en PMS","Corrección contable","Escalamiento a IT","Capacitación al equipo","Validación documental"]},z=document.querySelector("#app");let g=ke();const l={session:null,profile:null,page:"dashboard",loading:!0,incidents:[],audit:[],profiles:[],catalogs:[],selectedIncidentId:null,filters:{hotel:"",department:"",priority:"",status:"",responsible:"",type:"",search:""},userFilters:{search:"",role:"",status:""}};function ke(e=""){const t={apikey:Se,Authorization:`Bearer ${Se}`};return e&&(t[Ze]=e),new Ye(`${We}/rest/v1`,{headers:t,schema:"public"})}const o=e=>String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"),w=e=>String(e??"").trim(),ie=e=>w(e).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""),et=e=>w(e).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"sin-dato",O=(e,t=!1)=>{if(!e)return"";const s=new Date(e);return Number.isNaN(s.getTime())?String(e):new Intl.DateTimeFormat("es-DO",{day:"2-digit",month:"2-digit",year:"numeric",...t?{hour:"2-digit",minute:"2-digit"}:{}}).format(s)},tt=()=>new Date().toISOString().slice(0,10),F=()=>new Date().toISOString(),y=(e,t="")=>`<span class="badge ${et(e)} ${t}">${o(e||"Sin dato")}</span>`,U=(e,t=120)=>w(e).length>t?`${w(e).slice(0,t-3)}...`:w(e),B=()=>l.profile?.role||"Auditor",de=()=>B()==="Administrador",je=()=>B()==="Supervisor",Ie=()=>de(),st=()=>de()||je(),H=e=>e?"Sí":"No",Y=e=>["si","sí","true","1","yes"].includes(ie(e)),at=e=>({...e,password_mask:De});function rt(){try{const e=JSON.parse(localStorage.getItem(x)||"null");return!e?.token||!e?.expires_at?null:new Date(e.expires_at).getTime()<=Date.now()?(localStorage.removeItem(x),null):{token:e.token,expires_at:e.expires_at}}catch{return localStorage.removeItem(x),null}}function it(e){if(!e?.token){localStorage.removeItem(x);return}localStorage.setItem(x,JSON.stringify({token:e.token,expires_at:e.expires_at}))}function j(e){l.session=e,g=ke(e?.token||""),it(e)}function P(){return l.session?.token||""}function nt(){return`INC-${new Date().toISOString().replace(/[-:TZ.]/g,"").slice(0,14)}-${Math.random().toString(16).slice(2,6).toUpperCase()}`}function ue(e,t=new Date){const s=new Date(t),a=Qe[e]??3;return s.setDate(s.getDate()+a),s.toISOString().slice(0,10)}function L(e){const t=w(e.status),s=e.actual_due_at||e.due_at||ue(e.priority||"Media",e.created_at),a=new Date(`${s}T00:00:00`);if(_.includes(t)){if(!e.closed_at||Number.isNaN(a.getTime()))return{label:"Cerrado",days:null,met:!0,cls:"cerrado"};const d=new Date(e.closed_at)<=new Date(`${s}T23:59:59`);return{label:d?"Cerrado en SLA":"Cerrado fuera SLA",days:null,met:d,cls:d?"cerrado":"vencido"}}const r=new Date(`${tt()}T00:00:00`),i=Math.ceil((a-r)/864e5);return i<0?{label:`Vencido ${Math.abs(i)}d`,days:i,met:!1,cls:"vencido"}:i===0?{label:"Vence hoy",days:i,met:!0,cls:"media"}:i===1?{label:"Vence en 1d",days:i,met:!0,cls:"media"}:{label:`En tiempo (${i}d)`,days:i,met:!0,cls:"baja"}}function A(e,t="edit"){if(de())return!0;if(je())return["edit","comment","close","reopen","status"].includes(t);if(B()==="Consulta")return!1;if(t==="create"||t==="comment")return!0;if(!["edit","status"].includes(t)||!e)return!1;const s=l.profile?.id;return e.created_by===s||e.assigned_to===s}function ot(e){return _.includes(e.status)?k.filter(t=>_.includes(t)||A(e,"reopen")):k.filter(t=>!_.includes(t)||A(e,"close"))}function T(e){const t=e==="División"?["División","Hotel"]:[e],s=l.catalogs.filter(a=>t.includes(a.category)).map(a=>a.value).filter(Boolean);return s.length?[...new Set(s)].sort():Te[e]||[]}function lt(e){return e==="Hotel"?"División":e}function Z(e,t=""){return[...new Set([t,...e].filter(Boolean))].map(a=>`<option value="${o(a)}" ${a===t?"selected":""}>${o(a)}</option>`).join("")}function b(e){const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),2600)}async function S(e,t="No se pudo completar la operación."){if(e.error)throw new Error(e.error.message||t);return e.data}function Ne(e){const t=String(e?.reason||e?.message||"").toLowerCase();return t.includes("inactive")?"Usuario inactivo. Contacte al administrador.":t.includes("blocked")?"Usuario bloqueado. Contacte al administrador.":t.includes("weak_password")?"La nueva contraseña debe tener al menos 8 caracteres.":"Usuario o contraseña incorrectos."}function ct(e){const t=String(e?.message||"");return t.toLowerCase().includes("sesión")?"La sesión venció. Inicie sesión nuevamente.":t.toLowerCase().includes("inactivo")?"Usuario inactivo. Contacte al administrador.":t.toLowerCase().includes("bloqueado")?"Usuario bloqueado. Contacte al administrador.":"No fue posible cargar el sistema. Intente nuevamente o contacte al administrador."}function dt(e){const t=String(e?.message||e?.reason||"").trim(),s=t.toLowerCase();return s.includes("duplicate_username")?"Ya existe un usuario con ese nombre de usuario.":s.includes("weak_password")?"La contraseña inicial debe tener al menos 8 caracteres.":s.includes("legacy_user")?"Falta actualizar la tabla audit_log en Supabase. Ejecuta el SQL actualizado y vuelve a intentar.":s.includes("forbidden")?"No tienes permisos para guardar usuarios.":t?`No fue posible guardar el usuario: ${t}`:"No fue posible guardar el usuario. Verifica los datos e intenta nuevamente."}function pe(){l.session=null,l.profile=null,l.incidents=[],l.audit=[],l.profiles=[],l.selectedIncidentId=null}async function ut(){if(!g){pt();return}const e=rt();if(!e){l.loading=!1,W();return}j(e);try{if(await qe(),l.profile?.must_change_password){l.loading=!1,Q();return}await X(),q()}catch(t){console.error(t),j(null),pe(),W(ct(t))}}function pt(){z.innerHTML=`
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
  `}function W(e=""){z.innerHTML=`
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
  `,document.querySelector("#loginForm").addEventListener("submit",async t=>{t.preventDefault();const s=new FormData(t.currentTarget);try{await mt(s.get("login"),s.get("password"))}catch(a){console.warn("Login failed",a),j(null),pe(),W(Ne(a))}})}function Q(e=""){z.innerHTML=`
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
  `,document.querySelector("#passwordLogoutBtn").addEventListener("click",Re),document.querySelector("#passwordChangeForm").addEventListener("submit",async t=>{t.preventDefault();const s=new FormData(t.currentTarget),a=String(s.get("new_password")||"");if(a!==String(s.get("confirm_password")||"")){Q("Las contraseñas no coinciden.");return}try{await ht(s.get("current_password"),a),b("Contraseña actualizada."),await X(),q()}catch(r){console.warn("Password change failed",r),Q(Ne(r))}})}async function mt(e,t){const s=await S(await g.rpc("app_login",{p_username:w(e),p_password:String(t||"")}),"No fue posible iniciar sesión.");if(!s?.ok){const a=new Error(s?.reason||"invalid_credentials");throw a.reason=s?.reason,a}if(j({token:s.token,expires_at:s.expires_at}),l.profile=s.profile,s.must_change_password||s.profile?.must_change_password){Q();return}await X(),q()}async function ht(e,t){const s=await S(await g.rpc("app_change_password",{p_token:P(),p_current_password:String(e||""),p_new_password:String(t||"")}),"No fue posible cambiar la contraseña.");if(!s?.ok){const a=new Error(s?.reason||"invalid_credentials");throw a.reason=s?.reason,a}l.profile=s.profile,j({token:P(),expires_at:s.expires_at||l.session?.expires_at})}async function Re(){const e=P();try{e&&await g.rpc("app_logout",{p_token:e})}catch(t){console.warn("Logout failed",t)}j(null),pe(),W()}async function qe(){if(!P())throw new Error("Sesión inválida.");const e=await S(await g.rpc("app_validate_session",{p_token:P()}),"No fue posible validar la sesión.");if(!e?.ok)throw new Error("Sesión inválida.");return l.profile=e.profile,j({token:P(),expires_at:e.expires_at}),l.profile}async function X(){l.loading=!0,await qe();const[e,t,s,a]=await Promise.all([g.from("incidents").select("*").order("created_at",{ascending:!1}),g.from("audit_log").select("*").order("occurred_at",{ascending:!1}).limit(500),g.from("app_users").select(Xe).order("display_name"),g.from("catalogs").select("*").order("category").order("value")]);l.incidents=await S(e),l.audit=await S(t),l.profiles=(await S(s)).map(at),l.catalogs=await S(a),!l.selectedIncidentId&&l.incidents[0]&&(l.selectedIncidentId=l.incidents[0].id),l.loading=!1}function q(){const e={dashboard:{label:"Dashboard",icon:"📊"},incidents:{label:"Pendientes",icon:"📋"},kanban:{label:"Kanban",icon:"▦"},audit:{label:"Bitácora",icon:"🧾"},users:{label:"Usuarios",icon:"👥"},catalogs:{label:"Catálogos",icon:"⚙️"}},t=["dashboard","incidents","kanban","audit",...Ie()?["users"]:[],...st()?["catalogs"]:[]];z.innerHTML=`
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
          <span>${o(B())}</span>
          <button class="btn ghost" id="logoutBtn">Cerrar sesión</button>
        </div>
      </aside>
      <main class="content">
        <header class="topbar">
          <div>
            <h1>Auditoría Pendientes</h1>
            <div class="muted">Sistema de gestión de incidencias de auditoría</div>
          </div>
          <div class="user-chip">${o(l.profile?.display_name||"")} · ${o(B())}</div>
        </header>
        <section id="page"></section>
      </main>
    </div>
    <dialog class="modal" id="modal"></dialog>
  `,document.querySelectorAll("[data-page]").forEach(s=>{s.addEventListener("click",()=>{l.page=s.dataset.page,q()})}),document.querySelector("#logoutBtn").addEventListener("click",Re),ne()}function ne(){const e=document.querySelector("#page");l.page==="dashboard"&&(e.innerHTML=ft()),l.page==="incidents"&&(e.innerHTML=bt()),l.page==="kanban"&&(e.innerHTML=$t()),l.page==="audit"&&(e.innerHTML=_t()),l.page==="users"&&(e.innerHTML=St()),l.page==="catalogs"&&(e.innerHTML=At()),Ct()}function ee(){return l.incidents.filter(e=>{const t=l.filters,s=`${e.id} ${e.hotel} ${e.department} ${e.subject} ${e.incident_type} ${e.description} ${e.responsible}`.toLowerCase();return(!t.hotel||e.hotel===t.hotel)&&(!t.department||e.department===t.department)&&(!t.priority||e.priority===t.priority)&&(!t.status||e.status===t.status)&&(!t.responsible||e.responsible===t.responsible)&&(!t.type||e.incident_type===t.type)&&(!t.search||s.includes(t.search.toLowerCase()))})}function I(e,t,s=""){return`
    <div class="page-head">
      <div><h2>${o(e)}</h2><div class="muted">${o(t)}</div></div>
      ${s}
    </div>
  `}function me(){const e=l.filters,t=(s,a,r)=>`
    <div class="field">
      <label>${a}</label>
      <select data-filter="${s}">
        <option value="">Todos</option>
        ${Z(r,e[s])}
      </select>
    </div>
  `;return`
    <div class="filters">
      ${t("hotel","División",K("hotel"))}
      ${t("department","Departamento",K("department"))}
      ${t("type","Tipo",K("incident_type"))}
      ${t("priority","Prioridad",oe)}
      ${t("status","Estatus",k)}
      ${t("responsible","Responsable",K("responsible"))}
      <div class="field"><label>Buscar</label><input data-filter="search" value="${o(e.search)}" placeholder="ID, asunto, descripción..."></div>
    </div>
  `}function K(e){return[...new Set(l.incidents.map(t=>w(t[e])).filter(Boolean))].sort()}function ft(){const e=ee(),t=e.filter(u=>!_.includes(u.status)),s=e.filter(u=>_.includes(u.status)),a=t.filter(u=>L(u).days<0),r=e.filter(u=>["Crítica","Critica"].includes(u.priority)),i=s.filter(u=>O(u.closed_at).slice(3)===O(new Date).slice(3)),n=e.filter(u=>L(u).met).length,d=Pe(t,"responsible")||"Sin asignar",p=Pe(e,"department")||"-";return`
    ${I("Dashboard","Indicadores ejecutivos y comportamiento operativo.")}
    ${me()}
    <div class="kpi-grid">
      ${E("Total",e.length,"Incidencias filtradas")}
      ${E("Abiertas",t.length,`${we(t.length,e.length)}% del total`)}
      ${E("Vencidas",a.length,"Fuera de SLA")}
      ${E("Críticas",r.length,"Prioridad máxima")}
      ${E("Cerradas este mes",i.length,"Productividad mensual")}
      ${E("% Cumplimiento SLA",`${we(n,e.length)}%`,"Filtrado actual")}
      ${E("Responsable con más abiertas",d,"Carga operativa")}
      ${E("Departamento con más incidencias",p,"Concentración")}
    </div>
    <div class="charts">
      ${J("Incidencias por división",e,"hotel")}
      ${J("Incidencias por departamento",e,"department")}
      ${J("Incidencias por prioridad",e,"priority")}
      ${J("Incidencias por estatus",e,"status")}
    </div>
  `}function E(e,t,s){return`<div class="kpi"><div class="label">${o(e)}</div><div class="value">${o(t)}</div><div class="sub">${o(s)}</div></div>`}function we(e,t){return t?(e/t*100).toFixed(1):"0.0"}function Pe(e,t){const s=new Map;return e.forEach(a=>{const r=w(a[t])||"Sin asignar";s.set(r,(s.get(r)||0)+1)}),[...s.entries()].sort((a,r)=>r[1]-a[1])[0]?.[0]}function J(e,t,s){const a=new Map;t.forEach(n=>{const d=w(n[s])||"Sin dato";a.set(d,(a.get(d)||0)+1)});const r=Math.max(1,...a.values()),i=[...a.entries()].sort((n,d)=>d[1]-n[1]).slice(0,10);return`
    <section class="panel">
      <h3>${o(e)}</h3>
      ${i.length?i.map(([n,d])=>`
        <div class="bar-row">
          <span>${o(n)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${d/r*100}%"></div></div>
          <b>${d}</b>
        </div>
      `).join(""):'<div class="empty">Sin datos</div>'}
    </section>
  `}function bt(){const e=ee();!l.selectedIncidentId&&e[0]&&(l.selectedIncidentId=e[0].id);const t=e.find(a=>a.id===l.selectedIncidentId)||e[0];t&&(l.selectedIncidentId=t.id);const s=A(null,"create")?'<button class="btn primary" data-action="new-incident">Nueva incidencia</button>':"";return`
    ${I("Incidencias","Tabla tipo Excel, filtros, acciones y cierre formal.",s)}
    ${me()}
    <div class="toolbar">
      <strong>${e.length} registro(s)</strong>
      <button class="btn" data-action="export-csv">Exportar CSV</button>
    </div>
    <div class="split">
      ${vt(e)}
      <aside class="panel">${t?yt(t):'<div class="empty">Selecciona una incidencia.</div>'}</aside>
    </div>
  `}function vt(e){const t=[["id","ID"],["created_at","Fecha"],["hotel","División"],["department","Departamento"],["subject","Asunto"],["incident_type","Tipo"],["priority","Prioridad"],["status","Estatus"],["responsible","Responsable"],["sla","SLA"],["due_at","Compromiso"],["description","Descripción"]];return`
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr>${t.map(([,s])=>`<th>${o(s)}</th>`).join("")}</tr></thead>
          <tbody>
            ${e.length?e.map(s=>`
              <tr data-select="${o(s.id)}" class="${s.id===l.selectedIncidentId?"selected":""}">
                ${t.map(([a])=>`<td>${gt(s,a)}</td>`).join("")}
              </tr>
            `).join(""):`<tr><td colspan="${t.length}" class="empty">No hay incidencias con los filtros seleccionados.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `}function gt(e,t){if(t==="id")return`<button class="row-button" data-select="${o(e.id)}">${o(e.id)}</button>`;if(t==="created_at"||t==="due_at")return o(O(e[t]));if(t==="priority")return y(e.priority);if(t==="status")return y(e.status);if(t==="sla"){const s=L(e);return y(s.label,s.cls)}return o(t==="subject"?U(e.subject,90):t==="description"?U(e.description,130):e[t]||"")}function yt(e){const t=L(e);return`
    <h3>${o(e.subject||e.id)}</h3>
    <div class="selected-card">
      <div>${y(e.priority)} ${y(e.status)} ${y(t.label,t.cls)}</div>
      <span class="muted">${o(e.id)}</span>
      <strong>${o(e.hotel||"Sin división")}</strong>
      <span class="muted">${o(e.department||"Sin departamento")} · Responsable: ${o(e.responsible||"Sin asignar")}</span>
      <p>${o(e.description||"")}</p>
    </div>
    <div class="actions">
      <button class="btn" data-action="detail" data-id="${o(e.id)}">Detalle</button>
      <button class="btn" data-action="comment" data-id="${o(e.id)}" ${A(e,"comment")?"":"disabled"}>Comentar</button>
      <button class="btn" data-action="edit" data-id="${o(e.id)}" ${A(e,"edit")?"":"disabled"}>Editar</button>
      ${_.includes(e.status)?`<button class="btn" data-action="reopen" data-id="${o(e.id)}" ${A(e,"reopen")?"":"disabled"}>Reabrir</button>`:`<button class="btn primary" data-action="close" data-id="${o(e.id)}" ${A(e,"close")?"":"disabled"}>Cerrar</button>`}
    </div>
  `}function $t(){const e=ee();return`
    ${I("Kanban","Seguimiento por estatus con cambio rápido.")}
    ${me()}
    <div class="kanban">
      ${k.map(t=>{const s=e.filter(a=>a.status===t);return`
          <section class="kanban-col">
            <div class="kanban-head"><span>${o(t)}</span><b>${s.length}</b></div>
            ${s.map(a=>`
              <article class="kanban-card">
                <button class="row-button" data-select="${o(a.id)}" data-page-link="incidents">${o(a.id)}</button>
                <span class="muted">${o(a.hotel||"")} · ${o(a.department||"")}</span>
                <span>${y(a.priority)} ${y(L(a).label,L(a).cls)}</span>
                <strong>${o(U(a.subject||a.description,95))}</strong>
                <select data-status-change="${o(a.id)}" ${!A(a,"status")&&!A(a,"reopen")?"disabled":""}>
                  ${Z(ot(a),a.status)}
                </select>
              </article>
            `).join("")||'<div class="empty">Sin incidencias.</div>'}
          </section>
        `}).join("")}
    </div>
  `}function _t(){return`
    ${I("Bitácora","Historial completo de cambios y comentarios.")}
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Incidencia</th><th>Acción</th><th>Campo</th><th>Anterior</th><th>Nuevo</th><th>Comentario</th></tr></thead>
          <tbody>
            ${l.audit.map(e=>`
              <tr>
                <td>${o(O(e.occurred_at,!0))}</td>
                <td>${o(Lt(e))}</td>
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
  `}function St(){if(!Ie())return`
      ${I("Usuarios","Administración de accesos.")}
      <div class="error">No tienes permisos para administrar usuarios.</div>
    `;const e=wt();return`
    ${I("Usuarios","Administración de accesos, roles y estados.",'<button class="btn primary" data-action="new-user">Nuevo usuario</button>')}
    ${Pt()}
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
                <td>${o(t.password_mask||De)}</td>
                <td>${o(t.display_name||"")}</td>
                <td>${y(t.role||"Auditor")}</td>
                <td>${y(t.status||"Activo")}</td>
                <td>${o(O(t.last_access_at,!0))}</td>
                <td>${o(t.failed_attempts??0)}</td>
                <td>${y(H(!!t.blocked))}</td>
                <td>${y(H(!!t.must_change_password))}</td>
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
  `}function wt(){const e=l.userFilters;return l.profiles.filter(t=>{const s=`${t.username||""} ${t.display_name||""}`.toLowerCase();return(!e.search||s.includes(e.search.toLowerCase()))&&(!e.role||t.role===e.role)&&(!e.status||t.status===e.status)})}function Pt(){const e=l.userFilters,t=(s,a,r)=>`
    <div class="field">
      <label>${a}</label>
      <select data-user-filter="${s}">
        <option value="">Todos</option>
        ${Z(r,e[s])}
      </select>
    </div>
  `;return`
    <div class="filters user-filters">
      <div class="field"><label>Buscar</label><input data-user-filter="search" value="${o(e.search)}" placeholder="Usuario o nombre"></div>
      ${t("role","Rol",le)}
      ${t("status","Estado",ce)}
    </div>
  `}function At(){return`
    ${I("Catálogos","Valores usados por formularios y filtros.",'<button class="btn primary" data-action="new-catalog">Nuevo valor</button>')}
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr><th>Categoría</th><th>Valor</th></tr></thead>
          <tbody>
            ${l.catalogs.map(e=>`<tr><td>${o(lt(e.category))}</td><td>${o(e.value)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function Lt(e){return l.profiles.find(t=>t.id===e.user_id)?.display_name||e.legacy_user||""}function Ct(){document.querySelectorAll("[data-filter]").forEach(e=>{e.addEventListener("input",()=>{l.filters[e.dataset.filter]=e.value,ne()})}),document.querySelectorAll("[data-user-filter]").forEach(e=>{e.addEventListener("input",()=>{l.userFilters[e.dataset.userFilter]=e.value,ne()})}),document.querySelectorAll("[data-select]").forEach(e=>{e.addEventListener("click",()=>{l.selectedIncidentId=e.dataset.select,e.dataset.pageLink&&(l.page=e.dataset.pageLink),q()})}),document.querySelectorAll("[data-status-change]").forEach(e=>{e.addEventListener("change",async()=>{const t=l.incidents.find(a=>a.id===e.dataset.statusChange),s=e.value;if(!(!t||s===t.status)){if(_.includes(s)&&!_.includes(t.status)){xe(t);return}if(_.includes(t.status)&&!_.includes(s)){Me(t);return}await te(t,{status:s},"Cambio de estatus",`Estatus cambiado a ${s}.`)}})}),document.querySelectorAll("[data-action]").forEach(e=>{e.addEventListener("click",()=>{Et(e.dataset.action,e.dataset.id).catch(t=>{console.error(t),b("No fue posible completar la acción.")})})})}async function Et(e,t){const s=l.incidents.find(r=>r.id===t),a=l.profiles.find(r=>r.id===t);e==="new-incident"&&Ae(),e==="edit"&&Ae(s),e==="detail"&&qt(s),e==="comment"&&xt(s),e==="close"&&xe(s),e==="reopen"&&Me(s),e==="export-csv"&&Ft(ee()),e==="new-catalog"&&Mt(),e==="new-user"&&Le(),e==="edit-user"&&Le(a),e==="toggle-user"&&await Tt(a),e==="toggle-blocked"&&await kt(a),e==="password-user"&&jt(a),e==="audit-user"&&Nt(a)}function C(e,t,s=""){const a=document.querySelector("#modal");return a.innerHTML=`
    <div class="modal-body">
      <div class="modal-head"><h3>${o(e)}</h3><button class="btn ghost" data-modal-close>Cerrar</button></div>
      ${t}
      ${s}
    </div>
  `,a.showModal(),a.querySelector("[data-modal-close]").addEventListener("click",()=>a.close()),a}function Ae(e=null){const t=!!e,s=`
    <form id="incidentForm" class="form-grid">
      ${f("hotel","División",e?.hotel,"select",T("División"))}
      ${f("department","Departamento",e?.department,"select",T("Departamento"))}
      ${f("responsible_area","Área responsable",e?.responsible_area,"select",T("Área Responsable"))}
      ${f("incident_type","Tipo de incidencia",e?.incident_type,"select",T("Tipo de Incidencia"))}
      ${f("impact","Impacto",e?.impact,"select",T("Impacto"))}
      ${f("priority","Prioridad",e?.priority||"Media","select",oe)}
      ${f("status","Estatus",e?.status||"Pendiente","select",k)}
      ${f("responsible","Responsable",e?.responsible)}
      ${f("due_at","Fecha compromiso",e?.due_at||ue(e?.priority||"Media"),"date")}
      ${f("subject","Asunto",e?.subject,"text",[],"form-full")}
      ${f("description","Descripción",e?.description,"textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">${t?"Guardar cambios":"Crear incidencia"}</button>
    </form>
  `,a=C(t?`Editar ${e.id}`:"Nueva incidencia",s);a.querySelector("#incidentForm").addEventListener("submit",async r=>{r.preventDefault();const i=N(r.currentTarget);if(!i.hotel||!i.department||!i.incident_type||!i.priority||!i.subject||!i.description){b("Completa división, departamento, tipo, prioridad, asunto y descripción.");return}t?await te(e,i,"Actualización de incidencia","Incidencia actualizada."):await Rt(i),a.close()})}function f(e,t,s="",a="text",r=[],i=""){return a==="select"?`<div class="field ${i}"><label>${o(t)}</label><select name="${e}">${Z(r,s)}</select></div>`:a==="textarea"?`<div class="field ${i}"><label>${o(t)}</label><textarea name="${e}">${o(s||"")}</textarea></div>`:`<div class="field ${i}"><label>${o(t)}</label><input name="${e}" type="${a}" value="${o(s||"")}"></div>`}function N(e){return Object.fromEntries([...new FormData(e).entries()].map(([t,s])=>[t,w(s)]))}function Ot(e,t,s,a=!1){return l.profiles.filter(r=>{const i=r.id===e?t:r.role,n=r.id===e?s:r.status,d=r.id===e?a:!!r.blocked;return i==="Administrador"&&n==="Activo"&&!d}).length}function he(e,t=null){if(!e.username||!e.display_name||!e.role||!e.status)return"Usuario, nombre, rol y estado son obligatorios.";if(!t&&w(e.password).length<8)return"La contraseña inicial debe tener al menos 8 caracteres.";if(!le.includes(e.role))return"Selecciona un rol válido.";if(!ce.includes(e.status))return"Selecciona un estado válido.";if(l.profiles.find(r=>r.id!==t?.id&&ie(r.username)===ie(e.username)))return"Ya existe un usuario con ese nombre de usuario.";const a=Y(e.blocked);if(t?.id===l.profile?.id&&t.role==="Administrador"){if(e.status!=="Activo")return"No puedes desactivar tu propio usuario administrador.";if(e.role!=="Administrador")return"No puedes quitarte el rol Administrador desde tu propia sesión.";if(a)return"No puedes bloquear tu propio usuario administrador."}return t&&Ot(t.id,e.role,e.status,a)<1?"Debe quedar al menos un administrador activo.":""}function Le(e=null){const t=!!e,s=`
    <form id="userForm" class="form-grid">
      ${t?"":`
        <div class="field form-full">
          <label>Contraseña inicial</label>
          <input name="password" type="password" required autocomplete="new-password">
        </div>
      `}
      ${f("username","Usuario",e?.username||"")}
      ${f("display_name","Nombre",e?.display_name||"")}
      ${f("role","Rol",e?.role||"Auditor","select",le)}
      ${f("status","Estado",e?.status||"Activo","select",ce)}
      ${f("blocked","Bloqueado",H(!!e?.blocked),"select",re)}
      ${f("must_change_password","Debe cambiar password",H(e?!!e.must_change_password:!0),"select",re)}
      <button class="btn primary form-full" type="submit">${t?"Guardar cambios":"Crear usuario"}</button>
    </form>
  `,a=C(t?`Editar ${e.username||"usuario"}`:"Nuevo usuario",s);a.querySelector("#userForm").addEventListener("submit",async r=>{r.preventDefault();const i=N(r.currentTarget),n=he(i,e);if(n){b(n);return}try{await Dt(i,e),a.close()}catch(d){console.error(d),b(dt(d))}})}async function Dt(e,t=null){const s={username:e.username,display_name:e.display_name,role:e.role,status:e.status,blocked:Y(e.blocked),must_change_password:Y(e.must_change_password)};t||(s.password=e.password);const a=await S(await g.rpc("app_save_user",{p_token:P(),p_user_id:t?.id||null,p_user:s}),t?"No se pudo actualizar el usuario.":"No se pudo crear el usuario.");if(!a?.ok)throw new Error(a?.reason||"No se pudo guardar el usuario.");b(t?"Usuario actualizado.":"Usuario creado."),await D()}async function Tt(e){if(!e)return;const t=e.status==="Activo"?"Inactivo":"Activo",s=he({...e,status:t},e);if(s){b(s);return}try{const a=await S(await g.rpc("app_toggle_user_status",{p_token:P(),p_user_id:e.id}),"No se pudo cambiar el estado.");if(!a?.ok)throw new Error(a?.reason||"No se pudo cambiar el estado.");b(`Usuario ${t.toLowerCase()}.`),await D()}catch(a){console.error(a),b("No fue posible cambiar el estado del usuario.")}}async function kt(e){if(!e)return;const t=!e.blocked,s=he({...e,blocked:H(t)},e);if(s){b(s);return}try{const a=await S(await g.rpc("app_toggle_user_blocked",{p_token:P(),p_user_id:e.id}),"No se pudo cambiar el bloqueo.");if(!a?.ok)throw new Error(a?.reason||"No se pudo cambiar el bloqueo.");b(t?"Usuario bloqueado.":"Usuario desbloqueado."),await D()}catch(a){console.error(a),b("No fue posible cambiar el bloqueo del usuario.")}}function jt(e){if(!e)return;C(`Contraseña de ${e.username||"usuario"}`,`
    <form id="resetPasswordForm" class="form-grid" autocomplete="off">
      <div class="field form-full">
        <label>Nueva contraseña temporal</label>
        <input name="password" type="password" required autocomplete="new-password">
      </div>
      ${f("must_change_password","Debe cambiar password","Sí","select",re,"form-full")}
      <button class="btn primary form-full" type="submit">Restablecer contraseña</button>
    </form>
  `).querySelector("#resetPasswordForm").addEventListener("submit",s=>{s.preventDefault();const a=N(s.currentTarget);It(e,a.password,Y(a.must_change_password)).catch(r=>{console.error(r),b("No fue posible registrar el restablecimiento.")})})}async function It(e,t="",s=!0){if(!e)return;if(w(t).length<8){b("La contraseña temporal debe tener al menos 8 caracteres.");return}const a=await S(await g.rpc("app_admin_reset_password",{p_token:P(),p_user_id:e.id,p_new_password:t,p_must_change_password:s}),"No se pudo restablecer la contraseña.");if(!a?.ok)throw new Error(a?.reason||"No se pudo restablecer la contraseña.");document.querySelector("#modal")?.close(),b("Contraseña restablecida."),await D()}function Nt(e){if(!e)return;const t=l.audit.filter(s=>w(s.changed_field).includes(`Usuario: ${e.username}`));C(`Bitácora de ${e.username||"usuario"}`,`
    <div class="timeline">
      ${t.map(s=>`
        <div class="timeline-item">
          <b>${o(s.action)}</b> · <span class="muted">${o(O(s.occurred_at,!0))}</span>
          <p>${o(s.comment||"")}</p>
          <p class="muted">${o(U(s.old_value,140))} → ${o(U(s.new_value,140))}</p>
        </div>
      `).join("")||'<div class="empty">Sin movimientos registrados para este usuario.</div>'}
    </div>
  `)}async function Rt(e){const t=e.due_at||ue(e.priority),s={id:nt(),...e,due_at:t,actual_due_at:t,created_by:l.profile?.id,updated_by:l.profile?.id,created_at:F(),updated_at:F()};await S(await g.from("incidents").insert(s),"No se pudo crear la incidencia."),await fe(s.id,"Creación","Incidencia","","Creada","Incidencia creada.",s),b("Incidencia creada."),await D()}async function te(e,t,s,a){if(!e)return;const r={...t,updated_by:l.profile?.id,updated_at:F()};r.status&&_.includes(r.status)&&!e.closed_at&&(r.closed_at=F()),r.status&&!_.includes(r.status)&&(r.closed_at=null),await S(await g.from("incidents").update(r).eq("id",e.id),"No se pudo actualizar.");for(const[i,n]of Object.entries(t))String(e[i]??"")!==String(n??"")&&await fe(e.id,s,i,e[i],n,a,{...e,...r});b("Cambios guardados."),await D()}async function fe(e,t,s,a,r,i,n){await g.from("audit_log").insert({incident_id:e,user_id:l.profile?.id,legacy_user:l.profile?.display_name||l.profile?.username||"Usuario",action:t,changed_field:s,old_value:a??"",new_value:r??"",comment:i,hotel:n?.hotel||"",status:n?.status||""})}function qt(e){C(`Detalle ${e.id}`,`
    <div class="selected-card">
      <div>${y(e.priority)} ${y(e.status)} ${y(L(e).label,L(e).cls)}</div>
      <p><b>División:</b> ${o(e.hotel||"")}</p>
      <p><b>Departamento:</b> ${o(e.department||"")}</p>
      <p><b>Responsable:</b> ${o(e.responsible||"Sin asignar")}</p>
      <p><b>Asunto:</b> ${o(e.subject||"")}</p>
      <p><b>Descripción:</b><br>${o(e.description||"")}</p>
      <p><b>Causa raíz:</b> ${o(e.root_cause||"")}</p>
      <p><b>Acción tomada:</b> ${o(e.action_taken||"")}</p>
      <p><b>Comentario final:</b> ${o(e.final_comment||"")}</p>
    </div>
    <h3>Bitácora</h3>
    <div class="timeline">
      ${l.audit.filter(t=>t.incident_id===e.id).map(t=>`
        <div class="timeline-item">
          <b>${o(t.action)}</b> · <span class="muted">${o(O(t.occurred_at,!0))}</span>
          <p>${o(t.changed_field||"General")}: ${o(t.old_value||"")} → ${o(t.new_value||"")}</p>
          <p>${o(t.comment||"")}</p>
        </div>
      `).join("")||'<div class="empty">Sin movimientos.</div>'}
    </div>
  `)}function xt(e){const t=C(`Comentar ${e.id}`,`
    <form id="commentForm" class="form-grid">
      ${f("comment","Comentario","","textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">Guardar comentario</button>
    </form>
  `);t.querySelector("#commentForm").addEventListener("submit",async s=>{s.preventDefault();const a=N(s.currentTarget);await fe(e.id,"Comentario","Comentario","",a.comment,a.comment,e),b("Comentario guardado."),t.close(),await D()})}function xe(e){const t=C(`Cerrar ${e.id}`,`
    <form id="closeForm" class="form-grid">
      ${f("root_cause","Causa raíz",e.root_cause,"select",T("Causa raíz"))}
      ${f("action_taken","Acción tomada",e.action_taken,"select",T("Acción tomada"))}
      ${f("close_reason","Motivo de cierre",e.close_reason)}
      ${f("final_comment","Comentario final",e.final_comment,"textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">Cerrar incidencia</button>
    </form>
  `);t.querySelector("#closeForm").addEventListener("submit",async s=>{s.preventDefault();const a=N(s.currentTarget);if(!a.root_cause||!a.action_taken||!a.final_comment){b("Causa raíz, acción tomada y comentario final son obligatorios.");return}await te(e,{...a,status:"Cerrado",closed_at:F()},"Cierre formal",a.final_comment),t.close()})}function Me(e){const t=C(`Reabrir ${e.id}`,`
    <form id="reopenForm" class="form-grid">
      ${f("status","Nuevo estatus","En proceso","select",k.filter(s=>!_.includes(s)))}
      ${f("comment","Motivo de reapertura","","textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">Reabrir incidencia</button>
    </form>
  `);t.querySelector("#reopenForm").addEventListener("submit",async s=>{s.preventDefault();const a=N(s.currentTarget);if(!a.comment){b("El motivo es obligatorio.");return}await te(e,{status:a.status,closed_at:null},"Reapertura",a.comment),t.close()})}function Mt(){const e=C("Nuevo valor de catálogo",`
    <form id="catalogForm" class="form-grid">
      ${f("category","Categoría","","select",Object.keys(Te))}
      ${f("value","Valor","")}
      <button class="btn primary form-full" type="submit">Guardar</button>
    </form>
  `);e.querySelector("#catalogForm").addEventListener("submit",async t=>{t.preventDefault();const s=N(t.currentTarget);await S(await g.from("catalogs").insert(s),"No se pudo guardar el catálogo."),b("Catálogo guardado."),e.close(),await D()})}function Ft(e){const s=[["ID","Fecha","División","Departamento","Asunto","Tipo","Prioridad","Estatus","Responsable","SLA","Descripción"].join(","),...e.map(n=>[n.id,O(n.created_at),n.hotel,n.department,n.subject,n.incident_type,n.priority,n.status,n.responsible,L(n).label,n.description].map(d=>`"${String(d??"").replaceAll('"','""')}"`).join(","))],a=new Blob([s.join(`
`)],{type:"text/csv;charset=utf-8"}),r=URL.createObjectURL(a),i=document.createElement("a");i.href=r,i.download="incidencias_filtradas.csv",i.click(),URL.revokeObjectURL(r)}async function D(){await X(),q()}ut().catch(e=>{console.error(e),z.innerHTML=`<main class="config-shell"><section class="config-card"><div class="error">${o(e.message)}</div></section></main>`});
