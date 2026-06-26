(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))s(r);new MutationObserver(r=>{for(const i of r)if(i.type==="childList")for(const n of i.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function a(r){const i={};return r.integrity&&(i.integrity=r.integrity),r.referrerPolicy&&(i.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?i.credentials="include":r.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(r){if(r.ep)return;r.ep=!0;const i=a(r);fetch(r.href,i)}})();const Ee=3,ve=e=>Math.min(1e3*2**e,3e4),He=[520,503],Oe=["GET","HEAD","OPTIONS"];var ge=class extends Error{constructor(e){super(e.message),this.name="PostgrestError",this.details=e.details,this.hint=e.hint,this.code=e.code}toJSON(){return{name:this.name,message:this.message,details:this.details,hint:this.hint,code:this.code}}};function ye(e,t){return new Promise(a=>{if(t?.aborted){a();return}const s=setTimeout(()=>{t?.removeEventListener("abort",r),a()},e);function r(){clearTimeout(s),a()}t?.addEventListener("abort",r)})}function Be(e,t,a,s){return!(!s||a>=Ee||!Oe.includes(e)||!He.includes(t))}var ze=class{constructor(e){var t,a,s,r,i;this.shouldThrowOnError=!1,this.retryEnabled=!0,this.method=e.method,this.url=e.url,this.headers=new Headers(e.headers),this.schema=e.schema,this.body=e.body,this.shouldThrowOnError=(t=e.shouldThrowOnError)!==null&&t!==void 0?t:!1,this.signal=e.signal,this.isMaybeSingle=(a=e.isMaybeSingle)!==null&&a!==void 0?a:!1,this.shouldStripNulls=(s=e.shouldStripNulls)!==null&&s!==void 0?s:!1,this.urlLengthLimit=(r=e.urlLengthLimit)!==null&&r!==void 0?r:8e3,this.retryEnabled=(i=e.retry)!==null&&i!==void 0?i:!0,e.fetch?this.fetch=e.fetch:this.fetch=fetch}throwOnError(){return this.shouldThrowOnError=!0,this}stripNulls(){if(this.headers.get("Accept")==="text/csv")throw new Error("stripNulls() cannot be used with csv()");return this.shouldStripNulls=!0,this}setHeader(e,t){return this.headers=new Headers(this.headers),this.headers.set(e,t),this}retry(e){return this.retryEnabled=e,this}then(e,t){var a=this;if(this.schema===void 0||(["GET","HEAD"].includes(this.method)?this.headers.set("Accept-Profile",this.schema):this.headers.set("Content-Profile",this.schema)),this.method!=="GET"&&this.method!=="HEAD"&&this.headers.set("Content-Type","application/json"),this.shouldStripNulls){const n=this.headers.get("Accept");n==="application/vnd.pgrst.object+json"?this.headers.set("Accept","application/vnd.pgrst.object+json;nulls=stripped"):(!n||n==="application/json")&&this.headers.set("Accept","application/vnd.pgrst.array+json;nulls=stripped")}const s=this.fetch;let i=(async()=>{let n=0;for(;;){const u={};a.headers.forEach((c,f)=>{u[f]=c}),n>0&&(u["X-Retry-Count"]=String(n));let h;try{h=await s(a.url.toString(),{method:a.method,headers:u,body:JSON.stringify(a.body,(c,f)=>typeof f=="bigint"?f.toString():f),signal:a.signal})}catch(c){if(c?.name==="AbortError"||c?.code==="ABORT_ERR"||!Oe.includes(a.method))throw c;if(a.retryEnabled&&n<Ee){const f=ve(n);n++,await ye(f,a.signal);continue}throw c}if(Be(a.method,h.status,n,a.retryEnabled)){var d,p;const c=(d=(p=h.headers)===null||p===void 0?void 0:p.get("Retry-After"))!==null&&d!==void 0?d:null,f=c!==null?Math.max(0,parseInt(c,10)||0)*1e3:ve(n);await h.text(),n++,await ye(f,a.signal);continue}return await a.processResponse(h)}})();return this.shouldThrowOnError||(i=i.catch(n=>{var d;let p="",u="",h="";const c=n?.cause;if(c){var f,v,_,ae;const Fe=(f=c?.message)!==null&&f!==void 0?f:"",be=(v=c?.code)!==null&&v!==void 0?v:"";p=`${(_=n?.name)!==null&&_!==void 0?_:"FetchError"}: ${n?.message}`,p+=`

Caused by: ${(ae=c?.name)!==null&&ae!==void 0?ae:"Error"}: ${Fe}`,be&&(p+=` (${be})`),c?.stack&&(p+=`
${c.stack}`)}else{var se;p=(se=n?.stack)!==null&&se!==void 0?se:""}const z=this.url.toString().length;return n?.name==="AbortError"||n?.code==="ABORT_ERR"?(h="",u="Request was aborted (timeout or manual cancellation)",z>this.urlLengthLimit&&(u+=`. Note: Your request URL is ${z} characters, which may exceed server limits. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [many IDs])), consider using an RPC function to pass values server-side.`)):(c?.name==="HeadersOverflowError"||c?.code==="UND_ERR_HEADERS_OVERFLOW")&&(h="",u="HTTP headers exceeded server limits (typically 16KB)",z>this.urlLengthLimit&&(u+=`. Your request URL is ${z} characters. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [200+ IDs])), consider using an RPC function instead.`)),{success:!1,error:{message:`${(d=n?.name)!==null&&d!==void 0?d:"FetchError"}: ${n?.message}`,details:p,hint:u,code:h},data:null,count:null,status:0,statusText:""}})),i.then(e,t)}async processResponse(e){var t=this;let a=null,s=null,r=null,i=e.status,n=e.statusText;if(e.ok){var d,p;if(t.method!=="HEAD"){var u;const f=await e.text();if(f!=="")if(t.headers.get("Accept")==="text/csv")s=f;else if(t.headers.get("Accept")&&(!((u=t.headers.get("Accept"))===null||u===void 0)&&u.includes("application/vnd.pgrst.plan+text")))s=f;else try{s=JSON.parse(f)}catch{if(a={message:f},s=null,t.shouldThrowOnError)throw new ge({message:f,details:"",hint:"",code:""})}}const h=(d=t.headers.get("Prefer"))===null||d===void 0?void 0:d.match(/count=(exact|planned|estimated)/),c=(p=e.headers.get("content-range"))===null||p===void 0?void 0:p.split("/");h&&c&&c.length>1&&(r=parseInt(c[1])),t.isMaybeSingle&&Array.isArray(s)&&(s.length>1?(a={code:"PGRST116",details:`Results contain ${s.length} rows, application/vnd.pgrst.object+json requires 1 row`,hint:null,message:"JSON object requested, multiple (or no) rows returned"},s=null,r=null,i=406,n="Not Acceptable"):s.length===1?s=s[0]:s=null)}else{const h=await e.text();try{a=JSON.parse(h),Array.isArray(a)&&e.status===404&&(s=[],a=null,i=200,n="OK")}catch{e.status===404&&h===""?(i=204,n="No Content"):a={message:h}}if(a&&t.shouldThrowOnError)throw new ge(a)}return{success:a===null,error:a,data:s,count:r,status:i,statusText:n}}returns(){return this}overrideTypes(){return this}},Ve=class extends ze{throwOnError(){return super.throwOnError()}select(e){let t=!1;const a=(e??"*").split("").map(s=>/\s/.test(s)&&!t?"":(s==='"'&&(t=!t),s)).join("");return this.url.searchParams.set("select",a),this.headers.append("Prefer","return=representation"),this}order(e,{ascending:t=!0,nullsFirst:a,foreignTable:s,referencedTable:r=s}={}){const i=r?`${r}.order`:"order",n=this.url.searchParams.get(i);return this.url.searchParams.set(i,`${n?`${n},`:""}${e}.${t?"asc":"desc"}${a===void 0?"":a?".nullsfirst":".nullslast"}`),this}limit(e,{foreignTable:t,referencedTable:a=t}={}){const s=typeof a>"u"?"limit":`${a}.limit`;return this.url.searchParams.set(s,`${e}`),this}range(e,t,{foreignTable:a,referencedTable:s=a}={}){const r=typeof s>"u"?"offset":`${s}.offset`,i=typeof s>"u"?"limit":`${s}.limit`;return this.url.searchParams.set(r,`${e}`),this.url.searchParams.set(i,`${t-e+1}`),this}abortSignal(e){return this.signal=e,this}single(){return this.headers.set("Accept","application/vnd.pgrst.object+json"),this}maybeSingle(){return this.isMaybeSingle=!0,this}csv(){return this.headers.set("Accept","text/csv"),this}geojson(){return this.headers.set("Accept","application/geo+json"),this}explain({analyze:e=!1,verbose:t=!1,settings:a=!1,buffers:s=!1,wal:r=!1,format:i="text"}={}){var n;const d=[e?"analyze":null,t?"verbose":null,a?"settings":null,s?"buffers":null,r?"wal":null].filter(Boolean).join("|"),p=(n=this.headers.get("Accept"))!==null&&n!==void 0?n:"application/json";return this.headers.set("Accept",`application/vnd.pgrst.plan+${i}; for="${p}"; options=${d};`),i==="json"?this:this}rollback(){return this.headers.append("Prefer","tx=rollback"),this}returns(){return this}maxAffected(e){return this.headers.append("Prefer","handling=strict"),this.headers.append("Prefer",`max-affected=${e}`),this}};const $e=new RegExp("[,()]");var j=class extends Ve{throwOnError(){return super.throwOnError()}eq(e,t){return this.url.searchParams.append(e,`eq.${t}`),this}neq(e,t){return this.url.searchParams.append(e,`neq.${t}`),this}gt(e,t){return this.url.searchParams.append(e,`gt.${t}`),this}gte(e,t){return this.url.searchParams.append(e,`gte.${t}`),this}lt(e,t){return this.url.searchParams.append(e,`lt.${t}`),this}lte(e,t){return this.url.searchParams.append(e,`lte.${t}`),this}like(e,t){return this.url.searchParams.append(e,`like.${t}`),this}likeAllOf(e,t){return this.url.searchParams.append(e,`like(all).{${t.join(",")}}`),this}likeAnyOf(e,t){return this.url.searchParams.append(e,`like(any).{${t.join(",")}}`),this}ilike(e,t){return this.url.searchParams.append(e,`ilike.${t}`),this}ilikeAllOf(e,t){return this.url.searchParams.append(e,`ilike(all).{${t.join(",")}}`),this}ilikeAnyOf(e,t){return this.url.searchParams.append(e,`ilike(any).{${t.join(",")}}`),this}regexMatch(e,t){return this.url.searchParams.append(e,`match.${t}`),this}regexIMatch(e,t){return this.url.searchParams.append(e,`imatch.${t}`),this}is(e,t){return this.url.searchParams.append(e,`is.${t}`),this}isDistinct(e,t){return this.url.searchParams.append(e,`isdistinct.${t}`),this}in(e,t){const a=Array.from(new Set(t)).map(s=>typeof s=="string"&&$e.test(s)?`"${s}"`:`${s}`).join(",");return this.url.searchParams.append(e,`in.(${a})`),this}notIn(e,t){const a=Array.from(new Set(t)).map(s=>typeof s=="string"&&$e.test(s)?`"${s}"`:`${s}`).join(",");return this.url.searchParams.append(e,`not.in.(${a})`),this}contains(e,t){return typeof t=="string"?this.url.searchParams.append(e,`cs.${t}`):Array.isArray(t)?this.url.searchParams.append(e,`cs.{${t.join(",")}}`):this.url.searchParams.append(e,`cs.${JSON.stringify(t)}`),this}containedBy(e,t){return typeof t=="string"?this.url.searchParams.append(e,`cd.${t}`):Array.isArray(t)?this.url.searchParams.append(e,`cd.{${t.join(",")}}`):this.url.searchParams.append(e,`cd.${JSON.stringify(t)}`),this}rangeGt(e,t){return this.url.searchParams.append(e,`sr.${t}`),this}rangeGte(e,t){return this.url.searchParams.append(e,`nxl.${t}`),this}rangeLt(e,t){return this.url.searchParams.append(e,`sl.${t}`),this}rangeLte(e,t){return this.url.searchParams.append(e,`nxr.${t}`),this}rangeAdjacent(e,t){return this.url.searchParams.append(e,`adj.${t}`),this}overlaps(e,t){return typeof t=="string"?this.url.searchParams.append(e,`ov.${t}`):this.url.searchParams.append(e,`ov.{${t.join(",")}}`),this}textSearch(e,t,{config:a,type:s}={}){let r="";s==="plain"?r="pl":s==="phrase"?r="ph":s==="websearch"&&(r="w");const i=a===void 0?"":`(${a})`;return this.url.searchParams.append(e,`${r}fts${i}.${t}`),this}match(e){return Object.entries(e).filter(([t,a])=>a!==void 0).forEach(([t,a])=>{this.url.searchParams.append(t,`eq.${a}`)}),this}not(e,t,a){return this.url.searchParams.append(e,`not.${t}.${a}`),this}or(e,{foreignTable:t,referencedTable:a=t}={}){const s=a?`${a}.or`:"or";return this.url.searchParams.append(s,`(${e})`),this}filter(e,t,a){return this.url.searchParams.append(e,`${t}.${a}`),this}},Ge=class{constructor(e,{headers:t={},schema:a,fetch:s,urlLengthLimit:r=8e3,retry:i}){this.url=e,this.headers=new Headers(t),this.schema=a,this.fetch=s,this.urlLengthLimit=r,this.retry=i}cloneRequestState(){return{url:new URL(this.url.toString()),headers:new Headers(this.headers)}}select(e,t){const{head:a=!1,count:s}=t??{},r=a?"HEAD":"GET";let i=!1;const n=(e??"*").split("").map(u=>/\s/.test(u)&&!i?"":(u==='"'&&(i=!i),u)).join(""),{url:d,headers:p}=this.cloneRequestState();return d.searchParams.set("select",n),s&&p.append("Prefer",`count=${s}`),new j({method:r,url:d,headers:p,schema:this.schema,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}insert(e,{count:t,defaultToNull:a=!0}={}){var s;const r="POST",{url:i,headers:n}=this.cloneRequestState();if(t&&n.append("Prefer",`count=${t}`),a||n.append("Prefer","missing=default"),Array.isArray(e)){const d=e.reduce((p,u)=>p.concat(Object.keys(u)),[]);if(d.length>0){const p=[...new Set(d)].map(u=>`"${u}"`);i.searchParams.set("columns",p.join(","))}}return new j({method:r,url:i,headers:n,schema:this.schema,body:e,fetch:(s=this.fetch)!==null&&s!==void 0?s:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}upsert(e,{onConflict:t,ignoreDuplicates:a=!1,count:s,defaultToNull:r=!0}={}){var i;const n="POST",{url:d,headers:p}=this.cloneRequestState();if(p.append("Prefer",`resolution=${a?"ignore":"merge"}-duplicates`),t!==void 0&&d.searchParams.set("on_conflict",t),s&&p.append("Prefer",`count=${s}`),r||p.append("Prefer","missing=default"),Array.isArray(e)){const u=e.reduce((h,c)=>h.concat(Object.keys(c)),[]);if(u.length>0){const h=[...new Set(u)].map(c=>`"${c}"`);d.searchParams.set("columns",h.join(","))}}return new j({method:n,url:d,headers:p,schema:this.schema,body:e,fetch:(i=this.fetch)!==null&&i!==void 0?i:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}update(e,{count:t}={}){var a;const s="PATCH",{url:r,headers:i}=this.cloneRequestState();return t&&i.append("Prefer",`count=${t}`),new j({method:s,url:r,headers:i,schema:this.schema,body:e,fetch:(a=this.fetch)!==null&&a!==void 0?a:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}delete({count:e}={}){var t;const a="DELETE",{url:s,headers:r}=this.cloneRequestState();return e&&r.append("Prefer",`count=${e}`),new j({method:a,url:s,headers:r,schema:this.schema,fetch:(t=this.fetch)!==null&&t!==void 0?t:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};function M(e){"@babel/helpers - typeof";return M=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},M(e)}function Ke(e,t){if(M(e)!="object"||!e)return e;var a=e[Symbol.toPrimitive];if(a!==void 0){var s=a.call(e,t);if(M(s)!="object")return s;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function Je(e){var t=Ke(e,"string");return M(t)=="symbol"?t:t+""}function Ye(e,t,a){return(t=Je(t))in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function _e(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);t&&(s=s.filter(function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable})),a.push.apply(a,s)}return a}function V(e){for(var t=1;t<arguments.length;t++){var a=arguments[t]!=null?arguments[t]:{};t%2?_e(Object(a),!0).forEach(function(s){Ye(e,s,a[s])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):_e(Object(a)).forEach(function(s){Object.defineProperty(e,s,Object.getOwnPropertyDescriptor(a,s))})}return e}var We=class Te{constructor(t,{headers:a={},schema:s,fetch:r,timeout:i,urlLengthLimit:n=8e3,retry:d}={}){this.url=t,this.headers=new Headers(a),this.schemaName=s,this.urlLengthLimit=n;const p=r??globalThis.fetch;i!==void 0&&i>0?this.fetch=(u,h)=>{const c=new AbortController,f=setTimeout(()=>c.abort(),i),v=h?.signal;if(v){if(v.aborted)return clearTimeout(f),p(u,h);const _=()=>{clearTimeout(f),c.abort()};return v.addEventListener("abort",_,{once:!0}),p(u,V(V({},h),{},{signal:c.signal})).finally(()=>{clearTimeout(f),v.removeEventListener("abort",_)})}return p(u,V(V({},h),{},{signal:c.signal})).finally(()=>clearTimeout(f))}:this.fetch=p,this.retry=d}from(t){if(!t||typeof t!="string"||t.trim()==="")throw new Error("Invalid relation name: relation must be a non-empty string.");return new Ge(new URL(`${this.url}/${t}`),{headers:new Headers(this.headers),schema:this.schemaName,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}schema(t){return new Te(this.url,{headers:this.headers,schema:t,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}rpc(t,a={},{head:s=!1,get:r=!1,count:i}={}){var n;let d;const p=new URL(`${this.url}/rpc/${t}`);let u;const h=v=>v!==null&&typeof v=="object"&&(!Array.isArray(v)||v.some(h)),c=s&&Object.values(a).some(h);c?(d="POST",u=a):s||r?(d=s?"HEAD":"GET",Object.entries(a).filter(([v,_])=>_!==void 0).map(([v,_])=>[v,Array.isArray(_)?`{${_.join(",")}}`:`${_}`]).forEach(([v,_])=>{p.searchParams.append(v,_)})):(d="POST",u=a);const f=new Headers(this.headers);return c?f.set("Prefer",i?`count=${i},return=minimal`:"return=minimal"):i&&f.set("Prefer",`count=${i}`),new j({method:d,url:p,headers:f,schema:this.schemaName,body:u,fetch:(n=this.fetch)!==null&&n!==void 0?n:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};const Ze="https://plqszwbcgsoxfaufudgn.supabase.co",Se="sb_publishable_a34RnPQKgZS_TgHSp0CfBg_5BR3FFJi",k=["Pendiente","En proceso","En espera de respuesta","Escalado","Resuelto","Cerrado"],S=["Resuelto","Cerrado"],oe=["Baja","Media","Alta","Crítica"],le=["Administrador","Supervisor","Auditor","Consulta"],ce=["Activo","Inactivo"],re=["No","Sí"],Qe={Crítica:1,Critica:1,Alta:2,Media:3,Baja:5},x="auditoriaPendientes.session",Xe="x-app-session-token",et="id, username, display_name, role, status, hotel, department, last_access_at, failed_attempts, blocked, must_change_password, created_at, updated_at",De="********",ke={Hotel:["5910 - PPRL","5911 - ZEL","5917 - MPCB","5918 - MCB","5930 - PGC"],Departamento:["Recepción","Reservas","A&B","Spa","Contabilidad","IT","Club Meliá","Auditoría Nocturna","Auditoría Diurna"],"Área Responsable":["Operaciones","Finanzas","Contabilidad","Revenue","Sistemas","Auditoría"],"Tipo de Incidencia":["Cobro no realizado","Routing incorrecto","Check-in mal procesado","Rate Code incorrecto","Factura no volcada a SAP","Diferencia POS vs PMS","Resort Credit incorrecto","HTC incorrecto","Falta de soporte","Incidencia IT"],Impacto:["Operativo","Financiero","Contable","Cliente","Sistema"],Prioridad:oe,Estatus:k,"Causa raíz":["Error operativo","Falta de soporte","Configuración incorrecta","Proceso incompleto","Incidencia de sistema"],"Acción tomada":["Corrección en PMS","Corrección contable","Escalamiento a IT","Capacitación al equipo","Validación documental"]},B=document.querySelector("#app");let g=Ie();const l={session:null,profile:null,page:"dashboard",loading:!0,incidents:[],audit:[],profiles:[],catalogs:[],selectedIncidentId:null,filters:{hotel:"",department:"",priority:"",status:"",responsible:"",type:"",search:""},userFilters:{search:"",role:"",status:"",hotel:"",department:""}};function Ie(e=""){const t={apikey:Se,Authorization:`Bearer ${Se}`};return e&&(t[Xe]=e),new We(`${Ze}/rest/v1`,{headers:t,schema:"public"})}const o=e=>String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"),$=e=>String(e??"").trim(),ie=e=>$(e).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""),tt=e=>$(e).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"sin-dato",T=(e,t=!1)=>{if(!e)return"";const a=new Date(e);return Number.isNaN(a.getTime())?String(e):new Intl.DateTimeFormat("es-DO",{day:"2-digit",month:"2-digit",year:"numeric",...t?{hour:"2-digit",minute:"2-digit"}:{}}).format(a)},at=()=>new Date().toISOString().slice(0,10),U=()=>new Date().toISOString(),y=(e,t="")=>`<span class="badge ${tt(e)} ${t}">${o(e||"Sin dato")}</span>`,J=(e,t=120)=>$(e).length>t?`${$(e).slice(0,t-3)}...`:$(e),F=()=>l.profile?.role||"Auditor",de=()=>F()==="Administrador",Re=()=>F()==="Supervisor",Ne=()=>de(),st=()=>de()||Re(),H=e=>e?"Sí":"No",Y=e=>["si","sí","true","1","yes"].includes(ie(e)),rt=e=>({...e,password_mask:De});function it(){try{const e=JSON.parse(localStorage.getItem(x)||"null");return!e?.token||!e?.expires_at?null:new Date(e.expires_at).getTime()<=Date.now()?(localStorage.removeItem(x),null):{token:e.token,expires_at:e.expires_at}}catch{return localStorage.removeItem(x),null}}function nt(e){if(!e?.token){localStorage.removeItem(x);return}localStorage.setItem(x,JSON.stringify({token:e.token,expires_at:e.expires_at}))}function I(e){l.session=e,g=Ie(e?.token||""),nt(e)}function P(){return l.session?.token||""}function ot(){return`INC-${new Date().toISOString().replace(/[-:TZ.]/g,"").slice(0,14)}-${Math.random().toString(16).slice(2,6).toUpperCase()}`}function ue(e,t=new Date){const a=new Date(t),s=Qe[e]??3;return a.setDate(a.getDate()+s),a.toISOString().slice(0,10)}function C(e){const t=$(e.status),a=e.actual_due_at||e.due_at||ue(e.priority||"Media",e.created_at),s=new Date(`${a}T00:00:00`);if(S.includes(t)){if(!e.closed_at||Number.isNaN(s.getTime()))return{label:"Cerrado",days:null,met:!0,cls:"cerrado"};const d=new Date(e.closed_at)<=new Date(`${a}T23:59:59`);return{label:d?"Cerrado en SLA":"Cerrado fuera SLA",days:null,met:d,cls:d?"cerrado":"vencido"}}const r=new Date(`${at()}T00:00:00`),i=Math.ceil((s-r)/864e5);return i<0?{label:`Vencido ${Math.abs(i)}d`,days:i,met:!1,cls:"vencido"}:i===0?{label:"Vence hoy",days:i,met:!0,cls:"media"}:i===1?{label:"Vence en 1d",days:i,met:!0,cls:"media"}:{label:`En tiempo (${i}d)`,days:i,met:!0,cls:"baja"}}function L(e,t="edit"){if(de())return!0;if(Re())return["edit","comment","close","reopen","status"].includes(t);if(F()==="Consulta")return!1;if(t==="create"||t==="comment")return!0;if(!["edit","status"].includes(t)||!e)return!1;const a=l.profile?.id;return e.created_by===a||e.assigned_to===a}function lt(e){return S.includes(e.status)?k.filter(t=>S.includes(t)||L(e,"reopen")):k.filter(t=>!S.includes(t)||L(e,"close"))}function A(e){const t=l.catalogs.filter(a=>a.category===e).map(a=>a.value).filter(Boolean);return t.length?[...new Set(t)].sort():ke[e]||[]}function Q(e,t=""){return[...new Set([t,...e].filter(Boolean))].map(s=>`<option value="${o(s)}" ${s===t?"selected":""}>${o(s)}</option>`).join("")}function b(e){const t=document.createElement("div");t.className="toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),2600)}async function w(e,t="No se pudo completar la operación."){if(e.error)throw new Error(e.error.message||t);return e.data}function je(e){const t=String(e?.reason||e?.message||"").toLowerCase();return t.includes("inactive")?"Usuario inactivo. Contacte al administrador.":t.includes("blocked")?"Usuario bloqueado. Contacte al administrador.":t.includes("weak_password")?"La nueva contraseña debe tener al menos 8 caracteres.":"Usuario o contraseña incorrectos."}function ct(e){const t=String(e?.message||"");return t.toLowerCase().includes("sesión")?"La sesión venció. Inicie sesión nuevamente.":t.toLowerCase().includes("inactivo")?"Usuario inactivo. Contacte al administrador.":t.toLowerCase().includes("bloqueado")?"Usuario bloqueado. Contacte al administrador.":"No fue posible cargar el sistema. Intente nuevamente o contacte al administrador."}function pe(){l.session=null,l.profile=null,l.incidents=[],l.audit=[],l.profiles=[],l.selectedIncidentId=null}async function dt(){if(!g){ut();return}const e=it();if(!e){l.loading=!1,W();return}I(e);try{if(await xe(),l.profile?.must_change_password){l.loading=!1,Z();return}await X(),q()}catch(t){console.error(t),I(null),pe(),W(ct(t))}}function ut(){B.innerHTML=`
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
  `}function W(e=""){B.innerHTML=`
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
  `,document.querySelector("#loginForm").addEventListener("submit",async t=>{t.preventDefault();const a=new FormData(t.currentTarget);try{await pt(a.get("login"),a.get("password"))}catch(s){console.warn("Login failed",s),I(null),pe(),W(je(s))}})}function Z(e=""){B.innerHTML=`
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
  `,document.querySelector("#passwordLogoutBtn").addEventListener("click",qe),document.querySelector("#passwordChangeForm").addEventListener("submit",async t=>{t.preventDefault();const a=new FormData(t.currentTarget),s=String(a.get("new_password")||"");if(s!==String(a.get("confirm_password")||"")){Z("Las contraseñas no coinciden.");return}try{await mt(a.get("current_password"),s),b("Contraseña actualizada."),await X(),q()}catch(r){console.warn("Password change failed",r),Z(je(r))}})}async function pt(e,t){const a=await w(await g.rpc("app_login",{p_username:$(e),p_password:String(t||"")}),"No fue posible iniciar sesión.");if(!a?.ok){const s=new Error(a?.reason||"invalid_credentials");throw s.reason=a?.reason,s}if(I({token:a.token,expires_at:a.expires_at}),l.profile=a.profile,a.must_change_password||a.profile?.must_change_password){Z();return}await X(),q()}async function mt(e,t){const a=await w(await g.rpc("app_change_password",{p_token:P(),p_current_password:String(e||""),p_new_password:String(t||"")}),"No fue posible cambiar la contraseña.");if(!a?.ok){const s=new Error(a?.reason||"invalid_credentials");throw s.reason=a?.reason,s}l.profile=a.profile,I({token:P(),expires_at:a.expires_at||l.session?.expires_at})}async function qe(){const e=P();try{e&&await g.rpc("app_logout",{p_token:e})}catch(t){console.warn("Logout failed",t)}I(null),pe(),W()}async function xe(){if(!P())throw new Error("Sesión inválida.");const e=await w(await g.rpc("app_validate_session",{p_token:P()}),"No fue posible validar la sesión.");if(!e?.ok)throw new Error("Sesión inválida.");return l.profile=e.profile,I({token:P(),expires_at:e.expires_at}),l.profile}async function X(){l.loading=!0,await xe();const[e,t,a,s]=await Promise.all([g.from("incidents").select("*").order("created_at",{ascending:!1}),g.from("audit_log").select("*").order("occurred_at",{ascending:!1}).limit(500),g.from("app_users").select(et).order("display_name"),g.from("catalogs").select("*").order("category").order("value")]);l.incidents=await w(e),l.audit=await w(t),l.profiles=(await w(a)).map(rt),l.catalogs=await w(s),!l.selectedIncidentId&&l.incidents[0]&&(l.selectedIncidentId=l.incidents[0].id),l.loading=!1}function q(){const e={dashboard:{label:"Dashboard",icon:"📊"},incidents:{label:"Pendientes",icon:"📋"},kanban:{label:"Kanban",icon:"▦"},audit:{label:"Bitácora",icon:"🧾"},users:{label:"Usuarios",icon:"👥"},catalogs:{label:"Catálogos",icon:"⚙️"}},t=["dashboard","incidents","kanban","audit",...Ne()?["users"]:[],...st()?["catalogs"]:[]];B.innerHTML=`
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
          <span>${o(F())}</span>
          <button class="btn ghost" id="logoutBtn">Cerrar sesión</button>
        </div>
      </aside>
      <main class="content">
        <header class="topbar">
          <div>
            <h1>Auditoría Pendientes</h1>
            <div class="muted">Sistema de gestión de incidencias de auditoría</div>
          </div>
          <div class="user-chip">${o(l.profile?.display_name||"")} · ${o(F())}</div>
        </header>
        <section id="page"></section>
      </main>
    </div>
    <dialog class="modal" id="modal"></dialog>
  `,document.querySelectorAll("[data-page]").forEach(a=>{a.addEventListener("click",()=>{l.page=a.dataset.page,q()})}),document.querySelector("#logoutBtn").addEventListener("click",qe),ne()}function ne(){const e=document.querySelector("#page");l.page==="dashboard"&&(e.innerHTML=ht()),l.page==="incidents"&&(e.innerHTML=ft()),l.page==="kanban"&&(e.innerHTML=yt()),l.page==="audit"&&(e.innerHTML=$t()),l.page==="users"&&(e.innerHTML=_t()),l.page==="catalogs"&&(e.innerHTML=Pt()),Lt()}function ee(){return l.incidents.filter(e=>{const t=l.filters,a=`${e.id} ${e.hotel} ${e.department} ${e.incident_type} ${e.description} ${e.responsible}`.toLowerCase();return(!t.hotel||e.hotel===t.hotel)&&(!t.department||e.department===t.department)&&(!t.priority||e.priority===t.priority)&&(!t.status||e.status===t.status)&&(!t.responsible||e.responsible===t.responsible)&&(!t.type||e.incident_type===t.type)&&(!t.search||a.includes(t.search.toLowerCase()))})}function R(e,t,a=""){return`
    <div class="page-head">
      <div><h2>${o(e)}</h2><div class="muted">${o(t)}</div></div>
      ${a}
    </div>
  `}function me(){const e=l.filters,t=(a,s,r)=>`
    <div class="field">
      <label>${s}</label>
      <select data-filter="${a}">
        <option value="">Todos</option>
        ${Q(r,e[a])}
      </select>
    </div>
  `;return`
    <div class="filters">
      ${t("hotel","Hotel",G("hotel"))}
      ${t("department","Departamento",G("department"))}
      ${t("type","Tipo",G("incident_type"))}
      ${t("priority","Prioridad",oe)}
      ${t("status","Estatus",k)}
      ${t("responsible","Responsable",G("responsible"))}
      <div class="field"><label>Buscar</label><input data-filter="search" value="${o(e.search)}" placeholder="ID, descripción..."></div>
    </div>
  `}function G(e){return[...new Set(l.incidents.map(t=>$(t[e])).filter(Boolean))].sort()}function ht(){const e=ee(),t=e.filter(u=>!S.includes(u.status)),a=e.filter(u=>S.includes(u.status)),s=t.filter(u=>C(u).days<0),r=e.filter(u=>["Crítica","Critica"].includes(u.priority)),i=a.filter(u=>T(u.closed_at).slice(3)===T(new Date).slice(3)),n=e.filter(u=>C(u).met).length,d=Pe(t,"responsible")||"Sin asignar",p=Pe(e,"department")||"-";return`
    ${R("Dashboard","Indicadores ejecutivos y comportamiento operativo.")}
    ${me()}
    <div class="kpi-grid">
      ${O("Total",e.length,"Incidencias filtradas")}
      ${O("Abiertas",t.length,`${we(t.length,e.length)}% del total`)}
      ${O("Vencidas",s.length,"Fuera de SLA")}
      ${O("Críticas",r.length,"Prioridad máxima")}
      ${O("Cerradas este mes",i.length,"Productividad mensual")}
      ${O("% Cumplimiento SLA",`${we(n,e.length)}%`,"Filtrado actual")}
      ${O("Responsable con más abiertas",d,"Carga operativa")}
      ${O("Departamento con más incidencias",p,"Concentración")}
    </div>
    <div class="charts">
      ${K("Incidencias por hotel",e,"hotel")}
      ${K("Incidencias por departamento",e,"department")}
      ${K("Incidencias por prioridad",e,"priority")}
      ${K("Incidencias por estatus",e,"status")}
    </div>
  `}function O(e,t,a){return`<div class="kpi"><div class="label">${o(e)}</div><div class="value">${o(t)}</div><div class="sub">${o(a)}</div></div>`}function we(e,t){return t?(e/t*100).toFixed(1):"0.0"}function Pe(e,t){const a=new Map;return e.forEach(s=>{const r=$(s[t])||"Sin asignar";a.set(r,(a.get(r)||0)+1)}),[...a.entries()].sort((s,r)=>r[1]-s[1])[0]?.[0]}function K(e,t,a){const s=new Map;t.forEach(n=>{const d=$(n[a])||"Sin dato";s.set(d,(s.get(d)||0)+1)});const r=Math.max(1,...s.values()),i=[...s.entries()].sort((n,d)=>d[1]-n[1]).slice(0,10);return`
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
  `}function ft(){const e=ee();!l.selectedIncidentId&&e[0]&&(l.selectedIncidentId=e[0].id);const t=e.find(s=>s.id===l.selectedIncidentId)||e[0];t&&(l.selectedIncidentId=t.id);const a=L(null,"create")?'<button class="btn primary" data-action="new-incident">Nueva incidencia</button>':"";return`
    ${R("Incidencias","Tabla tipo Excel, filtros, acciones y cierre formal.",a)}
    ${me()}
    <div class="toolbar">
      <strong>${e.length} registro(s)</strong>
      <button class="btn" data-action="export-csv">Exportar CSV</button>
    </div>
    <div class="split">
      ${bt(e)}
      <aside class="panel">${t?gt(t):'<div class="empty">Selecciona una incidencia.</div>'}</aside>
    </div>
  `}function bt(e){const t=[["id","ID"],["created_at","Fecha"],["hotel","Hotel"],["department","Departamento"],["incident_type","Tipo"],["priority","Prioridad"],["status","Estatus"],["responsible","Responsable"],["sla","SLA"],["due_at","Compromiso"],["description","Descripción"]];return`
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr>${t.map(([,a])=>`<th>${o(a)}</th>`).join("")}</tr></thead>
          <tbody>
            ${e.length?e.map(a=>`
              <tr data-select="${o(a.id)}" class="${a.id===l.selectedIncidentId?"selected":""}">
                ${t.map(([s])=>`<td>${vt(a,s)}</td>`).join("")}
              </tr>
            `).join(""):`<tr><td colspan="${t.length}" class="empty">No hay incidencias con los filtros seleccionados.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `}function vt(e,t){if(t==="id")return`<button class="row-button" data-select="${o(e.id)}">${o(e.id)}</button>`;if(t==="created_at"||t==="due_at")return o(T(e[t]));if(t==="priority")return y(e.priority);if(t==="status")return y(e.status);if(t==="sla"){const a=C(e);return y(a.label,a.cls)}return o(t==="description"?J(e.description,130):e[t]||"")}function gt(e){const t=C(e);return`
    <h3>${o(e.id)}</h3>
    <div class="selected-card">
      <div>${y(e.priority)} ${y(e.status)} ${y(t.label,t.cls)}</div>
      <strong>${o(e.hotel||"Sin hotel")}</strong>
      <span class="muted">${o(e.department||"Sin departamento")} · Responsable: ${o(e.responsible||"Sin asignar")}</span>
      <p>${o(e.description||"")}</p>
    </div>
    <div class="actions">
      <button class="btn" data-action="detail" data-id="${o(e.id)}">Detalle</button>
      <button class="btn" data-action="comment" data-id="${o(e.id)}" ${L(e,"comment")?"":"disabled"}>Comentar</button>
      <button class="btn" data-action="edit" data-id="${o(e.id)}" ${L(e,"edit")?"":"disabled"}>Editar</button>
      ${S.includes(e.status)?`<button class="btn" data-action="reopen" data-id="${o(e.id)}" ${L(e,"reopen")?"":"disabled"}>Reabrir</button>`:`<button class="btn primary" data-action="close" data-id="${o(e.id)}" ${L(e,"close")?"":"disabled"}>Cerrar</button>`}
    </div>
  `}function yt(){const e=ee();return`
    ${R("Kanban","Seguimiento por estatus con cambio rápido.")}
    ${me()}
    <div class="kanban">
      ${k.map(t=>{const a=e.filter(s=>s.status===t);return`
          <section class="kanban-col">
            <div class="kanban-head"><span>${o(t)}</span><b>${a.length}</b></div>
            ${a.map(s=>`
              <article class="kanban-card">
                <button class="row-button" data-select="${o(s.id)}" data-page-link="incidents">${o(s.id)}</button>
                <span class="muted">${o(s.hotel||"")} · ${o(s.department||"")}</span>
                <span>${y(s.priority)} ${y(C(s).label,C(s).cls)}</span>
                <span>${o(J(s.description,95))}</span>
                <select data-status-change="${o(s.id)}" ${!L(s,"status")&&!L(s,"reopen")?"disabled":""}>
                  ${Q(lt(s),s.status)}
                </select>
              </article>
            `).join("")||'<div class="empty">Sin incidencias.</div>'}
          </section>
        `}).join("")}
    </div>
  `}function $t(){return`
    ${R("Bitácora","Historial completo de cambios y comentarios.")}
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Incidencia</th><th>Acción</th><th>Campo</th><th>Anterior</th><th>Nuevo</th><th>Comentario</th></tr></thead>
          <tbody>
            ${l.audit.map(e=>`
              <tr>
                <td>${o(T(e.occurred_at,!0))}</td>
                <td>${o(At(e))}</td>
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
  `}function _t(){if(!Ne())return`
      ${R("Usuarios","Administración de accesos.")}
      <div class="error">No tienes permisos para administrar usuarios.</div>
    `;const e=St();return`
    ${R("Usuarios","Administración de accesos, roles y estados.",'<button class="btn primary" data-action="new-user">Nuevo usuario</button>')}
    ${wt()}
    <div class="toolbar">
      <strong>${e.length} usuario(s)</strong>
      <span class="muted">Los cambios quedan registrados en bitácora.</span>
    </div>
    <div class="excel-wrap">
      <div class="excel-scroller">
        <table class="excel">
          <thead><tr><th>Usuario</th><th>Password</th><th>Nombre</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th>Intentos fallidos</th><th>Bloqueado</th><th>Debe cambiar password</th><th>Hotel</th><th>Departamento</th><th>Acciones</th></tr></thead>
          <tbody>
            ${e.map(t=>`
              <tr>
                <td>${o(t.username||"")}</td>
                <td>${o(t.password_mask||De)}</td>
                <td>${o(t.display_name||"")}</td>
                <td>${y(t.role||"Auditor")}</td>
                <td>${y(t.status||"Activo")}</td>
                <td>${o(T(t.last_access_at,!0))}</td>
                <td>${o(t.failed_attempts??0)}</td>
                <td>${y(H(!!t.blocked))}</td>
                <td>${y(H(!!t.must_change_password))}</td>
                <td>${o(t.hotel||"")}</td>
                <td>${o(t.department||"")}</td>
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
            `).join("")||'<tr><td colspan="12" class="empty">No hay usuarios con los filtros seleccionados.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `}function St(){const e=l.userFilters;return l.profiles.filter(t=>{const a=`${t.username||""} ${t.display_name||""}`.toLowerCase();return(!e.search||a.includes(e.search.toLowerCase()))&&(!e.role||t.role===e.role)&&(!e.status||t.status===e.status)&&(!e.hotel||t.hotel===e.hotel)&&(!e.department||t.department===e.department)})}function wt(){const e=l.userFilters,t=(a,s,r)=>`
    <div class="field">
      <label>${s}</label>
      <select data-user-filter="${a}">
        <option value="">Todos</option>
        ${Q(r,e[a])}
      </select>
    </div>
  `;return`
    <div class="filters user-filters">
      <div class="field"><label>Buscar</label><input data-user-filter="search" value="${o(e.search)}" placeholder="Usuario o nombre"></div>
      ${t("role","Rol",le)}
      ${t("status","Estado",ce)}
      ${t("hotel","Hotel",Ae("hotel"))}
      ${t("department","Departamento",Ae("department"))}
    </div>
  `}function Ae(e){return[...new Set(l.profiles.map(t=>$(t[e])).filter(Boolean))].sort()}function Pt(){return`
    ${R("Catálogos","Valores usados por formularios y filtros.",'<button class="btn primary" data-action="new-catalog">Nuevo valor</button>')}
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
  `}function At(e){return l.profiles.find(t=>t.id===e.user_id)?.display_name||e.legacy_user||""}function Lt(){document.querySelectorAll("[data-filter]").forEach(e=>{e.addEventListener("input",()=>{l.filters[e.dataset.filter]=e.value,ne()})}),document.querySelectorAll("[data-user-filter]").forEach(e=>{e.addEventListener("input",()=>{l.userFilters[e.dataset.userFilter]=e.value,ne()})}),document.querySelectorAll("[data-select]").forEach(e=>{e.addEventListener("click",()=>{l.selectedIncidentId=e.dataset.select,e.dataset.pageLink&&(l.page=e.dataset.pageLink),q()})}),document.querySelectorAll("[data-status-change]").forEach(e=>{e.addEventListener("change",async()=>{const t=l.incidents.find(s=>s.id===e.dataset.statusChange),a=e.value;if(!(!t||a===t.status)){if(S.includes(a)&&!S.includes(t.status)){Me(t);return}if(S.includes(t.status)&&!S.includes(a)){Ue(t);return}await te(t,{status:a},"Cambio de estatus",`Estatus cambiado a ${a}.`)}})}),document.querySelectorAll("[data-action]").forEach(e=>{e.addEventListener("click",()=>{Ct(e.dataset.action,e.dataset.id).catch(t=>{console.error(t),b("No fue posible completar la acción.")})})})}async function Ct(e,t){const a=l.incidents.find(r=>r.id===t),s=l.profiles.find(r=>r.id===t);e==="new-incident"&&Le(),e==="edit"&&Le(a),e==="detail"&&jt(a),e==="comment"&&qt(a),e==="close"&&Me(a),e==="reopen"&&Ue(a),e==="export-csv"&&Mt(ee()),e==="new-catalog"&&xt(),e==="new-user"&&Ce(),e==="edit-user"&&Ce(s),e==="toggle-user"&&await Tt(s),e==="toggle-blocked"&&await Dt(s),e==="password-user"&&kt(s),e==="audit-user"&&Rt(s)}function E(e,t,a=""){const s=document.querySelector("#modal");return s.innerHTML=`
    <div class="modal-body">
      <div class="modal-head"><h3>${o(e)}</h3><button class="btn ghost" data-modal-close>Cerrar</button></div>
      ${t}
      ${a}
    </div>
  `,s.showModal(),s.querySelector("[data-modal-close]").addEventListener("click",()=>s.close()),s}function Le(e=null){const t=!!e,a=`
    <form id="incidentForm" class="form-grid">
      ${m("hotel","Hotel",e?.hotel,"select",A("Hotel"))}
      ${m("department","Departamento",e?.department,"select",A("Departamento"))}
      ${m("responsible_area","Área responsable",e?.responsible_area,"select",A("Área Responsable"))}
      ${m("incident_type","Tipo de incidencia",e?.incident_type,"select",A("Tipo de Incidencia"))}
      ${m("impact","Impacto",e?.impact,"select",A("Impacto"))}
      ${m("priority","Prioridad",e?.priority||"Media","select",oe)}
      ${m("status","Estatus",e?.status||"Pendiente","select",k)}
      ${m("responsible","Responsable",e?.responsible)}
      ${m("due_at","Fecha compromiso",e?.due_at||ue(e?.priority||"Media"),"date")}
      ${m("description","Descripción",e?.description,"textarea",[],"form-full")}
      ${m("evidence_url","Evidencia URL",e?.evidence_url,"url",[],"form-full")}
      <button class="btn primary form-full" type="submit">${t?"Guardar cambios":"Crear incidencia"}</button>
    </form>
  `,s=E(t?`Editar ${e.id}`:"Nueva incidencia",a);s.querySelector("#incidentForm").addEventListener("submit",async r=>{r.preventDefault();const i=N(r.currentTarget);if(!i.hotel||!i.department||!i.incident_type||!i.priority||!i.description){b("Completa hotel, departamento, tipo, prioridad y descripción.");return}t?await te(e,i,"Actualización de incidencia","Incidencia actualizada."):await Nt(i),s.close()})}function m(e,t,a="",s="text",r=[],i=""){return s==="select"?`<div class="field ${i}"><label>${o(t)}</label><select name="${e}">${Q(r,a)}</select></div>`:s==="textarea"?`<div class="field ${i}"><label>${o(t)}</label><textarea name="${e}">${o(a||"")}</textarea></div>`:`<div class="field ${i}"><label>${o(t)}</label><input name="${e}" type="${s}" value="${o(a||"")}"></div>`}function N(e){return Object.fromEntries([...new FormData(e).entries()].map(([t,a])=>[t,$(a)]))}function Et(e,t,a,s=!1){return l.profiles.filter(r=>{const i=r.id===e?t:r.role,n=r.id===e?a:r.status,d=r.id===e?s:!!r.blocked;return i==="Administrador"&&n==="Activo"&&!d}).length}function he(e,t=null){if(!e.username||!e.display_name||!e.role||!e.status)return"Usuario, nombre, rol y estado son obligatorios.";if(!t&&$(e.password).length<8)return"La contraseña inicial debe tener al menos 8 caracteres.";if(!le.includes(e.role))return"Selecciona un rol válido.";if(!ce.includes(e.status))return"Selecciona un estado válido.";if(l.profiles.find(r=>r.id!==t?.id&&ie(r.username)===ie(e.username)))return"Ya existe un usuario con ese nombre de usuario.";const s=Y(e.blocked);if(t?.id===l.profile?.id&&t.role==="Administrador"){if(e.status!=="Activo")return"No puedes desactivar tu propio usuario administrador.";if(e.role!=="Administrador")return"No puedes quitarte el rol Administrador desde tu propia sesión.";if(s)return"No puedes bloquear tu propio usuario administrador."}return t&&Et(t.id,e.role,e.status,s)<1?"Debe quedar al menos un administrador activo.":""}function Ce(e=null){const t=!!e,a=`
    <form id="userForm" class="form-grid">
      ${t?"":`
        <div class="field form-full">
          <label>Contraseña inicial</label>
          <input name="password" type="password" required autocomplete="new-password">
        </div>
      `}
      ${m("username","Usuario",e?.username||"")}
      ${m("display_name","Nombre",e?.display_name||"")}
      ${m("role","Rol",e?.role||"Auditor","select",le)}
      ${m("status","Estado",e?.status||"Activo","select",ce)}
      ${m("blocked","Bloqueado",H(!!e?.blocked),"select",re)}
      ${m("must_change_password","Debe cambiar password",H(e?!!e.must_change_password:!0),"select",re)}
      ${m("hotel","Hotel",e?.hotel||"","select",A("Hotel"))}
      ${m("department","Departamento",e?.department||"","select",A("Departamento"))}
      <button class="btn primary form-full" type="submit">${t?"Guardar cambios":"Crear usuario"}</button>
    </form>
  `,s=E(t?`Editar ${e.username||"usuario"}`:"Nuevo usuario",a);s.querySelector("#userForm").addEventListener("submit",async r=>{r.preventDefault();const i=N(r.currentTarget),n=he(i,e);if(n){b(n);return}try{await Ot(i,e),s.close()}catch(d){console.error(d),b("No fue posible guardar el usuario. Verifica los datos e intenta nuevamente.")}})}async function Ot(e,t=null){const a={username:e.username,display_name:e.display_name,role:e.role,status:e.status,blocked:Y(e.blocked),must_change_password:Y(e.must_change_password),hotel:e.hotel||null,department:e.department||null};t||(a.password=e.password);const s=await w(await g.rpc("app_save_user",{p_token:P(),p_user_id:t?.id||null,p_user:a}),t?"No se pudo actualizar el usuario.":"No se pudo crear el usuario.");if(!s?.ok)throw new Error(s?.reason||"No se pudo guardar el usuario.");b(t?"Usuario actualizado.":"Usuario creado."),await D()}async function Tt(e){if(!e)return;const t=e.status==="Activo"?"Inactivo":"Activo",a=he({...e,status:t},e);if(a){b(a);return}try{const s=await w(await g.rpc("app_toggle_user_status",{p_token:P(),p_user_id:e.id}),"No se pudo cambiar el estado.");if(!s?.ok)throw new Error(s?.reason||"No se pudo cambiar el estado.");b(`Usuario ${t.toLowerCase()}.`),await D()}catch(s){console.error(s),b("No fue posible cambiar el estado del usuario.")}}async function Dt(e){if(!e)return;const t=!e.blocked,a=he({...e,blocked:H(t)},e);if(a){b(a);return}try{const s=await w(await g.rpc("app_toggle_user_blocked",{p_token:P(),p_user_id:e.id}),"No se pudo cambiar el bloqueo.");if(!s?.ok)throw new Error(s?.reason||"No se pudo cambiar el bloqueo.");b(t?"Usuario bloqueado.":"Usuario desbloqueado."),await D()}catch(s){console.error(s),b("No fue posible cambiar el bloqueo del usuario.")}}function kt(e){if(!e)return;E(`Contraseña de ${e.username||"usuario"}`,`
    <form id="resetPasswordForm" class="form-grid" autocomplete="off">
      <div class="field form-full">
        <label>Nueva contraseña temporal</label>
        <input name="password" type="password" required autocomplete="new-password">
      </div>
      ${m("must_change_password","Debe cambiar password","Sí","select",re,"form-full")}
      <button class="btn primary form-full" type="submit">Restablecer contraseña</button>
    </form>
  `).querySelector("#resetPasswordForm").addEventListener("submit",a=>{a.preventDefault();const s=N(a.currentTarget);It(e,s.password,Y(s.must_change_password)).catch(r=>{console.error(r),b("No fue posible registrar el restablecimiento.")})})}async function It(e,t="",a=!0){if(!e)return;if($(t).length<8){b("La contraseña temporal debe tener al menos 8 caracteres.");return}const s=await w(await g.rpc("app_admin_reset_password",{p_token:P(),p_user_id:e.id,p_new_password:t,p_must_change_password:a}),"No se pudo restablecer la contraseña.");if(!s?.ok)throw new Error(s?.reason||"No se pudo restablecer la contraseña.");document.querySelector("#modal")?.close(),b("Contraseña restablecida."),await D()}function Rt(e){if(!e)return;const t=l.audit.filter(a=>$(a.changed_field).includes(`Usuario: ${e.username}`));E(`Bitácora de ${e.username||"usuario"}`,`
    <div class="timeline">
      ${t.map(a=>`
        <div class="timeline-item">
          <b>${o(a.action)}</b> · <span class="muted">${o(T(a.occurred_at,!0))}</span>
          <p>${o(a.comment||"")}</p>
          <p class="muted">${o(J(a.old_value,140))} → ${o(J(a.new_value,140))}</p>
        </div>
      `).join("")||'<div class="empty">Sin movimientos registrados para este usuario.</div>'}
    </div>
  `)}async function Nt(e){const t=e.due_at||ue(e.priority),a={id:ot(),...e,due_at:t,actual_due_at:t,created_by:l.profile?.id,updated_by:l.profile?.id,created_at:U(),updated_at:U()};await w(await g.from("incidents").insert(a),"No se pudo crear la incidencia."),await fe(a.id,"Creación","Incidencia","","Creada","Incidencia creada.",a),b("Incidencia creada."),await D()}async function te(e,t,a,s){if(!e)return;const r={...t,updated_by:l.profile?.id,updated_at:U()};r.status&&S.includes(r.status)&&!e.closed_at&&(r.closed_at=U()),r.status&&!S.includes(r.status)&&(r.closed_at=null),await w(await g.from("incidents").update(r).eq("id",e.id),"No se pudo actualizar.");for(const[i,n]of Object.entries(t))String(e[i]??"")!==String(n??"")&&await fe(e.id,a,i,e[i],n,s,{...e,...r});b("Cambios guardados."),await D()}async function fe(e,t,a,s,r,i,n){await g.from("audit_log").insert({incident_id:e,user_id:l.profile?.id,legacy_user:l.profile?.display_name||l.profile?.username||"Usuario",action:t,changed_field:a,old_value:s??"",new_value:r??"",comment:i,hotel:n?.hotel||"",status:n?.status||""})}function jt(e){E(`Detalle ${e.id}`,`
    <div class="selected-card">
      <div>${y(e.priority)} ${y(e.status)} ${y(C(e).label,C(e).cls)}</div>
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
          <b>${o(t.action)}</b> · <span class="muted">${o(T(t.occurred_at,!0))}</span>
          <p>${o(t.changed_field||"General")}: ${o(t.old_value||"")} → ${o(t.new_value||"")}</p>
          <p>${o(t.comment||"")}</p>
        </div>
      `).join("")||'<div class="empty">Sin movimientos.</div>'}
    </div>
  `)}function qt(e){const t=E(`Comentar ${e.id}`,`
    <form id="commentForm" class="form-grid">
      ${m("comment","Comentario","","textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">Guardar comentario</button>
    </form>
  `);t.querySelector("#commentForm").addEventListener("submit",async a=>{a.preventDefault();const s=N(a.currentTarget);await fe(e.id,"Comentario","Comentario","",s.comment,s.comment,e),b("Comentario guardado."),t.close(),await D()})}function Me(e){const t=E(`Cerrar ${e.id}`,`
    <form id="closeForm" class="form-grid">
      ${m("root_cause","Causa raíz",e.root_cause,"select",A("Causa raíz"))}
      ${m("action_taken","Acción tomada",e.action_taken,"select",A("Acción tomada"))}
      ${m("close_reason","Motivo de cierre",e.close_reason)}
      ${m("evidence_url","Evidencia URL",e.evidence_url,"url")}
      ${m("final_comment","Comentario final",e.final_comment,"textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">Cerrar incidencia</button>
    </form>
  `);t.querySelector("#closeForm").addEventListener("submit",async a=>{a.preventDefault();const s=N(a.currentTarget);if(!s.root_cause||!s.action_taken||!s.final_comment){b("Causa raíz, acción tomada y comentario final son obligatorios.");return}await te(e,{...s,status:"Cerrado",closed_at:U()},"Cierre formal",s.final_comment),t.close()})}function Ue(e){const t=E(`Reabrir ${e.id}`,`
    <form id="reopenForm" class="form-grid">
      ${m("status","Nuevo estatus","En proceso","select",k.filter(a=>!S.includes(a)))}
      ${m("comment","Motivo de reapertura","","textarea",[],"form-full")}
      <button class="btn primary form-full" type="submit">Reabrir incidencia</button>
    </form>
  `);t.querySelector("#reopenForm").addEventListener("submit",async a=>{a.preventDefault();const s=N(a.currentTarget);if(!s.comment){b("El motivo es obligatorio.");return}await te(e,{status:s.status,closed_at:null},"Reapertura",s.comment),t.close()})}function xt(){const e=E("Nuevo valor de catálogo",`
    <form id="catalogForm" class="form-grid">
      ${m("category","Categoría","","select",Object.keys(ke))}
      ${m("value","Valor","")}
      <button class="btn primary form-full" type="submit">Guardar</button>
    </form>
  `);e.querySelector("#catalogForm").addEventListener("submit",async t=>{t.preventDefault();const a=N(t.currentTarget);await w(await g.from("catalogs").insert(a),"No se pudo guardar el catálogo."),b("Catálogo guardado."),e.close(),await D()})}function Mt(e){const a=[["ID","Fecha","Hotel","Departamento","Tipo","Prioridad","Estatus","Responsable","SLA","Descripción"].join(","),...e.map(n=>[n.id,T(n.created_at),n.hotel,n.department,n.incident_type,n.priority,n.status,n.responsible,C(n).label,n.description].map(d=>`"${String(d??"").replaceAll('"','""')}"`).join(","))],s=new Blob([a.join(`
`)],{type:"text/csv;charset=utf-8"}),r=URL.createObjectURL(s),i=document.createElement("a");i.href=r,i.download="incidencias_filtradas.csv",i.click(),URL.revokeObjectURL(r)}async function D(){await X(),q()}dt().catch(e=>{console.error(e),B.innerHTML=`<main class="config-shell"><section class="config-card"><div class="error">${o(e.message)}</div></section></main>`});
