(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))s(r);new MutationObserver(r=>{for(const i of r)if(i.type==="childList")for(const n of i.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function a(r){const i={};return r.integrity&&(i.integrity=r.integrity),r.referrerPolicy&&(i.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?i.credentials="include":r.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(r){if(r.ep)return;r.ep=!0;const i=a(r);fetch(r.href,i)}})();const Ce=3,ve=e=>Math.min(1e3*2**e,3e4),Be=[520,503],Ee=["GET","HEAD","OPTIONS"];var ge=class extends Error{constructor(e){super(e.message),this.name="PostgrestError",this.details=e.details,this.hint=e.hint,this.code=e.code}toJSON(){return{name:this.name,message:this.message,details:this.details,hint:this.hint,code:this.code}}};function ye(e,t){return new Promise(a=>{if(t?.aborted){a();return}const s=setTimeout(()=>{t?.removeEventListener("abort",r),a()},e);function r(){clearTimeout(s),a()}t?.addEventListener("abort",r)})}function He(e,t,a,s){return!(!s||a>=Ce||!Ee.includes(e)||!Be.includes(t))}var ze=class{constructor(e){var t,a,s,r,i;this.shouldThrowOnError=!1,this.retryEnabled=!0,this.method=e.method,this.url=e.url,this.headers=new Headers(e.headers),this.schema=e.schema,this.body=e.body,this.shouldThrowOnError=(t=e.shouldThrowOnError)!==null&&t!==void 0?t:!1,this.signal=e.signal,this.isMaybeSingle=(a=e.isMaybeSingle)!==null&&a!==void 0?a:!1,this.shouldStripNulls=(s=e.shouldStripNulls)!==null&&s!==void 0?s:!1,this.urlLengthLimit=(r=e.urlLengthLimit)!==null&&r!==void 0?r:8e3,this.retryEnabled=(i=e.retry)!==null&&i!==void 0?i:!0,e.fetch?this.fetch=e.fetch:this.fetch=fetch}throwOnError(){return this.shouldThrowOnError=!0,this}stripNulls(){if(this.headers.get("Accept")==="text/csv")throw new Error("stripNulls() cannot be used with csv()");return this.shouldStripNulls=!0,this}setHeader(e,t){return this.headers=new Headers(this.headers),this.headers.set(e,t),this}retry(e){return this.retryEnabled=e,this}then(e,t){var a=this;if(this.schema===void 0||(["GET","HEAD"].includes(this.method)?this.headers.set("Accept-Profile",this.schema):this.headers.set("Content-Profile",this.schema)),this.method!=="GET"&&this.method!=="HEAD"&&this.headers.set("Content-Type","application/json"),this.shouldStripNulls){const n=this.headers.get("Accept");n==="application/vnd.pgrst.object+json"?this.headers.set("Accept","application/vnd.pgrst.object+json;nulls=stripped"):(!n||n==="application/json")&&this.headers.set("Accept","application/vnd.pgrst.array+json;nulls=stripped")}const s=this.fetch;let i=(async()=>{let n=0;for(;;){const u={};a.headers.forEach((c,h)=>{u[h]=c}),n>0&&(u["X-Retry-Count"]=String(n));let m;try{m=await s(a.url.toString(),{method:a.method,headers:u,body:JSON.stringify(a.body,(c,h)=>typeof h=="bigint"?h.toString():h),signal:a.signal})}catch(c){if(c?.name==="AbortError"||c?.code==="ABORT_ERR"||!Ee.includes(a.method))throw c;if(a.retryEnabled&&n<Ce){const h=ve(n);n++,await ye(h,a.signal);continue}throw c}if(He(a.method,m.status,n,a.retryEnabled)){var d,p;const c=(d=(p=m.headers)===null||p===void 0?void 0:p.get("Retry-After"))!==null&&d!==void 0?d:null,h=c!==null?Math.max(0,parseInt(c,10)||0)*1e3:ve(n);await m.text(),n++,await ye(h,a.signal);continue}return await a.processResponse(m)}})();return this.shouldThrowOnError||(i=i.catch(n=>{var d;let p="",u="",m="";const c=n?.cause;if(c){var h,v,y,ae;const Ue=(h=c?.message)!==null&&h!==void 0?h:"",be=(v=c?.code)!==null&&v!==void 0?v:"";p=`${(y=n?.name)!==null&&y!==void 0?y:"FetchError"}: ${n?.message}`,p+=`

Caused by: ${(ae=c?.name)!==null&&ae!==void 0?ae:"Error"}: ${Ue}`,be&&(p+=` (${be})`),c?.stack&&(p+=`
${c.stack}`)}else{var se;p=(se=n?.stack)!==null&&se!==void 0?se:""}const V=this.url.toString().length;return n?.name==="AbortError"||n?.code==="ABORT_ERR"?(m="",u="Request was aborted (timeout or manual cancellation)",V>this.urlLengthLimit&&(u+=`. Note: Your request URL is ${V} characters, which may exceed server limits. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [many IDs])), consider using an RPC function to pass values server-side.`)):(c?.name==="HeadersOverflowError"||c?.code==="UND_ERR_HEADERS_OVERFLOW")&&(m="",u="HTTP headers exceeded server limits (typically 16KB)",V>this.urlLengthLimit&&(u+=`. Your request URL is ${V} characters. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [200+ IDs])), consider using an RPC function instead.`)),{success:!1,error:{message:`${(d=n?.name)!==null&&d!==void 0?d:"FetchError"}: ${n?.message}`,details:p,hint:u,code:m},data:null,count:null,status:0,statusText:""}})),i.then(e,t)}async processResponse(e){var t=this;let a=null,s=null,r=null,i=e.status,n=e.statusText;if(e.ok){var d,p;if(t.method!=="HEAD"){var u;const h=await e.text();if(h!=="")if(t.headers.get("Accept")==="text/csv")s=h;else if(t.headers.get("Accept")&&(!((u=t.headers.get("Accept"))===null||u===void 0)&&u.includes("application/vnd.pgrst.plan+text")))s=h;else try{s=JSON.parse(h)}catch{if(a={message:h},s=null,t.shouldThrowOnError)throw new ge({message:h,details:"",hint:"",code:""})}}const m=(d=t.headers.get("Prefer"))===null||d===void 0?void 0:d.match(/count=(exact|planned|estimated)/),c=(p=e.headers.get("content-range"))===null||p===void 0?void 0:p.split("/");m&&c&&c.length>1&&(r=parseInt(c[1])),t.isMaybeSingle&&Array.isArray(s)&&(s.length>1?(a={code:"PGRST116",details:`Results contain ${s.length} rows, application/vnd.pgrst.object+json requires 1 row`,hint:null,message:"JSON object requested, multiple (or no) rows returned"},s=null,r=null,i=406,n="Not Acceptable"):s.length===1?s=s[0]:s=null)}else{const m=await e.text();try{a=JSON.parse(m),Array.isArray(a)&&e.status===404&&(s=[],a=null,i=200,n="OK")}catch{e.status===404&&m===""?(i=204,n="No Content"):a={message:m}}if(a&&t.shouldThrowOnError)throw new ge(a)}return{success:a===null,error:a,data:s,count:r,status:i,statusText:n}}returns(){return this}overrideTypes(){return this}},Ve=class extends ze{throwOnError(){return super.throwOnError()}select(e){let t=!1;const a=(e??"*").split("").map(s=>/\s/.test(s)&&!t?"":(s==='"'&&(t=!t),s)).join("");return this.url.searchParams.set("select",a),this.headers.append("Prefer","return=representation"),this}order(e,{ascending:t=!0,nullsFirst:a,foreignTable:s,referencedTable:r=s}={}){const i=r?`${r}.order`:"order",n=this.url.searchParams.get(i);return this.url.searchParams.set(i,`${n?`${n},`:""}${e}.${t?"asc":"desc"}${a===void 0?"":a?".nullsfirst":".nullslast"}`),this}limit(e,{foreignTable:t,referencedTable:a=t}={}){const s=typeof a>"u"?"limit":`${a}.limit`;return this.url.searchParams.set(s,`${e}`),this}range(e,t,{foreignTable:a,referencedTable:s=a}={}){const r=typeof s>"u"?"offset":`${s}.offset`,i=typeof s>"u"?"limit":`${s}.limit`;return this.url.searchParams.set(r,`${e}`),this.url.searchParams.set(i,`${t-e+1}`),this}abortSignal(e){return this.signal=e,this}single(){return this.headers.set("Accept","application/vnd.pgrst.object+json"),this}maybeSingle(){return this.isMaybeSingle=!0,this}csv(){return this.headers.set("Accept","text/csv"),this}geojson(){return this.headers.set("Accept","application/geo+json"),this}explain({analyze:e=!1,verbose:t=!1,settings:a=!1,buffers:s=!1,wal:r=!1,format:i="text"}={}){var n;const d=[e?"analyze":null,t?"verbose":null,a?"settings":null,s?"buffers":null,r?"wal":null].filter(Boolean).join("|"),p=(n=this.headers.get("Accept"))!==null&&n!==void 0?n:"application/json";return this.headers.set("Accept",`application/vnd.pgrst.plan+${i}; for="${p}"; options=${d};`),i==="json"?this:this}rollback(){return this.headers.append("Prefer","tx=rollback"),this}returns(){return this}maxAffected(e){return this.headers.append("Prefer","handling=strict"),this.headers.append("Prefer",`max-affected=${e}`),this}};const $e=new RegExp("[,()]");var I=class extends Ve{throwOnError(){return super.throwOnError()}eq(e,t){return this.url.searchParams.append(e,`eq.${t}`),this}neq(e,t){return this.url.searchParams.append(e,`neq.${t}`),this}gt(e,t){return this.url.searchParams.append(e,`gt.${t}`),this}gte(e,t){return this.url.searchParams.append(e,`gte.${t}`),this}lt(e,t){return this.url.searchParams.append(e,`lt.${t}`),this}lte(e,t){return this.url.searchParams.append(e,`lte.${t}`),this}like(e,t){return this.url.searchParams.append(e,`like.${t}`),this}likeAllOf(e,t){return this.url.searchParams.append(e,`like(all).{${t.join(",")}}`),this}likeAnyOf(e,t){return this.url.searchParams.append(e,`like(any).{${t.join(",")}}`),this}ilike(e,t){return this.url.searchParams.append(e,`ilike.${t}`),this}ilikeAllOf(e,t){return this.url.searchParams.append(e,`ilike(all).{${t.join(",")}}`),this}ilikeAnyOf(e,t){return this.url.searchParams.append(e,`ilike(any).{${t.join(",")}}`),this}regexMatch(e,t){return this.url.searchParams.append(e,`match.${t}`),this}regexIMatch(e,t){return this.url.searchParams.append(e,`imatch.${t}`),this}is(e,t){return this.url.searchParams.append(e,`is.${t}`),this}isDistinct(e,t){return this.url.searchParams.append(e,`isdistinct.${t}`),this}in(e,t){const a=Array.from(new Set(t)).map(s=>typeof s=="string"&&$e.test(s)?`"${s}"`:`${s}`).join(",");return this.url.searchParams.append(e,`in.(${a})`),this}notIn(e,t){const a=Array.from(new Set(t)).map(s=>typeof s=="string"&&$e.test(s)?`"${s}"`:`${s}`).join(",");return this.url.searchParams.append(e,`not.in.(${a})`),this}contains(e,t){return typeof t=="string"?this.url.searchParams.append(e,`cs.${t}`):Array.isArray(t)?this.url.searchParams.append(e,`cs.{${t.join(",")}}`):this.url.searchParams.append(e,`cs.${JSON.stringify(t)}`),this}containedBy(e,t){return typeof t=="string"?this.url.searchParams.append(e,`cd.${t}`):Array.isArray(t)?this.url.searchParams.append(e,`cd.{${t.join(",")}}`):this.url.searchParams.append(e,`cd.${JSON.stringify(t)}`),this}rangeGt(e,t){return this.url.searchParams.append(e,`sr.${t}`),this}rangeGte(e,t){return this.url.searchParams.append(e,`nxl.${t}`),this}rangeLt(e,t){return this.url.searchParams.append(e,`sl.${t}`),this}rangeLte(e,t){return this.url.searchParams.append(e,`nxr.${t}`),this}rangeAdjacent(e,t){return this.url.searchParams.append(e,`adj.${t}`),this}overlaps(e,t){return typeof t=="string"?this.url.searchParams.append(e,`ov.${t}`):this.url.searchParams.append(e,`ov.{${t.join(",")}}`),this}textSearch(e,t,{config:a,type:s}={}){let r="";s==="plain"?r="pl":s==="phrase"?r="ph":s==="websearch"&&(r="w");const i=a===void 0?"":`(${a})`;return this.url.searchParams.append(e,`${r}fts${i}.${t}`),this}match(e){return Object.entries(e).filter(([t,a])=>a!==void 0).forEach(([t,a])=>{this.url.searchParams.append(t,`eq.${a}`)}),this}not(e,t,a){return this.url.searchParams.append(e,`not.${t}.${a}`),this}or(e,{foreignTable:t,referencedTable:a=t}={}){const s=a?`${a}.or`:"or";return this.url.searchParams.append(s,`(${e})`),this}filter(e,t,a){return this.url.searchParams.append(e,`${t}.${a}`),this}},Ge=class{constructor(e,{headers:t={},schema:a,fetch:s,urlLengthLimit:r=8e3,retry:i}){this.url=e,this.headers=new Headers(t),this.schema=a,this.fetch=s,this.urlLengthLimit=r,this.retry=i}cloneRequestState(){return{url:new URL(this.url.toString()),headers:new Headers(this.headers)}}select(e,t){const{head:a=!1,count:s}=t??{},r=a?"HEAD":"GET";let i=!1;const n=(e??"*").split("").map(u=>/\s/.test(u)&&!i?"":(u==='"'&&(i=!i),u)).join(""),{url:d,headers:p}=this.cloneRequestState();return d.searchParams.set("select",n),s&&p.append("Prefer",`count=${s}`),new I({method:r,url:d,headers:p,schema:this.schema,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}insert(e,{count:t,defaultToNull:a=!0}={}){var s;const r="POST",{url:i,headers:n}=this.cloneRequestState();if(t&&n.append("Prefer",`count=${t}`),a||n.append("Prefer","missing=default"),Array.isArray(e)){const d=e.reduce((p,u)=>p.concat(Object.keys(u)),[]);if(d.length>0){const p=[...new Set(d)].map(u=>`"${u}"`);i.searchParams.set("columns",p.join(","))}}return new I({method:r,url:i,headers:n,schema:this.schema,body:e,fetch:(s=this.fetch)!==null&&s!==void 0?s:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}upsert(e,{onConflict:t,ignoreDuplicates:a=!1,count:s,defaultToNull:r=!0}={}){var i;const n="POST",{url:d,headers:p}=this.cloneRequestState();if(p.append("Prefer",`resolution=${a?"ignore":"merge"}-duplicates`),t!==void 0&&d.searchParams.set("on_conflict",t),s&&p.append("Prefer",`count=${s}`),r||p.append("Prefer","missing=default"),Array.isArray(e)){const u=e.reduce((m,c)=>m.concat(Object.keys(c)),[]);if(u.length>0){const m=[...new Set(u)].map(c=>`"${c}"`);d.searchParams.set("columns",m.join(","))}}return new I({method:n,url:d,headers:p,schema:this.schema,body:e,fetch:(i=this.fetch)!==null&&i!==void 0?i:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}update(e,{count:t}={}){var a;const s="PATCH",{url:r,headers:i}=this.cloneRequestState();return t&&i.append("Prefer",`count=${t}`),new I({method:s,url:r,headers:i,schema:this.schema,body:e,fetch:(a=this.fetch)!==null&&a!==void 0?a:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}delete({count:e}={}){var t;const a="DELETE",{url:s,headers:r}=this.cloneRequestState();return e&&r.append("Prefer",`count=${e}`),new I({method:a,url:s,headers:r,schema:this.schema,fetch:(t=this.fetch)!==null&&t!==void 0?t:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};function x(e){"@babel/helpers - typeof";return x=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},x(e)}function Ke(e,t){if(x(e)!="object"||!e)return e;var a=e[Symbol.toPrimitive];if(a!==void 0){var s=a.call(e,t);if(x(s)!="object")return s;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function Je(e){var t=Ke(e,"string");return x(t)=="symbol"?t:t+""}function Ye(e,t,a){return(t=Je(t))in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function _e(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);t&&(s=s.filter(function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable})),a.push.apply(a,s)}return a}function G(e){for(var t=1;t<arguments.length;t++){var a=arguments[t]!=null?arguments[t]:{};t%2?_e(Object(a),!0).forEach(function(s){Ye(e,s,a[s])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):_e(Object(a)).forEach(function(s){Object.defineProperty(e,s,Object.getOwnPropertyDescriptor(a,s))})}return e}var We=class Oe{constructor(t,{headers:a={},schema:s,fetch:r,timeout:i,urlLengthLimit:n=8e3,retry:d}={}){this.url=t,this.headers=new Headers(a),this.schemaName=s,this.urlLengthLimit=n;const p=r??globalThis.fetch;i!==void 0&&i>0?this.fetch=(u,m)=>{const c=new AbortController,h=setTimeout(()=>c.abort(),i),v=m?.signal;if(v){if(v.aborted)return clearTimeout(h),p(u,m);const y=()=>{clearTimeout(h),c.abort()};return v.addEventListener("abort",y,{once:!0}),p(u,G(G({},m),{},{signal:c.signal})).finally(()=>{clearTimeout(h),v.removeEventListener("abort",y)})}return p(u,G(G({},m),{},{signal:c.signal})).finally(()=>clearTimeout(h))}:this.fetch=p,this.retry=d}from(t){if(!t||typeof t!="string"||t.trim()==="")throw new Error("Invalid relation name: relation must be a non-empty string.");return new Ge(new URL(`${this.url}/${t}`),{headers:new Headers(this.headers),schema:this.schemaName,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}schema(t){return new Oe(this.url,{headers:this.headers,schema:t,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}rpc(t,a={},{head:s=!1,get:r=!1,count:i}={}){var n;let d;const p=new URL(`${this.url}/rpc/${t}`);let u;const m=v=>v!==null&&typeof v=="object"&&(!Array.isArray(v)||v.some(m)),c=s&&Object.values(a).some(m);c?(d="POST",u=a):s||r?(d=s?"HEAD":"GET",Object.entries(a).filter(([v,y])=>y!==void 0).map(([v,y])=>[v,Array.isArray(y)?`{${y.join(",")}}`:`${y}`]).forEach(([v,y])=>{p.searchParams.append(v,y)})):(d="POST",u=a);const h=new Headers(this.headers);return c?h.set("Prefer",i?`count=${i},return=minimal`:"return=minimal"):i&&h.set("Prefer",`count=${i}`),new I({method:d,url:p,headers:h,schema:this.schemaName,body:u,fetch:(n=this.fetch)!==null&&n!==void 0?n:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};const Qe="https://plqszwbcgsoxfaufudgn.supabase.co",Se="sb_publishable_a34RnPQKgZS_TgHSp0CfBg_5BR3FFJi",j=["Pendiente","En proceso","En espera de respuesta","Escalado","Resuelto","Cerrado"],$=["Resuelto","Cerrado"],oe=["Baja","Media","Alta","Crítica"],le=["Administrador","Supervisor","Auditor","Consulta"],ce=["Activo","Inactivo"],re=["No","Sí"],Ze={Crítica:1,Critica:1,Alta:2,Media:3,Baja:5},q="auditoriaPendientes.session",Xe="x-app-session-token",et="id, username, display_name, role, status, last_access_at, failed_attempts, blocked, must_change_password, created_at, updated_at",De="********",Te={División:["5910 - PPRL","5911 - ZEL","5917 - MPCB","5918 - MCB","5930 - PGC"],Departamento:["Recepción","Reservas","A&B","Spa","Contabilidad","IT","Club Meliá","Auditoría Nocturna","Auditoría Diurna"],"Área Responsable":["Operaciones","Finanzas","Contabilidad","Revenue","Sistemas","Auditoría"],"Tipo de Incidencia":["Cobro no realizado","Routing incorrecto","Check-in mal procesado","Rate Code incorrecto","Factura no volcada a SAP","Diferencia POS vs PMS","Resort Credit incorrecto","HTC incorrecto","Falta de soporte","Incidencia IT"],Impacto:["Operativo","Financiero","Contable","Cliente","Sistema"],Prioridad:oe,Estatus:j,"Causa raíz":["Error operativo","Falta de soporte","Configuración incorrecta","Proceso incompleto","Incidencia de sistema"],"Acción tomada":["Corrección en PMS","Corrección contable","Escalamiento a IT","Capacitación al equipo","Validación documental"]},H=document.querySelector("#app");let g=je();const l={session:null,profile:null,page:"dashboard",loading:!0,incidents:[],audit:[],profiles:[],catalogs:[],filters:{hotel:"",department:"",priority:"",status:"",responsible:"",type:"",search:""},userFilters:{search:"",role:"",status:""}};function je(e=""){const t={apikey:Se,Authorization:`Bearer ${Se}`};return e&&(t[Xe]=e),new We(`${Qe}/rest/v1`,{headers:t,schema:"public"})}const o=e=>String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"),S=e=>String(e??"").trim(),ie=e=>S(e).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""),tt=e=>S(e).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"sin-dato",L=(e,t=!1)=>{if(!e)return"";const a=new Date(e);return Number.isNaN(a.getTime())?String(e):new Intl.DateTimeFormat("es-DO",{day:"2-digit",month:"2-digit",year:"numeric",...t?{hour:"2-digit",minute:"2-digit"}:{}}).format(a)},at=()=>new Date().toISOString().slice(0,10),M=()=>new Date().toISOString(),w=(e,t="")=>`<span class="badge ${tt(e)} ${t}">${o(e||"Sin dato")}</span>`,F=(e,t=120)=>S(e).length>t?`${S(e).slice(0,t-3)}...`:S(e),U=()=>l.profile?.role||"Auditor",de=()=>U()==="Administrador",Ne=()=>U()==="Supervisor",ke=()=>de(),st=()=>de()||Ne(),B=e=>e?"Sí":"No",Y=e=>["si","sí","true","1","yes"].includes(ie(e)),rt=e=>({...e,password_mask:De});function it(){try{const e=JSON.parse(localStorage.getItem(q)||"null");return!e?.token||!e?.expires_at?null:new Date(e.expires_at).getTime()<=Date.now()?(localStorage.removeItem(q),null):{token:e.token,expires_at:e.expires_at}}catch{return localStorage.removeItem(q),null}}function nt(e){if(!e?.token){localStorage.removeItem(q);return}localStorage.setItem(q,JSON.stringify({token:e.token,expires_at:e.expires_at}))}function N(e){l.session=e,g=je(e?.token||""),nt(e)}function A(){return l.session?.token||""}function ot(){return`INC-${new Date().toISOString().replace(/[-:TZ.]/g,"").slice(0,14)}-${Math.random().toString(16).slice(2,6).toUpperCase()}`}function ue(e,t=new Date){const a=new Date(t),s=Ze[e]??3;return a.setDate(a.getDate()+s),a.toISOString().slice(0,10)}function O(e){const t=S(e.status),a=e.actual_due_at||e.due_at||ue(e.priority||"Media",e.created_at),s=new Date(`${a}T00:00:00`);if($.includes(t)){if(!e.closed_at||Number.isNaN(s.getTime()))return{label:"Cerrado",days:null,met:!0,cls:"cerrado"};const d=new Date(e.closed_at)<=new Date(`${a}T23:59:59`);return{label:d?"Cerrado en SLA":"Cerrado fuera SLA",days:null,met:d,cls:d?"cerrado":"vencido"}}const r=new Date(`${at()}T00:00:00`),i=Math.ceil((s-r)/864e5);return i<0?{label:`Vencido ${Math.abs(i)}d`,days:i,met:!1,cls:"vencido"}:i===0?{label:"Vence hoy",days:i,met:!0,cls:"media"}:i===1?{label:"Vence en 1d",days:i,met:!0,cls:"media"}:{label:`En tiempo (${i}d)`,days:i,met:!0,cls:"baja"}}function P(e,t="edit"){if(de())return!0;if(Ne())return["edit","comment","close","reopen","status"].includes(t);if(U()==="Consulta")return!1;if(t==="create"||t==="comment")return!0;if(!["edit","status"].includes(t)||!e)return!1;const a=l.profile?.id;return e.created_by===a||e.assigned_to===a}function lt(e){return $.includes(e.status)?j.filter(t=>$.includes(t)||P(e,"reopen")):j.filter(t=>!$.includes(t)||P(e,"close"))}function T(e){const t=e==="División"?["División","Hotel"]:[e],a=l.catalogs.filter(s=>t.includes(s.category)).map(s=>s.value).filter(Boolean);return a.length?[...new Set(a)].sort():Te[e]||[]}function ct(e){return e==="Hotel"?"División":e}function Z(e,t=""){return[...new Set([t,...e].filter(Boolean))].map(s=>`<option value="${o(s)}" ${s===t?"selected":""}>${o(s)}</option>`).join("")}function b(e){const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),2600)}async function _(e,t="No se pudo completar la operación."){if(e.error)throw new Error(e.error.message||t);return e.data}function Re(e){const t=String(e?.reason||e?.message||"").toLowerCase();return t.includes("inactive")?"Usuario inactivo. Contacte al administrador.":t.includes("blocked")?"Usuario bloqueado. Contacte al administrador.":t.includes("weak_password")?"La nueva contraseña debe tener al menos 8 caracteres.":"Usuario o contraseña incorrectos."}function dt(e){const t=String(e?.message||"");return t.toLowerCase().includes("sesión")?"La sesión venció. Inicie sesión nuevamente.":t.toLowerCase().includes("inactivo")?"Usuario inactivo. Contacte al administrador.":t.toLowerCase().includes("bloqueado")?"Usuario bloqueado. Contacte al administrador.":"No fue posible cargar el sistema. Intente nuevamente o contacte al administrador."}function ut(e){const t=String(e?.message||e?.reason||"").trim(),a=t.toLowerCase();return a.includes("duplicate_username")?"Ya existe un usuario con ese nombre de usuario.":a.includes("weak_password")?"La contraseña inicial debe tener al menos 8 caracteres.":a.includes("legacy_user")?"Falta actualizar la tabla audit_log en Supabase. Ejecuta el SQL actualizado y vuelve a intentar.":a.includes("forbidden")?"No tienes permisos para guardar usuarios.":t?`No fue posible guardar el usuario: ${t}`:"No fue posible guardar el usuario. Verifica los datos e intenta nuevamente."}function pe(){l.session=null,l.profile=null,l.incidents=[],l.audit=[],l.profiles=[]}async function pt(){if(!g){mt();return}const e=it();if(!e){l.loading=!1,W();return}N(e);try{if(await qe(),l.profile?.must_change_password){l.loading=!1,Q();return}await X(),z()}catch(t){console.error(t),N(null),pe(),W(dt(t))}}function mt(){H.innerHTML=`
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
  `}function W(e=""){H.innerHTML=`
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
  `,document.querySelector("#loginForm").addEventListener("submit",async t=>{t.preventDefault();const a=new FormData(t.currentTarget);try{await ht(a.get("login"),a.get("password"))}catch(s){console.warn("Login failed",s),N(null),pe(),W(Re(s))}})}function Q(e=""){H.innerHTML=`
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
  `,document.querySelector("#passwordLogoutBtn").addEventListener("click",Ie),document.querySelector("#passwordChangeForm").addEventListener("submit",async t=>{t.preventDefault();const a=new FormData(t.currentTarget),s=String(a.get("new_password")||"");if(s!==String(a.get("confirm_password")||"")){Q("Las contraseñas no coinciden.");return}try{await ft(a.get("current_password"),s),b("Contraseña actualizada."),await X(),z()}catch(r){console.warn("Password change failed",r),Q(Re(r))}})}async function ht(e,t){const a=await _(await g.rpc("app_login",{p_username:S(e),p_password:String(t||"")}),"No fue posible iniciar sesión.");if(!a?.ok){const s=new Error(a?.reason||"invalid_credentials");throw s.reason=a?.reason,s}if(N({token:a.token,expires_at:a.expires_at}),l.profile=a.profile,a.must_change_password||a.profile?.must_change_password){Q();return}await X(),z()}async function ft(e,t){const a=await _(await g.rpc("app_change_password",{p_token:A(),p_current_password:String(e||""),p_new_password:String(t||"")}),"No fue posible cambiar la contraseña.");if(!a?.ok){const s=new Error(a?.reason||"invalid_credentials");throw s.reason=a?.reason,s}l.profile=a.profile,N({token:A(),expires_at:a.expires_at||l.session?.expires_at})}async function Ie(){const e=A();try{e&&await g.rpc("app_logout",{p_token:e})}catch(t){console.warn("Logout failed",t)}N(null),pe(),W()}async function qe(){if(!A())throw new Error("Sesión inválida.");const e=await _(await g.rpc("app_validate_session",{p_token:A()}),"No fue posible validar la sesión.");if(!e?.ok)throw new Error("Sesión inválida.");return l.profile=e.profile,N({token:A(),expires_at:e.expires_at}),l.profile}async function X(){l.loading=!0,await qe();const[e,t,a,s]=await Promise.all([g.from("incidents").select("*").order("created_at",{ascending:!1}),g.from("audit_log").select("*").order("occurred_at",{ascending:!1}).limit(500),g.from("app_users").select(et).order("display_name"),g.from("catalogs").select("*").order("category").order("value")]);l.incidents=await _(e),l.audit=await _(t),l.profiles=(await _(a)).map(rt),l.catalogs=await _(s),l.loading=!1}function z(){const e={dashboard:{label:"Dashboard",icon:"📊"},incidents:{label:"Pendientes",icon:"📋"},kanban:{label:"Kanban",icon:"▦"},audit:{label:"Bitácora",icon:"🧾"},users:{label:"Usuarios",icon:"👥"},catalogs:{label:"Catálogos",icon:"⚙️"}},t=["dashboard","incidents","kanban","audit",...ke()?["users"]:[],...st()?["catalogs"]:[]];H.innerHTML=`
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
          <span>${o(U())}</span>
          <button class="btn ghost" id="logoutBtn">Cerrar sesión</button>
        </div>
      </aside>
      <main class="content">
        <header class="topbar">
          <div>
            <h1>Auditoría Pendientes</h1>
            <div class="muted">Sistema de gestión de incidencias de auditoría</div>
          </div>
          <div class="user-chip">${o(l.profile?.display_name||"")} · ${o(U())}</div>
        </header>
        <section id="page"></section>
      </main>
    </div>
    <dialog class="modal" id="modal"></dialog>
  `,document.querySelectorAll("[data-page]").forEach(a=>{a.addEventListener("click",()=>{l.page=a.dataset.page,z()})}),document.querySelector("#logoutBtn").addEventListener("click",Ie),ne()}function ne(){const e=document.querySelector("#page");l.page==="dashboard"&&(e.innerHTML=bt()),l.page==="incidents"&&(e.innerHTML=vt()),l.page==="kanban"&&(e.innerHTML=$t()),l.page==="audit"&&(e.innerHTML=_t()),l.page==="users"&&(e.innerHTML=St()),l.page==="catalogs"&&(e.innerHTML=Pt()),Ct()}function ee(){return l.incidents.filter(e=>{const t=l.filters,a=`${e.id} ${e.hotel} ${e.department} ${e.subject} ${e.incident_type} ${e.description} ${e.responsible}`.toLowerCase();return(!t.hotel||e.hotel===t.hotel)&&(!t.department||e.department===t.department)&&(!t.priority||e.priority===t.priority)&&(!t.status||e.status===t.status)&&(!t.responsible||e.responsible===t.responsible)&&(!t.type||e.incident_type===t.type)&&(!t.search||a.includes(t.search.toLowerCase()))})}function k(e,t,a=""){return`
    <div class="page-head">
      <div><h2>${o(e)}</h2><div class="muted">${o(t)}</div></div>
      ${a}
    </div>
  `}function me(){const e=l.filters,t=(a,s,r)=>`
    <div class="field">
      <label>${s}</label>
      <select data-filter="${a}">
        <option value="">Todos</option>
        ${Z(r,e[a])}
      </select>
    </div>
  `;return`
    <div class="filters">
      ${t("hotel","División",K("hotel"))}
      ${t("department","Departamento",K("department"))}
      ${t("type","Tipo",K("incident_type"))}
      ${t("priority","Prioridad",oe)}
      ${t("status","Estatus",j)}
      ${t("responsible","Responsable",K("responsible"))}
      <div class="field"><label>Buscar</label><input data-filter="search" value="${o(e.search)}" placeholder="ID, asunto, descripción..."></div>
    </div>
  `}function K(e){return[...new Set(l.incidents.map(t=>S(t[e])).filter(Boolean))].sort()}function bt(){const e=ee(),t=e.filter(u=>!$.includes(u.status)),a=e.filter(u=>$.includes(u.status)),s=t.filter(u=>O(u).days<0),r=e.filter(u=>["Crítica","Critica"].includes(u.priority)),i=a.filter(u=>L(u.closed_at).slice(3)===L(new Date).slice(3)),n=e.filter(u=>O(u).met).length,d=Ae(t,"responsible")||"Sin asignar",p=Ae(e,"department")||"-";return`
    ${k("Dashboard","Indicadores ejecutivos y comportamiento operativo.")}
    ${me()}
    <div class="kpi-grid">
      ${E("Total",e.length,"Incidencias filtradas")}
      ${E("Abiertas",t.length,`${we(t.length,e.length)}% del total`)}
      ${E("Vencidas",s.length,"Fuera de SLA")}
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
  `}function E(e,t,a){return`<div class="kpi"><div class="label">${o(e)}</div><div class="value">${o(t)}</div><div class="sub">${o(a)}</div></div>`}function we(e,t){return t?(e/t*100).toFixed(1):"0.0"}function Ae(e,t){const a=new Map;return e.forEach(s=>{const r=S(s[t])||"Sin asignar";a.set(r,(a.get(r)||0)+1)}),[...a.entries()].sort((s,r)=>r[1]-s[1])[0]?.[0]}function J(e,t,a){const s=new Map;t.forEach(n=>{const d=S(n[a])||"Sin dato";s.set(d,(s.get(d)||0)+1)});const r=Math.max(1,...s.values()),i=[...s.entries()].sort((n,d)=>d[1]-n[1]).slice(0,10);return`
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
  `}function vt(){const e=ee(),t=P(null,"create")?'<button class="btn primary" data-action="new-incident">Nueva incidencia</button>':"";return`
    ${k("Incidencias","Tabla tipo Excel, filtros, acciones y cierre formal.",t)}
    ${me()}
    <div class="toolbar">
      <strong>${e.length} registro(s)</strong>
      <button class="btn" data-action="export-csv">Exportar CSV</button>
    </div>
    ${gt(e)}
  `}function gt(e){const t=[["actions","Abrir"],["id","ID"],["created_at","Fecha"],["hotel","División"],["department","Departamento"],["subject","Asunto"],["incident_type","Tipo"],["priority","Prioridad"],["status","Estatus"],["responsible","Responsable"],["sla","SLA"],["due_at","Compromiso"],["description","Descripción"]];return`
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr>${t.map(([,a])=>`<th>${o(a)}</th>`).join("")}</tr></thead>
          <tbody>
            ${e.length?e.map(a=>`
              <tr>
                ${t.map(([s])=>`<td>${yt(a,s)}</td>`).join("")}
              </tr>
            `).join(""):`<tr><td colspan="${t.length}" class="empty">No hay incidencias con los filtros seleccionados.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `}function yt(e,t){if(t==="id")return o(e.id);if(t==="actions")return`<button class="btn tiny" data-action="open-incident" data-id="${o(e.id)}">Abrir</button>`;if(t==="created_at"||t==="due_at")return o(L(e[t]));if(t==="priority")return w(e.priority);if(t==="status")return w(e.status);if(t==="sla"){const a=O(e);return w(a.label,a.cls)}return o(t==="subject"?F(e.subject,90):t==="description"?F(e.description,130):e[t]||"")}function $t(){const e=ee();return`
    ${k("Kanban","Seguimiento por estatus con cambio rápido.")}
    ${me()}
    <div class="kanban">
      ${j.map(t=>{const a=e.filter(s=>s.status===t);return`
          <section class="kanban-col">
            <div class="kanban-head"><span>${o(t)}</span><b>${a.length}</b></div>
            ${a.map(s=>`
              <article class="kanban-card">
                <button class="row-button" data-action="open-incident" data-id="${o(s.id)}">${o(s.id)}</button>
                <span class="muted">${o(s.hotel||"")} · ${o(s.department||"")}</span>
                <span>${w(s.priority)} ${w(O(s).label,O(s).cls)}</span>
                <strong>${o(F(s.subject||s.description,95))}</strong>
                <select data-status-change="${o(s.id)}" ${!P(s,"status")&&!P(s,"reopen")?"disabled":""}>
                  ${Z(lt(s),s.status)}
                </select>
              </article>
            `).join("")||'<div class="empty">Sin incidencias.</div>'}
          </section>
        `}).join("")}
    </div>
  `}function _t(){return`
    ${k("Bitácora","Historial completo de cambios y comentarios.")}
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Incidencia</th><th>Acción</th><th>Campo</th><th>Anterior</th><th>Nuevo</th><th>Comentario</th></tr></thead>
          <tbody>
            ${l.audit.map(e=>`
              <tr>
                <td>${o(L(e.occurred_at,!0))}</td>
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
  `}function St(){if(!ke())return`
      ${k("Usuarios","Administración de accesos.")}
      <div class="error">No tienes permisos para administrar usuarios.</div>
    `;const e=wt();return`
    ${k("Usuarios","Administración de accesos, roles y estados.",'<button class="btn primary" data-action="new-user">Nuevo usuario</button>')}
    ${At()}
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
                <td>${w(t.role||"Auditor")}</td>
                <td>${w(t.status||"Activo")}</td>
                <td>${o(L(t.last_access_at,!0))}</td>
                <td>${o(t.failed_attempts??0)}</td>
                <td>${w(B(!!t.blocked))}</td>
                <td>${w(B(!!t.must_change_password))}</td>
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
  `}function wt(){const e=l.userFilters;return l.profiles.filter(t=>{const a=`${t.username||""} ${t.display_name||""}`.toLowerCase();return(!e.search||a.includes(e.search.toLowerCase()))&&(!e.role||t.role===e.role)&&(!e.status||t.status===e.status)})}function At(){const e=l.userFilters,t=(a,s,r)=>`
    <div class="field">
      <label>${s}</label>
      <select data-user-filter="${a}">
        <option value="">Todos</option>
        ${Z(r,e[a])}
      </select>
    </div>
  `;return`
    <div class="filters user-filters">
      <div class="field"><label>Buscar</label><input data-user-filter="search" value="${o(e.search)}" placeholder="Usuario o nombre"></div>
      ${t("role","Rol",le)}
      ${t("status","Estado",ce)}
    </div>
  `}function Pt(){return`
    ${k("Catálogos","Valores usados por formularios y filtros.",'<button class="btn primary" data-action="new-catalog">Nuevo valor</button>')}
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr><th>Categoría</th><th>Valor</th></tr></thead>
          <tbody>
            ${l.catalogs.map(e=>`<tr><td>${o(ct(e.category))}</td><td>${o(e.value)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `}function Lt(e){return l.profiles.find(t=>t.id===e.user_id)?.display_name||e.legacy_user||""}function Ct(){document.querySelectorAll("[data-filter]").forEach(e=>{e.addEventListener("input",()=>{l.filters[e.dataset.filter]=e.value,ne()})}),document.querySelectorAll("[data-user-filter]").forEach(e=>{e.addEventListener("input",()=>{l.userFilters[e.dataset.userFilter]=e.value,ne()})}),document.querySelectorAll("[data-status-change]").forEach(e=>{e.addEventListener("change",async()=>{const t=l.incidents.find(s=>s.id===e.dataset.statusChange),a=e.value;if(!(!t||a===t.status)){if($.includes(a)&&!$.includes(t.status)){Me(t);return}if($.includes(t.status)&&!$.includes(a)){Fe(t);return}await te(t,{status:a},"Cambio de estatus",`Estatus cambiado a ${a}.`)}})}),document.querySelectorAll("[data-action]").forEach(e=>{e.addEventListener("click",()=>{xe(e.dataset.action,e.dataset.id).catch(t=>{console.error(t),b("No fue posible completar la acción.")})})})}async function xe(e,t){const a=l.incidents.find(r=>r.id===t),s=l.profiles.find(r=>r.id===t);e==="new-incident"&&Pe(),e==="edit"&&Pe(a),(e==="open-incident"||e==="detail")&&It(a),e==="comment"&&qt(a),e==="close"&&Me(a),e==="reopen"&&Fe(a),e==="export-csv"&&Mt(ee()),e==="new-catalog"&&xt(),e==="new-user"&&Le(),e==="edit-user"&&Le(s),e==="toggle-user"&&await Dt(s),e==="toggle-blocked"&&await Tt(s),e==="password-user"&&jt(s),e==="audit-user"&&kt(s)}function C(e,t,a=""){const s=document.querySelector("#modal");return s.innerHTML=`
    <div class="modal-body">
      <div class="modal-head"><h3>${o(e)}</h3><button class="btn ghost" data-modal-close>Cerrar</button></div>
      ${t}
      ${a}
    </div>
  `,s.showModal(),s.querySelector("[data-modal-close]").addEventListener("click",()=>s.close()),s}function Pe(e=null){const t=!!e,a=`
    <form id="incidentForm" class="form-grid">
      ${f("hotel","División",e?.hotel,"select",T("División"))}
      ${f("department","Departamento",e?.department,"select",T("Departamento"))}
      ${f("responsible_area","Área responsable",e?.responsible_area,"select",T("Área Responsable"))}
      ${f("incident_type","Tipo de incidencia",e?.incident_type,"select",T("Tipo de Incidencia"))}
      ${f("impact","Impacto",e?.impact,"select",T("Impacto"))}
      ${f("priority","Prioridad",e?.priority||"Media","select",oe)}
      ${f("status","Estatus",e?.status||"Pendiente","select",j)}
      ${f("responsible","Responsable",e?.responsible)}
      ${f("due_at","Fecha compromiso",e?.due_at||ue(e?.priority||"Media"),"date")}
      ${f("subject","Asunto",e?.subject,"text",[],"form-full")}
      ${f("description","Descripción",e?.description,"textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">${t?"Guardar cambios":"Crear incidencia"}</button>
    </form>
  `,s=C(t?`Editar ${e.id}`:"Nueva incidencia",a);s.querySelector("#incidentForm").addEventListener("submit",async r=>{r.preventDefault();const i=R(r.currentTarget);if(!i.hotel||!i.department||!i.incident_type||!i.priority||!i.subject||!i.description){b("Completa división, departamento, tipo, prioridad, asunto y descripción.");return}t?await te(e,i,"Actualización de incidencia","Incidencia actualizada."):await Rt(i),s.close()})}function f(e,t,a="",s="text",r=[],i=""){return s==="select"?`<div class="field ${i}"><label>${o(t)}</label><select name="${e}">${Z(r,a)}</select></div>`:s==="textarea"?`<div class="field ${i}"><label>${o(t)}</label><textarea name="${e}">${o(a||"")}</textarea></div>`:`<div class="field ${i}"><label>${o(t)}</label><input name="${e}" type="${s}" value="${o(a||"")}"></div>`}function R(e){return Object.fromEntries([...new FormData(e).entries()].map(([t,a])=>[t,S(a)]))}function Et(e,t,a,s=!1){return l.profiles.filter(r=>{const i=r.id===e?t:r.role,n=r.id===e?a:r.status,d=r.id===e?s:!!r.blocked;return i==="Administrador"&&n==="Activo"&&!d}).length}function he(e,t=null){if(!e.username||!e.display_name||!e.role||!e.status)return"Usuario, nombre, rol y estado son obligatorios.";if(!t&&S(e.password).length<8)return"La contraseña inicial debe tener al menos 8 caracteres.";if(!le.includes(e.role))return"Selecciona un rol válido.";if(!ce.includes(e.status))return"Selecciona un estado válido.";if(l.profiles.find(r=>r.id!==t?.id&&ie(r.username)===ie(e.username)))return"Ya existe un usuario con ese nombre de usuario.";const s=Y(e.blocked);if(t?.id===l.profile?.id&&t.role==="Administrador"){if(e.status!=="Activo")return"No puedes desactivar tu propio usuario administrador.";if(e.role!=="Administrador")return"No puedes quitarte el rol Administrador desde tu propia sesión.";if(s)return"No puedes bloquear tu propio usuario administrador."}return t&&Et(t.id,e.role,e.status,s)<1?"Debe quedar al menos un administrador activo.":""}function Le(e=null){const t=!!e,a=`
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
      ${f("blocked","Bloqueado",B(!!e?.blocked),"select",re)}
      ${f("must_change_password","Debe cambiar password",B(e?!!e.must_change_password:!0),"select",re)}
      <button class="btn primary form-full" type="submit">${t?"Guardar cambios":"Crear usuario"}</button>
    </form>
  `,s=C(t?`Editar ${e.username||"usuario"}`:"Nuevo usuario",a);s.querySelector("#userForm").addEventListener("submit",async r=>{r.preventDefault();const i=R(r.currentTarget),n=he(i,e);if(n){b(n);return}try{await Ot(i,e),s.close()}catch(d){console.error(d),b(ut(d))}})}async function Ot(e,t=null){const a={username:e.username,display_name:e.display_name,role:e.role,status:e.status,blocked:Y(e.blocked),must_change_password:Y(e.must_change_password)};t||(a.password=e.password);const s=await _(await g.rpc("app_save_user",{p_token:A(),p_user_id:t?.id||null,p_user:a}),t?"No se pudo actualizar el usuario.":"No se pudo crear el usuario.");if(!s?.ok)throw new Error(s?.reason||"No se pudo guardar el usuario.");b(t?"Usuario actualizado.":"Usuario creado."),await D()}async function Dt(e){if(!e)return;const t=e.status==="Activo"?"Inactivo":"Activo",a=he({...e,status:t},e);if(a){b(a);return}try{const s=await _(await g.rpc("app_toggle_user_status",{p_token:A(),p_user_id:e.id}),"No se pudo cambiar el estado.");if(!s?.ok)throw new Error(s?.reason||"No se pudo cambiar el estado.");b(`Usuario ${t.toLowerCase()}.`),await D()}catch(s){console.error(s),b("No fue posible cambiar el estado del usuario.")}}async function Tt(e){if(!e)return;const t=!e.blocked,a=he({...e,blocked:B(t)},e);if(a){b(a);return}try{const s=await _(await g.rpc("app_toggle_user_blocked",{p_token:A(),p_user_id:e.id}),"No se pudo cambiar el bloqueo.");if(!s?.ok)throw new Error(s?.reason||"No se pudo cambiar el bloqueo.");b(t?"Usuario bloqueado.":"Usuario desbloqueado."),await D()}catch(s){console.error(s),b("No fue posible cambiar el bloqueo del usuario.")}}function jt(e){if(!e)return;C(`Contraseña de ${e.username||"usuario"}`,`
    <form id="resetPasswordForm" class="form-grid" autocomplete="off">
      <div class="field form-full">
        <label>Nueva contraseña temporal</label>
        <input name="password" type="password" required autocomplete="new-password">
      </div>
      ${f("must_change_password","Debe cambiar password","Sí","select",re,"form-full")}
      <button class="btn primary form-full" type="submit">Restablecer contraseña</button>
    </form>
  `).querySelector("#resetPasswordForm").addEventListener("submit",a=>{a.preventDefault();const s=R(a.currentTarget);Nt(e,s.password,Y(s.must_change_password)).catch(r=>{console.error(r),b("No fue posible registrar el restablecimiento.")})})}async function Nt(e,t="",a=!0){if(!e)return;if(S(t).length<8){b("La contraseña temporal debe tener al menos 8 caracteres.");return}const s=await _(await g.rpc("app_admin_reset_password",{p_token:A(),p_user_id:e.id,p_new_password:t,p_must_change_password:a}),"No se pudo restablecer la contraseña.");if(!s?.ok)throw new Error(s?.reason||"No se pudo restablecer la contraseña.");document.querySelector("#modal")?.close(),b("Contraseña restablecida."),await D()}function kt(e){if(!e)return;const t=l.audit.filter(a=>S(a.changed_field).includes(`Usuario: ${e.username}`));C(`Bitácora de ${e.username||"usuario"}`,`
    <div class="timeline">
      ${t.map(a=>`
        <div class="timeline-item">
          <b>${o(a.action)}</b> · <span class="muted">${o(L(a.occurred_at,!0))}</span>
          <p>${o(a.comment||"")}</p>
          <p class="muted">${o(F(a.old_value,140))} → ${o(F(a.new_value,140))}</p>
        </div>
      `).join("")||'<div class="empty">Sin movimientos registrados para este usuario.</div>'}
    </div>
  `)}async function Rt(e){const t=e.due_at||ue(e.priority),a={id:ot(),...e,due_at:t,actual_due_at:t,created_by:l.profile?.id,updated_by:l.profile?.id,created_at:M(),updated_at:M()};await _(await g.from("incidents").insert(a),"No se pudo crear la incidencia."),await fe(a.id,"Creación","Incidencia","","Creada","Incidencia creada.",a),b("Incidencia creada."),await D()}async function te(e,t,a,s){if(!e)return;const r={...t,updated_by:l.profile?.id,updated_at:M()};r.status&&$.includes(r.status)&&!e.closed_at&&(r.closed_at=M()),r.status&&!$.includes(r.status)&&(r.closed_at=null),await _(await g.from("incidents").update(r).eq("id",e.id),"No se pudo actualizar.");for(const[i,n]of Object.entries(t))String(e[i]??"")!==String(n??"")&&await fe(e.id,a,i,e[i],n,s,{...e,...r});b("Cambios guardados."),await D()}async function fe(e,t,a,s,r,i,n){await g.from("audit_log").insert({incident_id:e,user_id:l.profile?.id,legacy_user:l.profile?.display_name||l.profile?.username||"Usuario",action:t,changed_field:a,old_value:s??"",new_value:r??"",comment:i,hotel:n?.hotel||"",status:n?.status||""})}function It(e){if(!e)return;const t=C(e.subject||`Detalle ${e.id}`,`
    <div class="selected-card">
      <div>${w(e.priority)} ${w(e.status)} ${w(O(e).label,O(e).cls)}</div>
      <p><b>ID:</b> ${o(e.id||"")}</p>
      <p><b>División:</b> ${o(e.hotel||"")}</p>
      <p><b>Departamento:</b> ${o(e.department||"")}</p>
      <p><b>Tipo:</b> ${o(e.incident_type||"")}</p>
      <p><b>Área responsable:</b> ${o(e.responsible_area||"")}</p>
      <p><b>Responsable:</b> ${o(e.responsible||"Sin asignar")}</p>
      <p><b>Asunto:</b> ${o(e.subject||"")}</p>
      <p><b>Descripción:</b><br>${o(e.description||"")}</p>
      <p><b>Fecha compromiso:</b> ${o(L(e.due_at))}</p>
      <p><b>Causa raíz:</b> ${o(e.root_cause||"")}</p>
      <p><b>Acción tomada:</b> ${o(e.action_taken||"")}</p>
      <p><b>Comentario final:</b> ${o(e.final_comment||"")}</p>
    </div>
    <div class="actions">
      <button class="btn" data-detail-action="comment" ${P(e,"comment")?"":"disabled"}>Comentar</button>
      <button class="btn" data-detail-action="edit" ${P(e,"edit")?"":"disabled"}>Editar</button>
      ${$.includes(e.status)?`<button class="btn primary" data-detail-action="reopen" ${P(e,"reopen")?"":"disabled"}>Reabrir</button>`:`<button class="btn primary" data-detail-action="close" ${P(e,"close")?"":"disabled"}>Cerrar</button>`}
    </div>
    <h3>Bitácora</h3>
    <div class="timeline">
      ${l.audit.filter(a=>a.incident_id===e.id).map(a=>`
        <div class="timeline-item">
          <b>${o(a.action)}</b> · <span class="muted">${o(L(a.occurred_at,!0))}</span>
          <p>${o(a.changed_field||"General")}: ${o(a.old_value||"")} → ${o(a.new_value||"")}</p>
          <p>${o(a.comment||"")}</p>
        </div>
      `).join("")||'<div class="empty">Sin movimientos.</div>'}
    </div>
  `);t.querySelectorAll("[data-detail-action]").forEach(a=>{a.addEventListener("click",()=>{t.close(),xe(a.dataset.detailAction,e.id).catch(s=>{console.error(s),b("No fue posible completar la acción.")})})})}function qt(e){const t=C(`Comentar ${e.id}`,`
    <form id="commentForm" class="form-grid">
      ${f("comment","Comentario","","textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">Guardar comentario</button>
    </form>
  `);t.querySelector("#commentForm").addEventListener("submit",async a=>{a.preventDefault();const s=R(a.currentTarget);await fe(e.id,"Comentario","Comentario","",s.comment,s.comment,e),b("Comentario guardado."),t.close(),await D()})}function Me(e){const t=C(`Cerrar ${e.id}`,`
    <form id="closeForm" class="form-grid">
      ${f("root_cause","Causa raíz",e.root_cause,"select",T("Causa raíz"))}
      ${f("action_taken","Acción tomada",e.action_taken,"select",T("Acción tomada"))}
      ${f("close_reason","Motivo de cierre",e.close_reason)}
      ${f("final_comment","Comentario final",e.final_comment,"textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">Cerrar incidencia</button>
    </form>
  `);t.querySelector("#closeForm").addEventListener("submit",async a=>{a.preventDefault();const s=R(a.currentTarget);if(!s.root_cause||!s.action_taken||!s.final_comment){b("Causa raíz, acción tomada y comentario final son obligatorios.");return}await te(e,{...s,status:"Cerrado",closed_at:M()},"Cierre formal",s.final_comment),t.close()})}function Fe(e){const t=C(`Reabrir ${e.id}`,`
    <form id="reopenForm" class="form-grid">
      ${f("status","Nuevo estatus","En proceso","select",j.filter(a=>!$.includes(a)))}
      ${f("comment","Motivo de reapertura","","textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">Reabrir incidencia</button>
    </form>
  `);t.querySelector("#reopenForm").addEventListener("submit",async a=>{a.preventDefault();const s=R(a.currentTarget);if(!s.comment){b("El motivo es obligatorio.");return}await te(e,{status:s.status,closed_at:null},"Reapertura",s.comment),t.close()})}function xt(){const e=C("Nuevo valor de catálogo",`
    <form id="catalogForm" class="form-grid">
      ${f("category","Categoría","","select",Object.keys(Te))}
      ${f("value","Valor","")}
      <button class="btn primary form-full" type="submit">Guardar</button>
    </form>
  `);e.querySelector("#catalogForm").addEventListener("submit",async t=>{t.preventDefault();const a=R(t.currentTarget);await _(await g.from("catalogs").insert(a),"No se pudo guardar el catálogo."),b("Catálogo guardado."),e.close(),await D()})}function Mt(e){const a=[["ID","Fecha","División","Departamento","Asunto","Tipo","Prioridad","Estatus","Responsable","SLA","Descripción"].join(","),...e.map(n=>[n.id,L(n.created_at),n.hotel,n.department,n.subject,n.incident_type,n.priority,n.status,n.responsible,O(n).label,n.description].map(d=>`"${String(d??"").replaceAll('"','""')}"`).join(","))],s=new Blob([a.join(`
`)],{type:"text/csv;charset=utf-8"}),r=URL.createObjectURL(s),i=document.createElement("a");i.href=r,i.download="incidencias_filtradas.csv",i.click(),URL.revokeObjectURL(r)}async function D(){await X(),z()}pt().catch(e=>{console.error(e),H.innerHTML=`<main class="config-shell"><section class="config-card"><div class="error">${o(e.message)}</div></section></main>`});
