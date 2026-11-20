/* KCM Travel & Tours backend, combined 2026-11-20 from Vendor.gs, Security.gs, Pricing.gs, Code.gs, Ops.gs, Assistant.gs, Demo.gs.
   Paste this whole file into Code.gs in the Apps Script editor (replace everything), save, run setup, then
   Deploy > Manage deployments > Edit > New version. Source: backend/apps-script/ in the repository. */

/* ======================= Vendor.gs ======================= */
/** Bundled crypto for the KCM backend: @noble/hashes (argon2id, hmac, sha1, sha256) and @noble/ciphers (aes-gcm).
 * MIT License, (c) Paul Miller (paulmillr.com). Audited libraries. Rebuild: see scripts/build_backend.py. Do not edit. */
(()=>{var gt=BigInt(4294967295),$t=BigInt(32);function Qt(e,t=!1){return t?{h:Number(e&gt),l:Number(e>>$t&gt)}:{h:Number(e>>$t&gt)|0,l:Number(e&gt)|0}}var J=(e,t,n)=>e>>>n|t<<32-n,$=(e,t,n)=>e<<32-n|t>>>n,yt=(e,t,n)=>e<<64-n|t>>>n-32,wt=(e,t,n)=>e>>>n-32|t<<64-n,At=(e,t)=>t,mt=(e,t)=>e;function vt(e,t,n,r){let s=(t>>>0)+(r>>>0);return{h:e+n+(s/2**32|0)|0,l:s|0}}var it=(e,t,n)=>(e>>>0)+(t>>>0)+(n>>>0),ct=(e,t,n,r)=>t+n+r+(e/2**32|0)|0;function Ee(e){return e instanceof Uint8Array||ArrayBuffer.isView(e)&&e.constructor.name==="Uint8Array"}function Q(e){if(!Number.isSafeInteger(e)||e<0)throw new Error("positive integer expected, got "+e)}function _(e,...t){if(!Ee(e))throw new Error("Uint8Array expected");if(t.length>0&&!t.includes(e.length))throw new Error("Uint8Array expected of length "+t+", got length="+e.length)}function te(e){if(typeof e!="function"||typeof e.create!="function")throw new Error("Hash should be wrapped by utils.createHasher");Q(e.outputLen),Q(e.blockLen)}function G(e,t=!0){if(e.destroyed)throw new Error("Hash instance has been destroyed");if(t&&e.finished)throw new Error("Hash#digest() has already been called")}function Bt(e,t){_(e);let n=t.outputLen;if(e.length<n)throw new Error("digestInto() expects output buffer of length at least "+n)}function tt(e){return new Uint8Array(e.buffer,e.byteOffset,e.byteLength)}function Z(e){return new Uint32Array(e.buffer,e.byteOffset,Math.floor(e.byteLength/4))}function A(...e){for(let t=0;t<e.length;t++)e[t].fill(0)}function Ut(e){return new DataView(e.buffer,e.byteOffset,e.byteLength)}function C(e,t){return e<<32-t|e>>>t}function Ht(e,t){return e<<t|e>>>32-t>>>0}var ee=new Uint8Array(new Uint32Array([287454020]).buffer)[0]===68;function ne(e){return e<<24&4278190080|e<<8&16711680|e>>>8&65280|e>>>24&255}var O=ee?e=>e:e=>ne(e);function Se(e){for(let t=0;t<e.length;t++)e[t]=ne(e[t]);return e}var Y=ee?e=>e:Se;function re(e){if(typeof e!="string")throw new Error("string expected");return new Uint8Array(new TextEncoder().encode(e))}function k(e){return typeof e=="string"&&(e=re(e)),_(e),e}function Lt(e){return typeof e=="string"&&(e=re(e)),_(e),e}var N=class{};function Et(e){let t=r=>e().update(k(r)).digest(),n=e();return t.outputLen=n.outputLen,t.blockLen=n.blockLen,t.create=()=>e(),t}function oe(e){let t=(r,s)=>e(s).update(k(r)).digest(),n=e({});return t.outputLen=n.outputLen,t.blockLen=n.blockLen,t.create=r=>e(r),t}var se=Uint8Array.from([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3,11,8,12,0,5,2,15,13,10,14,3,6,7,1,9,4,7,9,3,1,13,12,11,14,2,6,5,10,4,0,15,8,9,0,5,7,2,4,10,15,14,1,11,12,6,8,3,13,2,12,6,10,0,11,8,3,4,13,7,5,15,14,1,9,12,5,1,15,14,13,4,10,0,7,6,3,9,2,8,11,13,11,7,14,12,1,3,9,5,0,15,4,8,6,2,10,6,15,14,9,11,3,0,8,12,2,13,7,1,4,10,5,10,2,8,4,7,6,1,5,15,11,9,14,3,12,13,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,14,10,4,8,9,15,13,6,1,12,0,2,11,7,5,3,11,8,12,0,5,2,15,13,10,14,3,6,7,1,9,4,7,9,3,1,13,12,11,14,2,6,5,10,4,0,15,8,9,0,5,7,2,4,10,15,14,1,11,12,6,8,3,13,2,12,6,10,0,11,8,3,4,13,7,5,15,14,1,9]);function _e(e,t,n,r){if(typeof e.setBigUint64=="function")return e.setBigUint64(t,n,r);let s=BigInt(32),o=BigInt(4294967295),i=Number(n>>s&o),c=Number(n&o),h=r?4:0,f=r?0:4;e.setUint32(t+h,i,r),e.setUint32(t+f,c,r)}function St(e,t,n){return e&t^~e&n}function _t(e,t,n){return e&t^e&n^t&n}var et=class extends N{constructor(t,n,r,s){super(),this.finished=!1,this.length=0,this.pos=0,this.destroyed=!1,this.blockLen=t,this.outputLen=n,this.padOffset=r,this.isLE=s,this.buffer=new Uint8Array(t),this.view=Ut(this.buffer)}update(t){G(this),t=k(t),_(t);let{view:n,buffer:r,blockLen:s}=this,o=t.length;for(let i=0;i<o;){let c=Math.min(s-this.pos,o-i);if(c===s){let h=Ut(t);for(;s<=o-i;i+=s)this.process(h,i);continue}r.set(t.subarray(i,i+c),this.pos),this.pos+=c,i+=c,this.pos===s&&(this.process(n,0),this.pos=0)}return this.length+=t.length,this.roundClean(),this}digestInto(t){G(this),Bt(t,this),this.finished=!0;let{buffer:n,view:r,blockLen:s,isLE:o}=this,{pos:i}=this;n[i++]=128,A(this.buffer.subarray(i)),this.padOffset>s-i&&(this.process(r,0),i=0);for(let l=i;l<s;l++)n[l]=0;_e(r,s-8,BigInt(this.length*8),o),this.process(r,0);let c=Ut(t),h=this.outputLen;if(h%4)throw new Error("_sha2: outputLen should be aligned to 32bit");let f=h/4,a=this.get();if(f>a.length)throw new Error("_sha2: outputLen bigger than state");for(let l=0;l<f;l++)c.setUint32(4*l,a[l],o)}digest(){let{buffer:t,outputLen:n}=this;this.digestInto(t);let r=t.slice(0,n);return this.destroy(),r}_cloneInto(t){t||(t=new this.constructor),t.set(...this.get());let{blockLen:n,buffer:r,length:s,finished:o,destroyed:i,pos:c}=this;return t.destroyed=i,t.finished=o,t.length=s,t.pos=c,s%n&&t.buffer.set(r),t}clone(){return this._cloneInto()}},v=Uint32Array.from([1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225]);var U=Uint32Array.from([4089235720,1779033703,2227873595,3144134277,4271175723,1013904242,1595750129,2773480762,2917565137,1359893119,725511199,2600822924,4215389547,528734635,327033209,1541459225]),u=new Uint32Array(32);function W(e,t,n,r,s,o){let i=s[o],c=s[o+1],h=u[2*e],f=u[2*e+1],a=u[2*t],l=u[2*t+1],x=u[2*n],b=u[2*n+1],d=u[2*r],p=u[2*r+1],y=it(h,a,i);f=ct(y,f,l,c),h=y|0,{Dh:p,Dl:d}={Dh:p^f,Dl:d^h},{Dh:p,Dl:d}={Dh:At(p,d),Dl:mt(p,d)},{h:b,l:x}=vt(b,x,p,d),{Bh:l,Bl:a}={Bh:l^b,Bl:a^x},{Bh:l,Bl:a}={Bh:J(l,a,24),Bl:$(l,a,24)},u[2*e]=h,u[2*e+1]=f,u[2*t]=a,u[2*t+1]=l,u[2*n]=x,u[2*n+1]=b,u[2*r]=d,u[2*r+1]=p}function j(e,t,n,r,s,o){let i=s[o],c=s[o+1],h=u[2*e],f=u[2*e+1],a=u[2*t],l=u[2*t+1],x=u[2*n],b=u[2*n+1],d=u[2*r],p=u[2*r+1],y=it(h,a,i);f=ct(y,f,l,c),h=y|0,{Dh:p,Dl:d}={Dh:p^f,Dl:d^h},{Dh:p,Dl:d}={Dh:J(p,d,16),Dl:$(p,d,16)},{h:b,l:x}=vt(b,x,p,d),{Bh:l,Bl:a}={Bh:l^b,Bl:a^x},{Bh:l,Bl:a}={Bh:yt(l,a,63),Bl:wt(l,a,63)},u[2*e]=h,u[2*e+1]=f,u[2*t]=a,u[2*t+1]=l,u[2*n]=x,u[2*n+1]=b,u[2*r]=d,u[2*r+1]=p}function Ie(e,t={},n,r,s){if(Q(n),e<0||e>n)throw new Error("outputLen bigger than keyLen");let{key:o,salt:i,personalization:c}=t;if(o!==void 0&&(o.length<1||o.length>n))throw new Error("key length must be undefined or 1.."+n);if(i!==void 0&&i.length!==r)throw new Error("salt must be undefined or "+r);if(c!==void 0&&c.length!==s)throw new Error("personalization must be undefined or "+s)}var Vt=class extends N{constructor(t,n){super(),this.finished=!1,this.destroyed=!1,this.length=0,this.pos=0,Q(t),Q(n),this.blockLen=t,this.outputLen=n,this.buffer=new Uint8Array(t),this.buffer32=Z(this.buffer)}update(t){G(this),t=k(t),_(t);let{blockLen:n,buffer:r,buffer32:s}=this,o=t.length,i=t.byteOffset,c=t.buffer;for(let h=0;h<o;){this.pos===n&&(Y(s),this.compress(s,0,!1),Y(s),this.pos=0);let f=Math.min(n-this.pos,o-h),a=i+h;if(f===n&&!(a%4)&&h+f<o){let l=new Uint32Array(c,a,Math.floor((o-h)/4));Y(l);for(let x=0;h+n<o;x+=s.length,h+=n)this.length+=n,this.compress(l,x,!1);Y(l);continue}r.set(t.subarray(h,h+f),this.pos),this.pos+=f,this.length+=f,h+=f}return this}digestInto(t){G(this),Bt(t,this);let{pos:n,buffer32:r}=this;this.finished=!0,A(this.buffer.subarray(n)),Y(r),this.compress(r,0,!0),Y(r);let s=Z(t);this.get().forEach((o,i)=>s[i]=O(o))}digest(){let{buffer:t,outputLen:n}=this;this.digestInto(t);let r=t.slice(0,n);return this.destroy(),r}_cloneInto(t){let{buffer:n,length:r,finished:s,destroyed:o,outputLen:i,pos:c}=this;return t||(t=new this.constructor({dkLen:i})),t.set(...this.get()),t.buffer.set(n),t.destroyed=o,t.finished=s,t.length=r,t.pos=c,t.outputLen=i,t}clone(){return this._cloneInto()}},Nt=class extends Vt{constructor(t={}){let n=t.dkLen===void 0?64:t.dkLen;super(128,n),this.v0l=U[0]|0,this.v0h=U[1]|0,this.v1l=U[2]|0,this.v1h=U[3]|0,this.v2l=U[4]|0,this.v2h=U[5]|0,this.v3l=U[6]|0,this.v3h=U[7]|0,this.v4l=U[8]|0,this.v4h=U[9]|0,this.v5l=U[10]|0,this.v5h=U[11]|0,this.v6l=U[12]|0,this.v6h=U[13]|0,this.v7l=U[14]|0,this.v7h=U[15]|0,Ie(n,t,64,16,16);let{key:r,personalization:s,salt:o}=t,i=0;if(r!==void 0&&(r=k(r),i=r.length),this.v0l^=this.outputLen|i<<8|65536|1<<24,o!==void 0){o=k(o);let c=Z(o);this.v4l^=O(c[0]),this.v4h^=O(c[1]),this.v5l^=O(c[2]),this.v5h^=O(c[3])}if(s!==void 0){s=k(s);let c=Z(s);this.v6l^=O(c[0]),this.v6h^=O(c[1]),this.v7l^=O(c[2]),this.v7h^=O(c[3])}if(r!==void 0){let c=new Uint8Array(this.blockLen);c.set(r),this.update(c)}}get(){let{v0l:t,v0h:n,v1l:r,v1h:s,v2l:o,v2h:i,v3l:c,v3h:h,v4l:f,v4h:a,v5l:l,v5h:x,v6l:b,v6h:d,v7l:p,v7h:y}=this;return[t,n,r,s,o,i,c,h,f,a,l,x,b,d,p,y]}set(t,n,r,s,o,i,c,h,f,a,l,x,b,d,p,y){this.v0l=t|0,this.v0h=n|0,this.v1l=r|0,this.v1h=s|0,this.v2l=o|0,this.v2h=i|0,this.v3l=c|0,this.v3h=h|0,this.v4l=f|0,this.v4h=a|0,this.v5l=l|0,this.v5h=x|0,this.v6l=b|0,this.v6h=d|0,this.v7l=p|0,this.v7h=y|0}compress(t,n,r){this.get().forEach((h,f)=>u[f]=h),u.set(U,16);let{h:s,l:o}=Qt(BigInt(this.length));u[24]=U[8]^o,u[25]=U[9]^s,r&&(u[28]=~u[28],u[29]=~u[29]);let i=0,c=se;for(let h=0;h<12;h++)W(0,4,8,12,t,n+2*c[i++]),j(0,4,8,12,t,n+2*c[i++]),W(1,5,9,13,t,n+2*c[i++]),j(1,5,9,13,t,n+2*c[i++]),W(2,6,10,14,t,n+2*c[i++]),j(2,6,10,14,t,n+2*c[i++]),W(3,7,11,15,t,n+2*c[i++]),j(3,7,11,15,t,n+2*c[i++]),W(0,5,10,15,t,n+2*c[i++]),j(0,5,10,15,t,n+2*c[i++]),W(1,6,11,12,t,n+2*c[i++]),j(1,6,11,12,t,n+2*c[i++]),W(2,7,8,13,t,n+2*c[i++]),j(2,7,8,13,t,n+2*c[i++]),W(3,4,9,14,t,n+2*c[i++]),j(3,4,9,14,t,n+2*c[i++]);this.v0l^=u[0]^u[16],this.v0h^=u[1]^u[17],this.v1l^=u[2]^u[18],this.v1h^=u[3]^u[19],this.v2l^=u[4]^u[20],this.v2h^=u[5]^u[21],this.v3l^=u[6]^u[22],this.v3h^=u[7]^u[23],this.v4l^=u[8]^u[24],this.v4h^=u[9]^u[25],this.v5l^=u[10]^u[26],this.v5h^=u[11]^u[27],this.v6l^=u[12]^u[28],this.v6h^=u[13]^u[29],this.v7l^=u[14]^u[30],this.v7h^=u[15]^u[31],A(u)}destroy(){this.destroyed=!0,A(this.buffer32),this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)}},nt=oe(e=>new Nt(e));var Ct={Argond2d:0,Argon2i:1,Argon2id:2},ht=4,ie=e=>e===void 0?Uint8Array.of():Lt(e);function Wt(e,t){let n=e&65535,r=e>>>16,s=t&65535,o=t>>>16,i=Math.imul(n,s),c=Math.imul(r,s),h=Math.imul(n,o),f=Math.imul(r,o),a=(i>>>16)+(c&65535)+h,l=f+(c>>>16)+(a>>>16)|0,x=a<<16|i&65535;return{h:l,l:x}}function Ce(e,t){let{h:n,l:r}=Wt(e,t);return{h:(n<<1|r>>>31)&4294967295,l:r<<1&4294967295}}function It(e,t,n,r){let{h:s,l:o}=Ce(t,r),i=it(t,r,o);return{h:ct(i,e,n,s),l:i|0}}var m=new Uint32Array(256);function P(e,t,n,r){let s=m[2*e],o=m[2*e+1],i=m[2*t],c=m[2*t+1],h=m[2*n],f=m[2*n+1],a=m[2*r],l=m[2*r+1];({h:o,l:s}=It(o,s,c,i)),{Dh:l,Dl:a}={Dh:l^o,Dl:a^s},{Dh:l,Dl:a}={Dh:At(l,a),Dl:mt(l,a)},{h:f,l:h}=It(f,h,l,a),{Bh:c,Bl:i}={Bh:c^f,Bl:i^h},{Bh:c,Bl:i}={Bh:J(c,i,24),Bl:$(c,i,24)},{h:o,l:s}=It(o,s,c,i),{Dh:l,Dl:a}={Dh:l^o,Dl:a^s},{Dh:l,Dl:a}={Dh:J(l,a,16),Dl:$(l,a,16)},{h:f,l:h}=It(f,h,l,a),{Bh:c,Bl:i}={Bh:c^f,Bl:i^h},{Bh:c,Bl:i}={Bh:yt(c,i,63),Bl:wt(c,i,63)},m[2*e]=s,m[2*e+1]=o,m[2*t]=i,m[2*t+1]=c,m[2*n]=h,m[2*n+1]=f,m[2*r]=a,m[2*r+1]=l}function ce(e,t,n,r,s,o,i,c,h,f,a,l,x,b,d,p){P(e,s,h,x),P(t,o,f,b),P(n,i,a,d),P(r,c,l,p),P(e,o,a,p),P(t,i,l,x),P(n,c,h,b),P(r,s,f,d)}function ft(e,t,n,r,s){for(let o=0;o<256;o++)m[o]=e[t+o]^e[n+o];for(let o=0;o<128;o+=16)ce(o,o+1,o+2,o+3,o+4,o+5,o+6,o+7,o+8,o+9,o+10,o+11,o+12,o+13,o+14,o+15);for(let o=0;o<16;o+=2)ce(o,o+1,o+16,o+17,o+32,o+33,o+48,o+49,o+64,o+65,o+80,o+81,o+96,o+97,o+112,o+113);if(s)for(let o=0;o<256;o++)e[r+o]^=m[o]^e[t+o]^e[n+o];else for(let o=0;o<256;o++)e[r+o]=m[o]^e[t+o]^e[n+o];A(m)}function jt(e,t){let n=tt(e),r=new Uint32Array(1),s=tt(r);if(r[0]=t,t<=64)return nt.create({dkLen:t}).update(s).update(n).digest();let o=new Uint8Array(t),i=nt.create({}).update(s).update(n).digest(),c=0;for(o.set(i.subarray(0,32)),c+=32;t-c>64;c+=32){let h=nt.create({}).update(i);h.digestInto(i),h.destroy(),o.set(i.subarray(0,32),c)}return o.set(nt(i,{dkLen:t-c}),c),A(i,r),Z(o)}function ke(e,t,n,r,s,o,i=!1){let c;e===0?t===0?c=s-1:i?c=t*r+s-1:c=t*r+(s==0?-1:0):i?c=n-r+s-1:c=n-r+(s==0?-1:0);let h=e!==0&&t!==ht-1?(t+1)*r:0,f=c-1-Wt(c,Wt(o,o).h).h;return(h+f)%n}var he=Math.pow(2,32);function z(e){return Number.isSafeInteger(e)&&e>=0&&e<he}function Te(e){let t={version:19,dkLen:32,maxmem:he-1,asyncTick:10};for(let[h,f]of Object.entries(e))f!=null&&(t[h]=f);let{dkLen:n,p:r,m:s,t:o,version:i,onProgress:c}=t;if(!z(n)||n<4)throw new Error("dkLen should be at least 4 bytes");if(!z(r)||r<1||r>=Math.pow(2,24))throw new Error("p should be 1 <= p < 2^24");if(!z(s))throw new Error("m should be 0 <= m < 2^32");if(!z(o)||o<1)throw new Error("t (iterations) should be 1 <= t < 2^32");if(c!==void 0&&typeof c!="function")throw new Error("progressCb should be function");if(!z(s)||s<8*r)throw new Error("memory should be at least 8*p bytes");if(i!==16&&i!==19)throw new Error("unknown version="+i);return t}function De(e,t,n,r){if(e=Lt(e),t=Lt(t),_(e),_(t),!z(e.length))throw new Error("password should be less than 4 GB");if(!z(t.length)||t.length<8)throw new Error("salt should be at least 8 bytes and less than 4 GB");if(!Object.values(Ct).includes(n))throw new Error("invalid type");let{p:s,dkLen:o,m:i,t:c,version:h,key:f,personalization:a,maxmem:l,onProgress:x,asyncTick:b}=Te(r);f=ie(f),a=ie(a);let d=nt.create({}),p=new Uint32Array(1),y=tt(p);for(let S of[s,o,i,c,h,n])p[0]=S,d.update(y);for(let S of[e,t,f,a])p[0]=S.length,d.update(y).update(S);let w=new Uint32Array(18),g=tt(w);d.digestInto(g);let E=s,B=4*s*Math.floor(i/(ht*s)),L=Math.floor(B/s),K=Math.floor(L/ht),F=B*256;if(!z(l)||F>l)throw new Error("mem should be less than 2**32, got: maxmem="+l+", memused="+F);let st=new Uint32Array(F);for(let S=0;S<s;S++){let xt=256*L*S;w[17]=S,w[16]=0,st.set(jt(w,1024),xt),w[16]=1,st.set(jt(w,1024),xt+256)}let pt=()=>{};if(x){let S=c*ht*s*K,xt=Math.max(Math.floor(S/1e4),1),bt=0;pt=()=>{bt++,x&&(!(bt%xt)||bt===S)&&x(bt/S)}}return A(p,w),{type:n,mP:B,p:s,t:c,version:h,B:st,laneLen:L,lanes:E,segmentLen:K,dkLen:o,perBlock:pt,asyncTick:b}}function Oe(e,t,n,r){let s=new Uint32Array(256);for(let i=0;i<t;i++)for(let c=0;c<256;c++)s[c]^=e[256*(n*i+n-1)+c];let o=tt(jt(s,r));return A(s),o}function Me(e,t,n,r,s,o,i,c,h,f,a,l,x){f%i&&(a=f-1);let b,d;if(l){let g=o%128;g===0&&(t[268]++,ft(t,256,2*256,0,!1),ft(t,0,2*256,0,!1)),b=t[2*g],d=t[2*g+1]}else{let g=256*a;b=e[g],d=e[g+1]}let p=r===0&&s===0?n:d%h,y=ke(r,s,i,c,o,b,p==n),w=i*p+y;ft(e,256*a,256*w,f*256,x)}function Ke(e,t,n,r){let{mP:s,p:o,t:i,version:c,B:h,laneLen:f,lanes:a,segmentLen:l,dkLen:x,perBlock:b}=De(t,n,e,r),d=new Uint32Array(3*256);d[262]=s,d[264]=i,d[266]=e;for(let p=0;p<i;p++){let y=p!==0&&c===19;d[256]=p;for(let w=0;w<ht;w++){d[260]=w;let g=e==Ct.Argon2i||e==Ct.Argon2id&&p===0&&w<2;for(let E=0;E<o;E++){d[258]=E,d[268]=0;let B=0;p===0&&w===0&&(B=2,g&&(d[268]++,ft(d,256,2*256,0,!1),ft(d,0,2*256,0,!1)));let L=E*f+w*l+B,K=L%f?L-1:L+f-1;for(let F=B;F<l;F++,L++,K++)b(),Me(h,d,E,p,w,F,f,l,a,L,K,g,y)}}}return A(d),Oe(h,o,f,x)}var fe=(e,t,n)=>Ke(Ct.Argon2id,e,t,n);var kt=class extends N{constructor(t,n){super(),this.finished=!1,this.destroyed=!1,te(t);let r=k(n);if(this.iHash=t.create(),typeof this.iHash.update!="function")throw new Error("Expected instance of class which extends utils.Hash");this.blockLen=this.iHash.blockLen,this.outputLen=this.iHash.outputLen;let s=this.blockLen,o=new Uint8Array(s);o.set(r.length>s?t.create().update(r).digest():r);for(let i=0;i<o.length;i++)o[i]^=54;this.iHash.update(o),this.oHash=t.create();for(let i=0;i<o.length;i++)o[i]^=106;this.oHash.update(o),A(o)}update(t){return G(this),this.iHash.update(t),this}digestInto(t){G(this),_(t,this.outputLen),this.finished=!0,this.iHash.digestInto(t),this.oHash.update(t),this.oHash.digestInto(t),this.destroy()}digest(){let t=new Uint8Array(this.oHash.outputLen);return this.digestInto(t),t}_cloneInto(t){t||(t=Object.create(Object.getPrototypeOf(this),{}));let{oHash:n,iHash:r,finished:s,destroyed:o,blockLen:i,outputLen:c}=this;return t=t,t.finished=s,t.destroyed=o,t.blockLen=i,t.outputLen=c,t.oHash=n._cloneInto(t.oHash),t.iHash=r._cloneInto(t.iHash),t}clone(){return this._cloneInto()}destroy(){this.destroyed=!0,this.oHash.destroy(),this.iHash.destroy()}},Pt=(e,t,n)=>new kt(e,t).update(n).digest();Pt.create=(e,t)=>new kt(e,t);var lt=Uint32Array.from([1732584193,4023233417,2562383102,271733878,3285377520]),R=new Uint32Array(80),Tt=class extends et{constructor(){super(64,20,8,!1),this.A=lt[0]|0,this.B=lt[1]|0,this.C=lt[2]|0,this.D=lt[3]|0,this.E=lt[4]|0}get(){let{A:t,B:n,C:r,D:s,E:o}=this;return[t,n,r,s,o]}set(t,n,r,s,o){this.A=t|0,this.B=n|0,this.C=r|0,this.D=s|0,this.E=o|0}process(t,n){for(let h=0;h<16;h++,n+=4)R[h]=t.getUint32(n,!1);for(let h=16;h<80;h++)R[h]=Ht(R[h-3]^R[h-8]^R[h-14]^R[h-16],1);let{A:r,B:s,C:o,D:i,E:c}=this;for(let h=0;h<80;h++){let f,a;h<20?(f=St(s,o,i),a=1518500249):h<40?(f=s^o^i,a=1859775393):h<60?(f=_t(s,o,i),a=2400959708):(f=s^o^i,a=3395469782);let l=Ht(r,5)+f+c+a+R[h]|0;c=i,i=o,o=Ht(s,30),s=r,r=l}r=r+this.A|0,s=s+this.B|0,o=o+this.C|0,i=i+this.D|0,c=c+this.E|0,this.set(r,s,o,i,c)}roundClean(){A(R)}destroy(){this.set(0,0,0,0,0),A(this.buffer)}},le=Et(()=>new Tt);var ae=le;var Fe=Uint32Array.from([1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298]),X=new Uint32Array(64),Dt=class extends et{constructor(t=32){super(64,t,8,!1),this.A=v[0]|0,this.B=v[1]|0,this.C=v[2]|0,this.D=v[3]|0,this.E=v[4]|0,this.F=v[5]|0,this.G=v[6]|0,this.H=v[7]|0}get(){let{A:t,B:n,C:r,D:s,E:o,F:i,G:c,H:h}=this;return[t,n,r,s,o,i,c,h]}set(t,n,r,s,o,i,c,h){this.A=t|0,this.B=n|0,this.C=r|0,this.D=s|0,this.E=o|0,this.F=i|0,this.G=c|0,this.H=h|0}process(t,n){for(let l=0;l<16;l++,n+=4)X[l]=t.getUint32(n,!1);for(let l=16;l<64;l++){let x=X[l-15],b=X[l-2],d=C(x,7)^C(x,18)^x>>>3,p=C(b,17)^C(b,19)^b>>>10;X[l]=p+X[l-7]+d+X[l-16]|0}let{A:r,B:s,C:o,D:i,E:c,F:h,G:f,H:a}=this;for(let l=0;l<64;l++){let x=C(c,6)^C(c,11)^C(c,25),b=a+x+St(c,h,f)+Fe[l]+X[l]|0,p=(C(r,2)^C(r,13)^C(r,22))+_t(r,s,o)|0;a=f,f=h,h=c,c=i+b|0,i=o,o=s,s=r,r=b+p|0}r=r+this.A|0,s=s+this.B|0,o=o+this.C|0,i=i+this.D|0,c=c+this.E|0,h=h+this.F|0,f=f+this.G|0,a=a+this.H|0,this.set(r,s,o,i,c,h,f,a)}roundClean(){A(X)}destroy(){this.set(0,0,0,0,0,0,0,0),A(this.buffer)}};var ue=Et(()=>new Dt);var de=ue;function pe(e){return e instanceof Uint8Array||ArrayBuffer.isView(e)&&e.constructor.name==="Uint8Array"}function Ge(e){if(typeof e!="boolean")throw new Error(`boolean expected, not ${e}`)}function H(e,...t){if(!pe(e))throw new Error("Uint8Array expected");if(t.length>0&&!t.includes(e.length))throw new Error("Uint8Array expected of length "+t+", got length="+e.length)}function at(e,t=!0){if(e.destroyed)throw new Error("Hash instance has been destroyed");if(t&&e.finished)throw new Error("Hash#digest() has already been called")}function zt(e,t){H(e);let n=t.outputLen;if(e.length<n)throw new Error("digestInto() expects output buffer of length at least "+n)}function xe(e){return new Uint8Array(e.buffer,e.byteOffset,e.byteLength)}function T(e){return new Uint32Array(e.buffer,e.byteOffset,Math.floor(e.byteLength/4))}function D(...e){for(let t=0;t<e.length;t++)e[t].fill(0)}function rt(e){return new DataView(e.buffer,e.byteOffset,e.byteLength)}var ve=new Uint8Array(new Uint32Array([287454020]).buffer)[0]===68;function Ve(e){if(typeof e!="string")throw new Error("string expected");return new Uint8Array(new TextEncoder().encode(e))}function ot(e){if(typeof e=="string")e=Ve(e);else if(pe(e))e=q(e);else throw new Error("Uint8Array expected, got "+typeof e);return e}function be(e,t){if(e.length!==t.length)return!1;let n=0;for(let r=0;r<e.length;r++)n|=e[r]^t[r];return n===0}var ge=(e,t)=>{function n(r,...s){if(H(r),!ve)throw new Error("Non little-endian hardware is not yet supported");if(e.nonceLength!==void 0){let a=s[0];if(!a)throw new Error("nonce / iv required");e.varSizeNonce?H(a):H(a,e.nonceLength)}let o=e.tagLength;o&&s[1]!==void 0&&H(s[1]);let i=t(r,...s),c=(a,l)=>{if(l!==void 0){if(a!==2)throw new Error("cipher output not supported");H(l)}},h=!1;return{encrypt(a,l){if(h)throw new Error("cannot encrypt() twice with same key + nonce");return h=!0,H(a),c(i.encrypt.length,l),i.encrypt(a,l)},decrypt(a,l){if(H(a),o&&a.length<o)throw new Error("invalid ciphertext length: smaller than tagLength="+o);return c(i.decrypt.length,l),i.decrypt(a,l)}}}return Object.assign(n,e),n};function ye(e,t,n=!0){if(t===void 0)return new Uint8Array(e);if(t.length!==e)throw new Error("invalid output length, expected "+e+", got: "+t.length);if(n&&!ut(t))throw new Error("invalid output, must be aligned");return t}function Ot(e,t,n,r){if(typeof e.setBigUint64=="function")return e.setBigUint64(t,n,r);let s=BigInt(32),o=BigInt(4294967295),i=Number(n>>s&o),c=Number(n&o),h=r?4:0,f=r?0:4;e.setUint32(t+h,i,r),e.setUint32(t+f,c,r)}function we(e,t,n){Ge(n);let r=new Uint8Array(16),s=rt(r);return Ot(s,0,BigInt(t),n),Ot(s,8,BigInt(e),n),r}function ut(e){return e.byteOffset%4===0}function q(e){return Uint8Array.from(e)}var V=16,Xt=new Uint8Array(16),M=T(Xt),Ne=225,We=(e,t,n,r)=>{let s=r&1;return{s3:n<<31|r>>>1,s2:t<<31|n>>>1,s1:e<<31|t>>>1,s0:e>>>1^Ne<<24&-(s&1)}},I=e=>(e>>>0&255)<<24|(e>>>8&255)<<16|(e>>>16&255)<<8|e>>>24&255|0;function je(e){e.reverse();let t=e[15]&1,n=0;for(let r=0;r<e.length;r++){let s=e[r];e[r]=s>>>1|n,n=(s&1)<<7}return e[0]^=-t&225,e}var Pe=e=>e>64*1024?8:e>1024?4:2,Mt=class{constructor(t,n){this.blockLen=V,this.outputLen=V,this.s0=0,this.s1=0,this.s2=0,this.s3=0,this.finished=!1,t=ot(t),H(t,16);let r=rt(t),s=r.getUint32(0,!1),o=r.getUint32(4,!1),i=r.getUint32(8,!1),c=r.getUint32(12,!1),h=[];for(let d=0;d<128;d++)h.push({s0:I(s),s1:I(o),s2:I(i),s3:I(c)}),{s0:s,s1:o,s2:i,s3:c}=We(s,o,i,c);let f=Pe(n||1024);if(![1,2,4,8].includes(f))throw new Error("ghash: invalid window size, expected 2, 4 or 8");this.W=f;let l=128/f,x=this.windowSize=2**f,b=[];for(let d=0;d<l;d++)for(let p=0;p<x;p++){let y=0,w=0,g=0,E=0;for(let B=0;B<f;B++){if(!(p>>>f-B-1&1))continue;let{s0:K,s1:F,s2:st,s3:pt}=h[f*d+B];y^=K,w^=F,g^=st,E^=pt}b.push({s0:y,s1:w,s2:g,s3:E})}this.t=b}_updateBlock(t,n,r,s){t^=this.s0,n^=this.s1,r^=this.s2,s^=this.s3;let{W:o,t:i,windowSize:c}=this,h=0,f=0,a=0,l=0,x=(1<<o)-1,b=0;for(let d of[t,n,r,s])for(let p=0;p<4;p++){let y=d>>>8*p&255;for(let w=8/o-1;w>=0;w--){let g=y>>>o*w&x,{s0:E,s1:B,s2:L,s3:K}=i[b*c+g];h^=E,f^=B,a^=L,l^=K,b+=1}}this.s0=h,this.s1=f,this.s2=a,this.s3=l}update(t){at(this),t=ot(t),H(t);let n=T(t),r=Math.floor(t.length/V),s=t.length%V;for(let o=0;o<r;o++)this._updateBlock(n[o*4+0],n[o*4+1],n[o*4+2],n[o*4+3]);return s&&(Xt.set(t.subarray(r*V)),this._updateBlock(M[0],M[1],M[2],M[3]),D(M)),this}destroy(){let{t}=this;for(let n of t)n.s0=0,n.s1=0,n.s2=0,n.s3=0}digestInto(t){at(this),zt(t,this),this.finished=!0;let{s0:n,s1:r,s2:s,s3:o}=this,i=T(t);return i[0]=n,i[1]=r,i[2]=s,i[3]=o,t}digest(){let t=new Uint8Array(V);return this.digestInto(t),this.destroy(),t}},Rt=class extends Mt{constructor(t,n){t=ot(t),H(t);let r=je(q(t));super(r,n),D(r)}update(t){t=ot(t),at(this);let n=T(t),r=t.length%V,s=Math.floor(t.length/V);for(let o=0;o<s;o++)this._updateBlock(I(n[o*4+3]),I(n[o*4+2]),I(n[o*4+1]),I(n[o*4+0]));return r&&(Xt.set(t.subarray(s*V)),this._updateBlock(I(M[3]),I(M[2]),I(M[1]),I(M[0])),D(M)),this}digestInto(t){at(this),zt(t,this),this.finished=!0;let{s0:n,s1:r,s2:s,s3:o}=this,i=T(t);return i[0]=n,i[1]=r,i[2]=s,i[3]=o,t.reverse()}};function Ae(e){let t=(r,s)=>e(s,r.length).update(ot(r)).digest(),n=e(new Uint8Array(16),0);return t.outputLen=n.outputLen,t.blockLen=n.blockLen,t.create=(r,s)=>e(r,s),t}var Zt=Ae((e,t)=>new Mt(e,t)),ze=Ae((e,t)=>new Rt(e,t));var qt=16,Re=4,Kt=new Uint8Array(qt),Xe=283;function Jt(e){return e<<1^Xe&-(e>>7)}function me(e,t){let n=0;for(;t>0;t>>=1)n^=e&-(t&1),e=Jt(e);return n}var Ze=(()=>{let e=new Uint8Array(256);for(let n=0,r=1;n<256;n++,r^=Jt(r))e[n]=r;let t=new Uint8Array(256);t[0]=99;for(let n=0;n<255;n++){let r=e[255-n];r|=r<<8,t[e[n]]=(r^r>>4^r>>5^r>>6^r>>7^99)&255}return D(e),t})();var Ye=e=>e<<24|e>>>8,Yt=e=>e<<8|e>>>24;function qe(e,t){if(e.length!==256)throw new Error("Wrong sbox length");let n=new Uint32Array(256).map((f,a)=>t(e[a])),r=n.map(Yt),s=r.map(Yt),o=s.map(Yt),i=new Uint32Array(256*256),c=new Uint32Array(256*256),h=new Uint16Array(256*256);for(let f=0;f<256;f++)for(let a=0;a<256;a++){let l=f*256+a;i[l]=n[f]^r[a],c[l]=s[f]^o[a],h[l]=e[f]<<8|e[a]}return{sbox:e,sbox2:h,T0:n,T1:r,T2:s,T3:o,T01:i,T23:c}}var Ue=qe(Ze,e=>me(e,3)<<24|e<<16|e<<8|me(e,2));var Je=(()=>{let e=new Uint8Array(16);for(let t=0,n=1;t<16;t++,n=Jt(n))e[t]=n;return e})();function $e(e){H(e);let t=e.length;if(![16,24,32].includes(t))throw new Error("aes: invalid key size, should be 16, 24 or 32, got "+t);let{sbox2:n}=Ue,r=[];ut(e)||r.push(e=q(e));let s=T(e),o=s.length,i=h=>dt(n,h,h,h,h),c=new Uint32Array(t+28);c.set(s);for(let h=o;h<c.length;h++){let f=c[h-1];h%o===0?f=i(Ye(f))^Je[h/o-1]:o>6&&h%o===4&&(f=i(f)),c[h]=c[h-o]^f}return D(...r),c}function Ft(e,t,n,r,s,o){return e[n<<8&65280|r>>>8&255]^t[s>>>8&65280|o>>>24&255]}function dt(e,t,n,r,s){return e[t&255|n&65280]|e[r>>>16&255|s>>>16&65280]<<16}function Be(e,t,n,r,s){let{sbox2:o,T01:i,T23:c}=Ue,h=0;t^=e[h++],n^=e[h++],r^=e[h++],s^=e[h++];let f=e.length/4-2;for(let d=0;d<f;d++){let p=e[h++]^Ft(i,c,t,n,r,s),y=e[h++]^Ft(i,c,n,r,s,t),w=e[h++]^Ft(i,c,r,s,t,n),g=e[h++]^Ft(i,c,s,t,n,r);t=p,n=y,r=w,s=g}let a=e[h++]^dt(o,t,n,r,s),l=e[h++]^dt(o,n,r,s,t),x=e[h++]^dt(o,r,s,t,n),b=e[h++]^dt(o,s,t,n,r);return{s0:a,s1:l,s2:x,s3:b}}function Gt(e,t,n,r,s){H(n,qt),H(r),s=ye(r.length,s);let o=n,i=T(o),c=rt(o),h=T(r),f=T(s),a=t?0:12,l=r.length,x=c.getUint32(a,t),{s0:b,s1:d,s2:p,s3:y}=Be(e,i[0],i[1],i[2],i[3]);for(let g=0;g+4<=h.length;g+=4)f[g+0]=h[g+0]^b,f[g+1]=h[g+1]^d,f[g+2]=h[g+2]^p,f[g+3]=h[g+3]^y,x=x+1>>>0,c.setUint32(a,x,t),{s0:b,s1:d,s2:p,s3:y}=Be(e,i[0],i[1],i[2],i[3]);let w=qt*Math.floor(h.length/Re);if(w<l){let g=new Uint32Array([b,d,p,y]),E=xe(g);for(let B=w,L=0;B<l;B++,L++)s[B]=r[B]^E[L];D(g)}return s}function Qe(e,t,n,r,s){let o=s?s.length:0,i=e.create(n,r.length+o);s&&i.update(s);let c=we(8*r.length,8*o,t);i.update(r),i.update(c);let h=i.digest();return D(c),h}var He=ge({blockSize:16,nonceLength:12,tagLength:16,varSizeNonce:!0},function(t,n,r){if(n.length<8)throw new Error("aes/gcm: invalid nonce length");let s=16;function o(c,h,f){let a=Qe(Zt,!1,c,f,r);for(let l=0;l<h.length;l++)a[l]^=h[l];return a}function i(){let c=$e(t),h=Kt.slice(),f=Kt.slice();if(Gt(c,!1,f,f,h),n.length===12)f.set(n);else{let l=Kt.slice(),x=rt(l);Ot(x,8,BigInt(n.length*8),!1);let b=Zt.create(h).update(n).update(l);b.digestInto(f),b.destroy()}let a=Gt(c,!1,f,Kt);return{xk:c,authKey:h,counter:f,tagMask:a}}return{encrypt(c){let{xk:h,authKey:f,counter:a,tagMask:l}=i(),x=new Uint8Array(c.length+s),b=[h,f,a,l];ut(c)||b.push(c=q(c)),Gt(h,!1,a,c,x.subarray(0,c.length));let d=o(f,l,x.subarray(0,x.length-s));return b.push(d),x.set(d,c.length),D(...b),x},decrypt(c){let{xk:h,authKey:f,counter:a,tagMask:l}=i(),x=[h,f,l,a];ut(c)||x.push(c=q(c));let b=c.subarray(0,-s),d=c.subarray(-s),p=o(f,l,b);if(x.push(p),!be(p,d))throw new Error("aes/gcm: invalid ghash tag");let y=Gt(h,!1,a,b);return D(...x),y}}});globalThis.KCMCrypto={argon2id:fe,hmac:Pt,sha1:ae,sha256:de,gcm:He};})();
/*! Bundled license information:

@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/ciphers/esm/utils.js:
  (*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) *)
*/

/* ======================= Security.gs ======================= */
/**
 * KCM security layer: roles & permissions, Argon2id passwords, TOTP multi-factor authentication,
 * AES-256-GCM encryption for stored secrets, and session handling.
 *
 * Crypto primitives come from Vendor.gs (bundled @noble/hashes + @noble/ciphers, MIT licence, audited libraries),
 * verified against RFC 9106 (Argon2id), RFC 6238 (TOTP) and AES-GCM test vectors before shipping.
 * All secrets (password pepper, data-encryption keys) live in Script Properties, never in this code.
 */

/* =====================================================================
 * Roles and permissions (enforced on every protected action, server-side)
 * ===================================================================== */

const ROLE = { SUPER_ADMIN: 'SUPER_ADMIN', ADMIN: 'ADMIN', MANAGEMENT: 'MANAGEMENT', FINANCE: 'FINANCE', OPERATIONS: 'OPERATIONS', PARTNER: 'PARTNER', CUSTOMER: 'CUSTOMER' };
const ALL_ROLES = Object.keys(ROLE);
const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'FINANCE', 'OPERATIONS'];
/** Privileged roles must use multi-factor authentication (authenticator app). */
const MFA_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT', 'FINANCE'];
/** Roles stored by earlier versions of the Sheet are read as their new equivalents (no data rewrite needed). */
const LEGACY_ROLES = { owner: 'SUPER_ADMIN', admin: 'ADMIN', viewer: 'OPERATIONS', partner: 'PARTNER', customer: 'CUSTOMER' };

const SA = 'SUPER_ADMIN', AD = 'ADMIN', MG = 'MANAGEMENT', FI = 'FINANCE', OP = 'OPERATIONS';
/** permission -> roles that hold it (least privilege). "own" permissions are further limited to the user's own records in code. */
const PERMS = {
  'dashboard.view': [SA, AD, MG, FI, OP],
  'users.view': [SA, AD],
  'users.manage': [SA, AD],
  'audit.view': [SA, AD, MG],
  'partners.view': [SA, AD, MG, FI],
  'partners.review': [SA, AD, MG],              // includes identity / ownership documents
  'payouts.view': [SA, AD, MG, FI],
  'payouts.manage': [SA, AD, FI],
  'ratings.moderate': [SA, AD, MG],
  'messages.view': [SA, AD, MG, OP],
  'bookings.view': [SA, AD, MG, FI, OP],
  'bookings.update': [SA, AD, MG],
  // Operations Centre
  'ops.intake': [SA, AD, MG, OP],
  'ops.view.all': [SA, AD, MG, FI],              // OPERATIONS only see tickets they own or support
  'ops.edit.any': [SA, AD, MG],
  'ops.edit.own': [SA, AD, MG, OP],
  'ops.assign': [SA, AD, MG],
  'ops.workload': [SA, AD, MG],
  'ops.templates': [SA, AD, MG],
  'ops.statuses': [SA, AD, MG],
  'ops.confirm': [SA, AD, MG],                   // confirm bookings, cancel confirmed bookings
  'quote.prepare': [SA, AD, MG, OP],
  'quote.approve': [SA, AD, MG],
  'pay.view': [SA, AD, MG, FI],
  'pay.record': [SA, AD, MG, FI, OP],             // recorded payments are UNVERIFIED until finance verifies
  'pay.verify': [SA, AD, FI],
  'pay.refund.approve': [SA, AD, FI],
  'customers.erase': [SA, AD],
  'suppliers.manage': [SA, AD, MG, OP],
};

function roleOf_(u) {
  const r = String((u && u.Role) || '');
  if (LEGACY_ROLES[r]) return LEGACY_ROLES[r];
  return ALL_ROLES.indexOf(r) !== -1 ? r : 'CUSTOMER';
}
function isStaff_(u) { return STAFF_ROLES.indexOf(roleOf_(u)) !== -1; }
function can_(u, perm) { return !!u && (PERMS[perm] || []).indexOf(roleOf_(u)) !== -1; }
function permissionsOf_(u) { return Object.keys(PERMS).filter(p => can_(u, p)); }
function needsMfa_(u) { return MFA_ROLES.indexOf(roleOf_(u)) !== -1; }

/** Signed-in user holding a permission. Privileged sessions must have passed MFA. */
function requirePerm_(token, perm) {
  const user = requireUser_(token);
  if (!can_(user, perm)) throw userError_('You do not have access to this.', 'forbidden');
  return user;
}
/** Back-compat for older call sites: any of the listed permissions. */
function requireAnyPerm_(token, perms) {
  const user = requireUser_(token);
  if (!perms.some(p => can_(user, p))) throw userError_('You do not have access to this.', 'forbidden');
  return user;
}

/* =====================================================================
 * Byte helpers (Apps Script has no TextEncoder / crypto.getRandomValues)
 * ===================================================================== */

function utf8_(s) { const b = unescape(encodeURIComponent(String(s))); const out = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i); return out; }
function utf8Decode_(bytes) { let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return decodeURIComponent(escape(s)); }
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function b64_(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
    s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=') + (i + 2 < bytes.length ? B64[n & 63] : '=');
  }
  return s;
}
function unb64_(s) {
  s = String(s).replace(/[^A-Za-z0-9+/]/g, '');
  const out = [];
  for (let i = 0; i < s.length; i += 4) {
    const n = (B64.indexOf(s[i]) << 18) | (B64.indexOf(s[i + 1]) << 12) | ((B64.indexOf(s[i + 2]) & 63) << 6) | (B64.indexOf(s[i + 3]) & 63);
    out.push((n >> 16) & 255); if (s[i + 2]) out.push((n >> 8) & 255); if (s[i + 3]) out.push(n & 255);
  }
  return new Uint8Array(out);
}
function hex_(bytes) { let s = ''; for (let i = 0; i < bytes.length; i++) s += ('0' + (bytes[i] & 255).toString(16)).slice(-2); return s; }
/** Cryptographically secure random bytes: SHA-256 over server-generated random UUIDs (v4, SecureRandom-backed). */
function randomBytes_(n) {
  const out = new Uint8Array(n);
  let filled = 0;
  while (filled < n) {
    const d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Utilities.getUuid() + filled);
    for (let i = 0; i < d.length && filled < n; i++) out[filled++] = d[i] & 255;
  }
  return out;
}
function randomToken_() { return hex_(randomBytes_(32)); }
/** Uniform random integer in [0, max) without modulo bias. */
function randomInt_(max) {
  const limit = Math.floor(4294967296 / max) * max;
  for (;;) { const b = randomBytes_(4); const v = ((b[0] << 24) >>> 0) + (b[1] << 16) + (b[2] << 8) + b[3]; if (v < limit) return v % max; }
}
function constantTimeEqual_(a, b) {
  a = String(a); b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/* =====================================================================
 * Passwords: Argon2id (RFC 9106), OWASP minimum parameters m=19 MiB, t=2, p=1.
 * The private pepper (Script Properties) is passed as the Argon2 secret key.
 * Older iterated-SHA-256 hashes still verify and are upgraded on the next successful sign-in.
 * ===================================================================== */

const ARGON = { m: 19456, t: 2, p: 1, dkLen: 32 };

function argonHash_(password, saltBytes, usePepper) {
  const opts = { t: ARGON.t, m: ARGON.m, p: ARGON.p, dkLen: ARGON.dkLen };
  if (usePepper) opts.key = utf8_(pepper_());
  return KCMCrypto.argon2id(utf8_(password), saltBytes, opts);
}
/** Returns the PHC-format string stored in Users.PasswordHash; Users.PasswordSalt holds the scheme marker. */
function newPasswordHash_(password) {
  const salt = randomBytes_(16);
  return { hash: `$argon2id$v=19$m=${ARGON.m},t=${ARGON.t},p=${ARGON.p}$${b64_(salt).replace(/=+$/, '')}$${b64_(argonHash_(password, salt, true)).replace(/=+$/, '')}`, scheme: 'argon2id' };
}
/** true / false. Supports argon2id (peppered), argon2id-np (built-in test admin, no pepper) and the legacy scheme. */
function verifyPassword_(user, password) {
  const stored = String(user.PasswordHash || ''), scheme = String(user.PasswordSalt || '');
  if (!stored) return false;
  if (stored.indexOf('$argon2id$') === 0) {
    const parts = stored.split('$'); // ['', 'argon2id', 'v=19', 'm=..,t=..,p=..', salt, hash]
    const params = {}; parts[3].split(',').forEach(kv => { const [k, v] = kv.split('='); params[k] = Number(v); });
    const opts = { t: params.t, m: params.m, p: params.p, dkLen: 32 };
    if (scheme !== 'argon2id-np') opts.key = utf8_(pepper_());
    const out = KCMCrypto.argon2id(utf8_(password), unb64_(parts[4]), opts);
    return constantTimeEqual_(b64_(out).replace(/=+$/, ''), parts[5]);
  }
  return constantTimeEqual_(legacyHashPassword_(password, scheme), stored); // pre-1.4 scheme
}
function legacyHashPassword_(password, salt) {
  let h = salt + ':' + password + ':' + (String(salt).indexOf('np:') === 0 ? '' : pepper_());
  for (let i = 0; i < 1000; i++) h = hash_(h + ':' + salt);
  return h;
}

/* =====================================================================
 * Application-level encryption: AES-256-GCM with versioned keys (rotation-ready).
 * Format: "v<keyVersion>:<base64(iv[12] | ciphertext+tag)>". Keys: Script Properties DATA_KEY_V<n>.
 * ===================================================================== */

function dataKey_(version) {
  const props = PropertiesService.getScriptProperties();
  let v = version || Number(props.getProperty('DATA_KEY_VERSION') || 0);
  if (!v) { v = 1; props.setProperty('DATA_KEY_V1', b64_(randomBytes_(32))); props.setProperty('DATA_KEY_VERSION', '1'); }
  const k = props.getProperty('DATA_KEY_V' + v);
  if (!k) throw new Error('Missing data key v' + v);
  return { version: v, key: unb64_(k) };
}
function encrypt_(plain) {
  const { version, key } = dataKey_();
  const iv = randomBytes_(12);
  const ct = KCMCrypto.gcm(key, iv).encrypt(utf8_(plain));
  const buf = new Uint8Array(12 + ct.length); buf.set(iv, 0); buf.set(ct, 12);
  return 'v' + version + ':' + b64_(buf);
}
function decrypt_(blob) {
  const m = String(blob || '').match(/^v(\d+):(.+)$/);
  if (!m) throw new Error('Bad ciphertext');
  const { key } = dataKey_(Number(m[1]));
  const buf = unb64_(m[2]);
  return utf8Decode_(KCMCrypto.gcm(key, buf.slice(0, 12)).decrypt(buf.slice(12)));
}
/** Creates a new key version and re-encrypts stored secrets. Old key versions are kept so old backups stay readable. */
function rotateDataKey_() {
  const props = PropertiesService.getScriptProperties();
  const next = Number(props.getProperty('DATA_KEY_VERSION') || 1) + 1;
  props.setProperty('DATA_KEY_V' + next, b64_(randomBytes_(32)));
  const col = TABS.Users.indexOf('MfaSecret');
  withLock_(() => {
    const sh = sheet_('Users');
    const rows = sh.getDataRange().getValues();
    const plain = rows.map((r, i) => (i > 0 && r[col] ? decrypt_(r[col]) : null)); // decrypt with old versions first
    props.setProperty('DATA_KEY_VERSION', String(next));
    plain.forEach((p, i) => { if (p) sh.getRange(i + 1, col + 1).setValue(encrypt_(p)); });
  });
  return next;
}

/* =====================================================================
 * TOTP multi-factor authentication (RFC 6238, 30 s, 6 digits, SHA-1 for authenticator-app compatibility)
 * ===================================================================== */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32_(bytes) { let bits = '', s = ''; bytes.forEach(b => { bits += ('00000000' + b.toString(2)).slice(-8); }); for (let i = 0; i + 5 <= bits.length; i += 5) s += B32[parseInt(bits.substr(i, 5), 2)]; return s; }
function unbase32_(s) { let bits = ''; String(s).toUpperCase().replace(/[^A-Z2-7]/g, '').split('').forEach(c => { bits += ('00000' + B32.indexOf(c).toString(2)).slice(-5); }); const out = []; for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.substr(i, 8), 2)); return new Uint8Array(out); }
function totpAt_(secretB32, step) {
  const msg = new Uint8Array(8);
  let x = step; for (let i = 7; i >= 0; i--) { msg[i] = x & 255; x = Math.floor(x / 256); }
  const h = KCMCrypto.hmac(KCMCrypto.sha1, unbase32_(secretB32), msg);
  const o = h[19] & 15;
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1000000).padStart(6, '0');
}
/** Accepts the current code ±1 step (clock drift) and refuses a code that was already used (replay). */
function verifyTotp_(email, secretB32, code) {
  code = String(code || '').replace(/\D/g, '');
  if (code.length !== 6) return false;
  const now = Math.floor(Date.now() / 30000);
  const cache = CacheService.getScriptCache();
  const last = Number(cache.get('totp-last:' + email) || 0);
  for (let d = -1; d <= 1; d++) {
    const step = now + d;
    if (step <= last) continue;
    if (constantTimeEqual_(totpAt_(secretB32, step), code)) { cache.put('totp-last:' + email, String(step), 300); return true; }
  }
  return false;
}

/* =====================================================================
 * Login completion: every sign-in method (password, email code, Google, password reset) ends here,
 * so the MFA requirement cannot be bypassed by choosing a different method.
 * ===================================================================== */

function finishLogin_(email, opts) {
  const user = upsertUser_(email, opts);
  if (!opts.registering) accessGate_(user);
  if (!needsMfa_(user)) return startSession_(email, Object.assign({}, opts, { mfa: false }));
  const challenge = randomToken_();
  const enrolled = !!user.MfaSecret;
  const state = { email, provider: opts.provider || '', stage: enrolled ? 'verify' : 'setup', attempts: 0 };
  let out = { mfa: state.stage, challenge };
  if (!enrolled) {
    state.secret = base32_(randomBytes_(20));
    const label = encodeURIComponent('KCM Travel & Tours:' + email);
    out = Object.assign(out, { secret: state.secret, otpauth: `otpauth://totp/${label}?secret=${state.secret}&issuer=${encodeURIComponent('KCM Travel & Tours')}&period=30&digits=6` });
  }
  CacheService.getScriptCache().put('mfa:' + hash_(challenge), JSON.stringify(state), 600);
  log_(email, 'mfa_challenge', email, state.stage);
  return out;
}

function mfaState_(challenge) {
  const key = 'mfa:' + hash_(String(challenge || ''));
  const raw = CacheService.getScriptCache().get(key);
  if (!raw) throw userError_('This sign-in step has expired. Please sign in again.', 'auth');
  const st = JSON.parse(raw);
  st.attempts++;
  if (st.attempts > 5) { CacheService.getScriptCache().remove(key); throw userError_('Too many wrong codes. Please sign in again.', 'auth'); }
  CacheService.getScriptCache().put(key, JSON.stringify(st), 600);
  return { key, st };
}

/** Second step for enrolled users: 6-digit authenticator code or a one-time recovery code. */
function mfaVerify_(b) {
  const { key, st } = mfaState_(b.challenge);
  if (st.stage !== 'verify') throw userError_('Please finish setting up your authenticator app.');
  const user = findUser_(st.email);
  if (!user || !user.MfaSecret) throw userError_('Please sign in again.', 'auth');
  let ok = false, usedRecovery = false;
  if (b.recoveryCode) {
    const codes = JSON.parse(user.RecoveryCodes || '[]');
    const h = hash_(String(b.recoveryCode).replace(/[^A-Za-z0-9]/g, '').toUpperCase() + ':' + st.email);
    const idx = codes.indexOf(h);
    if (idx !== -1) { codes.splice(idx, 1); setUserFields_(st.email, { RecoveryCodes: JSON.stringify(codes) }); ok = true; usedRecovery = true; }
  } else {
    ok = verifyTotp_(st.email, decrypt_(user.MfaSecret), b.code);
  }
  if (!ok) { log_(st.email, 'mfa_failed', st.email, ''); throw userError_('That code is not right. Check the time on your phone and try the newest code.'); }
  CacheService.getScriptCache().remove(key);
  if (usedRecovery) log_(st.email, 'mfa_recovery_code_used', st.email, '');
  return startSession_(st.email, { provider: st.provider, mfa: true });
}

/** First-time setup: the user scanned the QR code / typed the key and confirms with a current code. */
function mfaSetupConfirm_(b) {
  const { key, st } = mfaState_(b.challenge);
  if (st.stage !== 'setup' || !st.secret) throw userError_('Please sign in again.', 'auth');
  if (!verifyTotp_(st.email, st.secret, b.code)) throw userError_('That code is not right. Make sure you added the key to your authenticator app and use the newest code.');
  const recovery = [], hashes = [];
  for (let i = 0; i < 8; i++) {
    let c = ''; for (let j = 0; j < 10; j++) c += 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[randomInt_(32)];
    recovery.push(c.slice(0, 5) + '-' + c.slice(5)); hashes.push(hash_(c + ':' + st.email));
  }
  setUserFields_(st.email, { MfaSecret: encrypt_(st.secret), MfaEnabledAt: new Date(), RecoveryCodes: JSON.stringify(hashes) });
  CacheService.getScriptCache().remove(key);
  log_(st.email, 'mfa_enabled', st.email, '');
  return Object.assign(startSession_(st.email, { provider: st.provider, mfa: true }), { recoveryCodes: recovery });
}

/** Admins can reset another person's authenticator (lost phone). Never their own, and admins cannot reset the super admin. */
function resetUserMfa_(b) {
  const actor = requirePerm_(b.token, 'users.manage');
  const email = cleanEmail_(b.email);
  if (email === actor.Email) throw userError_('You cannot reset your own authenticator. Ask another administrator.');
  const target = findUser_(email);
  if (!target) throw userError_('User not found.');
  if (roleOf_(target) === 'SUPER_ADMIN' || (roleOf_(target) === 'ADMIN' && roleOf_(actor) !== 'SUPER_ADMIN')) throw userError_('Only the super admin can reset this account.');
  setUserFields_(email, { MfaSecret: '', MfaEnabledAt: '', RecoveryCodes: '' });
  revokeSessions_(email);
  log_(actor.Email, 'mfa_reset', email, '');
  return { reset: true };
}

function setUserFields_(email, fields) {
  withLock_(() => {
    const sh = sheet_('Users');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === email);
    if (idx < 1) return;
    Object.keys(fields).forEach(k => { const c = TABS.Users.indexOf(k); if (c !== -1) sh.getRange(idx + 1, c + 1).setValue(fields[k]); });
  });
}

function revokeSessions_(email) {
  withLock_(() => {
    const sh = sheet_('Sessions');
    const rows = sh.getDataRange().getValues();
    for (let i = rows.length - 1; i >= 1; i--) if (rows[i][1] === email) { CacheService.getScriptCache().remove('sess:' + rows[i][0]); sh.deleteRow(i + 1); }
  });
}

/* ======================= Pricing.gs ======================= */
/**
 * KCM price list + authoritative estimate. GENERATED by scripts/gen_pricing.py from the website catalogue
 * (KcmTravel/Data/Catalog.cs). Do not edit by hand: change the catalogue, then regenerate.
 * Mirrors KcmTravel/Data/PricingService.cs. Prices submitted by browsers are never trusted.
 */
const CATALOG = {"tours":{"kruger-day-safari":{"title":"Kruger Full-Day Open-Vehicle Safari","nights":0,"price":1650,"extraNight":0},"panorama-route-day":{"title":"Panorama Route & God's Window Day Tour","nights":0,"price":1250,"extraNight":0},"kruger-panorama-3-day":{"title":"Kruger & Panorama Route: 3-Day Classic","nights":2,"price":6950,"extraNight":1650},"greater-kruger-lodge-4-day":{"title":"Greater Kruger Private Lodge: 4-Day Luxury","nights":3,"price":18900,"extraNight":5800},"sudwala-pilgrims-rest-weekend":{"title":"Sudwala Caves & Pilgrim's Rest Weekend","nights":2,"price":3850,"extraNight":950},"venda-sacred-sites-3-day":{"title":"Venda Sacred Sites: 3-Day Heritage Route","nights":2,"price":4650,"extraNight":1100},"mapungubwe-heritage-escape":{"title":"Mapungubwe Heritage & Wildlife Escape","nights":3,"price":7450,"extraNight":1450},"cape-town-4-night":{"title":"Cape Town Highlights: 4 Nights","nights":4,"price":12400,"extraNight":2100},"winelands-romantic-2-night":{"title":"Winelands Romantic Escape: 2 Nights","nights":2,"price":5900,"extraNight":2450},"garden-route-5-night":{"title":"Garden Route Self-Drive: 5 Nights","nights":5,"price":10800,"extraNight":1750},"durban-family-beach-3-night":{"title":"Durban Family Beach Holiday: 3 Nights","nights":3,"price":5450,"extraNight":1300},"drakensberg-weekend":{"title":"Drakensberg Mountain Weekend","nights":2,"price":3950,"extraNight":1350},"sun-city-pilanesberg-2-night":{"title":"Sun City & Pilanesberg Getaway","nights":2,"price":4750,"extraNight":1950},"group-kruger-school-church":{"title":"Group Kruger Safari: Schools, Churches & Stokvels","nights":2,"price":2950,"extraNight":750}},"extras":{"transfer":{"name":"Airport transfer (return)","price":950,"basis":"booking"},"car":{"name":"Car hire","price":520,"basis":"night"},"sunset":{"name":"Sunset or night game drive","price":690,"basis":"person"},"balloon":{"name":"Hot-air balloon flight","price":4200,"basis":"person"},"gorge":{"name":"Graskop Gorge lift","price":290,"basis":"person"},"meals":{"name":"Meal upgrade","price":420,"basis":"person-night"},"insurance":{"name":"Travel insurance","price":185,"basis":"person"},"celebration":{"name":"Celebration set-up","price":850,"basis":"booking"},"photo":{"name":"Photo package","price":450,"basis":"booking"}},"rooms":{"double":1.0,"family":0.95,"single":1.35,"self-catering":0.9,"upgrade":1.25},"childRate":0.5,"pensionerDiscount":0.1,"depositRate":0.3};

/** Returns the authoritative website estimate for a tour request, or null when the tour is unknown. */
function priceQuote_(r) {
  const key = String(r.tourSlug || '');
  let slug = CATALOG.tours[key] ? key : '';
  if (!slug) { const t = String(r.tour || '').trim().toLowerCase(); slug = Object.keys(CATALOG.tours).find(k => CATALOG.tours[k].title.toLowerCase() === t) || ''; }
  if (!slug) return null;
  const tour = CATALOG.tours[slug];
  const int = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
  const adults = int(r.adults, 60), children = int(r.children, 40), infants = int(r.infants, 20), pensioners = int(r.pensioners, 60);
  const nights = Math.max(tour.nights, int(r.nights, 60));
  const factor = Object.prototype.hasOwnProperty.call(CATALOG.rooms, r.room) ? CATALOG.rooms[r.room] : 1;
  const perAdult = (tour.price + (nights - tour.nights) * tour.extraNight) * factor;
  const lines = [];
  if (adults) lines.push({ label: adults + ' adult(s)', amount: adults * perAdult });
  if (pensioners) lines.push({ label: pensioners + ' pensioner(s)', amount: pensioners * perAdult * (1 - CATALOG.pensionerDiscount) });
  if (children) lines.push({ label: children + ' child(ren)', amount: children * perAdult * CATALOG.childRate });
  const paying = adults + children + pensioners, billNights = Math.max(nights, 1);
  const extras = [];
  (Array.isArray(r.extras) ? r.extras : []).forEach(code => {
    const x = CATALOG.extras[String(code)];
    if (!x || extras.indexOf(String(code)) !== -1) return;
    extras.push(String(code));
    const amount = x.basis === 'person' ? x.price * paying : x.basis === 'person-night' ? x.price * paying * billNights : x.basis === 'night' ? x.price * (billNights + 1) : x.price;
    lines.push({ label: x.name, amount });
  });
  const total = Math.round(lines.reduce((s, l) => s + l.amount, 0));
  const deposit = r.payment === 'full' ? total : Math.round(total * CATALOG.depositRate);
  return { slug, title: tour.title, nights, travellers: paying + infants, lines, total, deposit, extras: extras.map(c => CATALOG.extras[c].name) };
}

/* ======================= Code.gs ======================= */
/**
 * KCM Travel & Tours — pilot backend (Google Apps Script + Google Sheets)
 * ----------------------------------------------------------------------
 * The Google Sheet this script is attached to is the pilot database.
 * Deploy as a Web app (Execute as: Me · Who has access: Anyone) and paste the
 * /exec URL into the website settings (Site:ApiUrl). See backend/SETUP.md.
 *
 * Files (paste them into one Apps Script project, or paste dist/KCM-Backend.gs which combines them):
 *   Vendor.gs (crypto library) · Security.gs · Pricing.gs (generated) · Code.gs (this) · Ops.gs (Operations Centre)
 *
 * Security notes
 *  - No secrets live in these files. Settings and keys live in Script Properties.
 *  - Passwords: Argon2id (Security.gs). Privileged roles must use an authenticator app (TOTP MFA).
 *  - The script issues its own session token; only a SHA-256 hash is stored.
 *  - Every protected action checks a permission server-side (PERMS in Security.gs).
 *  - Partner photos and documents are stored privately in Drive; identity documents are only
 *    served to the partner who uploaded them and to staff allowed to review partners.
 */

const APP = {
  name: 'KCM Travel & Tours',
  version: '1.4.0',
  sessionDays: 7,
  privilegedSessionHours: 12,
  codeMinutes: 15,
  maxPhotoBytes: 4 * 1024 * 1024,
  maxDocBytes: 6 * 1024 * 1024,
  maxPhotosPerApplication: 30,
};


const TABS = {
  Users: ['Email', 'Name', 'Role', 'Status', 'Provider', 'Picture', 'Created', 'LastLogin', 'InvitedBy', 'PasswordHash', 'PasswordSalt', 'MfaSecret', 'MfaEnabledAt', 'RecoveryCodes'],
  Partners: ['ID', 'Created', 'Email', 'ContactName', 'Phone', 'BusinessName', 'PartnerType', 'Province', 'City',
    'Services', 'Description', 'RegNumber', 'Website', 'Social', 'YearsInBusiness', 'Summary', 'Details',
    'Status', 'PhotoCount', 'DriveFolderId', 'ReviewedBy', 'ReviewedAt', 'ReviewNote', 'Updated', 'Tier'],
  Photos: ['ID', 'PartnerID', 'Label', 'FileID', 'FileName', 'Uploaded', 'UploadedBy', 'Kind'],
  Bookings: ['Reference', 'Created', 'Tour', 'StartDate', 'Nights', 'Adults', 'Children', 'Infants', 'Pensioners',
    'Room', 'Extras', 'Payment', 'EstimatedTotal', 'Name', 'Email', 'Phone', 'Notes', 'Status', 'Source', 'TicketRef', 'ClientEstimate'],
  Messages: ['Created', 'Name', 'Email', 'Phone', 'Message', 'Status'],
  Jobs: ['JobID', 'Date', 'PartnerID', 'BookingRef', 'Service', 'Guests', 'Gross', 'CommissionPct', 'Payout', 'PayoutStatus', 'PaidOn', 'Notes', 'CreatedBy'],
  Ratings: ['ID', 'Created', 'PartnerID', 'BookingRef', 'GuestName', 'Stars', 'Comment', 'Status'],
  Activity: ['Time', 'Actor', 'Action', 'Target', 'Details'],
  Sessions: ['TokenHash', 'Email', 'Created', 'Expires', 'MFA'],
  Codes: ['Email', 'CodeHash', 'Expires', 'Attempts'],
};

/** required = photos; documents = proof the business/asset belongs to the applicant (private, staff-only). */
const PARTNER_TYPES = {
  vehicle: { label: 'Vehicle owner (car hire & transfers)', required: ['Front', 'Rear', 'Left side', 'Right side', 'Dashboard & front seats', 'Rear seats', 'Boot'],
    documents: ['Vehicle registration certificate', 'ID or driver\'s licence'] },
  accommodation: { label: 'Accommodation (hotel, lodge, B&B, guesthouse)', required: ['Exterior', 'Bedroom', 'Bathroom', 'Lounge or common area'],
    documents: ['Proof of ownership or lease', 'ID of owner or director'] },
  tour_operator: { label: 'Tour operator or travel agency', required: ['Logo', 'Vehicle or fleet'], documents: ['Business registration (CIPC)'] },
  guide: { label: 'Tour guide', required: ['Profile photo'], documents: ['Guide registration certificate'] },
  activity: { label: 'Activity provider', required: ['Activity photo', 'Safety equipment'], documents: ['Business registration or ID'] },
  other: { label: 'Other service', required: ['Photo of your service'], documents: ['Business registration or ID'] },
};

const STATUSES = ['Uploading', 'Pending', 'In review', 'Needs info', 'Approved', 'Rejected'];
const TIERS = ['Premium', 'Premium Plus', 'Signature'];
const PAYOUT_STATUSES = ['Pending', 'Approved', 'Paid', 'On hold'];
const BOOKING_STATUSES = ['New', 'Contacted', 'Confirmed', 'Paid', 'Completed', 'Cancelled'];

/* =====================================================================
 * Web entry points
 * ===================================================================== */

function doGet() {
  return json_({ ok: true, data: { name: APP.name, version: APP.version, googleSignIn: !!prop_('GOOGLE_CLIENT_ID') } });
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'Bad request' });
  }
  const action = String(body.action || '');
  const handler = ACTIONS[action];
  if (!handler) return json_({ ok: false, error: 'Unknown action' });
  try {
    return json_({ ok: true, data: handler(body) });
  } catch (err) {
    const msg = err && err.userMessage ? err.userMessage : 'Something went wrong. Please try again.';
    if (!(err && err.userMessage)) console.error(action, err && err.stack || err);
    return json_({ ok: false, error: msg, code: err && err.code || 'error' });
  }
}

const ACTIONS = {
  // public
  ping: () => ({ name: APP.name, version: APP.version, googleSignIn: !!prop_('GOOGLE_CLIENT_ID') }),
  requestCode: requestCode_,
  signIn: signIn_,
  resetPassword: resetPassword_,
  registerPartner: registerPartner_,
  verifyCode: verifyCode_,
  googleSignIn: googleSignIn_,
  mfaVerify: mfaVerify_,
  mfaSetupConfirm: mfaSetupConfirm_,
  submitBooking: submitBooking_,
  submitMessage: submitMessage_,
  ratingInfo: ratingInfo_,
  submitRating: submitRating_,
  // signed in
  me: b => publicUser_(requireUser_(b.token)),
  signOut: signOut_,
  partnerTypes: () => PARTNER_TYPES,
  submitApplication: submitApplication_,
  uploadPhoto: uploadPhoto_,
  finalizeApplication: finalizeApplication_,
  myApplications: myApplications_,
  getPhoto: getPhoto_,
  partnerDashboard: partnerDashboard_,
  // staff
  dashboard: dashboard_,
  listApplications: listApplications_,
  getApplication: getApplication_,
  reviewApplication: reviewApplication_,
  listBookings: listBookings_,
  updateBooking: updateBooking_,
  listMessages: listMessages_,
  listUsers: listUsers_,
  saveUser: saveUser_,
  resetUserMfa: resetUserMfa_,
  activity: activity_,
  listJobs: listJobs_,
  saveJob: saveJob_,
  setPayoutStatus: setPayoutStatus_,
  listRatings: listRatings_,
  setRatingStatus: setRatingStatus_,
};

/* =====================================================================
 * Authentication
 * ===================================================================== */

function requestCode_(b) {
  const email = cleanEmail_(b.email);
  const cache = CacheService.getScriptCache();
  const key = 'code-rate:' + email;
  const count = Number(cache.get(key) || 0);
  if (count >= 5) throw userError_('Too many codes requested. Please wait 15 minutes and try again.');
  cache.put(key, String(count + 1), 15 * 60);

  const code = String(100000 + randomInt_(900000));
  withLock_(() => {
    const sh = sheet_('Codes');
    deleteRowsWhere_(sh, r => r[0] === email);
    sh.appendRow([email, hash_(code + ':' + email), new Date(Date.now() + APP.codeMinutes * 60000), 0]);
  });
  sendMail_(email, `Your ${APP.name} sign-in code: ${code}`,
    `<p>Hi,</p><p>Your sign-in code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
     <p>It expires in ${APP.codeMinutes} minutes. If you didn't ask for this code, you can ignore this email.</p>`);
  return { sent: true };
}

function verifyCode_(b) {
  const email = cleanEmail_(b.email);
  verifyCodeOnly_(email, b.code);
  return finishLogin_(email, { provider: 'email', name: b.name });
}

function verifyCodeOnly_(email, rawCode) {
  const code = String(rawCode || '').replace(/\D/g, '');
  let ok = false;
  withLock_(() => {
    const sh = sheet_('Codes');
    const rows = sh.getDataRange().getValues();
    for (let i = rows.length - 1; i >= 1; i--) {
      if (rows[i][0] !== email) continue;
      const expired = new Date(rows[i][2]).getTime() < Date.now();
      const attempts = Number(rows[i][3] || 0);
      if (expired || attempts >= 5) { sh.deleteRow(i + 1); break; }
      if (rows[i][1] === hash_(code + ':' + email)) { ok = true; sh.deleteRow(i + 1); }
      else sh.getRange(i + 1, 4).setValue(attempts + 1);
      break;
    }
  });
  if (!ok) throw userError_('That code is wrong or has expired. Please request a new one.');
}

function googleSignIn_(b) {
  const clientId = prop_('GOOGLE_CLIENT_ID');
  if (!clientId) throw userError_('Google sign-in is not set up yet. Please use the email code option.');
  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(String(b.credential || '')), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw userError_('Google sign-in failed. Please try again.');
  const info = JSON.parse(res.getContentText());
  const issuerOk = info.iss === 'accounts.google.com' || info.iss === 'https://accounts.google.com';
  if (info.aud !== clientId || !issuerOk || String(info.email_verified) !== 'true' || Number(info.exp) * 1000 < Date.now()) {
    throw userError_('Google sign-in could not be verified.');
  }
  return finishLogin_(cleanEmail_(info.email), { provider: 'google', name: info.name, picture: info.picture });
}

/* ---------- passwords (hashing lives in Security.gs) ---------- */
function pepper_() {
  const props = PropertiesService.getScriptProperties();
  let p = props.getProperty('PASSWORD_PEPPER');
  if (!p) { p = randomToken_(); props.setProperty('PASSWORD_PEPPER', p); }
  return p;
}
function checkPassword_(password) {
  const pw = String(password || '');
  if (pw.length < 10 || pw.length > 128) throw userError_('Your password must be at least 10 characters.');
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) throw userError_('Use letters and at least one number in your password.');
  if (/^(password|kcm|admin|qwerty|123456)/i.test(pw)) throw userError_('Please choose a less common password.');
  return pw;
}
function setPassword_(email, password) {
  const h = newPasswordHash_(password);
  setUserFields_(email, { PasswordHash: h.hash, PasswordSalt: h.scheme });
}
function loginRateLimit_(email) {
  const cache = CacheService.getScriptCache();
  const key = 'login-rate:' + email;
  const n = Number(cache.get(key) || 0);
  if (n >= 8) throw userError_('Too many sign-in attempts. Please wait 15 minutes, or reset your password.');
  cache.put(key, String(n + 1), 15 * 60);
  // global brake against password spraying across many accounts (Apps Script cannot see client IPs)
  const g = 'login-global:' + Math.floor(Date.now() / 60000);
  const gn = Number(cache.get(g) || 0);
  if (gn >= 60) throw userError_('Sign-in is busy. Please try again in a minute.');
  cache.put(g, String(gn + 1), 120);
}

/** Email + password sign-in. Partners can only sign in once an application has been approved (or we asked them for more info). */
function signIn_(b) {
  const email = cleanEmail_(b.email);
  loginRateLimit_(email);
  const user = findUser_(email);
  const wrong = userError_('That email or password is incorrect. First time signing in? Use "Forgot or set password".');
  const password = String(b.password || '').slice(0, 128);
  if (!user || !user.PasswordHash) { if (!user) argonHash_(password, randomBytes_(16), false); throw wrong; } // same work either way (timing)
  if (!verifyPassword_(user, password)) { log_(email, 'sign_in_failed', email, ''); throw wrong; }
  CacheService.getScriptCache().remove('login-rate:' + email);
  if (String(user.PasswordHash).indexOf('$argon2id$') !== 0) { setPassword_(email, password); log_(email, 'password_rehashed', email, 'argon2id'); }
  return finishLogin_(email, { provider: 'password' });
}

/** Forgot / first-time password: verify the emailed code, then save the new password and sign in. */
function resetPassword_(b) {
  const email = cleanEmail_(b.email);
  const password = checkPassword_(b.password);
  verifyCodeOnly_(email, b.code);
  if (!findUser_(email)) throw userError_('We couldn\'t find an account for that email. New partners: please register first.');
  setPassword_(email, password);
  revokeSessions_(email); // a password reset signs out every other device
  log_(email, 'password_set', email, '');
  return finishLogin_(email, { provider: 'password' });
}

/** Who may open a session. Pending partners get a clear status message instead of a session. */
function accessGate_(user) {
  if (user.Status === 'disabled') throw userError_('This account has been disabled. Please contact KCM Travel & Tours.');
  if (roleOf_(user) !== 'PARTNER' || user.Status === 'active') return;
  const apps = readTable_('Partners').filter(p => p.Email === user.Email);
  if (apps.some(p => p.Status === 'Approved' || p.Status === 'Needs info')) return;
  if (apps.length && apps.every(p => p.Status === 'Rejected')) throw userError_('Your application was not approved. Please check your email for feedback, or contact us on WhatsApp.', 'pending');
  throw userError_('Thanks! Your application is still being reviewed. You can sign in as soon as it\'s approved, and we\'ll email you then.', 'pending');
}

/** Only called after every required factor has been checked (finishLogin_ in Security.gs, or registration). */
function startSession_(email, opts) {
  const user = findUser_(email) || upsertUser_(email, opts);
  const token = randomToken_();
  const ms = needsMfa_(user) ? APP.privilegedSessionHours * 3600000 : APP.sessionDays * 86400000;
  withLock_(() => {
    const sh = sheet_('Sessions');
    deleteRowsWhere_(sh, r => new Date(r[3]).getTime() < Date.now()); // tidy expired sessions
    sh.appendRow([hash_(token), email, new Date(), new Date(Date.now() + ms), opts.mfa ? 'yes' : '']);
  });
  log_(email, 'sign_in', email, (opts.provider || '') + (opts.mfa ? ' + MFA' : ''));
  return { token, user: publicUser_(user) };
}

function signOut_(b) {
  const h = hash_(String(b.token || ''));
  withLock_(() => deleteRowsWhere_(sheet_('Sessions'), r => r[0] === h));
  CacheService.getScriptCache().remove('sess:' + h);
  return { signedOut: true };
}

/** allowPending: a newly registered partner may finish uploading and submit before approval, nothing else. */
function requireUser_(token, allowPending) {
  if (!token) throw userError_('Please sign in.', 'auth');
  const h = hash_(String(token));
  const cache = CacheService.getScriptCache();
  let sess = cache.get('sess:' + h);
  if (!sess) {
    const rows = sheet_('Sessions').getDataRange().getValues();
    const row = rows.find((r, i) => i > 0 && r[0] === h && new Date(r[3]).getTime() > Date.now());
    if (!row) throw userError_('Your session has expired. Please sign in again.', 'auth');
    sess = row[1] + '|' + (row[4] === 'yes' ? 'mfa' : '') + '|' + new Date(row[3]).getTime();
    cache.put('sess:' + h, sess, 300);
  }
  const [email, mfa, expires] = sess.split('|');
  if (Number(expires) < Date.now()) throw userError_('Your session has expired. Please sign in again.', 'auth');
  const user = findUser_(email);
  if (!user || user.Status === 'disabled') throw userError_('Please sign in.', 'auth');
  // a session opened before the user became privileged (or without MFA) cannot use a privileged role
  if (needsMfa_(user) && mfa !== 'mfa') throw userError_('Please sign in again with your authenticator app.', 'auth');
  if (user.Status === 'pending' && !allowPending) accessGate_(user);
  return user;
}


/* =====================================================================
 * Users & access
 * ===================================================================== */

function findUser_(email) {
  return readTable_('Users').find(u => u.Email === email) || null;
}

function upsertUser_(email, opts) {
  opts = opts || {};
  const owner = String(prop_('OWNER_EMAIL') || '').toLowerCase();
  let result;
  withLock_(() => {
    const sh = sheet_('Users');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === email);
    const now = new Date();
    if (idx === -1) {
      const role = email === owner ? 'SUPER_ADMIN' : (opts.role || 'PARTNER');
      const row = [email, safe_(opts.name || ''), role, opts.status || 'active', opts.provider || '', safe_(opts.picture || ''), now, now, '', '', '', '', '', ''];
      sh.appendRow(row);
      result = rowToObj_(TABS.Users, row);
    } else {
      const r = rows[idx];
      if (email === owner && roleOf_({ Role: r[2] }) !== 'SUPER_ADMIN') r[2] = 'SUPER_ADMIN';
      if (!r[1] && opts.name) r[1] = safe_(opts.name);
      if (opts.picture) r[5] = safe_(opts.picture);
      if (opts.provider) r[4] = opts.provider;
      r[7] = now;
      sh.getRange(idx + 1, 1, 1, r.length).setValues([r]);
      result = rowToObj_(TABS.Users, r);
    }
  });
  return result;
}

/** What the browser may know about a user. Never includes hashes, secrets or recovery codes. */
function publicUser_(u) {
  return { email: u.Email, name: u.Name || '', role: roleOf_(u), picture: u.Picture || '', isStaff: isStaff_(u), canEdit: can_(u, 'partners.review'),
    permissions: permissionsOf_(u), mfaRequired: needsMfa_(u), mfaEnabled: !!u.MfaSecret };
}

function listUsers_(b) {
  requirePerm_(b.token, 'users.view');
  return readTable_('Users').map(u => ({ email: u.Email, name: u.Name, role: roleOf_(u), status: u.Status, provider: u.Provider, created: iso_(u.Created), lastLogin: iso_(u.LastLogin), invitedBy: u.InvitedBy, mfa: !!u.MfaSecret }));
}

/** Invite a new user or change an existing user's role/status. Only the super admin manages admins; nobody changes their own access. */
function saveUser_(b) {
  const actor = requirePerm_(b.token, 'users.manage');
  const email = cleanEmail_(b.email);
  const role = LEGACY_ROLES[String(b.role)] || String(b.role || 'OPERATIONS').toUpperCase();
  const status = String(b.status || 'active');
  if (ALL_ROLES.indexOf(role) === -1 || ['active', 'disabled'].indexOf(status) === -1) throw userError_('Invalid role or status.');
  if (email === actor.Email) throw userError_('You cannot change your own access.');
  if (role === 'SUPER_ADMIN') throw userError_('The super admin role cannot be assigned here.');
  const target = findUser_(email);
  if (target && roleOf_(target) === 'SUPER_ADMIN') throw userError_('The super admin account cannot be changed.');
  if (roleOf_(actor) !== 'SUPER_ADMIN' && (role === 'ADMIN' || (target && roleOf_(target) === 'ADMIN'))) throw userError_('Only the super admin can add or change admins.');

  withLock_(() => {
    const sh = sheet_('Users');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === email);
    if (idx === -1) {
      sh.appendRow([email, safe_(b.name || ''), role, status, 'invited', '', new Date(), '', actor.Email, '', '']);
    } else {
      sh.getRange(idx + 1, 3, 1, 2).setValues([[role, status]]);
      if (b.name) sh.getRange(idx + 1, 2).setValue(safe_(b.name));
    }
  });
  if (target && (roleOf_(target) !== role || status === 'disabled')) revokeSessions_(email); // role changes apply immediately
  log_(actor.Email, target ? 'user_updated' : 'user_invited', email, (target ? roleOf_(target) + ' → ' : '') + role + ' / ' + status);
  if (!target && STAFF_ROLES.indexOf(role) !== -1) {
    sendMail_(email, `You've been given access to ${APP.name}`,
      `<p>Hi${b.name ? ' ' + esc_(b.name) : ''},</p><p>${esc_(actor.Name || actor.Email)} has given you <strong>${role}</strong> access to the ${APP.name} admin dashboard.</p>
       <p>Go to the website, click <strong>Sign in</strong>, then <strong>Forgot or set password</strong> to create your password with this email address (${esc_(email)}).${MFA_ROLES.indexOf(role) !== -1 ? ' You\'ll also be asked to set up an authenticator app (such as Google Authenticator or Microsoft Authenticator) on your phone.' : ''}</p>${siteLink_('/admin', 'Open the admin dashboard')}`);
  }
  return { saved: true };
}

/* =====================================================================
 * Partner applications
 * ===================================================================== */

/** Public: new partner fills in the whole form, chooses a password and submits. Creates a pending account + the application. */
function registerPartner_(b) {
  if (b.website) throw userError_('Something went wrong. Please try again.'); // honeypot
  publicRateLimit_();
  const a = b.account || {};
  const email = cleanEmail_(a.email);
  const password = checkPassword_(a.password);
  const owner = String(prop_('OWNER_EMAIL') || '').toLowerCase();
  if (email === owner || findUser_(email)) throw userError_('This email is already registered. Please sign in to add another business, or use "Forgot or set password".', 'exists');
  const name = safe_(a.name || (b.application || {}).contactName || '');
  upsertUser_(email, { name, provider: 'password', status: 'pending' });
  setPassword_(email, password);
  const session = startSession_(email, { provider: 'password', registering: true }); // pending partner: may only upload + submit
  const app = createApplication_(findUser_(email), b.application || {});
  log_(email, 'partner_registered', app.id, name);
  return Object.assign(app, { token: session.token });
}

function submitApplication_(b) {
  return createApplication_(requireUser_(b.token), b.application || {});
}

function createApplication_(user, d) {
  const type = String(d.partnerType || '');
  if (!PARTNER_TYPES[type]) throw userError_('Please choose what kind of partner you are.');
  const need = ['contactName', 'phone', 'businessName', 'province', 'city', 'description'];
  need.forEach(k => { if (!String(d[k] || '').trim()) throw userError_('Please complete all required fields.'); });

  const id = 'P-' + Utilities.formatDate(new Date(), 'Africa/Johannesburg', 'yyMM') + '-' + randomCode_(4);
  const details = sanitizeDetails_(d.details || {});
  const folder = partnersFolder_().createFolder(id + ' · ' + String(d.businessName).slice(0, 60));
  const now = new Date();
  const row = [id, now, user.Email, safe_(d.contactName), safe_(d.phone), safe_(d.businessName), type, safe_(d.province), safe_(d.city),
    safe_((d.services || []).join(', ')), safe_(d.description, 2000), safe_(d.regNumber), safe_(d.website), safe_(d.social), safe_(d.years),
    safe_(summary_(type, details), 500), JSON.stringify(details), 'Uploading', 0, folder.getId(), '', '', '', now];
  withLock_(() => sheet_('Partners').appendRow(row));
  if (!user.Name && d.contactName) upsertUser_(user.Email, { name: d.contactName });
  log_(user.Email, 'application_started', id, PARTNER_TYPES[type].label);
  return { id, required: PARTNER_TYPES[type].required, documents: PARTNER_TYPES[type].documents };
}

function uploadPhoto_(b) {
  const user = requireUser_(b.token, true);
  const app = findApplication_(b.id);
  if (!app) throw userError_('Application not found.');
  const isOwner = app.row.Email === user.Email;
  if (!isOwner && !can_(user, 'partners.review')) throw userError_('You do not have access to this.', 'forbidden');
  if (['Uploading', 'Pending', 'In review', 'Needs info'].indexOf(app.row.Status) === -1) throw userError_('Photos can no longer be added to this application.');
  if (Number(app.row.PhotoCount || 0) >= APP.maxPhotosPerApplication) throw userError_('You have reached the maximum number of files.');

  const isDoc = b.kind === 'document';
  const m = String(b.dataUrl || '').match(isDoc ? /^data:(image\/(jpeg|png|webp)|application\/(pdf));base64,(.+)$/ : /^data:(image\/(jpeg|png|webp));base64,(.+)$/);
  if (!m) throw userError_(isDoc ? 'Please upload the document as a PDF or a photo (JPG or PNG).' : 'Please upload a JPG, PNG or WebP image.');
  const bytes = Utilities.base64Decode(m[m.length - 1]);
  if (bytes.length > (isDoc ? APP.maxDocBytes : APP.maxPhotoBytes)) throw userError_(isDoc ? 'That document is too large (max 6 MB).' : 'That photo is too large. Please use a smaller image.');
  if (!fileMatchesType_(bytes, m[1])) throw userError_('That file does not look like a real ' + (m[1] === 'application/pdf' ? 'PDF' : 'image') + '. Please upload the original file.');
  const label = safe_(b.label || (isDoc ? 'Document' : 'Photo'), 60);
  const ext = m[3] === 'pdf' ? 'pdf' : m[2] === 'jpeg' ? 'jpg' : m[2];
  const name = (isDoc ? 'DOC ' : '') + label.replace(/[^\w &-]/g, '') + '.' + ext;
  const file = DriveApp.getFolderById(app.row.DriveFolderId).createFile(Utilities.newBlob(bytes, m[1], name));
  const photoId = 'F-' + randomCode_(8);
  withLock_(() => {
    sheet_('Photos').appendRow([photoId, app.row.ID, label, file.getId(), name, new Date(), user.Email, isDoc ? 'document' : 'photo']);
    const fresh = findApplication_(b.id);
    sheet_('Partners').getRange(fresh.index, TABS.Partners.indexOf('PhotoCount') + 1).setValue(Number(fresh.row.PhotoCount || 0) + 1);
  });
  return { photoId, label, kind: isDoc ? 'document' : 'photo' };
}

function finalizeApplication_(b) {
  const user = requireUser_(b.token, true);
  const app = findApplication_(b.id);
  if (!app || app.row.Email !== user.Email) throw userError_('Application not found.');
  const files = photosFor_(app.row.ID);
  const labels = files.filter(p => p.Kind !== 'document').map(p => p.Label);
  const docs = files.filter(p => p.Kind === 'document').map(p => p.Label);
  const t = PARTNER_TYPES[app.row.PartnerType];
  const missing = t.required.filter(r => labels.indexOf(r) === -1);
  if (missing.length) throw userError_('Please add these photos first: ' + missing.join(', '));
  const missingDocs = (t.documents || []).filter(r => docs.indexOf(r) === -1);
  if (missingDocs.length) throw userError_('Please add these documents first: ' + missingDocs.join(', '));
  const wasNeedsInfo = app.row.Status === 'Needs info';
  setApplicationFields_(app.index, { Status: 'Pending', Updated: new Date() });
  log_(user.Email, wasNeedsInfo ? 'application_resubmitted' : 'application_submitted', app.row.ID, app.row.BusinessName);

  sendMail_(user.Email, `We've received your partner application (${app.row.ID})`,
    `<p>Hi ${esc_(app.row.ContactName)},</p><p>Thank you for applying to partner with ${APP.name}. Your application <strong>${app.row.ID}</strong> for <strong>${esc_(app.row.BusinessName)}</strong> is now with our team.</p>
     <p>We review every partner carefully, including the photos and documents, and usually reply within 3 working days. Once you're approved you can sign in with this email address and the password you chose.</p>`);
  whatsapp_(`${wasNeedsInfo ? '🔁 Partner application updated' : '🆕 New partner application'} (${app.row.ID})\n${app.row.BusinessName}\n${t.label}\n${app.row.City}, ${app.row.Province}\nContact: ${app.row.ContactName} · ${app.row.Phone}\n${files.length} photos & documents\n\nReview it: ${siteUrl_('/admin#applications/' + app.row.ID)}`);
  staffEmails_(['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT']).forEach(to => sendMail_(to, `New partner application: ${app.row.BusinessName}`,
    `<p>A new ${esc_(PARTNER_TYPES[app.row.PartnerType].label.toLowerCase())} application is waiting for review.</p>
     <p><strong>${esc_(app.row.BusinessName)}</strong> · ${esc_(app.row.City)}, ${esc_(app.row.Province)}<br>${esc_(app.row.Summary)}</p>${siteLink_('/admin#applications', 'Review it in the dashboard')}`));
  return { status: 'Pending' };
}

function myApplications_(b) {
  const user = requireUser_(b.token);
  return readTable_('Partners').filter(p => p.Email === user.Email).map(p => applicationView_(p, true));
}

function listApplications_(b) {
  requirePerm_(b.token, 'partners.view');
  return readTable_('Partners').map(p => applicationView_(p, false)).reverse();
}

function getApplication_(b) {
  const user = requireUser_(b.token);
  const app = findApplication_(b.id);
  if (!app) throw userError_('Application not found.');
  const own = app.row.Email === user.Email;
  if (!own && !can_(user, 'partners.view')) throw userError_('You do not have access to this.', 'forbidden');
  if (app.row.Status === 'Pending' && can_(user, 'partners.review')) {
    setApplicationFields_(app.index, { Status: 'In review', ReviewedBy: user.Email, Updated: new Date() });
    app.row.Status = 'In review'; app.row.ReviewedBy = user.Email;
    log_(user.Email, 'application_opened', app.row.ID, app.row.BusinessName);
  }
  const view = applicationView_(app.row, true);
  const files = photosFor_(app.row.ID).map(p => ({ id: p.ID, label: p.Label, fileId: p.FileID, uploaded: iso_(p.Uploaded), kind: p.Kind || 'photo', name: p.FileName }));
  view.photos = files.filter(f => f.kind !== 'document');
  // identity / ownership documents: only the applicant and partner reviewers
  view.documents = own || can_(user, 'partners.review') ? files.filter(f => f.kind === 'document') : [];
  return view;
}

function getPhoto_(b) {
  const user = requireUser_(b.token);
  const photo = readTable_('Photos').find(p => p.FileID === b.fileId);
  if (!photo) throw userError_('Photo not found.');
  const app = findApplication_(photo.PartnerID);
  const own = app && app.row.Email === user.Email;
  const allowed = own || (photo.Kind === 'document' ? can_(user, 'partners.review') : can_(user, 'partners.view'));
  if (!allowed) throw userError_('You do not have access to this.', 'forbidden');
  if (photo.Kind === 'document' && !own) log_(user.Email, 'document_viewed', photo.PartnerID, photo.Label); // audit access to ID documents
  const blob = DriveApp.getFileById(photo.FileID).getBlob();
  return { dataUrl: 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes()) };
}

function reviewApplication_(b) {
  const actor = requirePerm_(b.token, 'partners.review');
  const app = findApplication_(b.id);
  if (!app) throw userError_('Application not found.');
  const decision = { approve: 'Approved', reject: 'Rejected', needs_info: 'Needs info' }[b.decision];
  if (!decision) throw userError_('Invalid decision.');
  const note = safe_(b.note || '', 1000);
  if (decision !== 'Approved' && !note) throw userError_('Please add a note for the partner.');
  const tier = decision === 'Approved' ? (TIERS.indexOf(b.tier) !== -1 ? b.tier : 'Premium') : '';
  const fields = { Status: decision, ReviewedBy: actor.Email, ReviewedAt: new Date(), ReviewNote: note, Updated: new Date() };
  if (tier) fields.Tier = tier;
  setApplicationFields_(app.index, fields);
  if (decision === 'Approved') activateUser_(app.row.Email);
  log_(actor.Email, 'application_' + b.decision, app.row.ID, note);

  const p = app.row;
  const bodies = {
    Approved: `<p>Hi ${esc_(p.ContactName)},</p><p>Good news: <strong>${esc_(p.BusinessName)}</strong> has been <strong>approved</strong> as a ${APP.name} <strong>${tier}</strong> partner (${p.ID}).</p>
      ${note ? `<p>${esc_(note)}</p>` : ''}<p>You can now <strong>sign in with your email address and the password you chose</strong> when you registered to see your partner portal: your listings, trips, payouts, statements and guest ratings.</p>
      <p>Our team will contact you about next steps, including confirming your banking details for payments. Welcome aboard!</p>${siteLink_('/account', 'Sign in to your partner portal')}`,
    Rejected: `<p>Hi ${esc_(p.ContactName)},</p><p>Thank you for applying to partner with ${APP.name}. After reviewing <strong>${esc_(p.BusinessName)}</strong> (${p.ID}), we are not able to approve the application at this time.</p>
      <p><strong>Feedback:</strong> ${esc_(note)}</p><p>You're welcome to apply again in future.</p>`,
    'Needs info': `<p>Hi ${esc_(p.ContactName)},</p><p>We're reviewing <strong>${esc_(p.BusinessName)}</strong> (${p.ID}) and need a little more from you:</p>
      <p><strong>${esc_(note)}</strong></p><p>Sign in with your email and password to add the photos or documents, then resubmit.</p>${siteLink_('/account', 'Update your application')}`,
  };
  const subjects = { Approved: `You're approved! Welcome to ${APP.name}`, Rejected: `Update on your ${APP.name} application`, 'Needs info': `We need a bit more information (${p.ID})` };
  sendMail_(p.Email, subjects[decision], bodies[decision]);
  return { status: decision };
}

/* =====================================================================
 * Bookings & messages (from the public website)
 * ===================================================================== */

/**
 * Public: website booking form and Kaycee chat. Everything from the browser is untrusted:
 * fields are validated and length-limited, the price is recalculated here (priceQuote_ in Pricing.gs),
 * the reference is generated here, and a retry with the same idempotency key returns the same ticket.
 */
function submitBooking_(b) {
  if (b.website) return { saved: true }; // honeypot
  publicRateLimit_();
  const d = b.booking || {};
  const idem = String(b.idempotencyKey || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 64);
  const cache = CacheService.getScriptCache();
  if (idem) { const prev = cache.get('idem:booking:' + idem); if (prev) return JSON.parse(prev); }

  const name = safe_(d.name, 80), phone = safe_(d.phone, 30), email = String(d.email || '').trim().toLowerCase().slice(0, 120);
  if (!name) throw userError_('Please add your name.');
  if (!email && !phone) throw userError_('Please add your email or cell number.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw userError_('Please check your email address.');
  if (phone && !/^[0-9 +()-]{9,20}$/.test(phone.replace(/^'/, ''))) throw userError_('Please check your cell number.'); // safe_ prefixes ' to +27… so Sheets doesn't treat it as a formula
  if (d.consent !== true) throw userError_('Please agree to the privacy notice so we can contact you.');
  const source = d.source === 'chat' ? 'chat' : 'website';
  const est = priceQuote_({ tourSlug: d.tourSlug, tour: d.tour, nights: d.nights, adults: d.adults, children: d.children, infants: d.infants,
    pensioners: d.pensioners, room: d.room, extras: d.extraCodes, payment: d.payment });
  const tourTitle = est ? est.title : safe_(d.tour, 120) || 'Trip enquiry';
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(String(d.startDate || '')) ? String(d.startDate) : '';
  const k = d.kaycee && typeof d.kaycee === 'object' ? d.kaycee : {};

  const ticket = opsCreateTicketFromPublic_({
    source: source === 'chat' ? 'Kaycee AI' : 'Website booking form',
    customer: { name, email, phone, consentSource: source === 'chat' ? 'Kaycee chat' : 'Website booking form' },
    package: tourTitle, packageSlug: est ? est.slug : '', destination: safe_(k.region, 60), activities: safe_(k.style, 80),
    departDate: startDate, nights: est ? est.nights : num_(d.nights), adults: num_(d.adults), children: num_(d.children), infants: num_(d.infants), pensioners: num_(d.pensioners),
    rooms: safe_(d.room, 40), extras: est ? est.extras : [], budget: safe_(k.budget, 40), paymentPref: safe_(d.payment, 30),
    description: safe_(d.notes, 1500), estimate: est ? est.total : 0, dayTour: est ? est.nights === 0 : false,
  });
  const ref = ticket.ref;
  const row = [ref, new Date(), tourTitle, startDate || safe_(d.startDate, 30), est ? est.nights : num_(d.nights), num_(d.adults), num_(d.children), num_(d.infants), num_(d.pensioners),
    safe_(d.room), safe_((est ? est.extras : []).join(', ')), safe_(d.payment), est ? est.total : 0, name, email, phone, safe_(d.notes, 600), 'New', source, ref, num_(d.total)];
  withLock_(() => sheet_('Bookings').appendRow(row));
  log_(email || phone, 'booking_request', ref, tourTitle + (est && num_(d.total) && num_(d.total) !== est.total ? ' · browser total ignored (R' + num_(d.total) + ' vs R' + est.total + ')' : ''));

  const travellers = num_(d.adults) + num_(d.children) + num_(d.pensioners) + num_(d.infants);
  const q = { reference: ref, tour: tourTitle, startDate: startDate || 'flexible', nights: est ? est.nights : num_(d.nights), room: d.room, extras: est ? est.extras : [], total: est ? est.total : 0, name };
  staffEmails_(['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT']).forEach(to => sendMail_(to, `New enquiry ${ref}: ${tourTitle}`,
    `<p><strong>${esc_(name)}</strong> (${esc_(phone)}${email ? ', ' + esc_(email) : ''}) asked about <strong>${esc_(tourTitle)}</strong> from ${esc_(q.startDate)} for ${travellers} travellers via ${source === 'chat' ? 'Kaycee' : 'the booking form'}.${est ? ' Website estimate: R' + zar_(est.total) + '.' : ''}</p>${siteLink_('/admin#ticket/' + ref, 'Open the ticket')}`));
  whatsapp_(`🧳 New enquiry ${ref}${source === 'chat' ? ' (via Kaycee)' : ''}\n${tourTitle}\nWhen: ${q.startDate}${q.nights ? ' · ' + q.nights + ' nights' : ''}\nTravellers: ${travellers || '-'}\n${est ? 'Estimate: R' + zar_(est.total) + '\n' : ''}${name} · ${phone}${email ? ' · ' + email : ''}\n\nOpen: ${siteUrl_('/admin#ticket/' + ref)}`);
  if (email) sendMail_(email, `Your KCM trip quote ${ref}`, quoteHtml_(q, travellers));
  const out = { saved: true, reference: ref, estimate: est ? est.total : null, emailed: !!email };
  if (idem) cache.put('idem:booking:' + idem, JSON.stringify(out), 3600);
  return out;
}

/** The quote the traveller receives by email (prices are estimates until a consultant confirms availability). */
function quoteHtml_(d, travellers) {
  const row = (k, v) => v ? `<tr><td style="padding:6px 12px 6px 0;color:#666">${k}</td><td style="padding:6px 0"><strong>${esc_(v)}</strong></td></tr>` : '';
  const total = num_(d.total);
  return `<p>Hi ${esc_(String(d.name || '').split(' ')[0] || 'there')},</p>
    <p>Thanks for planning your trip with KCM Travel &amp; Tours. Here's your quote. A consultant will confirm availability and the final price within one working day.</p>
    <table style="border-collapse:collapse;margin:12px 0">
      ${row('Reference', d.reference)}${row('Trip', d.tour)}${row('Travel date', d.startDate)}${row('Nights', num_(d.nights) ? String(num_(d.nights)) : '')}
      ${row('Travellers', travellers ? String(travellers) : '')}${row('Room', d.room)}${row('Extras', (d.extras || []).join(', '))}
      ${row('Estimated total', total ? 'R' + zar_(total) + ' (estimate)' : 'Your consultant will price this for you')}
    </table>
    <p>Questions or changes? Reply to this email or WhatsApp us on <a href="https://wa.me/27764360010?text=${encodeURIComponent('Hi KCM, about my quote ' + d.reference)}">076 436 0010</a> and quote <strong>${esc_(d.reference)}</strong>.</p>`;
}

function submitMessage_(b) {
  if (b.website) return { saved: true };
  publicRateLimit_();
  const d = b.message || {};
  if (!d.name || !d.message) throw userError_('Missing message details.');
  withLock_(() => sheet_('Messages').appendRow([new Date(), safe_(d.name), safe_(d.email), safe_(d.phone), safe_(d.message, 1500), 'New']));
  whatsapp_(`✉️ New website message from ${d.name}${d.phone ? ' · ' + d.phone : ''}\n${String(d.message).slice(0, 400)}\n\nOpen: ${siteUrl_('/admin#messages')}`);
  return { saved: true };
}

function listBookings_(b) {
  requirePerm_(b.token, 'bookings.view');
  return readTable_('Bookings').map(r => ({
    reference: r.Reference, created: iso_(r.Created), tour: r.Tour, startDate: iso_(r.StartDate) || String(r.StartDate), nights: r.Nights,
    travellers: num_(r.Adults) + num_(r.Children) + num_(r.Infants) + num_(r.Pensioners), adults: r.Adults, children: r.Children,
    room: r.Room, extras: r.Extras, payment: r.Payment, total: num_(r.EstimatedTotal), name: r.Name, email: r.Email, phone: r.Phone, notes: r.Notes, status: r.Status, source: r.Source,
  })).reverse();
}

function updateBooking_(b) {
  const actor = requirePerm_(b.token, 'bookings.update');
  if (BOOKING_STATUSES.indexOf(b.status) === -1) throw userError_('Invalid status.');
  let found = false;
  withLock_(() => {
    const sh = sheet_('Bookings');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === b.reference);
    if (idx > 0) { sh.getRange(idx + 1, TABS.Bookings.indexOf('Status') + 1).setValue(b.status); found = true; }
  });
  if (!found) throw userError_('Booking not found.');
  log_(actor.Email, 'booking_status', b.reference, b.status);
  return { status: b.status };
}

function listMessages_(b) {
  requirePerm_(b.token, 'messages.view');
  return readTable_('Messages').map(m => ({ created: iso_(m.Created), name: m.Name, email: m.Email, phone: m.Phone, message: m.Message, status: m.Status })).reverse();
}

/* =====================================================================
 * Dashboard
 * ===================================================================== */

function dashboard_(b) {
  const user = requirePerm_(b.token, 'dashboard.view');
  const partners = readTable_('Partners').filter(p => p.Status !== 'Uploading');
  const bookings = readTable_('Bookings');
  const users = readTable_('Users');
  const count = (list, key) => list.reduce((acc, x) => { const k = x[key] || 'Unknown'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});

  // applications per week, last 12 weeks
  const weeks = [];
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - start.getDay() - 7 * 11);
  for (let i = 0; i < 12; i++) { const d = new Date(start); d.setDate(d.getDate() + i * 7); weeks.push({ week: iso_(d).slice(0, 10), applications: 0, bookings: 0 }); }
  const weekIndex = date => Math.floor((new Date(date).getTime() - start.getTime()) / (7 * 86400000));
  partners.forEach(p => { const i = weekIndex(p.Created); if (i >= 0 && i < 12) weeks[i].applications++; });
  bookings.forEach(x => { const i = weekIndex(x.Created); if (i >= 0 && i < 12) weeks[i].bookings++; });

  const value = bookings.filter(x => x.Status !== 'Cancelled').reduce((s, x) => s + num_(x.EstimatedTotal), 0);
  const jobs = readTable_('Jobs');
  const ratings = readTable_('Ratings').filter(r => r.Status !== 'Hidden');
  const payoutsPending = jobs.filter(j => j.PayoutStatus !== 'Paid').reduce((s, j) => s + num_(j.Payout), 0);
  const avgRating = ratings.length ? ratings.reduce((s, r) => s + num_(r.Stars), 0) / ratings.length : 0;
  const byTour = {};
  bookings.forEach(x => { byTour[x.Tour] = (byTour[x.Tour] || 0) + num_(x.EstimatedTotal); });

  return {
    you: publicUser_(user),
    kpis: {
      pending: partners.filter(p => p.Status === 'Pending' || p.Status === 'In review').length,
      needsInfo: partners.filter(p => p.Status === 'Needs info').length,
      approved: partners.filter(p => p.Status === 'Approved').length,
      applications: partners.length,
      bookings: bookings.length,
      newBookings: bookings.filter(x => x.Status === 'New').length,
      bookingValue: value,
      users: users.length,
      staff: users.filter(u => isStaff_(u)).length,
      inReview: partners.filter(p => p.Status === 'In review').length,
      trips: jobs.length,
      payoutsPending,
      grossEarned: jobs.reduce((s, j) => s + num_(j.Gross), 0),
      avgRating: Math.round(avgRating * 10) / 10,
      ratings: ratings.length,
    },
    byStatus: count(partners, 'Status'),
    byType: Object.entries(count(partners, 'PartnerType')).reduce((acc, [k, v]) => { acc[(PARTNER_TYPES[k] || {}).label || k] = v; return acc; }, {}),
    byProvince: count(partners, 'Province'),
    bookingsByStatus: count(bookings, 'Status'),
    valueByTour: byTour,
    weekly: weeks,
    recent: readTable_('Activity').slice(-15).reverse().map(a => ({ time: iso_(a.Time), actor: a.Actor, action: a.Action, target: a.Target, details: a.Details })),
    sheetUrl: can_(user, 'users.manage') ? SpreadsheetApp.getActiveSpreadsheet().getUrl() : '',
  };
}

function activity_(b) {
  requirePerm_(b.token, 'audit.view');
  return readTable_('Activity').slice(-300).reverse().map(a => ({ time: iso_(a.Time), actor: a.Actor, action: a.Action, target: a.Target, details: a.Details }));
}

/* =====================================================================
 * Partner portal: trips, payouts and ratings
 * ===================================================================== */

/** Everything a partner sees about their own businesses. Never includes other partners' data. */
function partnerDashboard_(b) {
  const user = requireUser_(b.token);
  const listings = readTable_('Partners').filter(p => p.Email === user.Email);
  const ids = listings.map(p => p.ID);
  const jobs = readTable_('Jobs').filter(j => ids.indexOf(j.PartnerID) !== -1);
  const ratings = readTable_('Ratings').filter(r => ids.indexOf(r.PartnerID) !== -1 && r.Status !== 'Hidden');
  const names = {}; listings.forEach(p => { names[p.ID] = p.BusinessName; });

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ month: Utilities.formatDate(d, 'Africa/Johannesburg', 'yyyy-MM'), trips: 0, payout: 0 }); }
  jobs.forEach(j => {
    const key = Utilities.formatDate(new Date(j.Date), 'Africa/Johannesburg', 'yyyy-MM');
    const m = months.find(x => x.month === key); if (m) { m.trips++; m.payout += num_(j.Payout); }
  });

  const stars = [0, 0, 0, 0, 0];
  ratings.forEach(r => { const s = Math.min(5, Math.max(1, num_(r.Stars))); stars[s - 1]++; });
  const avg = ratings.length ? ratings.reduce((s, r) => s + num_(r.Stars), 0) / ratings.length : 0;

  return {
    listings: listings.map(p => {
      const pj = jobs.filter(j => j.PartnerID === p.ID), pr = ratings.filter(r => r.PartnerID === p.ID);
      const v = applicationView_(p, false);
      v.trips = pj.length; v.earned = pj.reduce((s, j) => s + num_(j.Payout), 0);
      v.rating = pr.length ? Math.round(pr.reduce((s, r) => s + num_(r.Stars), 0) / pr.length * 10) / 10 : 0; v.ratingCount = pr.length;
      return v;
    }),
    totals: {
      trips: jobs.length,
      guests: jobs.reduce((s, j) => s + num_(j.Guests), 0),
      gross: jobs.reduce((s, j) => s + num_(j.Gross), 0),
      paid: jobs.filter(j => j.PayoutStatus === 'Paid').reduce((s, j) => s + num_(j.Payout), 0),
      pending: jobs.filter(j => j.PayoutStatus !== 'Paid').reduce((s, j) => s + num_(j.Payout), 0),
      rating: Math.round(avg * 10) / 10, ratingCount: ratings.length,
    },
    months,
    stars,
    jobs: jobs.map(j => jobView_(j, names)).reverse(),
    ratings: ratings.map(r => ({ created: iso_(r.Created), partnerId: r.PartnerID, business: names[r.PartnerID] || '', guest: r.GuestName, stars: num_(r.Stars), comment: r.Comment })).reverse(),
  };
}

function jobView_(j, names) {
  return {
    id: j.JobID, date: iso_(j.Date), partnerId: j.PartnerID, business: names ? names[j.PartnerID] || '' : '', bookingRef: j.BookingRef, service: j.Service,
    guests: num_(j.Guests), gross: num_(j.Gross), commissionPct: num_(j.CommissionPct), payout: num_(j.Payout), payoutStatus: j.PayoutStatus || 'Pending', paidOn: iso_(j.PaidOn), notes: j.Notes,
  };
}

function listJobs_(b) {
  requirePerm_(b.token, 'payouts.view');
  const names = {}; readTable_('Partners').forEach(p => { names[p.ID] = p.BusinessName; });
  return readTable_('Jobs').map(j => jobView_(j, names)).reverse();
}

/** Record a trip/job done by a partner. Payout = gross minus KCM commission. */
function saveJob_(b) {
  const actor = requirePerm_(b.token, 'payouts.manage');
  const j = b.job || {};
  const partner = findApplication_(j.partnerId);
  if (!partner || partner.row.Status !== 'Approved') throw userError_('Choose an approved partner.');
  const gross = num_(j.gross), pct = Math.min(100, Math.max(0, num_(j.commissionPct === undefined ? 15 : j.commissionPct)));
  if (gross <= 0) throw userError_('Enter the trip value.');
  const date = j.date ? new Date(j.date) : new Date();
  if (isNaN(date.getTime())) throw userError_('Invalid date.');
  const payout = Math.round(gross * (1 - pct / 100));
  const id = 'J-' + Utilities.formatDate(new Date(), 'Africa/Johannesburg', 'yyMM') + '-' + randomCode_(4);
  withLock_(() => sheet_('Jobs').appendRow([id, date, partner.row.ID, safe_(j.bookingRef, 30), safe_(j.service, 120), num_(j.guests), gross, pct, payout, 'Pending', '', safe_(j.notes, 300), actor.Email]));
  log_(actor.Email, 'trip_recorded', id, partner.row.BusinessName + ' · R' + gross);
  return { id, payout };
}

function setPayoutStatus_(b) {
  const actor = requirePerm_(b.token, 'payouts.manage');
  if (PAYOUT_STATUSES.indexOf(b.status) === -1) throw userError_('Invalid payout status.');
  let job = null;
  withLock_(() => {
    const sh = sheet_('Jobs');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === b.id);
    if (idx > 0) {
      sh.getRange(idx + 1, TABS.Jobs.indexOf('PayoutStatus') + 1).setValue(b.status);
      sh.getRange(idx + 1, TABS.Jobs.indexOf('PaidOn') + 1).setValue(b.status === 'Paid' ? new Date() : '');
      job = rowToObj_(TABS.Jobs, rows[idx]);
    }
  });
  if (!job) throw userError_('Trip not found.');
  log_(actor.Email, 'payout_' + String(b.status).toLowerCase().replace(/\s/g, '_'), b.id, 'R' + job.Payout);
  if (b.status === 'Paid') {
    const p = findApplication_(job.PartnerID);
    if (p) sendMail_(p.row.Email, `Payout sent: R${zar_(num_(job.Payout))} (${job.JobID})`,
      `<p>Hi ${esc_(p.row.ContactName)},</p><p>We've paid <strong>R${zar_(num_(job.Payout))}</strong> for ${esc_(job.Service || 'your trip')} (${job.JobID}${job.BookingRef ? ', booking ' + esc_(job.BookingRef) : ''}).</p>${siteLink_('/account#payouts', 'View your statement')}`);
  }
  return { status: b.status };
}

/** Public: what the rating page needs to show (no personal data). */
function ratingInfo_(b) {
  const p = findApplication_(String(b.partnerId || ''));
  if (!p || p.row.Status !== 'Approved') throw userError_('This rating link is not valid.');
  const job = readTable_('Jobs').find(j => j.PartnerID === p.row.ID && j.BookingRef === b.bookingRef);
  if (!job) throw userError_('This rating link is not valid.');
  const done = readTable_('Ratings').some(r => r.PartnerID === p.row.ID && r.BookingRef === b.bookingRef);
  return { business: p.row.BusinessName, type: (PARTNER_TYPES[p.row.PartnerType] || {}).label || '', service: job.Service, alreadyRated: done };
}

/** Public: a guest rates a partner after a trip. One rating per booking per partner. */
function submitRating_(b) {
  if (b.website) return { saved: true };
  publicRateLimit_();
  const info = ratingInfo_(b);
  if (info.alreadyRated) throw userError_('Thank you, a rating has already been received for this trip.');
  const stars = Math.round(num_(b.stars));
  if (stars < 1 || stars > 5) throw userError_('Please choose 1 to 5 stars.');
  withLock_(() => sheet_('Ratings').appendRow(['R-' + randomCode_(6), new Date(), b.partnerId, safe_(b.bookingRef, 30), safe_(b.name || 'Guest', 60), stars, safe_(b.comment, 800), 'Published']));
  log_(String(b.name || 'Guest'), 'rating', b.partnerId, stars + ' stars');
  return { saved: true };
}

function listRatings_(b) {
  requireAnyPerm_(b.token, ['partners.view', 'ratings.moderate']);
  const names = {}; readTable_('Partners').forEach(p => { names[p.ID] = p.BusinessName; });
  return readTable_('Ratings').map(r => ({ id: r.ID, created: iso_(r.Created), partnerId: r.PartnerID, business: names[r.PartnerID] || r.PartnerID, bookingRef: r.BookingRef, guest: r.GuestName, stars: num_(r.Stars), comment: r.Comment, status: r.Status })).reverse();
}

function setRatingStatus_(b) {
  const actor = requirePerm_(b.token, 'ratings.moderate');
  if (['Published', 'Hidden'].indexOf(b.status) === -1) throw userError_('Invalid status.');
  let ok = false;
  withLock_(() => {
    const sh = sheet_('Ratings');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === b.id);
    if (idx > 0) { sh.getRange(idx + 1, TABS.Ratings.indexOf('Status') + 1).setValue(b.status); ok = true; }
  });
  if (!ok) throw userError_('Rating not found.');
  log_(actor.Email, 'rating_' + b.status.toLowerCase(), b.id, '');
  return { status: b.status };
}

/* =====================================================================
 * Helpers
 * ===================================================================== */

function applicationView_(p, full) {
  let details = {};
  try { details = JSON.parse(p.Details || '{}'); } catch (e) { /* ignore */ }
  const v = {
    id: p.ID, created: iso_(p.Created), updated: iso_(p.Updated), email: p.Email, contactName: p.ContactName, phone: p.Phone,
    businessName: p.BusinessName, partnerType: p.PartnerType, partnerTypeLabel: (PARTNER_TYPES[p.PartnerType] || {}).label || p.PartnerType,
    province: p.Province, city: p.City, services: p.Services, summary: p.Summary, status: p.Status, photoCount: Number(p.PhotoCount || 0),
    reviewedBy: p.ReviewedBy, reviewedAt: iso_(p.ReviewedAt), reviewNote: p.ReviewNote, tier: p.Tier || '',
    required: (PARTNER_TYPES[p.PartnerType] || {}).required || [],
    requiredDocuments: (PARTNER_TYPES[p.PartnerType] || {}).documents || [],
  };
  if (full) Object.assign(v, { description: p.Description, regNumber: p.RegNumber, website: p.Website, social: p.Social, years: p.YearsInBusiness, details });
  return v;
}

function summary_(type, d) {
  const parts = {
    vehicle: [d.make, d.model, d.year, d.seats ? d.seats + ' seats' : '', d.transmission, d.colour],
    accommodation: [d.propertyType, d.rooms ? d.rooms + ' rooms' : '', d.sleeps ? 'sleeps ' + d.sleeps : '', d.grading, d.rateFrom ? 'from R' + d.rateFrom : ''],
    tour_operator: [d.fleetSize ? d.fleetSize + ' vehicles' : '', d.tourTypes, d.satsa ? 'SATSA ' + d.satsa : ''],
    guide: [d.guideLevel, d.languages, d.regions],
    activity: [d.activityType, d.capacity ? 'up to ' + d.capacity + ' people' : '', d.priceFrom ? 'from R' + d.priceFrom : ''],
    other: [d.serviceType],
  }[type] || [];
  return parts.filter(Boolean).join(' · ');
}

function sanitizeDetails_(d) {
  const out = {};
  Object.keys(d).slice(0, 40).forEach(k => {
    if (!/^[a-zA-Z]{1,30}$/.test(k)) return;
    const v = d[k];
    out[k] = Array.isArray(v) ? v.slice(0, 20).map(x => safe_(x, 80)) : safe_(v, 300);
  });
  return out;
}

function findApplication_(id) {
  const sh = sheet_('Partners');
  const rows = sh.getDataRange().getValues();
  const idx = rows.findIndex((r, i) => i > 0 && r[0] === id);
  return idx > 0 ? { index: idx + 1, row: rowToObj_(TABS.Partners, rows[idx]) } : null;
}

function setApplicationFields_(rowIndex, fields) {
  withLock_(() => {
    const sh = sheet_('Partners');
    Object.keys(fields).forEach(k => sh.getRange(rowIndex, TABS.Partners.indexOf(k) + 1).setValue(fields[k]));
  });
}

function photosFor_(partnerId) {
  return readTable_('Photos').filter(p => p.PartnerID === partnerId);
}

function partnersFolder_() {
  const id = prop_('PARTNER_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* recreate below */ } }
  const folder = DriveApp.createFolder('KCM Partner Uploads (private)');
  PropertiesService.getScriptProperties().setProperty('PARTNER_FOLDER_ID', folder.getId());
  return folder;
}

function staffEmails_(roles) {
  return readTable_('Users').filter(u => roles.indexOf(roleOf_(u)) !== -1 && u.Status !== 'disabled' && !/\.test$/.test(u.Email)).map(u => u.Email);
}

/** Checks the file's real signature (magic bytes), not just the type the browser claims. */
function fileMatchesType_(bytes, mime) {
  const b = i => bytes[i] & 255;
  if (mime === 'image/jpeg') return b(0) === 0xFF && b(1) === 0xD8 && b(2) === 0xFF;
  if (mime === 'image/png') return b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4E && b(3) === 0x47;
  if (mime === 'image/webp') return b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 && b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50;
  if (mime === 'application/pdf') return b(0) === 0x25 && b(1) === 0x50 && b(2) === 0x44 && b(3) === 0x46;
  return false;
}

function publicRateLimit_() {
  if (typeof DEMO_MODE_ !== 'undefined' && DEMO_MODE_) return;
  const cache = CacheService.getScriptCache();
  const key = 'public-rate:' + Math.floor(Date.now() / 60000);
  const n = Number(cache.get(key) || 0);
  if (n >= 30) throw userError_('We are receiving a lot of requests. Please try again in a minute or message us on WhatsApp.');
  cache.put(key, String(n + 1), 120);
}

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, TABS[name].length).setValues([TABS[name]]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function readTable_(name) {
  const values = sheet_(name).getDataRange().getValues();
  const headers = TABS[name];
  return values.slice(1).filter(r => r[0] !== '').map(r => rowToObj_(headers, r));
}

function rowToObj_(headers, row) {
  const o = {};
  headers.forEach((h, i) => { o[h] = row[i] === undefined ? '' : row[i]; });
  return o;
}

function deleteRowsWhere_(sh, pred) {
  const rows = sh.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) if (pred(rows[i])) sh.deleteRow(i + 1);
}

/** One script-wide lock serialises every write (Sheets has no transactions). Re-entrant within one request. */
let LOCK_DEPTH = 0;
function withLock_(fn) {
  if (LOCK_DEPTH > 0) { LOCK_DEPTH++; try { return fn(); } finally { LOCK_DEPTH--; } }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  LOCK_DEPTH = 1;
  try { return fn(); } finally { LOCK_DEPTH = 0; lock.releaseLock(); }
}

/** Append-only audit trail. There is no API to edit or delete Activity rows. */
function log_(actor, action, target, details) {
  try { sheet_('Activity').appendRow([new Date(), safe_(actor), action, safe_(target), safe_(details, 2000)]); } catch (e) { console.error(e); }
}

function sendMail_(to, subject, html) {
  if (typeof DEMO_MODE_ !== 'undefined' && DEMO_MODE_) return; // demo data: never email anyone
  try {
    MailApp.sendEmail({
      to, subject, name: APP.name,
      htmlBody: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0e1512;max-width:560px">${html}
        <hr style="border:0;border-top:1px solid #ddd;margin:24px 0"><p style="font-size:12px;color:#666">${APP.name} · Mbombela, Mpumalanga · 076 436 0010</p></div>`,
    });
  } catch (e) { console.error('Mail failed', to, e); }
}

function activateUser_(email) {
  withLock_(() => {
    const sh = sheet_('Users');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === email);
    if (idx > 0 && rows[idx][3] === 'pending') sh.getRange(idx + 1, 4).setValue('active');
  });
}

function siteUrl_(path) {
  return String(prop_('SITE_URL') || 'https://mathonsimm.github.io/KCMTravel-Tours').replace(/\/$/, '') + path;
}

/**
 * WhatsApp alerts to the KCM team. Pilot provider: CallMeBot (free). Each number that should get alerts sends
 * "I allow callmebot to send me messages" to CallMeBot once, gets an API key, then is added in the Sheet menu
 * (KCM → WhatsApp alerts). Stored in Script Properties as WHATSAPP_ALERTS = [{"phone":"2776…","apikey":"…"}].
 * Never throws: an alert failing must not block a booking or application (the email alerts still go out).
 */
function whatsapp_(text) {
  if (typeof DEMO_MODE_ !== 'undefined' && DEMO_MODE_) return 0;
  let list = [];
  try { list = JSON.parse(prop_('WHATSAPP_ALERTS') || '[]'); } catch (e) { list = []; }
  if (!list.length) return 0;
  const requests = list.map(x => ({
    url: 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(x.phone) + '&text=' + encodeURIComponent(String(text).slice(0, 1500)) + '&apikey=' + encodeURIComponent(x.apikey),
    muteHttpExceptions: true,
  }));
  try {
    const res = UrlFetchApp.fetchAll(requests);
    res.forEach((r, i) => { if (r.getResponseCode() !== 200) console.error('WhatsApp alert failed', list[i].phone, r.getResponseCode(), r.getContentText().slice(0, 200)); });
    return res.filter(r => r.getResponseCode() === 200).length;
  } catch (e) { console.error('WhatsApp alert failed', e); return 0; }
}

function siteLink_(path, label) {
  const base = String(prop_('SITE_URL') || '').replace(/\/$/, '');
  return base ? `<p><a href="${base}${path}" style="display:inline-block;background:#a8481f;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">${label}</a></p>` : '';
}

function prop_(key) { return PropertiesService.getScriptProperties().getProperty(key); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function hash_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s).map(b => ('0' + (b & 255).toString(16)).slice(-2)).join(''); }
function randomCode_(n) { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < n; i++) s += c[randomInt_(c.length)]; return s; }
function iso_(v) { if (!v) return ''; const d = v instanceof Date ? v : new Date(v); return isNaN(d.getTime()) ? '' : d.toISOString(); }
function num_(v) { const n = Number(v); return isFinite(n) ? n : 0; }
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function userError_(message, code) { const e = new Error(message); e.userMessage = message; e.code = code || 'user'; return e; }

function cleanEmail_(v) {
  const email = String(v || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) throw userError_('Please enter a valid email address.');
  return email;
}

/** Cleans text for the sheet: trims, limits length and stops spreadsheet formula injection. */
/** 12 345 or 6 727.50 (no currency sign): one format for emails, alerts and messages. */
function zar_(n) {
  const v = Math.round((Number(n) || 0) * 100) / 100, parts = Math.abs(v).toFixed(2).split('.');
  return (v < 0 ? '-' : '') + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (parts[1] !== '00' ? '.' + parts[1] : '');
}

function safe_(v, max) {
  let s = String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max || 200);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

/* =====================================================================
 * Setup & sheet menu
 * ===================================================================== */

/** Run once from the Apps Script editor (Run ▶ setup). Creates the tabs, the private photo folder and makes you the owner. */
/**
 * Built-in TEST admin so the dashboard can be tried before real admins are invited.
 * Email: admin@kcm.test (password shared with the owner privately). Remove it before going live:
 * Sheet menu KCM → Remove test admin (or disable it in the dashboard under Users & access).
 */
const TEST_ADMIN = { email: 'admin@kcm.test', name: 'Test Admin', salt: 'argon2id-np', hash: '$argon2id$v=19$m=19456,t=2,p=1$AT5zVv7vHoW/6Q6sQ1nCPg$JzSaFKqceqkfit+IkMB/XdFP7/lUVaOhOnyJJVjrLf0' };
function ensureTestAdmin_() {
  if (prop_('TEST_ADMIN_REMOVED') === '1') return;
  withLock_(() => {
    const sh = sheet_('Users');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === TEST_ADMIN.email);
    const row = [TEST_ADMIN.email, TEST_ADMIN.name, 'ADMIN', 'active', 'test', '', new Date(), '', 'setup', TEST_ADMIN.hash, TEST_ADMIN.salt];
    if (idx > 0) sh.getRange(idx + 1, 1, 1, row.length).setValues([[row[0], row[1], row[2], rows[idx][3] === 'disabled' ? 'disabled' : 'active', row[4], row[5], rows[idx][6] || row[6], rows[idx][7], row[8], row[9], row[10]]]);
    else sh.appendRow(row);
  });
}
function menuRemoveTestAdmin_() {
  PropertiesService.getScriptProperties().setProperty('TEST_ADMIN_REMOVED', '1');
  withLock_(() => {
    const sh = sheet_('Users');
    const rows = sh.getDataRange().getValues();
    const idx = rows.findIndex((r, i) => i > 0 && r[0] === TEST_ADMIN.email);
    if (idx > 0) sh.deleteRow(idx + 1);
  });
  SpreadsheetApp.getUi().alert('The test admin (admin@kcm.test) has been removed.');
}

function setup() {
  Object.keys(TABS).forEach(name => {
    const sh = sheet_(name);
    const header = sh.getRange(1, 1, 1, TABS[name].length);
    header.setValues([TABS[name]]).setFontWeight('bold').setBackground('#0e1512').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  });
  const props = PropertiesService.getScriptProperties();
  const me = Session.getEffectiveUser().getEmail().toLowerCase();
  if (!props.getProperty('OWNER_EMAIL')) props.setProperty('OWNER_EMAIL', me);
  if (!props.getProperty('SITE_URL')) props.setProperty('SITE_URL', 'https://mathonsimm.github.io/KCMTravel-Tours');
  partnersFolder_();
  pepper_();
  dataKey_();
  ensureTestAdmin_();
  if (typeof opsSetup_ === 'function') opsSetup_();
  upsertUser_(props.getProperty('OWNER_EMAIL'), { provider: 'owner' });
  // hide technical tabs
  ['Sessions', 'Codes'].forEach(n => sheet_(n).hideSheet());
  log_(me, 'setup', SpreadsheetApp.getActiveSpreadsheet().getName(), 'v' + APP.version);
  MailApp.getRemainingDailyQuota(); // triggers the email permission prompt during setup
  return 'Setup complete. Owner: ' + props.getProperty('OWNER_EMAIL');
}

function menuWhatsApp_() {
  const ui = SpreadsheetApp.getUi();
  let list = [];
  try { list = JSON.parse(prop_('WHATSAPP_ALERTS') || '[]'); } catch (e) { list = []; }
  const current = list.length ? list.map(x => x.phone).join(', ') : 'none yet';
  const r = ui.prompt('WhatsApp alerts',
    'Numbers getting alerts now: ' + current + '\n\nTo add a number: from that phone, WhatsApp the text\n"I allow callmebot to send me messages" to +34 644 71 81 99.\nYou\'ll get an API key back. Then enter here:  number, apikey\n(e.g. 27764360010, 1234567)\n\nType "clear" to remove all numbers.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const v = r.getResponseText().trim();
  if (v.toLowerCase() === 'clear') { PropertiesService.getScriptProperties().setProperty('WHATSAPP_ALERTS', '[]'); ui.alert('All WhatsApp alert numbers removed.'); return; }
  const parts = v.split(',').map(x => x.trim());
  let phone = (parts[0] || '').replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '27' + phone.slice(1);
  if (phone.length < 10 || !parts[1]) { ui.alert('Please enter it as: number, apikey'); return; }
  list = list.filter(x => x.phone !== phone).concat([{ phone, apikey: parts[1] }]);
  PropertiesService.getScriptProperties().setProperty('WHATSAPP_ALERTS', JSON.stringify(list));
  const sent = whatsapp_('✅ KCM Travel & Tours: WhatsApp alerts are switched on for this number.');
  ui.alert(sent ? 'Saved. A test message was sent to WhatsApp.' : 'Saved, but the test message could not be sent. Check the number and API key.');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('KCM Admin')
    .addItem('Run setup', 'menuSetup_')
    .addItem('Set Google Sign-In client ID', 'menuClientId_')
    .addItem('Set website address', 'menuSiteUrl_')
    .addItem('WhatsApp alerts…', 'menuWhatsApp_')
    .addItem('Remove test admin', 'menuRemoveTestAdmin_')
    .addSeparator()
    .addItem('Create tickets from existing bookings', 'menuBackfillTickets_')
    .addItem('Rotate data-encryption key', 'menuRotateKey_')
    .addSeparator()
    .addItem('Load demo data (testing only)', 'menuLoadDemo_')
    .addItem('Remove demo data', 'menuRemoveDemo_')
    .addToUi();
}

function menuSetup_() { SpreadsheetApp.getUi().alert(setup()); }
function menuRotateKey_() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Rotate the data-encryption key?', 'Stored secrets are re-encrypted with a new key. Older key versions are kept so backups stay readable.', ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  ui.alert('Done. Now using key version ' + rotateDataKey_() + '.');
}

function menuClientId_() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Google Sign-In', 'Paste the OAuth Client ID (ends with .apps.googleusercontent.com):', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const v = r.getResponseText().trim();
  if (v && !/\.apps\.googleusercontent\.com$/.test(v)) return ui.alert('That does not look like a Google OAuth Client ID.');
  PropertiesService.getScriptProperties().setProperty('GOOGLE_CLIENT_ID', v);
  ui.alert(v ? 'Google Sign-In client ID saved.' : 'Google Sign-In switched off.');
}

function menuSiteUrl_() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Website address', 'Used for links in emails, e.g. https://mathonsimm.github.io/KCMTravel-Tours', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() === ui.Button.OK && r.getResponseText().trim()) {
    PropertiesService.getScriptProperties().setProperty('SITE_URL', r.getResponseText().trim());
    ui.alert('Saved.');
  }
}

/* ======================= Ops.gs ======================= */
/**
 * KCM OPERATIONS CENTRE: customers, tickets, lifecycle, tasks, checklists, notes, handover,
 * quotations, payments, suppliers, attachments, notifications and reporting.
 *
 * Rules enforced here (not in the browser):
 *  - every action checks a permission (PERMS in Security.gs) and, for OPERATIONS staff, that they are on the ticket;
 *  - ticket and customer references are generated here, never chosen by users;
 *  - status changes go through guards (a booking cannot be confirmed without an accepted quote and verified deposit);
 *  - operational, payment and customer-response statuses are separate; payment status is derived from verified payments;
 *  - money is calculated here; recorded payments stay UNVERIFIED until finance verifies them (not the person who recorded them);
 *  - notes, history and payments are append-only (corrections are new records); optimistic versioning stops silent overwrites.
 */

Object.assign(TABS, {
  Customers: ['CustomerRef', 'Created', 'FullName', 'Email', 'Phone', 'WhatsApp', 'AltPhone', 'PreferredComms', 'Location', 'CustomerType',
    'ConsentAt', 'ConsentSource', 'Updated', 'Status', 'PhoneKey', 'CreatedBy'],
  Tickets: ['Ref', 'CustomerRef', 'Created', 'Received', 'Source', 'EnquiryType', 'OpStatus', 'PaymentStatus', 'ResponseStatus', 'Priority',
    'AssignedTo', 'SupportBy', 'CreatedBy', 'Updated', 'UpdatedBy', 'NextAction', 'NextActionDue', 'Description', 'Destination', 'Package',
    'PackageSlug', 'CustomTrip', 'DepartDate', 'ReturnDate', 'Nights', 'Adults', 'Children', 'Infants', 'Pensioners', 'Accommodation', 'Rooms',
    'Transport', 'Activities', 'AirportTransfer', 'CarHire', 'Insurance', 'Meals', 'SpecialRequests', 'Accessibility', 'Budget', 'PaymentPref',
    'IntakeNotes', 'CommsNotes', 'Outstanding', 'FollowUp', 'Deadline', 'WebsiteEstimate', 'LegacyRef', 'Template', 'Version', 'LastActivity',
    'ConfirmedAt', 'ClosedAt', 'HandoverSummary', 'Destinations'],
  Tasks: ['TaskID', 'TicketRef', 'Title', 'Description', 'AssignedTo', 'Priority', 'Due', 'Status', 'CreatedBy', 'Created', 'CompletedAt',
    'CompletedBy', 'CompletionNotes', 'Source', 'Updated'],
  ChecklistTemplates: ['TemplateID', 'Name', 'AppliesTo', 'Items', 'Active', 'Updated', 'UpdatedBy'],
  Checklist: ['ItemID', 'TicketRef', 'Section', 'Label', 'Ord', 'Done', 'AssignedTo', 'DoneAt', 'DoneBy', 'Notes', 'Applicable'],
  Notes: ['NoteID', 'TicketRef', 'Created', 'Author', 'Kind', 'Channel', 'Content', 'TaskID', 'Attachment'],
  Quotes: ['QuoteID', 'TicketRef', 'Version', 'Status', 'Lines', 'CostTotal', 'SellingPrice', 'Discount', 'VatMode', 'VatAmount', 'FinalAmount',
    'DepositPct', 'DepositAmount', 'ValidUntil', 'PreparedBy', 'PreparedAt', 'ApprovedBy', 'ApprovedAt', 'SentAt', 'SentBy', 'AcceptedAt',
    'DeclinedAt', 'RecordedBy', 'Notes', 'Margin'],
  Payments: ['PaymentID', 'TicketRef', 'QuoteID', 'Type', 'Amount', 'Method', 'Reference', 'PaidOn', 'RecordedBy', 'RecordedAt', 'Verification',
    'VerifiedBy', 'VerifiedAt', 'VerificationSource', 'Notes', 'IdempotencyKey', 'ApprovalStatus', 'ApprovedBy', 'ApprovedAt', 'VoidReason'],
  Suppliers: ['SupplierID', 'Name', 'Type', 'ContactName', 'Phone', 'Email', 'PartnerID', 'Notes', 'Created', 'CreatedBy', 'Active'],
  SupplierQuotes: ['SQID', 'TicketRef', 'SupplierID', 'SupplierName', 'Service', 'Amount', 'ValidUntil', 'Status', 'Notes', 'RecordedBy', 'RecordedAt'],
  Attachments: ['FileID', 'TicketRef', 'LinkKind', 'LinkID', 'Name', 'Mime', 'Size', 'DriveID', 'UploadedBy', 'UploadedAt'],
  Notifications: ['NotifID', 'Created', 'UserEmail', 'Type', 'TicketRef', 'Message', 'ReadAt', 'DedupKey'],
  OpsSettings: ['Key', 'Value', 'Updated', 'UpdatedBy'],
});

const OP_STATUSES = ['NEW ENQUIRY', 'AWAITING REVIEW', 'UNASSIGNED', 'ASSIGNED', 'REQUIREMENTS UNDER REVIEW', 'SUPPLIER RESEARCH',
  'QUOTATION IN PREPARATION', 'QUOTATION SENT', 'AWAITING CUSTOMER RESPONSE', 'ACCEPTED BY CUSTOMER', 'AWAITING DEPOSIT', 'PAYMENT VERIFICATION',
  'SUPPLIER CONFIRMATION', 'BOOKING CONFIRMED', 'TRIP PREPARATION', 'IN PROGRESS / TRAVELLING', 'COMPLETED', 'CANCELLED', 'LOST / DECLINED', 'ON HOLD'];
const CLOSED_STATUSES = ['COMPLETED', 'CANCELLED', 'LOST / DECLINED'];
const CONFIRMED_INDEX = OP_STATUSES.indexOf('BOOKING CONFIRMED');
const PAYMENT_STATUSES_DERIVED = ['Not invoiced', 'Awaiting payment', 'Deposit pending', 'Deposit received', 'Partially paid', 'Fully paid', 'Overdue', 'Refund pending', 'Refunded'];
const RESPONSE_STATUSES = ['', 'Awaiting response', 'Interested', 'Accepted', 'Declined', 'No response'];
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const SOURCES = ['Kaycee AI', 'WhatsApp', 'Website booking form', 'Direct phone call', 'Email', 'Walk-in customer', 'Social media', 'Referral', 'Other'];
const ENQUIRY_TYPES = ['Package tour', 'Day tour', 'Custom trip', 'Accommodation only', 'Transfer / transport', 'Group or school trip', 'Corporate travel', 'General enquiry'];
const CUSTOMER_TYPES = ['Individual', 'Family', 'Group', 'School', 'Church', 'Corporate', 'Other'];
const COMMS = ['WhatsApp', 'Phone call', 'Email', 'SMS'];
const TASK_STATUSES = ['NOT STARTED', 'IN PROGRESS', 'WAITING', 'COMPLETED', 'CANCELLED'];
const NOTE_KINDS = ['internal', 'customer', 'supplier', 'handover', 'decision', 'problem'];
const PAYMENT_TYPES = ['deposit', 'instalment', 'balance', 'refund'];
const PAYMENT_METHODS = ['EFT', 'Card', 'Cash', 'SnapScan / Zapper', 'Payment gateway', 'Other'];
const VAT_RATE = 0.15;
const QUOTE_CATEGORIES = ['Accommodation', 'Transport', 'Activities', 'Additional services', 'Other'];
const TEMPLATE_BY_TYPE = { 'Package tour': 'full', 'Day tour': 'day', 'Custom trip': 'full', 'Accommodation only': 'accommodation',
  'Transfer / transport': 'transfer', 'Group or school trip': 'full', 'Corporate travel': 'full', 'General enquiry': 'general' };

const DEFAULT_CHECKLIST = {
  'Customer requirements': ['Customer details verified', 'Travel dates confirmed', 'Number of travellers confirmed', 'Special requirements reviewed', 'Budget established'],
  'Destination and activities': ['Destination researched', 'Attractions identified', 'Activities confirmed', 'Park or conservation requirements checked', 'Itinerary prepared'],
  Accommodation: ['Accommodation options researched', 'Availability checked', 'Supplier contacted', 'Supplier quotation received', 'Accommodation confirmed'],
  Transport: ['Transport requirements reviewed', 'Vehicle or transport option identified', 'Transport supplier contacted', 'Transport quotation received', 'Transport confirmed'],
  Quotation: ['Supplier costs compiled', 'Selling price calculated', 'VAT reviewed', 'Deposit calculated', 'Final quotation prepared', 'Quotation sent', 'Customer response recorded'],
  Payment: ['Invoice prepared', 'Payment instructions sent', 'Deposit received', 'Payment verified', 'Balance calculated', 'Final payment verified'],
  'Final confirmation': ['All suppliers confirmed', 'Customer confirmation sent', 'Booking reference issued', 'Travel itinerary prepared', 'Customer travel information sent', 'Trip coordination completed'],
};
const DEFAULT_TEMPLATES = [
  { id: 'full', name: 'Package with accommodation', appliesTo: ['Package tour', 'Custom trip', 'Group or school trip', 'Corporate travel'], sections: Object.keys(DEFAULT_CHECKLIST) },
  { id: 'day', name: 'Day tour (no accommodation)', appliesTo: ['Day tour'], sections: ['Customer requirements', 'Destination and activities', 'Transport', 'Quotation', 'Payment', 'Final confirmation'] },
  { id: 'transfer', name: 'Transfer / transport only', appliesTo: ['Transfer / transport'], sections: ['Customer requirements', 'Transport', 'Quotation', 'Payment', 'Final confirmation'] },
  { id: 'accommodation', name: 'Accommodation only', appliesTo: ['Accommodation only'], sections: ['Customer requirements', 'Accommodation', 'Quotation', 'Payment', 'Final confirmation'] },
  { id: 'general', name: 'General enquiry', appliesTo: ['General enquiry'], sections: ['Customer requirements'] },
];

Object.assign(ACTIONS, {
  opsConfig: opsConfig_,
  opsOverview: opsOverview_,
  myWorkspace: myWorkspace_,
  listTickets: listTickets_,
  getTicket: getTicket_,
  createTicket: createTicket_,
  updateTicket: updateTicket_,
  setTicketStatus: setTicketStatus_,
  setResponseStatus: setResponseStatus_,
  assignTicket: assignTicket_,
  addNote: addNote_,
  createTask: createTask_,
  updateTask: updateTask_,
  listTasks: listTasks_,
  updateChecklistItem: updateChecklistItem_,
  addChecklistItem: addChecklistItem_,
  applyChecklistTemplate: applyChecklistTemplate_,
  listTemplates: listTemplates_,
  saveTemplate: saveTemplate_,
  saveQuote: saveQuote_,
  quoteAction: quoteAction_,
  listQuotes: listQuotes_,
  recordPayment: recordPayment_,
  verifyPayment: verifyPayment_,
  approveRefund: approveRefund_,
  voidPayment: voidPayment_,
  listPayments: listPayments_,
  listSuppliers: listSuppliers_,
  saveSupplier: saveSupplier_,
  addSupplierQuote: addSupplierQuote_,
  updateSupplierQuote: updateSupplierQuote_,
  uploadTicketFile: uploadTicketFile_,
  getTicketFile: getTicketFile_,
  listCustomers: listCustomers_,
  getCustomer: getCustomer_,
  updateCustomer: updateCustomer_,
  eraseCustomer: eraseCustomer_,
  listNotifications: listNotifications_,
  markNotificationsRead: markNotificationsRead_,
  workload: workload_,
  saveCustomStatus: saveCustomStatus_,
});

/* =====================================================================
 * Generic table helpers
 * ===================================================================== */

function findRow_(name, id) {
  const rows = sheet_(name).getDataRange().getValues();
  const idx = rows.findIndex((r, i) => i > 0 && r[0] === id);
  return idx > 0 ? { index: idx + 1, row: rowToObj_(TABS[name], rows[idx]) } : null;
}
function writeRow_(name, rowIndex, obj) {
  sheet_(name).getRange(rowIndex, 1, 1, TABS[name].length).setValues([TABS[name].map(h => (obj[h] === undefined || obj[h] === null ? '' : obj[h]))]);
}
function appendObj_(name, obj) {
  sheet_(name).appendRow(TABS[name].map(h => (obj[h] === undefined || obj[h] === null ? '' : obj[h])));
}
function nextSeq_(key) {
  return withLock_(() => {
    const props = PropertiesService.getScriptProperties();
    const n = Number(props.getProperty(key) || 0) + 1;
    props.setProperty(key, String(n));
    return n;
  });
}
function newTicketRef_() { const y = Utilities.formatDate(new Date(), 'Africa/Johannesburg', 'yyyy'); return 'KCM-' + y + '-' + String(nextSeq_('SEQ_TICKET_' + y)).padStart(6, '0'); }
function newCustomerRef_() { return 'CUS-' + String(nextSeq_('SEQ_CUSTOMER')).padStart(6, '0'); }
function newId_(prefix) { return prefix + '-' + Utilities.formatDate(new Date(), 'Africa/Johannesburg', 'yyMMdd') + '-' + randomCode_(6); }

function dateOrBlank_(v, label) {
  if (v === '' || v === null || v === undefined) return '';
  const s = String(v);
  // date-only values are stored at 12:00 UTC: the same calendar day in every timezone from UTC-11 to UTC+11 (no drift)
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T12:00:00Z') : new Date(s);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000 || d.getFullYear() > 2100) throw userError_('Please check the date' + (label ? ' for ' + label : '') + '.');
  return d;
}
function money_(v, label) {
  if (v === '' || v === null || v === undefined) return 0;
  const n = Number(v);
  if (!isFinite(n) || n < 0 || n > 50000000) throw userError_('Please check the amount' + (label ? ' for ' + label : '') + '.');
  return Math.round(n * 100) / 100;
}
function count_(v, max) { const n = Math.floor(Number(v) || 0); return Math.max(0, Math.min(max || 500, n)); }
function oneOf_(v, list, fallback) { return list.indexOf(v) !== -1 ? v : fallback; }
function phoneKey_(p) { let d = String(p || '').replace(/\D/g, ''); if (d.indexOf('0') === 0 && d.length === 10) d = '27' + d.slice(1); return d.length >= 9 ? d : ''; }
function day_(d) { return d ? new Date(d).getTime() : 0; }
/** A date-only deadline (stored 12:00 UTC) counts as passed once that whole day is over in South Africa. */
function pastDue_(d) { return !!d && day_(d) + 10 * 3600000 < Date.now(); }
function audit_(actor, ref, action, details) { log_(actor, action, ref, typeof details === 'string' ? details : JSON.stringify(details)); }

/* =====================================================================
 * Access to a ticket
 * ===================================================================== */

function involved_(user, t) {
  const me = user.Email;
  return t.AssignedTo === me || t.CreatedBy === me || String(t.SupportBy || '').split(',').map(s => s.trim()).indexOf(me) !== -1;
}
function canSeeTicket_(user, t) { return can_(user, 'ops.view.all') || (can_(user, 'ops.edit.own') && involved_(user, t)); }
function canEditTicket_(user, t) { return can_(user, 'ops.edit.any') || (can_(user, 'ops.edit.own') && involved_(user, t)); }
/** Loads a ticket the user may see; a ticket the user may not see looks exactly like one that doesn't exist (no IDOR hints). */
function loadTicket_(user, ref, needEdit) {
  const f = findRow_('Tickets', String(ref || ''));
  if (!f || !canSeeTicket_(user, f.row)) throw userError_('Ticket not found.', 'notfound');
  if (needEdit && !canEditTicket_(user, f.row)) throw userError_('You can view this ticket but not change it.', 'forbidden');
  return f;
}
function requireOpsUser_(token) {
  const user = requireUser_(token);
  if (!can_(user, 'ops.view.all') && !can_(user, 'ops.edit.own')) throw userError_('You do not have access to this.', 'forbidden');
  return user;
}
function touchTicket_(f, actor, extra) {
  const t = Object.assign({}, f.row, extra || {});
  t.Updated = new Date(); t.UpdatedBy = actor.Email; t.LastActivity = new Date(); t.Version = Number(f.row.Version || 0) + 1;
  writeRow_('Tickets', f.index, t);
  f.row = t;
  return t;
}
function checkVersion_(f, version) {
  if (version !== undefined && version !== null && version !== '' && Number(version) !== Number(f.row.Version || 0)) {
    throw userError_('Someone else updated this ticket a moment ago. Reload it to see their changes, then try again.', 'conflict');
  }
}

/* =====================================================================
 * Staff, notifications
 * ===================================================================== */

function staffList_() {
  return readTable_('Users').filter(u => isStaff_(u) && u.Status !== 'disabled').map(u => ({ email: u.Email, name: u.Name || u.Email, role: roleOf_(u) }));
}
function notify_(email, type, ref, message, dedupKey) {
  if (!email) return;
  if (dedupKey && readTable_('Notifications').some(n => n.DedupKey === dedupKey && n.UserEmail === email)) return;
  appendObj_('Notifications', { NotifID: newId_('N'), Created: new Date(), UserEmail: email, Type: type, TicketRef: ref || '', Message: safe_(message, 300), ReadAt: '', DedupKey: dedupKey || '' });
}
function notifyRoles_(roles, type, ref, message, dedupKey, exceptEmail) {
  staffList_().filter(s => roles.indexOf(s.role) !== -1 && s.email !== exceptEmail).forEach(s => notify_(s.email, type, ref, message, dedupKey ? dedupKey + ':' + s.email : ''));
}
function listNotifications_(b) {
  const user = requireUser_(b.token);
  const all = readTable_('Notifications').filter(n => n.UserEmail === user.Email);
  return { unread: all.filter(n => !n.ReadAt).length, items: all.slice(-60).reverse().map(n => ({ id: n.NotifID, created: iso_(n.Created), type: n.Type, ref: n.TicketRef, message: n.Message, read: !!n.ReadAt })) };
}
function markNotificationsRead_(b) {
  const user = requireUser_(b.token);
  const ids = Array.isArray(b.ids) ? b.ids.map(String) : null;
  withLock_(() => {
    const sh = sheet_('Notifications');
    const rows = sh.getDataRange().getValues();
    const col = TABS.Notifications.indexOf('ReadAt') + 1;
    rows.forEach((r, i) => { if (i > 0 && r[2] === user.Email && !r[6] && (!ids || ids.indexOf(r[0]) !== -1)) sh.getRange(i + 1, col).setValue(new Date()); });
  });
  return { ok: true };
}

/* =====================================================================
 * Config for the UI (lists, staff, statuses)
 * ===================================================================== */

function customStatuses_() {
  const s = readTable_('OpsSettings').find(x => x.Key === 'customStatuses');
  try { return s ? JSON.parse(s.Value) : []; } catch (e) { return []; }
}
function allStatuses_() { const c = customStatuses_(); return OP_STATUSES.slice(0, CONFIRMED_INDEX).concat(c, OP_STATUSES.slice(CONFIRMED_INDEX)); }

function opsConfig_(b) {
  const user = requireOpsUser_(b.token);
  return {
    statuses: allStatuses_(), closed: CLOSED_STATUSES, confirmed: 'BOOKING CONFIRMED', custom: customStatuses_(),
    paymentStatuses: PAYMENT_STATUSES_DERIVED, responseStatuses: RESPONSE_STATUSES.filter(Boolean), priorities: PRIORITIES, sources: SOURCES,
    enquiryTypes: ENQUIRY_TYPES, customerTypes: CUSTOMER_TYPES, comms: COMMS, taskStatuses: TASK_STATUSES, noteKinds: NOTE_KINDS,
    paymentTypes: PAYMENT_TYPES, paymentMethods: PAYMENT_METHODS, quoteCategories: QUOTE_CATEGORIES, vatRate: VAT_RATE,
    depositPct: Math.round(CATALOG.depositRate * 100), packages: Object.keys(CATALOG.tours).map(k => ({ slug: k, title: CATALOG.tours[k].title, nights: CATALOG.tours[k].nights })),
    staff: staffList_().filter(s => PERMS['ops.edit.own'].indexOf(s.role) !== -1), templates: templates_().map(t => ({ id: t.TemplateID, name: t.Name })),
    me: { email: user.Email, permissions: permissionsOf_(user), role: roleOf_(user) },
  };
}

function saveCustomStatus_(b) {
  const actor = requirePerm_(b.token, 'ops.statuses');
  const name = safe_(b.name, 40).toUpperCase().replace(/^'/, '');
  if (!/^[A-Z0-9 /&-]{3,40}$/.test(name)) throw userError_('Use 3–40 letters, numbers or spaces.');
  if (OP_STATUSES.indexOf(name) !== -1) throw userError_('That status already exists.');
  const list = customStatuses_();
  if (b.remove) { const i = list.indexOf(name); if (i !== -1) list.splice(i, 1); } else if (list.indexOf(name) === -1) list.push(name);
  withLock_(() => {
    const f = findRow_('OpsSettings', 'customStatuses');
    const row = { Key: 'customStatuses', Value: JSON.stringify(list), Updated: new Date(), UpdatedBy: actor.Email };
    if (f) writeRow_('OpsSettings', f.index, row); else appendObj_('OpsSettings', row);
  });
  audit_(actor.Email, 'settings', b.remove ? 'status_removed' : 'status_added', name);
  return { statuses: allStatuses_() };
}

/* =====================================================================
 * Customers (one profile, many enquiries; duplicates avoided by email / phone)
 * ===================================================================== */

function findCustomerMatch_(email, phone) {
  const e = String(email || '').toLowerCase(), pk = phoneKey_(phone);
  return readTable_('Customers').find(c => c.Status !== 'erased' && ((e && String(c.Email).toLowerCase() === e) || (pk && c.PhoneKey === pk))) || null;
}
function customerView_(c) {
  return { ref: c.CustomerRef, created: iso_(c.Created), name: c.FullName, email: c.Email, phone: c.Phone, whatsapp: c.WhatsApp, altPhone: c.AltPhone,
    preferredComms: c.PreferredComms, location: c.Location, type: c.CustomerType, consentAt: iso_(c.ConsentAt), consentSource: c.ConsentSource, status: c.Status };
}
function upsertCustomer_(d, actorEmail) {
  return withLock_(() => {
    const match = d.customerRef ? findRow_('Customers', d.customerRef) : null;
    if (d.customerRef && !match) throw userError_('Customer not found.');
    const existing = match ? match.row : findCustomerMatch_(d.email, d.phone);
    if (existing) {
      const f = match || findRow_('Customers', existing.CustomerRef);
      const c = Object.assign({}, f.row);
      // fill gaps only; never silently overwrite what the customer told us before
      [['FullName', d.name], ['Email', d.email], ['Phone', d.phone], ['WhatsApp', d.whatsapp], ['AltPhone', d.altPhone], ['PreferredComms', d.preferredComms],
        ['Location', d.location], ['CustomerType', d.type]].forEach(([k, v]) => { if (!c[k] && v) c[k] = safe_(v, 120); });
      if (!c.PhoneKey) c.PhoneKey = phoneKey_(c.Phone);
      if (d.consentSource && !c.ConsentAt) { c.ConsentAt = new Date(); c.ConsentSource = d.consentSource; }
      c.Updated = new Date();
      writeRow_('Customers', f.index, c);
      return { ref: c.CustomerRef, existing: true };
    }
    const ref = newCustomerRef_();
    appendObj_('Customers', { CustomerRef: ref, Created: new Date(), FullName: safe_(d.name, 80), Email: String(d.email || '').toLowerCase().slice(0, 120),
      Phone: safe_(d.phone, 30), WhatsApp: safe_(d.whatsapp, 30), AltPhone: safe_(d.altPhone, 30), PreferredComms: oneOf_(d.preferredComms, COMMS, ''),
      Location: safe_(d.location, 80), CustomerType: oneOf_(d.type, CUSTOMER_TYPES, 'Individual'), ConsentAt: d.consentSource ? new Date() : '',
      ConsentSource: safe_(d.consentSource, 60), Updated: new Date(), Status: 'active', PhoneKey: phoneKey_(d.phone), CreatedBy: actorEmail || 'public' });
    return { ref, existing: false };
  });
}
function listCustomers_(b) {
  requirePerm_(b.token, 'ops.intake');
  const q = String(b.q || '').toLowerCase().trim();
  if (q.length < 2) return [];
  const pk = phoneKey_(q);
  return readTable_('Customers').filter(c => c.Status !== 'erased' && (String(c.FullName).toLowerCase().indexOf(q) !== -1 || String(c.Email).toLowerCase().indexOf(q) !== -1 ||
    (pk && String(c.PhoneKey).indexOf(pk) !== -1) || c.CustomerRef.toLowerCase() === q)).slice(0, 15).map(customerView_);
}
function getCustomer_(b) {
  const user = requireOpsUser_(b.token);
  const f = findRow_('Customers', String(b.ref || ''));
  if (!f) throw userError_('Customer not found.', 'notfound');
  const tickets = readTable_('Tickets').filter(t => t.CustomerRef === f.row.CustomerRef && canSeeTicket_(user, t));
  if (!can_(user, 'ops.view.all') && !tickets.length) throw userError_('Customer not found.', 'notfound');
  return { customer: customerView_(f.row), tickets: tickets.map(t => ticketSummary_(t, null)) };
}
function updateCustomer_(b) {
  const user = requireOpsUser_(b.token);
  const f = findRow_('Customers', String(b.ref || ''));
  if (!f || f.row.Status === 'erased') throw userError_('Customer not found.', 'notfound');
  const mine = readTable_('Tickets').some(t => t.CustomerRef === f.row.CustomerRef && canEditTicket_(user, t));
  if (!can_(user, 'ops.edit.any') && !mine) throw userError_('Customer not found.', 'notfound');
  const d = b.customer || {}, c = Object.assign({}, f.row), changes = {};
  const set = (k, v) => { if (v !== undefined && String(v) !== String(c[k])) { changes[k] = [c[k], v]; c[k] = v; } };
  if (d.name !== undefined) { if (!String(d.name).trim()) throw userError_('Name cannot be empty.'); set('FullName', safe_(d.name, 80)); }
  if (d.email !== undefined) { const e = String(d.email).trim().toLowerCase(); if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) throw userError_('Please check the email address.'); set('Email', e); }
  if (d.phone !== undefined) { set('Phone', safe_(d.phone, 30)); c.PhoneKey = phoneKey_(c.Phone); }
  ['whatsapp:WhatsApp', 'altPhone:AltPhone', 'location:Location'].forEach(p => { const [k, col] = p.split(':'); if (d[k] !== undefined) set(col, safe_(d[k], 80)); });
  if (d.preferredComms !== undefined) set('PreferredComms', oneOf_(d.preferredComms, COMMS, ''));
  if (d.type !== undefined) set('CustomerType', oneOf_(d.type, CUSTOMER_TYPES, 'Individual'));
  c.Updated = new Date();
  withLock_(() => writeRow_('Customers', f.index, c));
  audit_(user.Email, c.CustomerRef, 'customer_updated', Object.keys(changes).reduce((o, k) => { o[k] = 'changed'; return o; }, {}));
  return customerView_(c);
}
/**
 * POPIA right to deletion: personal details are anonymised. Financial and booking records are kept (retention for tax/audit),
 * but no longer identify the person. Refused while the customer still has an open ticket.
 */
function eraseCustomer_(b) {
  const actor = requirePerm_(b.token, 'customers.erase');
  const f = findRow_('Customers', String(b.ref || ''));
  if (!f || f.row.Status === 'erased') throw userError_('Customer not found.');
  if (!String(b.reason || '').trim()) throw userError_('Please record why the data is being erased (e.g. customer request date).');
  const open = readTable_('Tickets').filter(t => t.CustomerRef === f.row.CustomerRef && CLOSED_STATUSES.indexOf(t.OpStatus) === -1);
  if (open.length) throw userError_('Close or cancel the customer\'s open tickets first (' + open.map(t => t.Ref).join(', ') + ').');
  const email = String(f.row.Email || '').toLowerCase(), pk = f.row.PhoneKey;
  withLock_(() => {
    writeRow_('Customers', f.index, Object.assign({}, f.row, { FullName: 'Erased customer', Email: '', Phone: '', WhatsApp: '', AltPhone: '', Location: '', PhoneKey: '', Status: 'erased', Updated: new Date() }));
    const scrub = (tab, emailCol, phoneCol, nameCol) => {
      const sh = sheet_(tab); const rows = sh.getDataRange().getValues();
      rows.forEach((r, i) => { if (i > 0 && ((email && String(r[emailCol]).toLowerCase() === email) || (pk && phoneKey_(r[phoneCol]) === pk))) { sh.getRange(i + 1, nameCol + 1).setValue('Erased'); sh.getRange(i + 1, emailCol + 1).setValue(''); sh.getRange(i + 1, phoneCol + 1).setValue(''); } });
    };
    scrub('Bookings', TABS.Bookings.indexOf('Email'), TABS.Bookings.indexOf('Phone'), TABS.Bookings.indexOf('Name'));
    scrub('Messages', TABS.Messages.indexOf('Email'), TABS.Messages.indexOf('Phone'), TABS.Messages.indexOf('Name'));
  });
  audit_(actor.Email, f.row.CustomerRef, 'customer_erased', safe_(b.reason, 300));
  return { erased: true };
}

/* =====================================================================
 * Tickets
 * ===================================================================== */

/** From the public website / Kaycee: creates (or links) the customer and a NEW ENQUIRY ticket. */
function opsCreateTicketFromPublic_(d) {
  const cust = upsertCustomer_({ name: d.customer.name, email: d.customer.email, phone: d.customer.phone, consentSource: d.customer.consentSource }, 'public');
  const type = d.dayTour ? 'Day tour' : d.package && d.package !== 'Trip enquiry' ? 'Package tour' : 'General enquiry';
  const ref = newTicketRef_();
  const t = { Ref: ref, CustomerRef: cust.ref, Created: new Date(), Received: new Date(), Source: d.source, EnquiryType: type, OpStatus: 'NEW ENQUIRY',
    PaymentStatus: 'Not invoiced', ResponseStatus: '', Priority: 'Normal', CreatedBy: d.source === 'Kaycee AI' ? 'Kaycee (website)' : 'Website', Updated: new Date(),
    Description: d.description, Destination: d.destination, Package: d.package, PackageSlug: d.packageSlug, DepartDate: d.departDate ? dateOrBlank_(d.departDate) : '',
    Nights: d.nights, Adults: d.adults, Children: d.children, Infants: d.infants, Pensioners: d.pensioners, Rooms: d.rooms, Activities: d.activities,
    AirportTransfer: (d.extras || []).some(x => /transfer/i.test(x)) ? 'Yes' : '', CarHire: (d.extras || []).some(x => /car hire/i.test(x)) ? 'Yes' : '',
    Insurance: (d.extras || []).some(x => /insurance/i.test(x)) ? 'Yes' : '', SpecialRequests: (d.extras || []).join(', '), Budget: d.budget, PaymentPref: d.paymentPref,
    WebsiteEstimate: d.estimate || 0, NextAction: 'Review enquiry and assign', NextActionDue: new Date(Date.now() + 4 * 3600000), Template: TEMPLATE_BY_TYPE[type], Version: 1, LastActivity: new Date() };
  withLock_(() => { appendObj_('Tickets', t); createChecklist_(ref, TEMPLATE_BY_TYPE[type]); });
  audit_(t.CreatedBy, ref, 'ticket_created', { source: d.source, customer: cust.ref, existingCustomer: cust.existing });
  notifyRoles_(['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT'], 'new_enquiry', ref, `New enquiry ${ref} via ${d.source}: ${d.package || 'trip enquiry'}`);
  return { ref, customerRef: cust.ref };
}

const TICKET_FIELDS = {
  // section A
  source: ['Source', 'enum', SOURCES], enquiryType: ['EnquiryType', 'enum', ENQUIRY_TYPES], received: ['Received', 'date'], description: ['Description', 'text', 2000],
  intakeNotes: ['IntakeNotes', 'text', 2000],
  // section C (travel)
  destination: ['Destination', 'text', 120], destinations: ['Destinations', 'text', 300], package: ['Package', 'text', 140], customTrip: ['CustomTrip', 'yesno'],
  departDate: ['DepartDate', 'date'], returnDate: ['ReturnDate', 'date'], nights: ['Nights', 'count', 120], adults: ['Adults', 'count', 500], children: ['Children', 'count', 500],
  infants: ['Infants', 'count', 100], pensioners: ['Pensioners', 'count', 500], accommodation: ['Accommodation', 'text', 120], rooms: ['Rooms', 'text', 200],
  transport: ['Transport', 'text', 300], activities: ['Activities', 'text', 400], airportTransfer: ['AirportTransfer', 'yesno'], carHire: ['CarHire', 'yesno'],
  insurance: ['Insurance', 'yesno'], meals: ['Meals', 'text', 200], specialRequests: ['SpecialRequests', 'text', 1000], accessibility: ['Accessibility', 'text', 500],
  budget: ['Budget', 'text', 60], paymentPref: ['PaymentPref', 'text', 60],
  // section E (agent may edit on own tickets)
  nextAction: ['NextAction', 'text', 200], nextActionDue: ['NextActionDue', 'date'], followUp: ['FollowUp', 'date'], commsNotes: ['CommsNotes', 'text', 2000],
  outstanding: ['Outstanding', 'text', 1000],
  // management only
  priority: ['Priority', 'enum', PRIORITIES, 'ops.assign'], deadline: ['Deadline', 'date', null, 'ops.assign'],
};
/** Whitelisted field mapping (protects against mass assignment: status, assignment, money and IDs can't be set through here). */
function applyTicketFields_(t, fields, user) {
  const changes = {};
  Object.keys(fields || {}).forEach(k => {
    const spec = TICKET_FIELDS[k];
    if (!spec || fields[k] === undefined) return;
    const [col, type, extra, perm] = spec;
    if (perm && !can_(user, perm)) throw userError_('Only management can change ' + k.replace(/([A-Z])/g, ' $1').toLowerCase() + '.', 'forbidden');
    let v = fields[k];
    if (type === 'enum') v = oneOf_(v, extra, t[col] || extra[0]);
    else if (type === 'date') v = dateOrBlank_(v, k);
    else if (type === 'count') v = v === '' ? '' : count_(v, extra);
    else if (type === 'yesno') v = v === true || v === 'Yes' ? 'Yes' : v === false || v === 'No' ? 'No' : '';
    else v = safe_(v, extra);
    const before = t[col] instanceof Date ? iso_(t[col]) : String(t[col] == null ? '' : t[col]);
    const after = v instanceof Date ? iso_(v) : String(v);
    if (before !== after) { changes[col] = [before.slice(0, 60), after.slice(0, 60)]; t[col] = v; }
  });
  if (t.DepartDate && t.ReturnDate && day_(t.ReturnDate) < day_(t.DepartDate)) throw userError_('The return date is before the departure date.');
  return changes;
}

/** Internal intake form (sections A–E). Incomplete forms can be saved; employees complete them later. */
function createTicket_(b) {
  const actor = requirePerm_(b.token, 'ops.intake');
  const c = b.customer || {}, f = b.fields || {};
  if (!c.customerRef && !String(c.name || '').trim() && !c.phone && !c.email) throw userError_('Add at least the customer\'s name or a contact number.');
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(c.email).trim())) throw userError_('Please check the customer\'s email address.');
  if (!f.source) throw userError_('Choose where the enquiry came from.');
  const cust = upsertCustomer_(Object.assign({}, c, { consentSource: c.consent ? 'Recorded by ' + actor.Email : '' }), actor.Email);
  const ref = newTicketRef_();
  const t = { Ref: ref, CustomerRef: cust.ref, Created: new Date(), Received: new Date(), OpStatus: 'NEW ENQUIRY', PaymentStatus: 'Not invoiced', ResponseStatus: '',
    Priority: 'Normal', CreatedBy: actor.Email, Updated: new Date(), UpdatedBy: actor.Email, Version: 1, LastActivity: new Date() };
  const mgr = can_(actor, 'ops.assign');
  applyTicketFields_(t, Object.assign({}, f, mgr ? {} : { priority: undefined, deadline: undefined }), actor);
  if (b.existingRef) t.IntakeNotes = safe_('Related to ' + b.existingRef + '. ' + (t.IntakeNotes || ''), 2000);
  t.Template = TEMPLATE_BY_TYPE[t.EnquiryType] || 'general';
  let assignee = String(b.assignTo || '').toLowerCase();
  if (assignee && !mgr && assignee !== actor.Email) throw userError_('Only management can assign tickets to other people.', 'forbidden');
  if (assignee && !staffList_().some(s => s.email === assignee && PERMS['ops.edit.own'].indexOf(s.role) !== -1)) throw userError_('Choose a valid employee.');
  if (!assignee && !mgr) assignee = actor.Email; // agents own what they register
  if (assignee) { t.AssignedTo = assignee; t.OpStatus = 'ASSIGNED'; }
  if (!t.NextAction) t.NextAction = assignee ? 'Contact the customer' : 'Review enquiry and assign';
  if (!t.NextActionDue) t.NextActionDue = new Date(Date.now() + 24 * 3600000);
  withLock_(() => { appendObj_('Tickets', t); createChecklist_(ref, t.Template); });
  audit_(actor.Email, ref, 'ticket_created', { source: t.Source, customer: cust.ref, existingCustomer: cust.existing, assignedTo: assignee || '' });
  if (assignee) afterAssign_(t, assignee, '', actor);
  else notifyRoles_(['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT'], 'new_enquiry', ref, `New enquiry ${ref} (${t.Source}) registered by ${actor.Name || actor.Email}`, '', actor.Email);
  return { ref, customerRef: cust.ref, existingCustomer: cust.existing };
}

function updateTicket_(b) {
  const user = requireOpsUser_(b.token);
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    checkVersion_(f, b.version);
    if (CLOSED_STATUSES.indexOf(f.row.OpStatus) !== -1 && !can_(user, 'ops.edit.any')) throw userError_('This ticket is closed.');
    const t = Object.assign({}, f.row);
    const changes = applyTicketFields_(t, b.fields || {}, user);
    if (!Object.keys(changes).length) return { ticket: ticketSummary_(f.row), unchanged: true };
    touchTicket_(f, user, t);
    audit_(user.Email, f.row.Ref, 'ticket_updated', changes);
    notifyOthers_(f.row, user, 'ticket_updated', `${user.Name || user.Email} updated ${f.row.Ref}`);
    return { ticket: ticketSummary_(f.row), version: f.row.Version };
  });
}
function notifyOthers_(t, user, type, msg) {
  [t.AssignedTo].concat(String(t.SupportBy || '').split(',')).map(s => String(s).trim()).filter(e => e && e !== user.Email)
    .forEach(e => notify_(e, type, t.Ref, msg, type + ':' + t.Ref + ':' + e + ':' + Utilities.formatDate(new Date(), 'Africa/Johannesburg', 'yyyyMMddHH')));
}

/* ---------- lifecycle ---------- */

function ticketMoney_(ref) {
  const quotes = readTable_('Quotes').filter(q => q.TicketRef === ref);
  const accepted = quotes.filter(q => q.Status === 'Accepted').sort((a, b) => num_(b.Version) - num_(a.Version))[0] || null;
  const pays = readTable_('Payments').filter(p => p.TicketRef === ref && p.Verification !== 'Voided');
  const verifiedIn = pays.filter(p => p.Type !== 'refund' && p.Verification === 'Verified').reduce((s, p) => s + num_(p.Amount), 0);
  const unverifiedIn = pays.filter(p => p.Type !== 'refund' && p.Verification === 'Unverified').reduce((s, p) => s + num_(p.Amount), 0);
  const refunds = pays.filter(p => p.Type === 'refund');
  const refunded = refunds.filter(p => p.ApprovalStatus === 'Approved').reduce((s, p) => s + num_(p.Amount), 0);
  const refundPending = refunds.some(p => p.ApprovalStatus === 'Pending approval');
  const paid = Math.round((verifiedIn - refunded) * 100) / 100;
  const final = accepted ? num_(accepted.FinalAmount) : 0, deposit = accepted ? num_(accepted.DepositAmount) : 0;
  return { accepted, quotes, pays, verifiedIn, unverifiedIn, refunded, refundPending, paid, final, deposit, outstanding: Math.max(0, Math.round((final - paid) * 100) / 100) };
}
function derivePaymentStatus_(t, m) {
  if (m.refundPending) return 'Refund pending';
  if (m.refunded > 0 && m.paid <= 0) return 'Refunded';
  if (!m.accepted) return 'Not invoiced';
  if (m.final > 0 && m.paid >= m.final) return 'Fully paid';
  if (m.deposit > 0 && m.paid >= m.deposit) return m.paid > m.deposit ? 'Partially paid' : 'Deposit received';
  if (m.paid > 0) return 'Partially paid';
  const due = t.Deadline ? day_(t.Deadline) : day_(m.accepted.AcceptedAt) + 7 * 86400000;
  if (due && due < Date.now() && CLOSED_STATUSES.indexOf(t.OpStatus) === -1) return 'Overdue';
  return m.deposit > 0 && m.deposit < m.final ? 'Deposit pending' : 'Awaiting payment';
}
function refreshPaymentStatus_(ref, actorEmail) {
  const f = findRow_('Tickets', ref);
  if (!f) return null;
  const m = ticketMoney_(ref);
  const ps = derivePaymentStatus_(f.row, m);
  if (ps !== f.row.PaymentStatus) { writeRow_('Tickets', f.index, Object.assign({}, f.row, { PaymentStatus: ps, LastActivity: new Date() })); audit_(actorEmail, ref, 'payment_status', { from: f.row.PaymentStatus, to: ps }); }
  return { status: ps, money: m };
}

/** Guards that stop status changes from skipping essential steps. Returns an error message or ''. */
function transitionProblem_(t, to, user, note) {
  const statuses = allStatuses_();
  if (statuses.indexOf(to) === -1) return 'Unknown status.';
  const from = t.OpStatus, m = ticketMoney_(t.Ref);
  const idx = s => OP_STATUSES.indexOf(s);
  const wasConfirmed = !!t.ConfirmedAt;
  if (CLOSED_STATUSES.indexOf(from) !== -1 && !can_(user, 'ops.edit.any')) return 'This ticket is closed. Ask management to reopen it.';
  if (['CANCELLED', 'LOST / DECLINED', 'ON HOLD'].indexOf(to) !== -1 && !String(note || '').trim()) return 'Please add a reason.';
  if (to === 'CANCELLED' && wasConfirmed && !can_(user, 'ops.confirm')) return 'Only management can cancel a confirmed booking.';
  if (to === 'ASSIGNED' && !t.AssignedTo) return 'Assign an employee first.';
  if (to === 'UNASSIGNED' && t.AssignedTo) return 'This ticket is assigned. Reassign it instead.';
  if (to === 'QUOTATION SENT' && !m.quotes.some(q => ['Sent', 'Accepted', 'Declined'].indexOf(q.Status) !== -1)) return 'Send a quotation first (Quotations → Send).';
  if (to === 'AWAITING CUSTOMER RESPONSE' && !m.quotes.some(q => q.Status === 'Sent')) return 'There is no sent quotation waiting for a response.';
  if (['ACCEPTED BY CUSTOMER', 'AWAITING DEPOSIT', 'SUPPLIER CONFIRMATION'].indexOf(to) !== -1 && !m.accepted) return 'Record the customer\'s acceptance of a quotation first.';
  if (to === 'PAYMENT VERIFICATION' && !m.pays.some(p => p.Type !== 'refund')) return 'Record a payment first.';
  if (to === 'BOOKING CONFIRMED') {
    if (!can_(user, 'ops.confirm')) return 'Only management can confirm a booking.';
    if (!m.accepted) return 'A booking needs an accepted quotation.';
    if (m.paid < (m.deposit || m.final) || m.paid <= 0) return 'A booking can only be confirmed once finance has verified the deposit (R' + zar_((m.deposit || m.final)) + ').';
  }
  if (['TRIP PREPARATION', 'IN PROGRESS / TRAVELLING'].indexOf(to) !== -1 && !wasConfirmed) return 'Confirm the booking first.';
  if (to === 'COMPLETED') {
    if (!wasConfirmed) return 'Only confirmed bookings can be completed. Use Cancelled or Lost for others.';
    if (m.outstanding > 0 && !(can_(user, 'ops.confirm') && String(note || '').trim())) return 'R' + zar_(m.outstanding) + ' is still outstanding. Management can complete it with a note.';
  }
  if (wasConfirmed && idx(to) !== -1 && idx(to) < CONFIRMED_INDEX && ['ON HOLD'].indexOf(to) === -1 && !can_(user, 'ops.confirm')) return 'Only management can move a confirmed booking back.';
  if (from === to) return 'The ticket already has this status.';
  return '';
}

function setTicketStatus_(b) {
  const user = requireOpsUser_(b.token);
  const to = String(b.status || '');
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    checkVersion_(f, b.version);
    const problem = transitionProblem_(f.row, to, user, b.note);
    if (problem) throw userError_(problem, 'guard');
    const extra = { OpStatus: to };
    if (to === 'BOOKING CONFIRMED') extra.ConfirmedAt = new Date();
    if (CLOSED_STATUSES.indexOf(to) !== -1) extra.ClosedAt = new Date(); else if (f.row.ClosedAt) extra.ClosedAt = '';
    const from = f.row.OpStatus;
    touchTicket_(f, user, extra);
    if (b.note) addNoteRow_(f.row.Ref, user.Email, 'decision', '', `Status ${from} → ${to}: ${safe_(b.note, 1500)}`);
    audit_(user.Email, f.row.Ref, 'status_changed', { from, to, note: safe_(b.note || '', 200) });
    notifyOthers_(f.row, user, 'status_changed', `${f.row.Ref} moved to ${to}`);
    if (to === 'BOOKING CONFIRMED') {
      autoTask_(f.row, 'Send itinerary and travel information to the customer', f.row.AssignedTo, f.row.DepartDate ? new Date(day_(f.row.DepartDate) - 3 * 86400000) : new Date(Date.now() + 2 * 86400000));
      tickChecklist_(f.row.Ref, ['Booking reference issued'], user.Email);
    }
    return { ticket: ticketSummary_(f.row), version: f.row.Version };
  });
}

function setResponseStatus_(b) {
  const user = requireOpsUser_(b.token);
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    const v = oneOf_(b.status, RESPONSE_STATUSES, null);
    if (v === null) throw userError_('Invalid response status.');
    if (v === 'Accepted') throw userError_('Record acceptance on the quotation itself (Quotations → Accepted), so it is linked to the right version.');
    const from = f.row.ResponseStatus;
    touchTicket_(f, user, { ResponseStatus: v });
    audit_(user.Email, f.row.Ref, 'response_status', { from, to: v });
    if (b.note) addNoteRow_(f.row.Ref, user.Email, 'customer', '', safe_(b.note, 1500));
    return { ticket: ticketSummary_(f.row), version: f.row.Version };
  });
}

/* ---------- assignment & handover ---------- */

function assignTicket_(b) {
  const actor = requirePerm_(b.token, 'ops.assign');
  const to = String(b.assignee || '').trim().toLowerCase();
  const staff = staffList_().filter(s => PERMS['ops.edit.own'].indexOf(s.role) !== -1);
  if (to && !staff.some(s => s.email === to)) throw userError_('Choose a valid employee.');
  const supporters = (Array.isArray(b.supporters) ? b.supporters : []).map(s => String(s).toLowerCase().trim()).filter(s => s && s !== to && staff.some(x => x.email === s)).slice(0, 5);
  return withLock_(() => {
    const f = loadTicket_(actor, b.ref, false);
    checkVersion_(f, b.version);
    const prev = f.row.AssignedTo || '';
    const extra = { AssignedTo: to };
    if (Array.isArray(b.supporters)) extra.SupportBy = supporters.join(', '); // quick (re)assign from a list keeps existing supporters
    if (to && ['NEW ENQUIRY', 'AWAITING REVIEW', 'UNASSIGNED'].indexOf(f.row.OpStatus) !== -1) extra.OpStatus = 'ASSIGNED';
    if (!to && ['ASSIGNED', 'NEW ENQUIRY', 'AWAITING REVIEW'].indexOf(f.row.OpStatus) !== -1) extra.OpStatus = 'UNASSIGNED';
    if (b.priority) extra.Priority = oneOf_(b.priority, PRIORITIES, f.row.Priority);
    if (b.deadline !== undefined) extra.Deadline = dateOrBlank_(b.deadline, 'deadline');
    if (b.handoverSummary) extra.HandoverSummary = safe_(b.handoverSummary, 2000);
    if (to && (!f.row.NextAction || f.row.NextAction === 'Review enquiry and assign')) { extra.NextAction = 'Contact the customer and confirm requirements'; extra.NextActionDue = new Date(Date.now() + 24 * 3600000); }
    touchTicket_(f, actor, extra);
    // handover: previous work stays exactly where it is; we add a handover note and move the person's open tasks if asked
    if (prev && to && prev !== to) {
      addNoteRow_(f.row.Ref, actor.Email, 'handover', '', `Handover from ${prev} to ${to}.` + (b.handoverSummary ? '\n' + safe_(b.handoverSummary, 2000) : ''));
      if (b.moveTasks !== false) reassignOpenTasks_(f.row.Ref, prev, to, actor.Email);
      notify_(prev, 'reassigned', f.row.Ref, `${f.row.Ref} was reassigned to ${to}`);
    }
    audit_(actor.Email, f.row.Ref, prev && prev !== to ? 'ticket_reassigned' : 'ticket_assigned', { from: prev, to, supporters, priority: f.row.Priority });
    if (to && to !== prev) afterAssign_(f.row, to, prev, actor);
    supporters.forEach(s => notify_(s, 'supporting', f.row.Ref, `You were added as support on ${f.row.Ref}`, 'support:' + f.row.Ref + ':' + s));
    return { ticket: ticketSummary_(f.row), version: f.row.Version };
  });
}
function afterAssign_(t, to, prev, actor) {
  notify_(to, prev ? 'reassigned' : 'assigned', t.Ref, `${t.Ref} ${prev ? 'was handed over' : 'was assigned'} to you by ${actor.Name || actor.Email}`);
  const hasContactTask = readTable_('Tasks').some(k => k.TicketRef === t.Ref && k.Source === 'workflow:contact');
  if (!hasContactTask) autoTask_(t, 'Contact the customer and confirm requirements', to, new Date(Date.now() + 24 * 3600000), 'workflow:contact');
}
function reassignOpenTasks_(ref, from, to, actorEmail) {
  const sh = sheet_('Tasks');
  const rows = sh.getDataRange().getValues();
  const c = TABS.Tasks.indexOf('AssignedTo') + 1;
  rows.forEach((r, i) => { if (i > 0 && r[1] === ref && r[4] === from && ['COMPLETED', 'CANCELLED'].indexOf(r[7]) === -1) sh.getRange(i + 1, c).setValue(to); });
  audit_(actorEmail, ref, 'tasks_moved', { from, to });
}

/* ---------- notes (append-only) ---------- */

function addNoteRow_(ref, author, kind, channel, content, taskId) {
  const id = newId_('NT');
  appendObj_('Notes', { NoteID: id, TicketRef: ref, Created: new Date(), Author: author, Kind: kind, Channel: channel || '', Content: content, TaskID: taskId || '' });
  return id;
}
function addNote_(b) {
  const user = requireOpsUser_(b.token);
  const content = safe_(b.content, 4000);
  if (!content) throw userError_('Write the note first.');
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    const kind = oneOf_(b.kind, NOTE_KINDS, 'internal');
    const id = addNoteRow_(f.row.Ref, user.Email, kind, oneOf_(b.channel, COMMS.concat(['In person', 'Other']), ''), content, safe_(b.taskId, 40));
    let taskId = '';
    if (b.followUp && String(b.followUp.title || '').trim()) {
      const assignee = String(b.followUp.assignTo || user.Email).toLowerCase();
      if (assignee !== user.Email && !can_(user, 'ops.assign')) throw userError_('Only management can give tasks to other people.', 'forbidden');
      taskId = autoTask_(f.row, safe_(b.followUp.title, 140), assignee, dateOrBlank_(b.followUp.due, 'follow-up'), 'note:' + id, user.Email);
    }
    touchTicket_(f, user, {});
    audit_(user.Email, f.row.Ref, 'note_added', { kind, note: id, task: taskId });
    notifyOthers_(f.row, user, 'ticket_updated', `${user.Name || user.Email} added a note to ${f.row.Ref}`);
    return { id, taskId, version: f.row.Version };
  });
}

/* ---------- tasks ---------- */

function autoTask_(t, title, assignee, due, source, createdBy) {
  const id = newId_('T');
  appendObj_('Tasks', { TaskID: id, TicketRef: t.Ref, Title: title, AssignedTo: assignee || '', Priority: t.Priority || 'Normal', Due: due || '', Status: 'NOT STARTED',
    CreatedBy: createdBy || 'workflow', Created: new Date(), Source: source || 'workflow', Updated: new Date() });
  if (assignee && assignee !== createdBy) notify_(assignee, 'task_assigned', t.Ref, `New task on ${t.Ref}: ${title}`);
  return id;
}
function taskView_(k) {
  const overdue = k.Due && ['COMPLETED', 'CANCELLED'].indexOf(k.Status) === -1 && pastDue_(k.Due);
  return { id: k.TaskID, ref: k.TicketRef, title: k.Title, description: k.Description, assignedTo: k.AssignedTo, priority: k.Priority, due: iso_(k.Due), status: k.Status,
    createdBy: k.CreatedBy, created: iso_(k.Created), completedAt: iso_(k.CompletedAt), completedBy: k.CompletedBy, completionNotes: k.CompletionNotes, source: k.Source, overdue: !!overdue };
}
function createTask_(b) {
  const user = requireOpsUser_(b.token);
  const title = safe_(b.title, 140);
  if (!title) throw userError_('Give the task a title.');
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    const assignee = String(b.assignedTo || user.Email).toLowerCase();
    if (assignee !== user.Email && !can_(user, 'ops.assign')) throw userError_('Only management can give tasks to other people.', 'forbidden');
    if (!staffList_().some(s => s.email === assignee)) throw userError_('Choose a valid employee.');
    const id = newId_('T');
    appendObj_('Tasks', { TaskID: id, TicketRef: f.row.Ref, Title: title, Description: safe_(b.description, 1000), AssignedTo: assignee, Priority: oneOf_(b.priority, PRIORITIES, 'Normal'),
      Due: dateOrBlank_(b.due, 'due date'), Status: 'NOT STARTED', CreatedBy: user.Email, Created: new Date(), Source: 'manual', Updated: new Date() });
    touchTicket_(f, user, {});
    audit_(user.Email, f.row.Ref, 'task_created', { task: id, title, assignee });
    if (assignee !== user.Email) notify_(assignee, 'task_assigned', f.row.Ref, `New task on ${f.row.Ref}: ${title}`);
    return { id };
  });
}
function updateTask_(b) {
  const user = requireOpsUser_(b.token);
  return withLock_(() => {
    const tf = findRow_('Tasks', String(b.id || ''));
    if (!tf) throw userError_('Task not found.', 'notfound');
    const f = loadTicket_(user, tf.row.TicketRef, false);
    const own = tf.row.AssignedTo === user.Email;
    if (!own && !canEditTicket_(user, f.row)) throw userError_('Task not found.', 'notfound');
    const k = Object.assign({}, tf.row), changes = {};
    if (b.status !== undefined) {
      const s = oneOf_(b.status, TASK_STATUSES, null);
      if (!s) throw userError_('Invalid task status.');
      if (s !== k.Status) { changes.Status = [k.Status, s]; k.Status = s; }
      if (s === 'COMPLETED') { k.CompletedAt = new Date(); k.CompletedBy = user.Email; k.CompletionNotes = safe_(b.completionNotes, 1000); }
      else if (k.CompletedAt) { k.CompletedAt = ''; k.CompletedBy = ''; }
    }
    if (b.assignedTo !== undefined && b.assignedTo !== k.AssignedTo) {
      if (!can_(user, 'ops.assign')) throw userError_('Only management can reassign tasks.', 'forbidden');
      const to = String(b.assignedTo).toLowerCase();
      if (!staffList_().some(s => s.email === to)) throw userError_('Choose a valid employee.');
      changes.AssignedTo = [k.AssignedTo, to]; k.AssignedTo = to; notify_(to, 'task_assigned', k.TicketRef, `Task on ${k.TicketRef} assigned to you: ${k.Title}`);
    }
    if (b.due !== undefined) { k.Due = dateOrBlank_(b.due, 'due date'); changes.Due = 'changed'; }
    if (b.priority !== undefined) k.Priority = oneOf_(b.priority, PRIORITIES, k.Priority);
    k.Updated = new Date();
    writeRow_('Tasks', tf.index, k);
    touchTicket_(f, user, {});
    audit_(user.Email, k.TicketRef, 'task_updated', Object.assign({ task: k.TaskID }, changes));
    return taskView_(k);
  });
}
function listTasks_(b) {
  const user = requireOpsUser_(b.token);
  const tickets = {}; readTable_('Tickets').forEach(t => { tickets[t.Ref] = t; });
  let tasks = readTable_('Tasks').filter(k => tickets[k.TicketRef] && (canSeeTicket_(user, tickets[k.TicketRef]) || k.AssignedTo === user.Email));
  if (b.mine) tasks = tasks.filter(k => k.AssignedTo === user.Email);
  if (b.assignee && can_(user, 'ops.view.all')) tasks = tasks.filter(k => k.AssignedTo === b.assignee);
  if (b.open) tasks = tasks.filter(k => ['COMPLETED', 'CANCELLED'].indexOf(k.Status) === -1);
  return tasks.map(k => Object.assign(taskView_(k), { customer: tickets[k.TicketRef].CustomerRef, package: tickets[k.TicketRef].Package })).sort((a, b) => (a.due || '9') < (b.due || '9') ? -1 : 1).slice(0, 500);
}

/* ---------- checklists ---------- */

function templates_() {
  const rows = readTable_('ChecklistTemplates').filter(t => t.Active !== 'no');
  return rows.length ? rows : DEFAULT_TEMPLATES.map(t => ({ TemplateID: t.id, Name: t.name, AppliesTo: t.appliesTo.join(', '), Items: JSON.stringify(t.sections.reduce((a, s) => a.concat(DEFAULT_CHECKLIST[s].map(l => ({ section: s, label: l }))), [])), Active: 'yes' }));
}
function createChecklist_(ref, templateId) {
  const t = templates_().find(x => x.TemplateID === templateId) || templates_()[0];
  if (!t) return;
  let items = [];
  try { items = JSON.parse(t.Items || '[]'); } catch (e) { items = []; }
  const sh = sheet_('Checklist');
  const base = newId_('C');
  const rows = items.map((it, i) => { const o = { ItemID: base + '-' + i, TicketRef: ref, Section: safe_(it.section, 60), Label: safe_(it.label, 140), Ord: i, Done: '', AssignedTo: '', DoneAt: '', DoneBy: '', Notes: '', Applicable: 'yes' }; return TABS.Checklist.map(h => o[h] === undefined ? '' : o[h]); });
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, TABS.Checklist.length).setValues(rows);
}
function tickChecklist_(ref, labels, by) {
  const sh = sheet_('Checklist');
  const rows = sh.getDataRange().getValues();
  rows.forEach((r, i) => { if (i > 0 && r[1] === ref && labels.indexOf(r[3]) !== -1 && r[5] !== 'yes') { sh.getRange(i + 1, 6, 1, 4).setValues([['yes', r[6], new Date(), by + ' (auto)']]); } });
}
function updateChecklistItem_(b) {
  const user = requireOpsUser_(b.token);
  return withLock_(() => {
    const cf = findRow_('Checklist', String(b.id || ''));
    if (!cf) throw userError_('Checklist item not found.', 'notfound');
    const f = loadTicket_(user, cf.row.TicketRef, true);
    const it = Object.assign({}, cf.row), changes = {};
    if (b.done !== undefined) { const v = b.done ? 'yes' : ''; if (v !== it.Done) { changes.done = [it.Done || 'no', v || 'no']; it.Done = v; it.DoneAt = v ? new Date() : ''; it.DoneBy = v ? user.Email : ''; } }
    if (b.applicable !== undefined) { it.Applicable = b.applicable ? 'yes' : 'no'; changes.applicable = it.Applicable; }
    if (b.notes !== undefined) { it.Notes = safe_(b.notes, 500); changes.notes = 'changed'; }
    if (b.assignedTo !== undefined) {
      const to = String(b.assignedTo).toLowerCase();
      if (to && to !== user.Email && !can_(user, 'ops.assign')) throw userError_('Only management can assign checklist items to other people.', 'forbidden');
      it.AssignedTo = to; changes.assignedTo = to;
    }
    writeRow_('Checklist', cf.index, it);
    touchTicket_(f, user, {});
    audit_(user.Email, it.TicketRef, 'checklist_updated', Object.assign({ item: it.Label }, changes));
    return checklistView_(it);
  });
}
function addChecklistItem_(b) {
  const user = requireOpsUser_(b.token);
  const label = safe_(b.label, 140);
  if (!label) throw userError_('Write the checklist item.');
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    const it = { ItemID: newId_('C'), TicketRef: f.row.Ref, Section: safe_(b.section || 'Other', 60), Label: label, Ord: 999, Done: '', Applicable: 'yes' };
    appendObj_('Checklist', it);
    audit_(user.Email, f.row.Ref, 'checklist_item_added', { item: label });
    return checklistView_(it);
  });
}
function applyChecklistTemplate_(b) {
  const user = requireOpsUser_(b.token);
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    const t = templates_().find(x => x.TemplateID === b.templateId);
    if (!t) throw userError_('Template not found.');
    const have = readTable_('Checklist').filter(c => c.TicketRef === f.row.Ref).map(c => c.Section + '|' + c.Label);
    let items = []; try { items = JSON.parse(t.Items || '[]'); } catch (e) { items = []; }
    items.filter(it => have.indexOf(it.section + '|' + it.label) === -1).forEach((it, i) => appendObj_('Checklist', { ItemID: newId_('C') + i, TicketRef: f.row.Ref, Section: it.section, Label: it.label, Ord: 500 + i, Done: '', Applicable: 'yes' }));
    touchTicket_(f, user, { Template: t.TemplateID });
    audit_(user.Email, f.row.Ref, 'checklist_template_applied', t.Name);
    return { ok: true };
  });
}
function checklistView_(c) { return { id: c.ItemID, section: c.Section, label: c.Label, order: num_(c.Ord), done: c.Done === 'yes', assignedTo: c.AssignedTo, doneAt: iso_(c.DoneAt), doneBy: c.DoneBy, notes: c.Notes, applicable: c.Applicable !== 'no' }; }
function listTemplates_(b) {
  requireOpsUser_(b.token);
  return templates_().map(t => { let items = []; try { items = JSON.parse(t.Items || '[]'); } catch (e) { /* */ } return { id: t.TemplateID, name: t.Name, appliesTo: t.AppliesTo, items }; });
}
/** Items as text: one per line, "Section: item". */
function saveTemplate_(b) {
  const actor = requirePerm_(b.token, 'ops.templates');
  const name = safe_(b.name, 80);
  if (!name) throw userError_('Name the template.');
  const items = String(b.items || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 80).map(l => {
    const i = l.indexOf(':');
    return i > 0 ? { section: safe_(l.slice(0, i), 60), label: safe_(l.slice(i + 1), 140) } : { section: 'General', label: safe_(l, 140) };
  }).filter(x => x.label);
  if (!items.length) throw userError_('Add at least one item.');
  return withLock_(() => {
    if (!readTable_('ChecklistTemplates').length) DEFAULT_TEMPLATES.forEach(t => appendObj_('ChecklistTemplates', { TemplateID: t.id, Name: t.name, AppliesTo: t.appliesTo.join(', '), Items: JSON.stringify(t.sections.reduce((a, s) => a.concat(DEFAULT_CHECKLIST[s].map(l => ({ section: s, label: l }))), [])), Active: 'yes', Updated: new Date(), UpdatedBy: 'default' }));
    const id = b.id && /^[a-z0-9-]{2,30}$/.test(b.id) ? b.id : 'tpl-' + randomCode_(5).toLowerCase();
    const f = findRow_('ChecklistTemplates', id);
    const row = { TemplateID: id, Name: name, AppliesTo: safe_((b.appliesTo || []).join ? b.appliesTo.join(', ') : b.appliesTo, 300), Items: JSON.stringify(items), Active: b.active === false ? 'no' : 'yes', Updated: new Date(), UpdatedBy: actor.Email };
    if (f) writeRow_('ChecklistTemplates', f.index, row); else appendObj_('ChecklistTemplates', row);
    audit_(actor.Email, 'template:' + id, 'template_saved', { name, items: items.length });
    return { id };
  });
}

/* ---------- quotations (versioned; amounts calculated here) ---------- */

function calcQuote_(d) {
  const lines = (Array.isArray(d.lines) ? d.lines : []).slice(0, 40).map(l => ({ category: oneOf_(l.category, QUOTE_CATEGORIES, 'Other'), description: safe_(l.description, 140),
    supplier: safe_(l.supplier, 80), cost: money_(l.cost, 'a cost line') })).filter(l => l.description || l.cost);
  const cost = Math.round(lines.reduce((s, l) => s + l.cost, 0) * 100) / 100;
  let selling = d.sellingPrice !== undefined && d.sellingPrice !== '' ? money_(d.sellingPrice, 'selling price') : 0;
  if (!selling && d.markupPct !== undefined && d.markupPct !== '') { const mk = Number(d.markupPct); if (!isFinite(mk) || mk < 0 || mk > 500) throw userError_('Check the markup %.'); selling = Math.round(cost * (1 + mk / 100) * 100) / 100; }
  if (!selling) throw userError_('Enter a selling price (or a markup %).');
  const discount = money_(d.discount, 'discount');
  if (discount > selling) throw userError_('The discount is bigger than the selling price.');
  const vatMode = oneOf_(d.vatMode, ['none', 'inclusive', 'exclusive'], 'none');
  const sub = Math.round((selling - discount) * 100) / 100;
  const vat = vatMode === 'exclusive' ? Math.round(sub * VAT_RATE * 100) / 100 : vatMode === 'inclusive' ? Math.round(sub * VAT_RATE / (1 + VAT_RATE) * 100) / 100 : 0;
  const final = vatMode === 'exclusive' ? Math.round((sub + vat) * 100) / 100 : sub;
  const pct = d.depositPct === undefined || d.depositPct === '' ? Math.round(CATALOG.depositRate * 100) : Number(d.depositPct);
  if (!isFinite(pct) || pct < 0 || pct > 100) throw userError_('Deposit % must be between 0 and 100.');
  const deposit = Math.round(final * pct / 100 * 100) / 100;
  const net = vatMode === 'none' ? final : final - vat;
  return { lines, cost, selling, discount, vatMode, vat, final, depositPct: pct, deposit, margin: Math.round((net - cost) * 100) / 100 };
}
function quoteView_(q, user, money) {
  const expired = q.Status === 'Sent' && q.ValidUntil && day_(q.ValidUntil) + 86400000 < Date.now();
  let lines = []; try { lines = JSON.parse(q.Lines || '[]'); } catch (e) { /* */ }
  const v = { id: q.QuoteID, ref: q.TicketRef, version: num_(q.Version), status: expired ? 'Expired' : q.Status, lines, cost: num_(q.CostTotal), selling: num_(q.SellingPrice),
    discount: num_(q.Discount), vatMode: q.VatMode, vat: num_(q.VatAmount), final: num_(q.FinalAmount), depositPct: num_(q.DepositPct), deposit: num_(q.DepositAmount),
    validUntil: iso_(q.ValidUntil), preparedBy: q.PreparedBy, preparedAt: iso_(q.PreparedAt), approvedBy: q.ApprovedBy, approvedAt: iso_(q.ApprovedAt), sentAt: iso_(q.SentAt),
    sentBy: q.SentBy, acceptedAt: iso_(q.AcceptedAt), declinedAt: iso_(q.DeclinedAt), notes: q.Notes, margin: num_(q.Margin) };
  if (!can_(user, 'quote.prepare') && !can_(user, 'pay.view')) { v.lines = []; v.cost = 0; v.margin = 0; }
  if (money && q.Status === 'Accepted') { v.paid = money.paid; v.outstanding = money.outstanding; }
  return v;
}
function saveQuote_(b) {
  const user = requirePerm_(b.token, 'quote.prepare');
  const calc = calcQuote_(b.quote || {});
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    const all = readTable_('Quotes').filter(q => q.TicketRef === f.row.Ref);
    const draft = b.quoteId ? findRow_('Quotes', String(b.quoteId)) : null;
    if (b.quoteId && (!draft || draft.row.TicketRef !== f.row.Ref)) throw userError_('Quotation not found.');
    if (draft && ['Draft', 'Awaiting approval'].indexOf(draft.row.Status) === -1) throw userError_('This version can no longer be changed. Create a revised version instead.');
    const row = { TicketRef: f.row.Ref, Status: 'Draft', Lines: JSON.stringify(calc.lines), CostTotal: calc.cost, SellingPrice: calc.selling, Discount: calc.discount, VatMode: calc.vatMode,
      VatAmount: calc.vat, FinalAmount: calc.final, DepositPct: calc.depositPct, DepositAmount: calc.deposit, ValidUntil: dateOrBlank_((b.quote || {}).validUntil, 'valid until') || new Date(Date.now() + 14 * 86400000),
      PreparedBy: user.Email, PreparedAt: new Date(), RecordedBy: user.Email, Notes: safe_((b.quote || {}).notes, 1000), Margin: calc.margin };
    let id;
    if (draft) { id = draft.row.QuoteID; writeRow_('Quotes', draft.index, Object.assign({}, draft.row, row, { QuoteID: id, Version: draft.row.Version })); }
    else { id = newId_('Q'); appendObj_('Quotes', Object.assign(row, { QuoteID: id, Version: all.reduce((m, q) => Math.max(m, num_(q.Version)), 0) + 1 })); }
    const extra = {};
    if (['NEW ENQUIRY', 'AWAITING REVIEW', 'ASSIGNED', 'REQUIREMENTS UNDER REVIEW', 'SUPPLIER RESEARCH'].indexOf(f.row.OpStatus) !== -1) extra.OpStatus = 'QUOTATION IN PREPARATION';
    touchTicket_(f, user, extra);
    tickChecklist_(f.row.Ref, ['Supplier costs compiled', 'Selling price calculated', 'Deposit calculated'], user.Email);
    audit_(user.Email, f.row.Ref, draft ? 'quote_draft_updated' : 'quote_version_created', { quote: id, final: calc.final, deposit: calc.deposit });
    return { id, calc };
  });
}
/** submit (for approval) · approve · send · accept · decline · reopen (back to draft) */
function quoteAction_(b) {
  const user = requireOpsUser_(b.token);
  return withLock_(() => {
    const qf = findRow_('Quotes', String(b.quoteId || ''));
    if (!qf) throw userError_('Quotation not found.', 'notfound');
    const f = loadTicket_(user, qf.row.TicketRef, true);
    const q = Object.assign({}, qf.row), a = String(b.step || '');
    const extra = {};
    const supersede = except => { const sh = sheet_('Quotes'); sh.getDataRange().getValues().forEach((r, i) => { if (i > 0 && r[1] === q.TicketRef && r[0] !== except && ['Draft', 'Awaiting approval', 'Approved', 'Sent'].indexOf(r[3]) !== -1) sh.getRange(i + 1, 4).setValue('Superseded'); }); };
    if (a === 'submit') {
      if (q.Status !== 'Draft') throw userError_('Only drafts can be submitted for approval.');
      q.Status = 'Awaiting approval';
      notifyRoles_(['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT'], 'quote_approval', q.TicketRef, `Quotation v${q.Version} on ${q.TicketRef} needs approval (R${zar_(num_(q.FinalAmount))})`, '', user.Email);
    } else if (a === 'approve') {
      if (!can_(user, 'quote.approve')) throw userError_('Only management can approve quotations.', 'forbidden');
      if (['Draft', 'Awaiting approval'].indexOf(q.Status) === -1) throw userError_('This quotation is not waiting for approval.');
      q.Status = 'Approved'; q.ApprovedBy = user.Email; q.ApprovedAt = new Date();
      if (q.PreparedBy !== user.Email) notify_(q.PreparedBy, 'quote_approved', q.TicketRef, `Quotation v${q.Version} on ${q.TicketRef} was approved`);
    } else if (a === 'send') {
      if (q.Status !== 'Approved') throw userError_('A quotation must be approved before it is sent.');
      supersede(q.QuoteID);
      q.Status = 'Sent'; q.SentAt = new Date(); q.SentBy = user.Email;
      extra.OpStatus = 'QUOTATION SENT'; extra.ResponseStatus = 'Awaiting response';
      tickChecklist_(q.TicketRef, ['Final quotation prepared', 'Quotation sent', 'VAT reviewed'], user.Email);
      const cust = findRow_('Customers', f.row.CustomerRef);
      let channel = b.channel || 'recorded';
      if (b.emailCustomer && cust && cust.row.Email) {
        sendMail_(cust.row.Email, `Your quotation ${q.TicketRef} (v${q.Version}) from KCM Travel & Tours`, quoteEmailHtml_(f.row, cust.row, q));
        channel = 'Email';
      }
      addNoteRow_(q.TicketRef, user.Email, 'customer', channel === 'Email' ? 'Email' : oneOf_(b.channel, COMMS, ''), `Quotation v${q.Version} sent to the customer${channel === 'Email' ? ' by email' : ' (' + (b.channel || 'channel not recorded') + ')'}: R${zar_(num_(q.FinalAmount))}, deposit R${zar_(num_(q.DepositAmount))}.`);
    } else if (a === 'accept') {
      if (['Sent', 'Approved'].indexOf(q.Status) === -1) throw userError_('Only a sent quotation can be accepted.');
      if (q.ValidUntil && day_(q.ValidUntil) + 86400000 < Date.now() && !can_(user, 'quote.approve')) throw userError_('This quotation has expired. Management can still record acceptance, or send a revised version.');
      supersede(q.QuoteID);
      q.Status = 'Accepted'; q.AcceptedAt = new Date();
      extra.OpStatus = 'ACCEPTED BY CUSTOMER'; extra.ResponseStatus = 'Accepted';
      tickChecklist_(q.TicketRef, ['Customer response recorded'], user.Email);
      autoTask_(f.row, 'Send invoice and payment instructions for the deposit', f.row.AssignedTo || user.Email, new Date(Date.now() + 86400000), 'workflow:invoice');
      notifyOthers_(f.row, user, 'quote_accepted', `Quotation v${q.Version} on ${q.TicketRef} was accepted by the customer`);
      notifyRoles_(['FINANCE'], 'quote_accepted', q.TicketRef, `${q.TicketRef}: quotation accepted (R${zar_(num_(q.FinalAmount))}). Expect a deposit.`, 'qa:' + q.QuoteID);
    } else if (a === 'decline') {
      if (['Sent', 'Approved'].indexOf(q.Status) === -1) throw userError_('Only a sent quotation can be declined.');
      q.Status = 'Declined'; q.DeclinedAt = new Date(); extra.ResponseStatus = 'Declined'; extra.OpStatus = 'AWAITING CUSTOMER RESPONSE';
    } else if (a === 'reopen') {
      if (q.Status !== 'Awaiting approval') throw userError_('Only a quotation waiting for approval can be sent back to draft.');
      q.Status = 'Draft';
    } else throw userError_('Unknown action.');
    writeRow_('Quotes', qf.index, q);
    if (b.note) addNoteRow_(q.TicketRef, user.Email, 'decision', '', `Quotation v${q.Version} ${a}: ${safe_(b.note, 1000)}`);
    touchTicket_(f, user, extra);
    audit_(user.Email, q.TicketRef, 'quote_' + a, { quote: q.QuoteID, version: q.Version, final: q.FinalAmount });
    const ps = refreshPaymentStatus_(q.TicketRef, user.Email);
    return { quote: quoteView_(q, user), paymentStatus: ps && ps.status };
  });
}
function quoteEmailHtml_(t, c, q) {
  let lines = []; try { lines = JSON.parse(q.Lines || '[]'); } catch (e) { /* */ }
  const cats = {}; lines.forEach(l => { cats[l.category] = 1; });
  return `<p>Hi ${esc_(String(c.FullName || '').split(' ')[0] || 'there')},</p><p>Thank you for choosing KCM Travel &amp; Tours. Here is your quotation <strong>${esc_(t.Ref)}</strong> (version ${q.Version}).</p>
    <table style="border-collapse:collapse;margin:12px 0">
    <tr><td style="padding:6px 12px 6px 0;color:#666">Trip</td><td><strong>${esc_(t.Package || t.Destination || 'Your trip')}</strong></td></tr>
    ${t.DepartDate ? `<tr><td style="padding:6px 12px 6px 0;color:#666">Travel date</td><td><strong>${esc_(Utilities.formatDate(new Date(t.DepartDate), 'Africa/Johannesburg', 'd MMM yyyy'))}</strong></td></tr>` : ''}
    <tr><td style="padding:6px 12px 6px 0;color:#666">Includes</td><td>${esc_(Object.keys(cats).join(', ') || 'As discussed')}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#666">Total</td><td><strong>R${zar_(num_(q.FinalAmount))}</strong>${q.VatMode === 'inclusive' ? ' (incl. VAT)' : q.VatMode === 'exclusive' ? ' (incl. VAT of R' + zar_(num_(q.VatAmount)) + ')' : ''}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#666">Deposit to secure</td><td><strong>R${zar_(num_(q.DepositAmount))}</strong></td></tr>
    ${q.ValidUntil ? `<tr><td style="padding:6px 12px 6px 0;color:#666">Valid until</td><td>${esc_(Utilities.formatDate(new Date(q.ValidUntil), 'Africa/Johannesburg', 'd MMM yyyy'))}</td></tr>` : ''}</table>
    <p>To accept, simply reply to this email or WhatsApp us on 076 436 0010 quoting <strong>${esc_(t.Ref)}</strong>. We'll then send payment instructions. Your booking is confirmed once the deposit has been received and verified.</p>`;
}
function listQuotes_(b) {
  const user = requireOpsUser_(b.token);
  const tickets = {}; readTable_('Tickets').forEach(t => { tickets[t.Ref] = t; });
  let quotes = readTable_('Quotes').filter(q => tickets[q.TicketRef] && canSeeTicket_(user, tickets[q.TicketRef]));
  if (b.status) quotes = quotes.filter(q => quoteView_(q, user).status === b.status);
  return quotes.map(q => Object.assign(quoteView_(q, user), { customer: tickets[q.TicketRef].CustomerRef, package: tickets[q.TicketRef].Package, assignedTo: tickets[q.TicketRef].AssignedTo })).reverse().slice(0, 300);
}

/* ---------- payments (recorded → verified by finance; refunds need a second person) ---------- */

function paymentView_(p, full) {
  const v = { id: p.PaymentID, ref: p.TicketRef, quoteId: p.QuoteID, type: p.Type, amount: num_(p.Amount), method: p.Method, paidOn: iso_(p.PaidOn), recordedBy: p.RecordedBy,
    recordedAt: iso_(p.RecordedAt), verification: p.Verification, verifiedBy: p.VerifiedBy, verifiedAt: iso_(p.VerifiedAt), approvalStatus: p.ApprovalStatus, approvedBy: p.ApprovedBy };
  if (full) Object.assign(v, { reference: p.Reference, verificationSource: p.VerificationSource, notes: p.Notes, voidReason: p.VoidReason });
  return v;
}
function recordPayment_(b) {
  const user = requirePerm_(b.token, 'pay.record');
  const d = b.payment || {};
  const type = oneOf_(d.type, PAYMENT_TYPES, null);
  if (!type) throw userError_('Choose the payment type.');
  if (type === 'refund' && !can_(user, 'pay.verify')) throw userError_('Only finance can record refunds.', 'forbidden');
  const amount = money_(d.amount, 'amount');
  if (amount <= 0) throw userError_('Enter the amount received.');
  const method = oneOf_(d.method, PAYMENT_METHODS, null);
  if (!method) throw userError_('Choose the payment method.');
  const reference = safe_(d.reference, 60);
  if (['EFT', 'Card', 'Payment gateway', 'SnapScan / Zapper'].indexOf(method) !== -1 && !reference) throw userError_('Add the payment reference (bank or gateway reference).');
  const paidOn = dateOrBlank_(d.paidOn, 'payment date') || new Date();
  if (day_(paidOn) > Date.now() + 86400000) throw userError_('The payment date is in the future.');
  const idem = String(b.idempotencyKey || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 64);
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, false);
    if (!can_(user, 'pay.view') && !canEditTicket_(user, f.row)) throw userError_('Ticket not found.', 'notfound');
    const all = readTable_('Payments');
    if (idem) { const dup = all.find(p => p.IdempotencyKey === idem); if (dup) return { id: dup.PaymentID, duplicate: true }; }
    if (reference && all.some(p => p.Verification !== 'Voided' && p.Type === type && String(p.Reference).toLowerCase() === reference.toLowerCase() && p.Method === method)) {
      throw userError_('A payment with this reference is already recorded. Check the payment timeline before adding it again.');
    }
    const m = ticketMoney_(f.row.Ref);
    if (!m.accepted) throw userError_('Record the customer\'s acceptance of a quotation before recording payments.');
    if (type === 'refund' && amount > m.paid) throw userError_('A refund cannot be more than the verified amount paid (R' + zar_(m.paid) + ').');
    if (type !== 'refund' && amount > m.final - m.paid - m.unverifiedIn + 0.01 && !String(d.notes || '').trim()) throw userError_('This is more than the outstanding balance. Add a note explaining the overpayment.');
    const id = newId_('PAY');
    appendObj_('Payments', { PaymentID: id, TicketRef: f.row.Ref, QuoteID: m.accepted.QuoteID, Type: type, Amount: amount, Method: method, Reference: reference, PaidOn: paidOn,
      RecordedBy: user.Email, RecordedAt: new Date(), Verification: 'Unverified', Notes: safe_(d.notes, 500), IdempotencyKey: idem, ApprovalStatus: type === 'refund' ? 'Pending approval' : '' });
    const extra = {};
    if (type !== 'refund' && ['ACCEPTED BY CUSTOMER', 'AWAITING DEPOSIT'].indexOf(f.row.OpStatus) !== -1) extra.OpStatus = 'PAYMENT VERIFICATION';
    touchTicket_(f, user, extra);
    audit_(user.Email, f.row.Ref, type === 'refund' ? 'refund_requested' : 'payment_recorded', { payment: id, amount, method, verification: 'Unverified' });
    notifyRoles_(type === 'refund' ? ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] : ['FINANCE'], type === 'refund' ? 'refund_approval' : 'payment_verify', f.row.Ref,
      `${f.row.Ref}: ${type === 'refund' ? 'refund of' : 'payment of'} R${zar_(amount)} ${type === 'refund' ? 'needs approval' : 'needs verification'}`, '', user.Email);
    const ps = refreshPaymentStatus_(f.row.Ref, user.Email);
    return { id, paymentStatus: ps.status };
  });
}
function verifyPayment_(b) {
  const user = requirePerm_(b.token, 'pay.verify');
  const decision = b.decision === 'reject' ? 'Rejected' : b.decision === 'verify' ? 'Verified' : null;
  if (!decision) throw userError_('Choose verify or reject.');
  const source = safe_(b.source, 120);
  if (decision === 'Verified' && !source) throw userError_('Record how you verified it (e.g. "Bank statement 19 Nov, FNB").');
  return withLock_(() => {
    const pf = findRow_('Payments', String(b.id || ''));
    if (!pf || pf.row.Type === 'refund') throw userError_('Payment not found.', 'notfound');
    if (pf.row.Verification !== 'Unverified') throw userError_('This payment has already been ' + pf.row.Verification.toLowerCase() + '. Verified records cannot be changed; void it with a reason instead.');
    const self = pf.row.RecordedBy === user.Email;
    if (self && roleOf_(user) !== 'SUPER_ADMIN') throw userError_('Someone other than the person who recorded a payment must verify it.', 'forbidden');
    const p = Object.assign({}, pf.row, { Verification: decision, VerifiedBy: user.Email, VerifiedAt: new Date(), VerificationSource: source + (self ? ' [self-verified by super admin]' : '') });
    if (b.notes) p.Notes = safe_((p.Notes ? p.Notes + ' | ' : '') + b.notes, 500);
    writeRow_('Payments', pf.index, p);
    audit_(user.Email, p.TicketRef, 'payment_' + decision.toLowerCase(), { payment: p.PaymentID, amount: p.Amount, source, selfVerified: self });
    const ps = refreshPaymentStatus_(p.TicketRef, user.Email);
    const t = findRow_('Tickets', p.TicketRef);
    if (t) {
      if (decision === 'Verified') tickChecklist_(p.TicketRef, ps.money.paid >= ps.money.final ? ['Deposit received', 'Payment verified', 'Balance calculated', 'Final payment verified'] : ['Deposit received', 'Payment verified', 'Balance calculated'], user.Email);
      notifyOthers_(t.row, user, 'payment_' + decision.toLowerCase(), `${p.TicketRef}: payment of R${zar_(num_(p.Amount))} ${decision.toLowerCase()} (${ps.status})`);
    }
    return { payment: paymentView_(p, true), paymentStatus: ps.status, outstanding: ps.money.outstanding };
  });
}
function approveRefund_(b) {
  const user = requirePerm_(b.token, 'pay.refund.approve');
  return withLock_(() => {
    const pf = findRow_('Payments', String(b.id || ''));
    if (!pf || pf.row.Type !== 'refund') throw userError_('Refund not found.', 'notfound');
    if (pf.row.ApprovalStatus !== 'Pending approval') throw userError_('This refund is not waiting for approval.');
    if (pf.row.RecordedBy === user.Email) throw userError_('A different person must approve a refund (two-person rule).', 'forbidden');
    const approve = b.decision !== 'reject';
    const p = Object.assign({}, pf.row, { ApprovalStatus: approve ? 'Approved' : 'Rejected', ApprovedBy: user.Email, ApprovedAt: new Date(), Verification: approve ? 'Verified' : 'Rejected', VerifiedBy: user.Email, VerifiedAt: new Date(), VerificationSource: safe_(b.source || 'Refund approval', 120) });
    writeRow_('Payments', pf.index, p);
    audit_(user.Email, p.TicketRef, approve ? 'refund_approved' : 'refund_rejected', { payment: p.PaymentID, amount: p.Amount });
    const ps = refreshPaymentStatus_(p.TicketRef, user.Email);
    return { payment: paymentView_(p, true), paymentStatus: ps.status };
  });
}
function voidPayment_(b) {
  const user = requirePerm_(b.token, 'pay.verify');
  const reason = safe_(b.reason, 300);
  if (!reason) throw userError_('Give the reason for voiding this payment record.');
  return withLock_(() => {
    const pf = findRow_('Payments', String(b.id || ''));
    if (!pf) throw userError_('Payment not found.', 'notfound');
    if (pf.row.Verification === 'Voided') throw userError_('Already voided.');
    if (pf.row.Verification === 'Verified' && pf.row.VerifiedBy === user.Email && roleOf_(user) !== 'SUPER_ADMIN') throw userError_('Another finance user must void a payment you verified.', 'forbidden');
    const p = Object.assign({}, pf.row, { Verification: 'Voided', VoidReason: reason + ' (by ' + user.Email + ', ' + new Date().toISOString().slice(0, 10) + ')' });
    writeRow_('Payments', pf.index, p);
    audit_(user.Email, p.TicketRef, 'payment_voided', { payment: p.PaymentID, amount: p.Amount, reason, previously: pf.row.Verification });
    const ps = refreshPaymentStatus_(p.TicketRef, user.Email);
    return { paymentStatus: ps.status };
  });
}
function listPayments_(b) {
  const user = requirePerm_(b.token, 'pay.view');
  const tickets = {}; readTable_('Tickets').forEach(t => { tickets[t.Ref] = t; });
  let pays = readTable_('Payments');
  if (b.verification) pays = pays.filter(p => p.Verification === b.verification || (b.verification === 'Pending approval' && p.ApprovalStatus === 'Pending approval'));
  const byTicket = {};
  Object.keys(tickets).forEach(ref => { if (tickets[ref].PaymentStatus && tickets[ref].PaymentStatus !== 'Not invoiced') { const m = ticketMoney_(ref); byTicket[ref] = { ref, status: tickets[ref].PaymentStatus, final: m.final, deposit: m.deposit, paid: m.paid, unverified: m.unverifiedIn, outstanding: m.outstanding, package: tickets[ref].Package, customer: tickets[ref].CustomerRef, opStatus: tickets[ref].OpStatus }; } });
  return { payments: pays.map(p => Object.assign(paymentView_(p, true), { package: (tickets[p.TicketRef] || {}).Package })).reverse().slice(0, 500), tickets: Object.values(byTicket) };
}

/* ---------- suppliers ---------- */

function listSuppliers_(b) {
  requireOpsUser_(b.token);
  const own = readTable_('Suppliers').filter(s => s.Active !== 'no').map(s => ({ id: s.SupplierID, name: s.Name, type: s.Type, contact: s.ContactName, phone: s.Phone, email: s.Email, partnerId: s.PartnerID, notes: s.Notes }));
  const partners = readTable_('Partners').filter(p => p.Status === 'Approved' && !own.some(s => s.partnerId === p.ID))
    .map(p => ({ id: 'partner:' + p.ID, name: p.BusinessName, type: (PARTNER_TYPES[p.PartnerType] || {}).label || p.PartnerType, contact: p.ContactName, phone: p.Phone, email: p.Email, partnerId: p.ID, notes: 'KCM partner · ' + (p.Tier || '') }));
  return own.concat(partners);
}
function saveSupplier_(b) {
  const user = requirePerm_(b.token, 'suppliers.manage');
  const d = b.supplier || {};
  const name = safe_(d.name, 100);
  if (!name) throw userError_('Supplier name is required.');
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(d.email))) throw userError_('Please check the email address.');
  return withLock_(() => {
    const f = d.id ? findRow_('Suppliers', String(d.id)) : null;
    const row = { SupplierID: f ? f.row.SupplierID : newId_('S'), Name: name, Type: safe_(d.type, 60), ContactName: safe_(d.contact, 80), Phone: safe_(d.phone, 30), Email: String(d.email || '').toLowerCase().slice(0, 120),
      PartnerID: safe_(d.partnerId, 30), Notes: safe_(d.notes, 500), Created: f ? f.row.Created : new Date(), CreatedBy: f ? f.row.CreatedBy : user.Email, Active: d.active === false ? 'no' : 'yes' };
    if (f) writeRow_('Suppliers', f.index, row); else appendObj_('Suppliers', row);
    audit_(user.Email, 'supplier:' + row.SupplierID, f ? 'supplier_updated' : 'supplier_created', name);
    return { id: row.SupplierID };
  });
}
function addSupplierQuote_(b) {
  const user = requireOpsUser_(b.token);
  const d = b.supplierQuote || {};
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    const sup = d.supplierId ? listSuppliers_({ token: b.token }).find(s => s.id === d.supplierId) : null;
    const name = sup ? sup.name : safe_(d.supplierName, 100);
    if (!name) throw userError_('Choose or name the supplier.');
    const id = newId_('SQ');
    appendObj_('SupplierQuotes', { SQID: id, TicketRef: f.row.Ref, SupplierID: sup ? sup.id : '', SupplierName: name, Service: safe_(d.service, 140), Amount: money_(d.amount, 'supplier quote'),
      ValidUntil: dateOrBlank_(d.validUntil, 'valid until'), Status: oneOf_(d.status, ['Requested', 'Received', 'Accepted', 'Declined'], 'Received'), Notes: safe_(d.notes, 500), RecordedBy: user.Email, RecordedAt: new Date() });
    if (d.status !== 'Requested') tickChecklist_(f.row.Ref, /accommodation|lodge|hotel|room|guest/i.test(d.service || '') ? ['Supplier quotation received'] : /transport|vehicle|transfer|car|shuttle/i.test(d.service || '') ? ['Transport quotation received'] : [], user.Email);
    addNoteRow_(f.row.Ref, user.Email, 'supplier', '', `Supplier ${name}: ${safe_(d.service, 140)}${num_(d.amount) ? ' · R' + zar_(num_(d.amount)) : ''} (${d.status || 'Received'})${d.notes ? ' — ' + safe_(d.notes, 300) : ''}`);
    touchTicket_(f, user, f.row.OpStatus === 'REQUIREMENTS UNDER REVIEW' || f.row.OpStatus === 'ASSIGNED' ? { OpStatus: 'SUPPLIER RESEARCH' } : {});
    audit_(user.Email, f.row.Ref, 'supplier_quote_added', { id, supplier: name, amount: num_(d.amount) });
    return { id };
  });
}
function updateSupplierQuote_(b) {
  const user = requireOpsUser_(b.token);
  return withLock_(() => {
    const sf = findRow_('SupplierQuotes', String(b.id || ''));
    if (!sf) throw userError_('Supplier quote not found.', 'notfound');
    loadTicket_(user, sf.row.TicketRef, true);
    const s = Object.assign({}, sf.row, { Status: oneOf_(b.status, ['Requested', 'Received', 'Accepted', 'Declined'], sf.row.Status) });
    if (b.amount !== undefined) s.Amount = money_(b.amount);
    writeRow_('SupplierQuotes', sf.index, s);
    audit_(user.Email, s.TicketRef, 'supplier_quote_updated', { id: s.SQID, status: s.Status });
    if (s.Status === 'Accepted') tickChecklist_(s.TicketRef, /accommodation|lodge|hotel|room|guest/i.test(s.Service) ? ['Accommodation confirmed'] : /transport|vehicle|transfer|car|shuttle/i.test(s.Service) ? ['Transport confirmed'] : [], user.Email);
    return { ok: true };
  });
}

/* ---------- attachments (private Drive folder) ---------- */

function opsFolder_() {
  const id = prop_('OPS_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* recreate */ } }
  const folder = DriveApp.createFolder('KCM Operations Files (private)');
  PropertiesService.getScriptProperties().setProperty('OPS_FOLDER_ID', folder.getId());
  return folder;
}
function uploadTicketFile_(b) {
  const user = requireOpsUser_(b.token);
  const m = String(b.dataUrl || '').match(/^data:(image\/(jpeg|png|webp)|application\/(pdf));base64,(.+)$/);
  if (!m) throw userError_('Upload a PDF or a JPG/PNG/WebP image.');
  const bytes = Utilities.base64Decode(m[m.length - 1]);
  if (bytes.length > APP.maxDocBytes) throw userError_('That file is too large (max 6 MB).');
  if (!fileMatchesType_(bytes, m[1])) throw userError_('That file does not match its type. Please upload the original file.');
  return withLock_(() => {
    const f = loadTicket_(user, b.ref, true);
    const name = safe_(b.name || 'file', 80).replace(/[^\w .&()-]/g, '') || 'file';
    const file = opsFolder_().createFile(Utilities.newBlob(bytes, m[1], f.row.Ref + ' ' + name));
    const id = newId_('F');
    appendObj_('Attachments', { FileID: id, TicketRef: f.row.Ref, LinkKind: oneOf_(b.linkKind, ['note', 'task', 'checklist', 'payment', 'ticket'], 'ticket'), LinkID: safe_(b.linkId, 40),
      Name: name, Mime: m[1], Size: bytes.length, DriveID: file.getId(), UploadedBy: user.Email, UploadedAt: new Date() });
    touchTicket_(f, user, {});
    audit_(user.Email, f.row.Ref, 'file_uploaded', { file: id, name });
    return { id, name };
  });
}
function getTicketFile_(b) {
  const user = requireOpsUser_(b.token);
  const af = findRow_('Attachments', String(b.id || ''));
  if (!af) throw userError_('File not found.', 'notfound');
  loadTicket_(user, af.row.TicketRef, false);
  if (af.row.LinkKind === 'payment' && !can_(user, 'pay.view')) throw userError_('File not found.', 'notfound');
  const blob = DriveApp.getFileById(af.row.DriveID).getBlob();
  return { name: af.row.Name, dataUrl: 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes()) };
}

/* =====================================================================
 * Views: summary, full workspace, register, workspace, overview, workload
 * ===================================================================== */

function ticketSummary_(t, ctx) {
  const now = Date.now();
  const open = CLOSED_STATUSES.indexOf(t.OpStatus) === -1;
  const v = { ref: t.Ref, customerRef: t.CustomerRef, created: iso_(t.Created), received: iso_(t.Received), source: t.Source, enquiryType: t.EnquiryType, opStatus: t.OpStatus,
    paymentStatus: t.PaymentStatus || 'Not invoiced', responseStatus: t.ResponseStatus, priority: t.Priority, assignedTo: t.AssignedTo, supportBy: t.SupportBy, createdBy: t.CreatedBy,
    updated: iso_(t.Updated), updatedBy: t.UpdatedBy, nextAction: t.NextAction, nextActionDue: iso_(t.NextActionDue), deadline: iso_(t.Deadline), destination: t.Destination,
    package: t.Package, departDate: iso_(t.DepartDate), travellers: num_(t.Adults) + num_(t.Children) + num_(t.Infants) + num_(t.Pensioners), version: num_(t.Version),
    lastActivity: iso_(t.LastActivity), open, overdue: open && ((t.NextActionDue && day_(t.NextActionDue) < now) || pastDue_(t.Deadline)), legacyRef: t.LegacyRef };
  if (ctx && ctx.customers) { const c = ctx.customers[t.CustomerRef]; if (c) { v.customerName = c.FullName; v.customerPhone = c.Phone; v.customerEmail = c.Email; } }
  if (ctx && ctx.tasks) { const ks = ctx.tasks[t.Ref] || []; v.openTasks = ks.filter(k => ['COMPLETED', 'CANCELLED'].indexOf(k.Status) === -1).length; v.overdueTasks = ks.filter(k => taskView_(k).overdue).length; }
  return v;
}
function getTicket_(b) {
  const user = requireOpsUser_(b.token);
  const f = loadTicket_(user, b.ref, false);
  const t = f.row, ref = t.Ref;
  const cust = findRow_('Customers', t.CustomerRef);
  const money = ticketMoney_(ref);
  const seePay = can_(user, 'pay.view');
  const view = Object.assign(ticketSummary_(t), {
    fields: TABS.Tickets.reduce((o, h) => { o[h] = t[h] instanceof Date ? iso_(t[h]) : t[h]; return o; }, {}),
    customer: cust ? customerView_(cust.row) : null,
    tasks: readTable_('Tasks').filter(k => k.TicketRef === ref).map(taskView_),
    checklist: readTable_('Checklist').filter(c => c.TicketRef === ref).map(checklistView_).sort((a, b) => a.order - b.order),
    notes: readTable_('Notes').filter(n => n.TicketRef === ref).map(n => ({ id: n.NoteID, created: iso_(n.Created), author: n.Author, kind: n.Kind, channel: n.Channel, content: n.Content, taskId: n.TaskID })).reverse(),
    quotes: money.quotes.map(q => quoteView_(q, user, money)).sort((a, b) => b.version - a.version),
    payments: money.pays.concat(readTable_('Payments').filter(p => p.TicketRef === ref && p.Verification === 'Voided')).map(p => paymentView_(p, seePay)),
    money: { final: money.final, deposit: money.deposit, paid: money.paid, unverified: money.unverifiedIn, refunded: money.refunded, outstanding: money.outstanding, acceptedQuote: money.accepted ? money.accepted.QuoteID : '' },
    supplierQuotes: readTable_('SupplierQuotes').filter(s => s.TicketRef === ref).map(s => ({ id: s.SQID, supplier: s.SupplierName, supplierId: s.SupplierID, service: s.Service, amount: num_(s.Amount), validUntil: iso_(s.ValidUntil), status: s.Status, notes: s.Notes, recordedBy: s.RecordedBy, recordedAt: iso_(s.RecordedAt) })),
    files: readTable_('Attachments').filter(a => a.TicketRef === ref && (a.LinkKind !== 'payment' || seePay)).map(a => ({ id: a.FileID, name: a.Name, mime: a.Mime, size: num_(a.Size), linkKind: a.LinkKind, linkId: a.LinkID, uploadedBy: a.UploadedBy, uploadedAt: iso_(a.UploadedAt) })),
    history: readTable_('Activity').filter(a => a.Target === ref).map(a => ({ time: iso_(a.Time), actor: a.Actor, action: a.Action, details: a.Details })).reverse(),
    allowed: { edit: canEditTicket_(user, t), assign: can_(user, 'ops.assign'), confirm: can_(user, 'ops.confirm'), quotePrepare: can_(user, 'quote.prepare') && canEditTicket_(user, t),
      quoteApprove: can_(user, 'quote.approve'), payRecord: can_(user, 'pay.record') && (seePay || canEditTicket_(user, t)), payVerify: can_(user, 'pay.verify'), payView: seePay,
      refundApprove: can_(user, 'pay.refund.approve'), management: can_(user, 'ops.edit.any') },
  });
  if (!cust) view.customer = { ref: t.CustomerRef, name: '(customer record missing)' };
  return view;
}

function listTickets_(b) {
  const user = requireOpsUser_(b.token);
  const customers = {}; readTable_('Customers').forEach(c => { customers[c.CustomerRef] = c; });
  const tasks = {}; readTable_('Tasks').forEach(k => { (tasks[k.TicketRef] = tasks[k.TicketRef] || []).push(k); });
  let list = readTable_('Tickets').filter(t => canSeeTicket_(user, t));
  const view = String(b.view || 'all');
  if (view === 'incoming') list = list.filter(t => ['NEW ENQUIRY', 'AWAITING REVIEW'].indexOf(t.OpStatus) !== -1);
  if (view === 'unassigned') list = list.filter(t => !t.AssignedTo && CLOSED_STATUSES.indexOf(t.OpStatus) === -1);
  if (view === 'mine') list = list.filter(t => t.AssignedTo === user.Email || String(t.SupportBy || '').indexOf(user.Email) !== -1);
  if (view === 'bookings') list = list.filter(t => !!t.ConfirmedAt && ['CANCELLED'].indexOf(t.OpStatus) === -1);
  if (view === 'completed') list = list.filter(t => t.OpStatus === 'COMPLETED');
  if (view === 'open') list = list.filter(t => CLOSED_STATUSES.indexOf(t.OpStatus) === -1);
  const eq = (k, col) => { if (b[k]) list = list.filter(t => String(t[col]) === String(b[k])); };
  eq('status', 'OpStatus'); eq('priority', 'Priority'); eq('source', 'Source'); eq('paymentStatus', 'PaymentStatus');
  if (b.assignee) list = list.filter(t => b.assignee === '(none)' ? !t.AssignedTo : t.AssignedTo === b.assignee);
  if (b.destination) { const d = String(b.destination).toLowerCase(); list = list.filter(t => (String(t.Destination) + ' ' + t.Package + ' ' + t.Destinations).toLowerCase().indexOf(d) !== -1); }
  if (b.from) list = list.filter(t => day_(t.Created) >= day_(dateOrBlank_(b.from)));
  if (b.to) list = list.filter(t => day_(t.Created) < day_(dateOrBlank_(b.to)) + 86400000);
  if (b.overdue) list = list.filter(t => ticketSummary_(t).overdue || (tasks[t.Ref] || []).some(k => taskView_(k).overdue));
  if (b.q) {
    const q = String(b.q).toLowerCase().trim(), pk = phoneKey_(q);
    list = list.filter(t => {
      const c = customers[t.CustomerRef] || {};
      return [t.Ref, t.LegacyRef, t.CustomerRef, c.FullName, c.Email, t.Destination, t.Package, t.AssignedTo].some(x => String(x || '').toLowerCase().indexOf(q) !== -1) ||
        (pk.length >= 6 && [c.PhoneKey, phoneKey_(c.WhatsApp), phoneKey_(c.AltPhone)].some(x => String(x || '').indexOf(pk) !== -1));
    });
  }
  const sort = String(b.sort || 'updated');
  const pr = { Urgent: 0, High: 1, Normal: 2, Low: 3 };
  list.sort((a, c) => sort === 'priority' ? (pr[a.Priority] - pr[c.Priority]) || day_(c.Updated) - day_(a.Updated)
    : sort === 'due' ? (day_(a.NextActionDue) || 9e15) - (day_(c.NextActionDue) || 9e15)
      : sort === 'created' ? day_(c.Created) - day_(a.Created) : day_(c.LastActivity || c.Updated) - day_(a.LastActivity || a.Updated));
  const total = list.length;
  return { total, tickets: list.slice(0, Math.min(500, Number(b.limit) || 200)).map(t => ticketSummary_(t, { customers, tasks })) };
}

function myWorkspace_(b) {
  const user = requireOpsUser_(b.token);
  const me = user.Email, now = Date.now(), week = now + 7 * 86400000;
  const customers = {}; readTable_('Customers').forEach(c => { customers[c.CustomerRef] = c; });
  const allTasks = readTable_('Tasks');
  const tasksBy = {}; allTasks.forEach(k => { (tasksBy[k.TicketRef] = tasksBy[k.TicketRef] || []).push(k); });
  const tickets = readTable_('Tickets').filter(t => t.AssignedTo === me || String(t.SupportBy || '').indexOf(me) !== -1);
  const mine = allTasks.filter(k => k.AssignedTo === me).map(taskView_);
  const open = mine.filter(k => ['COMPLETED', 'CANCELLED'].indexOf(k.status) === -1);
  return {
    tickets: tickets.filter(t => CLOSED_STATUSES.indexOf(t.OpStatus) === -1).map(t => ticketSummary_(t, { customers, tasks: tasksBy })).sort((a, c) => (a.nextActionDue || '9') < (c.nextActionDue || '9') ? -1 : 1),
    pending: open.filter(k => !k.overdue),
    overdue: open.filter(k => k.overdue),
    upcoming: open.filter(k => k.due && day_(k.due) >= now && day_(k.due) <= week).concat(tickets.filter(t => t.NextActionDue && day_(t.NextActionDue) >= now && day_(t.NextActionDue) <= week && CLOSED_STATUSES.indexOf(t.OpStatus) === -1)
      .map(t => ({ id: '', ref: t.Ref, title: 'Next action: ' + (t.NextAction || 'follow up'), due: iso_(t.NextActionDue), status: 'TICKET' }))).sort((a, c) => a.due < c.due ? -1 : 1),
    completed: mine.filter(k => k.status === 'COMPLETED' && day_(k.completedAt) > now - 30 * 86400000).slice(-20).reverse(),
    activity: readTable_('Activity').filter(a => a.Actor === me).slice(-25).reverse().map(a => ({ time: iso_(a.Time), action: a.Action, target: a.Target, details: a.Details })),
  };
}

function rangeOf_(b) {
  const now = new Date(), start = new Date(now); start.setHours(0, 0, 0, 0);
  const r = String(b.range || 'month');
  if (r === 'today') return [start, now];
  if (r === 'week') { const d = new Date(start); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return [d, now]; }
  if (r === 'year') return [new Date(now.getFullYear(), 0, 1), now];
  if (r === 'custom') { const f = dateOrBlank_(b.from, 'from') || new Date(now.getFullYear(), 0, 1); const t = dateOrBlank_(b.to, 'to') || now; return [f, new Date(day_(t) + 86400000 - 1)]; }
  return [new Date(now.getFullYear(), now.getMonth(), 1), now];
}
/** All figures come from the Sheet records at the time of the request. Nothing is hard-coded. */
function opsOverview_(b) {
  const user = requirePerm_(b.token, 'ops.view.all');
  const [from, to] = rangeOf_(b);
  const inRange = d => d && day_(d) >= from.getTime() && day_(d) <= to.getTime();
  const tickets = readTable_('Tickets');
  const open = tickets.filter(t => CLOSED_STATUSES.indexOf(t.OpStatus) === -1);
  const created = tickets.filter(t => inRange(t.Created));
  const tasks = readTable_('Tasks');
  const quotes = readTable_('Quotes');
  const cnt = (list, key) => list.reduce((a, x) => { const k = x[key] || '—'; a[k] = (a[k] || 0) + 1; return a; }, {});
  const spanDays = Math.max(1, Math.ceil((to - from) / 86400000));
  const bucket = spanDays <= 31 ? 'day' : spanDays <= 120 ? 'week' : 'month';
  const keyOf = d => { const x = new Date(d); if (bucket === 'day') return Utilities.formatDate(x, 'Africa/Johannesburg', 'yyyy-MM-dd'); if (bucket === 'month') return Utilities.formatDate(x, 'Africa/Johannesburg', 'yyyy-MM'); const m = new Date(x); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return Utilities.formatDate(m, 'Africa/Johannesburg', 'yyyy-MM-dd'); };
  const series = {}; for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) series[keyOf(d)] = 0;
  created.forEach(t => { const k = keyOf(t.Created); series[k] = (series[k] || 0) + 1; });
  const staff = staffList_().filter(s => PERMS['ops.edit.own'].indexOf(s.role) !== -1);
  const workload = staff.map(s => ({ email: s.email, name: s.name, active: open.filter(t => t.AssignedTo === s.email).length,
    overdue: open.filter(t => t.AssignedTo === s.email && ticketSummary_(t).overdue).length + tasks.filter(k => k.AssignedTo === s.email && taskView_(k).overdue).length }));
  const sent = quotes.filter(q => inRange(q.SentAt)), accepted = quotes.filter(q => inRange(q.AcceptedAt));
  const confirmedInRange = tickets.filter(t => inRange(t.ConfirmedAt));
  let due = 0, received = 0;
  open.concat(tickets.filter(t => t.OpStatus === 'COMPLETED' && inRange(t.ClosedAt))).forEach(t => { if (t.PaymentStatus && t.PaymentStatus !== 'Not invoiced') { const m = ticketMoney_(t.Ref); due += m.final; received += m.paid; } });
  const dest = {}; tickets.filter(t => t.ConfirmedAt).forEach(t => { const k = t.Destination || t.Package || '—'; dest[k] = (dest[k] || 0) + 1; });
  return {
    range: { from: iso_(from), to: iso_(to), bucket },
    kpis: {
      enquiries: created.length,
      awaitingReview: open.filter(t => ['NEW ENQUIRY', 'AWAITING REVIEW'].indexOf(t.OpStatus) !== -1).length,
      unassigned: open.filter(t => !t.AssignedTo).length,
      inProgress: open.filter(t => t.AssignedTo && !t.ConfirmedAt).length,
      quotesPreparing: open.filter(t => t.OpStatus === 'QUOTATION IN PREPARATION').length + quotes.filter(q => ['Draft', 'Awaiting approval'].indexOf(q.Status) !== -1).length,
      quotesAwaiting: open.filter(t => ['QUOTATION SENT', 'AWAITING CUSTOMER RESPONSE'].indexOf(t.OpStatus) !== -1).length,
      confirmed: confirmedInRange.length,
      outstandingPayments: Math.round(open.filter(t => ['Not invoiced', 'Fully paid', 'Refunded'].indexOf(t.PaymentStatus || 'Not invoiced') === -1).reduce((s, t) => s + ticketMoney_(t.Ref).outstanding, 0)),
      overdueTasks: tasks.filter(k => taskView_(k).overdue).length,
      completed: tickets.filter(t => t.OpStatus === 'COMPLETED' && inRange(t.ClosedAt)).length,
      cancelled: tickets.filter(t => t.OpStatus === 'CANCELLED' && inRange(t.ClosedAt)).length,
    },
    enquiriesOverTime: Object.keys(series).sort().map(k => ({ label: k, value: series[k] })),
    bySource: cnt(created, 'Source'),
    byStatus: cnt(open, 'OpStatus'),
    byDestination: dest,
    workload,
    quoteConversion: { sent: sent.length, accepted: accepted.length, rate: sent.length ? Math.round(accepted.length / sent.length * 100) : 0 },
    bookingConversion: { enquiries: created.length, confirmed: created.filter(t => t.ConfirmedAt).length, rate: created.length ? Math.round(created.filter(t => t.ConfirmedAt).length / created.length * 100) : 0 },
    paymentProgress: { due: Math.round(due), received: Math.round(received) },
    you: { permissions: permissionsOf_(user) },
  };
}

function workload_(b) {
  requirePerm_(b.token, 'ops.workload');
  const tickets = readTable_('Tickets'), tasks = readTable_('Tasks');
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  return staffList_().filter(s => PERMS['ops.edit.own'].indexOf(s.role) !== -1).map(s => {
    const mineOpen = tickets.filter(t => t.AssignedTo === s.email && CLOSED_STATUSES.indexOf(t.OpStatus) === -1);
    const myTasks = tasks.filter(k => k.AssignedTo === s.email);
    const last = readTable_('Activity').filter(a => a.Actor === s.email).slice(-1)[0];
    return { email: s.email, name: s.name, role: s.role, activeTickets: mineOpen.length, overdueTickets: mineOpen.filter(t => ticketSummary_(t).overdue).length,
      supporting: tickets.filter(t => String(t.SupportBy || '').indexOf(s.email) !== -1 && CLOSED_STATUSES.indexOf(t.OpStatus) === -1).length,
      openTasks: myTasks.filter(k => ['COMPLETED', 'CANCELLED'].indexOf(k.Status) === -1).length, overdueTasks: myTasks.filter(k => taskView_(k).overdue).length,
      completedThisMonth: tickets.filter(t => t.AssignedTo === s.email && t.OpStatus === 'COMPLETED' && day_(t.ClosedAt) >= monthStart.getTime()).length,
      tasksDoneThisMonth: myTasks.filter(k => k.Status === 'COMPLETED' && day_(k.CompletedAt) >= monthStart.getTime()).length, lastActivity: last ? iso_(last.Time) : '' };
  });
}

/* =====================================================================
 * Scheduled sweep (hourly trigger): overdue tasks, deadlines, unassigned and inactive tickets.
 * Internal notifications only; nothing is claimed to be sent externally.
 * ===================================================================== */

function opsSweep() {
  const now = Date.now(), dayKey = Utilities.formatDate(new Date(), 'Africa/Johannesburg', 'yyyyMMdd');
  const tickets = readTable_('Tickets').filter(t => CLOSED_STATUSES.indexOf(t.OpStatus) === -1);
  withLock_(() => {
    readTable_('Tasks').forEach(k => {
      if (['COMPLETED', 'CANCELLED'].indexOf(k.Status) !== -1 || !k.Due || !k.AssignedTo) return;
      const due = day_(k.Due);
      if (pastDue_(k.Due)) notify_(k.AssignedTo, 'task_overdue', k.TicketRef, `Overdue task on ${k.TicketRef}: ${k.Title}`, 'overdue:' + k.TaskID + ':' + dayKey);
      else if (due - now < 24 * 3600000) notify_(k.AssignedTo, 'deadline_soon', k.TicketRef, `Due within 24 hours on ${k.TicketRef}: ${k.Title}`, 'soon:' + k.TaskID);
    });
    tickets.forEach(t => {
      if (!t.AssignedTo && now - day_(t.Created) > 4 * 3600000) notifyRoles_(['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT'], 'unassigned', t.Ref, `${t.Ref} has been unassigned for more than 4 hours`, 'unassigned:' + t.Ref + ':' + dayKey);
      if (pastDue_(t.Deadline)) notifyRoles_(['SUPER_ADMIN', 'ADMIN', 'MANAGEMENT'], 'deadline_missed', t.Ref, `${t.Ref} missed its processing deadline`, 'missed:' + t.Ref + ':' + dayKey);
      if (t.AssignedTo && t.NextActionDue && day_(t.NextActionDue) < now) notify_(t.AssignedTo, 'next_action_overdue', t.Ref, `${t.Ref}: next action is overdue (${t.NextAction || 'follow up'})`, 'nextdue:' + t.Ref + ':' + dayKey);
      if (now - day_(t.LastActivity || t.Updated) > 3 * 86400000) {
        notify_(t.AssignedTo, 'inactive', t.Ref, `${t.Ref} has had no activity for 3 days`, 'inactive:' + t.Ref + ':' + dayKey);
        notifyRoles_(['MANAGEMENT'], 'inactive', t.Ref, `${t.Ref} has had no activity for 3 days`, 'inactive-m:' + t.Ref + ':' + dayKey);
      }
      if (t.PaymentStatus && ['Deposit pending', 'Awaiting payment'].indexOf(t.PaymentStatus) !== -1) refreshPaymentStatus_(t.Ref, 'system');
    });
  });
}

/* =====================================================================
 * Setup & migration (non-destructive)
 * ===================================================================== */

function opsSetup_() {
  ['Customers', 'Tickets', 'Tasks', 'ChecklistTemplates', 'Checklist', 'Notes', 'Quotes', 'Payments', 'Suppliers', 'SupplierQuotes', 'Attachments', 'Notifications', 'OpsSettings'].forEach(name => {
    const sh = sheet_(name);
    sh.getRange(1, 1, 1, TABS[name].length).setValues([TABS[name]]).setFontWeight('bold').setBackground('#0e1512').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  });
  opsFolder_();
  try {
    if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'opsSweep')) ScriptApp.newTrigger('opsSweep').timeBased().everyHours(1).create();
  } catch (e) { console.error('Could not create the hourly trigger', e); }
}

/** Creates tickets for website bookings received before the Operations Centre existed. Safe to run more than once. */
function backfillTickets_() {
  let created = 0;
  const rows = sheet_('Bookings').getDataRange().getValues();
  const refCol = TABS.Bookings.indexOf('TicketRef');
  rows.forEach((r, i) => {
    if (i === 0 || r[refCol] || !r[0]) return;
    const b = rowToObj_(TABS.Bookings, r);
    const t = opsCreateTicketFromPublic_({ source: b.Source === 'chat' ? 'Kaycee AI' : 'Website booking form', customer: { name: b.Name, email: b.Email, phone: b.Phone, consentSource: 'Website (before Operations Centre)' },
      package: b.Tour, packageSlug: '', destination: '', activities: '', departDate: /^\d{4}-\d{2}-\d{2}/.test(iso_(b.StartDate)) ? iso_(b.StartDate).slice(0, 10) : '', nights: num_(b.Nights),
      adults: num_(b.Adults), children: num_(b.Children), infants: num_(b.Infants), pensioners: num_(b.Pensioners), rooms: b.Room, extras: String(b.Extras || '').split(', ').filter(Boolean),
      budget: '', paymentPref: b.Payment, description: String(b.Notes || ''), estimate: num_(b.EstimatedTotal), dayTour: num_(b.Nights) === 0 });
    const f = findRow_('Tickets', t.ref);
    writeRow_('Tickets', f.index, Object.assign({}, f.row, { LegacyRef: b.Reference, Created: b.Created || f.row.Created, Received: b.Created || f.row.Received }));
    sheet_('Bookings').getRange(i + 1, refCol + 1).setValue(t.ref);
    created++;
  });
  return created;
}
function menuBackfillTickets_() { SpreadsheetApp.getUi().alert('Created ' + backfillTickets_() + ' ticket(s) from earlier bookings.'); }

/* ======================= Assistant.gs ======================= */
/**
 * KC Assist AI mode: answers staff "how do I…" questions with Claude, using only KCM help content.
 *
 * Off until you add a key:  Apps Script > Project Settings > Script Properties >
 *   ANTHROPIC_API_KEY = sk-ant-...           (from console.anthropic.com; never put it in the code or GitHub)
 *   ASSISTANT_MODEL   = claude-haiku-5-5     (optional; this is the default)
 * Without a key the dashboard uses its built-in, free keyword assistant instead.
 *
 * The browser sends the question plus the help articles it thinks are most relevant (so the prompt stays
 * small and cheap). The model must answer only from those articles and name the article it used.
 * Each staff member can ask up to 40 questions an hour. Questions are not stored.
 */
Object.assign(ACTIONS, {
  assistantAsk: b => {
    const user = requireUser_(b.token);
    if (!isStaff_(user)) throw userError_('Only KCM staff can use KC Assist.', 'forbidden');
    const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
    if (!key) return { mode: 'local' };
    const question = String(b.question || '').trim().slice(0, 500);
    if (!question) throw userError_('Please type a question.');
    const cache = CacheService.getScriptCache(), rk = 'kca:' + user.email, n = Number(cache.get(rk) || 0);
    if (n >= 40) throw userError_('You have asked a lot of questions this hour. Please try again a bit later.', 'rate');
    cache.put(rk, String(n + 1), 3600);
    const arts = (Array.isArray(b.articles) ? b.articles : []).slice(0, 8).map(a => ({
      id: String(a.id || '').slice(0, 40), title: String(a.title || '').slice(0, 120),
      who: String(a.who || '').slice(0, 120), text: String(a.text || '').slice(0, 1800) }));
    const titles = (Array.isArray(b.titles) ? b.titles : []).slice(0, 80).map(t => String(t).slice(0, 100));
    const role = roleOf_(user), name = String(user.name || '').split(' ')[0];
    const system = [
      'You are Kaycee, the dashboard assistant inside the KCM Travel & Tours staff dashboard (the KCM Operations Centre).',
      'Answer the employee\'s question using ONLY the help articles provided. Do not invent buttons, pages, rules or numbers.',
      'If the articles do not answer it, say you are not sure and suggest which of the listed topics to ask about.',
      'The employee\'s role is ' + role + '. If an article says only certain roles can do something and this role is not one of them, say so and say who can.',
      'Write in plain, friendly South African English. Be brief: one short sentence, then numbered steps if there are steps (max 6). Use the exact button and page names from the articles. No emojis, no markdown headings, no bold markers.',
      'Last line must be exactly: ARTICLE: <id of the article you used, or none>',
    ].join('\n');
    const content = 'Help articles:\n\n' + arts.map(a => `[${a.id}] ${a.title}${a.who ? ' (allowed: ' + a.who + ')' : ''}\n${a.text}`).join('\n\n') +
      '\n\nOther topics available: ' + titles.join('; ') + '\n\nEmployee (' + (name || 'staff') + ') asks: ' + question;
    const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify({ model: PropertiesService.getScriptProperties().getProperty('ASSISTANT_MODEL') || 'claude-haiku-5-5', max_tokens: 600, temperature: 0.2, system, messages: [{ role: 'user', content }] }),
    });
    const code = res.getResponseCode();
    if (code !== 200) { console.error('KC Assist AI error', code, res.getContentText().slice(0, 300)); return { mode: 'local', reason: 'ai_unavailable' }; }
    const out = JSON.parse(res.getContentText());
    let text = (out.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
    const m = /\n?ARTICLE:\s*([a-z0-9-]+|none)\s*$/i.exec(text);
    const article = m && m[1].toLowerCase() !== 'none' ? m[1] : '';
    if (m) text = text.slice(0, m.index).trim();
    return { mode: 'ai', answer: text.slice(0, 3000), article };
  },
});

/* ======================= Demo.gs ======================= */
/**
 * KCM demo data: fills the system with clearly labelled FAKE records so every screen can be tried out,
 * then removes them again before going live.
 *
 *  Sheet menu  KCM Admin → Load demo data (testing only)
 *              KCM Admin → Remove demo data
 *
 * Everything is marked:  names end in "(demo)", emails end in @demo.kcm.test, ticket descriptions start with [DEMO].
 * Records are created through the normal backend actions (assign, quote, approve, pay, verify, confirm…), so the
 * history, checklists, notifications and money figures behave exactly like real work.
 * No emails or WhatsApp alerts are sent while demo data is being created.
 * Loading is done in parts so it never hits Google's 6-minute limit: if a part runs out of time you are asked to
 * click "Load demo data" again and it carries on where it stopped.
 */
var DEMO_MODE_ = false;
const DEMO_DOMAIN = '@demo.kcm.test';
const DEMO_TAG = '(demo)';
/** Shared password for all demo staff and demo partners. Demo accounts are deleted by "Remove demo data". */
const DEMO_PASSWORD = 'Demo-Lowveld-2026';
const DEMO_STAFF = [
  { key: 'mgr', email: 'thandi.manager@demo.kcm.test', name: 'Thandi Nkosi (demo)', role: 'MANAGEMENT' },
  { key: 'fin', email: 'fiona.finance@demo.kcm.test', name: 'Fiona van Wyk (demo)', role: 'FINANCE' },
  { key: 'fin2', email: 'sam.finance@demo.kcm.test', name: 'Sam Pillay (demo)', role: 'FINANCE' },
  { key: 'nomsa', email: 'nomsa.ops@demo.kcm.test', name: 'Nomsa Mokoena (demo)', role: 'OPERATIONS' },
  { key: 'sipho', email: 'sipho.ops@demo.kcm.test', name: 'Sipho Dlamini (demo)', role: 'OPERATIONS' },
  { key: 'ayesha', email: 'ayesha.ops@demo.kcm.test', name: 'Ayesha Khan (demo)', role: 'OPERATIONS' },
  { key: 'former', email: 'former.ops@demo.kcm.test', name: 'Pieter Botha (demo, access removed)', role: 'OPERATIONS', status: 'disabled' },
];

const DAY_MS = 86400000;
const dIso_ = days => Utilities.formatDate(new Date(Date.now() + days * DAY_MS), 'Africa/Johannesburg', 'yyyy-MM-dd');

/* ------------------------------------------------------------------ helpers */
function demoCall_(action, token, payload) {
  if (!ACTIONS[action]) throw new Error('Unknown action ' + action);
  return ACTIONS[action](Object.assign({ token }, payload || {}));
}
function demoTokens_() {
  const T = {};
  DEMO_STAFF.filter(s => s.status !== 'disabled').forEach(s => { T[s.key] = startSession_(s.email, { mfa: true, provider: 'demo' }).token; });
  return T;
}
function demoStaffEmail_(key) { return DEMO_STAFF.filter(s => s.key === key)[0].email; }

/**
 * Moves one ticket forward through the real workflow, up to `target`.
 * o: { agent, priority, sell, lines, decline, notes, tasks, overdueTask, handoverTo }
 */
const DEMO_STAGES = ['assigned', 'requirements', 'supplier', 'quoteDraft', 'quoteSubmitted', 'quoteSent', 'accepted',
  'depositRecorded', 'depositVerified', 'confirmed', 'tripPrep', 'travelling', 'completed'];
function demoAdvance_(T, ref, target, o) {
  o = o || {};
  const upto = DEMO_STAGES.indexOf(target);
  const agentKey = o.agent || 'nomsa', ag = T[agentKey], agentEmail = demoStaffEmail_(agentKey);
  const reached = s => DEMO_STAGES.indexOf(s) <= upto;
  let quoteId = null;
  const tk = () => demoCall_('getTicket', T.mgr, { ref });

  if (reached('assigned')) {
    const t = tk();
    if (t.assignedTo !== agentEmail) demoCall_('assignTicket', T.mgr, { ref, assignee: agentEmail, priority: o.priority || 'Normal' });
  }
  if (reached('requirements')) {
    demoCall_('updateTicket', ag, { ref, fields: Object.assign({ budget: o.budget || 'R8 000 – R12 000', paymentPref: 'Deposit then balance' }, o.fields || {}) });
    demoCall_('setTicketStatus', ag, { ref, status: 'REQUIREMENTS UNDER REVIEW' });
    demoCall_('addNote', ag, { ref, kind: 'customer', channel: 'Phone call', content: o.callNote || '[DEMO] Called the customer to confirm dates, numbers and budget. Prefers WhatsApp for updates.' });
    const items = tk().checklist.filter(c => !c.done).slice(0, 3);
    items.forEach(c => demoCall_('updateChecklistItem', ag, { id: c.id, done: true, notes: 'Demo' }));
  }
  if (reached('supplier')) {
    demoCall_('addSupplierQuote', ag, { ref, supplierQuote: { supplierName: o.supplier || 'Lowveld Shuttles (demo)', service: o.supplierService || 'Transport: 4x4 safari vehicle with driver', amount: o.supplierCost || 3200, status: 'Received', notes: '[DEMO] Quote received by email' } });
  }
  if (reached('quoteDraft')) {
    const lines = o.lines || [{ category: 'Transport', description: 'Safari vehicle and driver', supplier: o.supplier || 'Lowveld Shuttles (demo)', cost: o.supplierCost || 3200 },
      { category: 'Activities', description: 'Kruger conservation fees', supplier: 'SANParks', cost: 1400 }];
    quoteId = demoCall_('saveQuote', ag, { ref, quote: { lines, sellingPrice: o.sell || 7500, vatMode: 'exclusive', depositPct: 30, validUntil: dIso_(14), notes: '[DEMO] Includes pickup from your accommodation.' } }).id;
  }
  if (reached('quoteSubmitted')) demoCall_('quoteAction', ag, { quoteId, step: 'submit' });
  if (reached('quoteSent')) {
    demoCall_('quoteAction', T.mgr, { quoteId, step: 'approve' });
    demoCall_('quoteAction', ag, { quoteId, step: 'send' });
  }
  if (o.decline && upto === DEMO_STAGES.indexOf('quoteSent')) {
    demoCall_('quoteAction', ag, { quoteId, step: 'decline', note: '[DEMO] Customer found a cheaper option.' });
    demoCall_('setTicketStatus', ag, { ref, status: 'LOST / DECLINED', note: '[DEMO] Customer chose another operator on price.' });
    return;
  }
  if (reached('accepted')) demoCall_('quoteAction', ag, { quoteId, step: 'accept', note: '[DEMO] Accepted on WhatsApp' });
  let money = null;
  if (reached('depositRecorded')) {
    money = tk().money;
    demoCall_('recordPayment', ag, { ref, payment: { type: 'deposit', amount: money.deposit, method: 'EFT', reference: 'DEMO-' + ref.slice(-6) + '-D', paidOn: dIso_(-2) } });
  }
  if (reached('depositVerified')) {
    const p = demoCall_('listPayments', T.fin, {}).payments.filter(x => x.ref === ref && x.verification === 'Unverified')[0];
    if (p) demoCall_('verifyPayment', T.fin, { id: p.id, decision: 'verify', source: '[DEMO] FNB business account statement' });
  }
  if (reached('confirmed')) demoCall_('setTicketStatus', T.mgr, { ref, status: 'BOOKING CONFIRMED' });
  if (reached('tripPrep')) demoCall_('setTicketStatus', ag, { ref, status: 'TRIP PREPARATION' });
  if (reached('travelling')) demoCall_('setTicketStatus', ag, { ref, status: 'IN PROGRESS / TRAVELLING' });
  if (reached('completed')) {
    money = tk().money;
    if (money.outstanding > 0) {
      const p = demoCall_('recordPayment', T.fin, { ref, payment: { type: 'balance', amount: money.outstanding, method: 'EFT', reference: 'DEMO-' + ref.slice(-6) + '-B', paidOn: dIso_(-1) } });
      demoCall_('verifyPayment', T.fin2, { id: p.id, decision: 'verify', source: '[DEMO] FNB business account statement' });
    }
    demoCall_('addNote', ag, { ref, kind: 'customer', channel: 'WhatsApp', content: '[DEMO] Customer sent thanks and photos after the trip.' });
    demoCall_('setTicketStatus', ag, { ref, status: 'COMPLETED' });
  }
}

/** New enquiry from the website form or Kaycee (creates a Bookings row + ticket, like a real visitor). */
function demoWebsiteEnquiry_(c, trip, source, extra) {
  return submitBooking_({ booking: Object.assign({
    tourSlug: trip.slug, tour: trip.title, startDate: trip.date, nights: trip.nights || 0, adults: trip.adults || 2, children: trip.children || 0,
    infants: 0, pensioners: trip.pensioners || 0, room: trip.room || 'double', extraCodes: trip.extras || [], payment: 'deposit',
    name: c.name, email: c.email, phone: c.phone, notes: '[DEMO] ' + (trip.notes || 'Demo enquiry'), consent: true, source,
  }, extra || {}), idempotencyKey: 'demo-' + Utilities.getUuid() }).reference;
}
/** Enquiry registered by an employee (WhatsApp, phone, email, walk-in...). */
function demoManualEnquiry_(T, agentKey, c, f) {
  return demoCall_('createTicket', T[agentKey], { customer: Object.assign({ consent: true }, c), fields: Object.assign({}, f, { description: '[DEMO] ' + (f.description || '') }) }).ref;
}

const DEMO_TRIPS = {
  kruger: { slug: 'kruger-day-safari', title: 'Kruger Full-Day Open-Vehicle Safari' },
  panorama: { slug: 'panorama-route', title: 'Panorama Route & God\'s Window Day Tour' },
};

/* ------------------------------------------------------------------ the demo script, in resumable parts */
function demoSteps_() {
  const C = n => ({ name: n.name + ' ' + DEMO_TAG, email: n.e + DEMO_DOMAIN, phone: n.p, whatsapp: n.p, type: n.t || 'Individual', location: n.l || '' });
  const people = {
    lerato: C({ name: 'Lerato Khumalo', e: 'lerato.khumalo', p: '071 200 0001', l: 'Johannesburg' }),
    johan: C({ name: 'Johan Pretorius', e: 'johan.p', p: '082 200 0002', t: 'Family', l: 'Pretoria' }),
    zanele: C({ name: 'Zanele Mthembu', e: 'zanele.m', p: '073 200 0003', l: 'Durban' }),
    grace: C({ name: 'Grace Chikwanha', e: 'grace.c', p: '074 200 0004', t: 'Church', l: 'Mbombela' }),
    david: C({ name: 'David Smith', e: 'david.smith', p: '+44 7700 900005', l: 'London, UK' }),
    priya: C({ name: 'Priya Naidoo', e: 'priya.n', p: '076 200 0006', t: 'Corporate', l: 'Sandton' }),
    themba: C({ name: 'Themba Zulu', e: 'themba.z', p: '078 200 0007', t: 'School', l: 'Witbank' }),
    anna: C({ name: 'Anna Müller', e: 'anna.m', p: '+49 151 2000008', l: 'Munich, Germany' }),
    kagiso: C({ name: 'Kagiso Molefe', e: 'kagiso.m', p: '079 200 0009', t: 'Family', l: 'Rustenburg' }),
    fatima: C({ name: 'Fatima Patel', e: 'fatima.p', p: '072 200 0010', l: 'Lenasia' }),
    bongani: C({ name: 'Bongani Ndlovu', e: 'bongani.n', p: '083 200 0011', t: 'Group', l: 'Soweto' }),
    sarah: C({ name: 'Sarah Jacobs', e: 'sarah.j', p: '084 200 0012', l: 'Cape Town' }),
    mpho: C({ name: 'Mpho Sithole', e: 'mpho.s', p: '061 200 0013', l: 'Nelspruit' }),
    chen: C({ name: 'Chen Wei', e: 'chen.w', p: '060 200 0014', t: 'Family', l: 'Midrand' }),
    nandi: C({ name: 'Nandi Mahlangu', e: 'nandi.m', p: '062 200 0015', l: 'Polokwane' }),
    peter: C({ name: 'Peter van der Merwe', e: 'peter.vdm', p: '063 200 0016', t: 'Group', l: 'Bloemfontein' }),
    ruth: C({ name: 'Ruth Mokwena', e: 'ruth.m', p: '064 200 0017', l: 'Hazyview' }),
    ahmed: C({ name: 'Ahmed Hassan', e: 'ahmed.h', p: '065 200 0018', t: 'Corporate', l: 'Rosebank' }),
  };
  const manual = (T, agent, who, f) => demoManualEnquiry_(T, agent, people[who], f);
  const pkg = (dest, days, adults, children, extra) => Object.assign({ enquiryType: 'Package tour', destination: dest, departDate: dIso_(days), returnDate: dIso_(days + 3), nights: 3, adults, children: children || 0, accommodation: '4-star lodge', airportTransfer: 'Yes' }, extra || {});

  return [
    { name: 'Demo staff accounts', run: () => {
      const hash = newPasswordHash_(DEMO_PASSWORD);
      DEMO_STAFF.forEach(s => {
        upsertUser_(s.email, { name: s.name, role: s.role, provider: 'demo', status: s.status || 'active' });
        setUserFields_(s.email, { Name: s.name, Role: s.role, Status: s.status || 'active', PasswordHash: hash.hash, PasswordSalt: hash.scheme, InvitedBy: 'demo data' });
      });
    } },
    { name: 'Demo suppliers', run: T => {
      [['Lowveld Shuttles (demo)', 'Transport', 'Thabo Mashaba', '013 000 1001'], ['Marula Bush Lodge (demo)', 'Accommodation', 'Lindiwe Shabangu', '013 000 1002'],
        ['Blyde Canyon Boat Cruises (demo)', 'Activity', 'Jan Steyn', '013 000 1003'], ['Kruger Gate Guides (demo)', 'Guide', 'Elias Nkuna', '013 000 1004'],
        ['Sabie River Guesthouse (demo)', 'Accommodation', 'Mary Coetzee', '013 000 1005'], ['KMIA Car Hire (demo)', 'Car hire', 'Desk manager', '013 000 1006']]
        .forEach(s => demoCall_('saveSupplier', T.mgr, { supplier: { name: s[0], type: s[1], contact: s[2], phone: s[3], email: s[0].split(' ')[0].toLowerCase() + DEMO_DOMAIN, notes: '[DEMO] supplier' } }));
    } },
    // ----- new and unassigned
    { name: 'New website enquiries', run: () => {
      demoWebsiteEnquiry_(people.lerato, Object.assign({ date: dIso_(25), adults: 2, extras: ['transfer'], notes: 'Celebrating our anniversary' }, DEMO_TRIPS.kruger), 'website');
      demoWebsiteEnquiry_(people.david, Object.assign({ date: dIso_(40), adults: 2, children: 1, notes: 'First time in South Africa' }, DEMO_TRIPS.panorama), 'website');
    } },
    { name: 'New Kaycee enquiries', run: () => {
      demoWebsiteEnquiry_(people.zanele, Object.assign({ date: dIso_(18), adults: 4, notes: 'Girls trip' }, DEMO_TRIPS.panorama), 'chat', { kaycee: { style: 'Scenic & photography', region: 'Panorama Route', budget: 'R2 000–R4 000 pp' } });
      demoWebsiteEnquiry_(people.anna, Object.assign({ date: dIso_(55), adults: 2, notes: 'Honeymoon' }, DEMO_TRIPS.kruger), 'chat', { kaycee: { style: 'Safari & wildlife', region: 'Kruger & Panorama', budget: 'R4 000+ pp' } });
    } },
    // ----- in progress
    { name: 'WhatsApp enquiry (assigned)', run: T => { const r = manual(T, 'sipho', 'johan', pkg('Kruger & Blyde River Canyon', 30, 2, 3, { source: 'WhatsApp', description: 'Family of 5 wants 3 nights near Kruger in the school holidays' })); demoAdvance_(T, r, 'assigned', { agent: 'sipho', priority: 'High' }); } },
    { name: 'Phone enquiry (requirements)', run: T => { const r = manual(T, 'nomsa', 'grace', { source: 'Direct phone call', enquiryType: 'Group or school trip', description: 'Church group of 28 for a day trip to God\'s Window', destination: 'Panorama Route', departDate: dIso_(45), adults: 28 }); demoAdvance_(T, r, 'requirements', { agent: 'nomsa', budget: 'R450 pp' }); } },
    { name: 'Email enquiry (supplier research)', run: T => { const r = manual(T, 'ayesha', 'priya', pkg('Hazyview', 21, 12, 0, { source: 'Email', enquiryType: 'Corporate travel', description: 'Team-building weekend for 12 staff' })); demoAdvance_(T, r, 'supplier', { agent: 'ayesha', supplier: 'Marula Bush Lodge (demo)', supplierService: 'Accommodation: 12 guests, 2 nights', supplierCost: 28000 }); } },
    { name: 'Quote being prepared', run: T => { const r = manual(T, 'nomsa', 'kagiso', pkg('Sabie', 35, 2, 2, { source: 'Referral' })); demoAdvance_(T, r, 'quoteDraft', { agent: 'nomsa', sell: 14500 }); } },
    { name: 'Quote waiting for approval', run: T => {
      const r = manual(T, 'sipho', 'themba', { source: 'Social media', enquiryType: 'Group or school trip', description: 'Grade 10 school tour, 40 learners', destination: 'Kruger', departDate: dIso_(60), adults: 4, children: 40 });
      demoAdvance_(T, r, 'quoteSubmitted', { agent: 'sipho', sell: 36000, supplierCost: 24000 });
      const r2 = manual(T, 'ayesha', 'fatima', pkg('Graskop', 28, 2, 0, { source: 'WhatsApp' }));
      demoAdvance_(T, r2, 'quoteSubmitted', { agent: 'ayesha', sell: 9200 });
    } },
    { name: 'Quote sent to customer', run: T => { const r = manual(T, 'nomsa', 'sarah', pkg('Kruger', 20, 2, 0, { source: 'Email' })); demoAdvance_(T, r, 'quoteSent', { agent: 'nomsa', sell: 11800 }); } },
    { name: 'Accepted, awaiting deposit', run: T => { const r = manual(T, 'sipho', 'chen', pkg('Kruger & Panorama', 26, 2, 2, { source: 'Walk-in customer' })); demoAdvance_(T, r, 'accepted', { agent: 'sipho', sell: 16800 }); } },
    { name: 'Deposits waiting for finance', run: T => {
      const r = manual(T, 'ayesha', 'nandi', pkg('Blyde River Canyon', 15, 2, 0, { source: 'WhatsApp' }));
      demoAdvance_(T, r, 'depositRecorded', { agent: 'ayesha', sell: 8600 });
      const r2 = demoWebsiteEnquiry_(people.mpho, Object.assign({ date: dIso_(12), adults: 3, notes: 'Birthday trip' }, DEMO_TRIPS.kruger), 'website');
      demoAdvance_(T, r2, 'depositRecorded', { agent: 'nomsa', sell: 6900 });
    } },
    { name: 'Confirmed booking', run: T => { const r = manual(T, 'nomsa', 'peter', pkg('Kruger', 10, 8, 0, { source: 'Direct phone call', enquiryType: 'Package tour' })); demoAdvance_(T, r, 'confirmed', { agent: 'nomsa', sell: 42000, supplierCost: 18000 }); } },
    { name: 'Trip preparation', run: T => { const r = manual(T, 'sipho', 'ruth', pkg('Panorama Route', 5, 2, 0, { source: 'WhatsApp' })); demoAdvance_(T, r, 'tripPrep', { agent: 'sipho', sell: 7200 }); } },
    { name: 'Travelling now', run: T => { const r = manual(T, 'ayesha', 'ahmed', pkg('Kruger', 0, 4, 0, { source: 'Email', enquiryType: 'Corporate travel' })); demoAdvance_(T, r, 'travelling', { agent: 'ayesha', sell: 19500 }); } },
    // ----- finished
    { name: 'Completed trips', run: T => {
      const a = manual(T, 'nomsa', 'bongani', pkg('Kruger', -20, 6, 0, { source: 'WhatsApp', enquiryType: 'Package tour' }));
      demoAdvance_(T, a, 'completed', { agent: 'nomsa', sell: 24000 });
      const b = manual(T, 'sipho', 'lerato', { source: 'Direct phone call', enquiryType: 'Day tour', description: 'Return customer: Panorama day tour', destination: 'Panorama Route', departDate: dIso_(-12), adults: 2 });
      demoAdvance_(T, b, 'completed', { agent: 'sipho', sell: 3600, supplierCost: 1800 });
    } },
    { name: 'Lost, cancelled and on hold', run: T => {
      const lost = manual(T, 'ayesha', 'david', pkg('Kruger', 50, 2, 0, { source: 'Email', description: 'Luxury lodge enquiry' }));
      demoAdvance_(T, lost, 'quoteSent', { agent: 'ayesha', sell: 38000, decline: true });
      const cancel = manual(T, 'nomsa', 'zanele', { source: 'WhatsApp', enquiryType: 'Transfer / transport', description: 'Airport transfer KMIA to Hazyview', destination: 'Hazyview', departDate: dIso_(8), adults: 2 });
      demoAdvance_(T, cancel, 'assigned', { agent: 'nomsa' });
      demoCall_('setTicketStatus', T.nomsa, { ref: cancel, status: 'CANCELLED', note: '[DEMO] Customer\'s flight was cancelled.' });
      const hold = manual(T, 'sipho', 'kagiso', { source: 'Referral', enquiryType: 'Custom trip', description: 'Mozambique add-on, waiting for passports', destination: 'Kruger & Mozambique', departDate: dIso_(90), adults: 2 });
      demoAdvance_(T, hold, 'requirements', { agent: 'sipho' });
      demoCall_('setTicketStatus', T.sipho, { ref: hold, status: 'ON HOLD', note: '[DEMO] Waiting for the customer\'s passports to be renewed.' });
    } },
    { name: 'Refund waiting for approval', run: T => {
      const r = manual(T, 'nomsa', 'johan', { source: 'Direct phone call', enquiryType: 'Day tour', description: 'Kruger day safari; one guest fell ill', destination: 'Kruger', departDate: dIso_(-5), adults: 3 });
      demoAdvance_(T, r, 'completed', { agent: 'nomsa', sell: 5400, supplierCost: 3000 });
      demoCall_('recordPayment', T.fin, { ref: r, payment: { type: 'refund', amount: 1200, method: 'EFT', reference: 'DEMO-RF-' + r.slice(-4), notes: '[DEMO] Goodwill refund: one guest could not travel' } });
    } },
    { name: 'Tasks, follow-ups and a handover', run: T => {
      const mine = demoCall_('listTickets', T.mgr, { view: 'tickets' }).tickets.filter(t => t.open && t.assignedTo);
      mine.slice(0, 6).forEach((t, i) => {
        const agent = DEMO_STAFF.filter(s => s.email === t.assignedTo)[0];
        if (!agent || !T[agent.key]) return;
        demoCall_('createTask', T[agent.key], { ref: t.ref, title: ['Send updated itinerary', 'Confirm pickup time with driver', 'Chase customer for ID copies', 'Call lodge to hold rooms', 'Check park gate times', 'Follow up on quotation'][i], priority: i % 3 === 0 ? 'High' : 'Normal', due: dIso_(i % 2 === 0 ? -2 : 3) });
      });
      // a handover: Sipho is "on leave", his WhatsApp ticket goes to Nomsa with a summary
      const sip = mine.filter(t => t.assignedTo === demoStaffEmail_('sipho'))[0];
      if (sip) demoCall_('assignTicket', T.mgr, { ref: sip.ref, assignee: demoStaffEmail_('nomsa'), handoverSummary: '[DEMO] Sipho on leave. Customer prefers WhatsApp; lodge quote pending; next step is the quotation.' });
    } },
    // ----- batch 2: richer records so every field and list has something in it
    { name: 'More unassigned enquiries (to practise assigning)', run: T => {
      [['peter', 'Email', 'Golf weekend for 8 at White River', 'White River', 'Corporate travel', 34, 8, 0],
        ['nandi', 'Social media', 'Graduation trip, 6 friends, budget conscious', 'Graskop & Pilgrim\'s Rest', 'Package tour', 48, 6, 0],
        ['fatima', 'Referral', 'Halaal-friendly safari for 2 families', 'Kruger', 'Package tour', 62, 4, 4],
        ['chen', 'Website booking form', 'Self-drive route with lodge stays', 'Panorama Route', 'Custom trip', 70, 2, 2],
        ['ahmed', 'Email', 'Conference shuttle KMIA ↔ Mbombela, 3 days', 'Mbombela', 'Transfer / transport', 16, 24, 0]]
        .forEach(x => {
          const r = demoManualEnquiry_(T, 'ayesha', people[x[0]], { source: x[1], description: x[2], destination: x[3], enquiryType: x[4], departDate: dIso_(x[5]), returnDate: dIso_(x[5] + 2), adults: x[6], children: x[7], budget: 'R' + (x[6] * 2500) + ' total' });
          demoCall_('assignTicket', T.mgr, { ref: r, assignee: '' }); // back to Unassigned for practice
        });
    } },
    { name: 'Fully detailed trips', run: T => {
      const full = (dest, days, adults, children, f) => Object.assign({
        enquiryType: 'Package tour', destination: dest, destinations: dest + ', Blyde River Canyon, God\'s Window', departDate: dIso_(days), returnDate: dIso_(days + 4), nights: 4, adults, children,
        accommodation: '4-star lodge, half board', rooms: (adults / 2) + ' double rooms' + (children ? ', 1 family room' : ''), transport: '4x4 safari vehicle with driver-guide', activities: 'Sunrise game drive, Blyde boat cruise, Bourke\'s Luck Potholes',
        airportTransfer: 'Yes', carHire: 'No', insurance: 'Yes', meals: 'Breakfast and dinner; one vegetarian', specialRequests: 'Anniversary cake on night 2', accessibility: 'One traveller uses a walking stick: ground-floor room please',
        budget: 'R25 000 – R35 000', paymentPref: '30% deposit, balance 30 days before', intakeNotes: '[DEMO] Detailed brief taken on the phone', commsNotes: 'Prefers WhatsApp after 17:00' }, f || {});
      const a = demoManualEnquiry_(T, 'nomsa', people.sarah, full('Kruger', 40, 2, 0, { source: 'Direct phone call' }));
      demoAdvance_(T, a, 'quoteSent', { agent: 'nomsa', sell: 28500, lines: [{ category: 'Accommodation', description: 'Marula Bush Lodge, 4 nights half board', supplier: 'Marula Bush Lodge (demo)', cost: 14800 }, { category: 'Transport', description: 'Safari vehicle and driver-guide, 5 days', supplier: 'Lowveld Shuttles (demo)', cost: 6200 }, { category: 'Activities', description: 'Blyde boat cruise and park fees', supplier: 'Blyde Canyon Boat Cruises (demo)', cost: 2100 }, { category: 'Additional services', description: 'Travel insurance', supplier: '', cost: 900 }] });
      const b = demoManualEnquiry_(T, 'sipho', people.johan, full('Hazyview', 22, 2, 2, { source: 'WhatsApp', accessibility: '' }));
      demoAdvance_(T, b, 'confirmed', { agent: 'sipho', sell: 33800, supplierCost: 21000 });
      demoCall_('recordPayment', T.sipho, { ref: b, payment: { type: 'instalment', amount: 8000, method: 'EFT', reference: 'DEMO-' + b.slice(-6) + '-I1', paidOn: dIso_(-1), notes: '[DEMO] Second instalment' } });
      const c = demoManualEnquiry_(T, 'ayesha', people.grace, full('Sabie', 30, 20, 8, { source: 'Email', enquiryType: 'Group or school trip', rooms: '14 rooms at Sabie River Guesthouse', transport: '2 x 22-seater buses', accessibility: '' }));
      demoAdvance_(T, c, 'accepted', { agent: 'ayesha', sell: 72000, supplierCost: 48000 });
    } },
    { name: 'More quotation states', run: T => {
      // approved but not yet sent
      const a = demoManualEnquiry_(T, 'nomsa', people.mpho, { source: 'WhatsApp', enquiryType: 'Day tour', description: 'Panorama day tour for 4', destination: 'Panorama Route', departDate: dIso_(19), adults: 4 });
      demoAdvance_(T, a, 'quoteSubmitted', { agent: 'nomsa', sell: 5200, supplierCost: 3000 });
      const qa = (demoCall_('getTicket', T.mgr, { ref: a }).quotes || [])[0];
      if (qa) demoCall_('quoteAction', T.mgr, { quoteId: qa.id, step: 'approve' });
      // revised quotation: version 1 superseded by version 2
      const b = demoManualEnquiry_(T, 'sipho', people.anna, { source: 'Email', enquiryType: 'Package tour', description: 'Honeymoon, wants a private plunge pool', destination: 'Kruger', departDate: dIso_(85), returnDate: dIso_(89), nights: 4, adults: 2 });
      demoAdvance_(T, b, 'quoteSent', { agent: 'sipho', sell: 46000, supplierCost: 30000 });
      const v2 = demoCall_('saveQuote', T.sipho, { ref: b, quote: { lines: [{ category: 'Accommodation', description: 'Luxury suite with plunge pool', cost: 30000 }], sellingPrice: 43500, discount: 1000, vatMode: 'exclusive', depositPct: 40, validUntil: dIso_(10), notes: '[DEMO] Revised after customer asked for a better rate' } });
      demoCall_('quoteAction', T.sipho, { quoteId: v2.id, step: 'submit' });
    } },
    { name: 'Website messages', run: () => {
      [['Tumi Maseko', 'Do you do day trips from Johannesburg to the Panorama Route?'], ['Lisa Brown', 'Can you arrange a wheelchair-friendly safari vehicle?'],
        ['Andile Cele', 'Price for a school group of 60 to Kruger in March?'], ['Hennie Joubert', 'Do you offer airport transfers from KMIA on Sundays?']]
        .forEach((m, i) => submitMessage_({ message: { name: m[0] + ' ' + DEMO_TAG, email: m[0].split(' ')[0].toLowerCase() + DEMO_DOMAIN, phone: '081 300 00' + (10 + i), message: '[DEMO] ' + m[1] } }));
    } },
    { name: 'Partner applications', run: T => {
      const hash = newPasswordHash_(DEMO_PASSWORD);
      const apps = [
        ['vehicle', 'Lowveld Executive Transfers (demo)', 'Bheki Mahlalela', 'Mbombela', 'Approved', 'Premium Plus', { make: 'Toyota', model: 'Fortuner 2.8 GD-6', year: '2022', seats: '7' }],
        ['accommodation', 'Marula Bush Lodge (demo)', 'Lindiwe Shabangu', 'Hazyview', 'Approved', 'Signature', { rooms: '12', stars: '4' }],
        ['guide', 'Kruger Gate Guides (demo)', 'Elias Nkuna', 'Skukuza', 'Approved', 'Premium', {}],
        ['tour_operator', 'Panorama Day Trips (demo)', 'Karen Steyn', 'Graskop', 'In review', '', {}],
        ['accommodation', 'Sabie River Guesthouse (demo)', 'Mary Coetzee', 'Sabie', 'Needs info', '', { rooms: '5' }],
        ['vehicle', 'Budget Kombi Hire (demo)', 'Sizwe Nkosi', 'Witbank', 'Rejected', '', { make: 'Toyota', model: 'Quantum', year: '2009', seats: '14' }],
        ['activity', 'Blyde Canyon Boat Cruises (demo)', 'Jan Steyn', 'Hoedspruit', 'Pending', '', {}],
      ];
      apps.forEach((a, i) => {
        const email = a[1].split(' ')[0].toLowerCase() + '.partner' + i + DEMO_DOMAIN;
        upsertUser_(email, { name: a[2] + ' ' + DEMO_TAG, provider: 'demo', status: a[4] === 'Approved' ? 'active' : 'pending' });
        setUserFields_(email, { PasswordHash: hash.hash, PasswordSalt: hash.scheme });
        const app = createApplication_(findUser_(email), { partnerType: a[0], contactName: a[2] + ' ' + DEMO_TAG, phone: '082 400 00' + (10 + i), businessName: a[1], province: 'Mpumalanga', city: a[3],
          description: '[DEMO] ' + a[1] + ' has served Lowveld visitors for several years with friendly, reliable service.', services: ['Tours'], details: a[6], yearsInBusiness: String(3 + i) });
        const found = findApplication_(app.id);
        const f = { Status: a[4], Updated: new Date() };
        if (a[4] !== 'Pending') { f.ReviewedBy = demoStaffEmail_('mgr'); f.ReviewedAt = new Date(); }
        if (a[4] === 'Needs info') f.ReviewNote = '[DEMO] Please add a clear photo of the bathroom and proof of ownership.';
        if (a[4] === 'Rejected') f.ReviewNote = '[DEMO] The vehicle is older than our 10-year limit.';
        if (a[5]) f.Tier = a[5];
        setApplicationFields_(found.index, f);
      });
    } },
    { name: 'Partner trips, payouts and ratings', run: T => {
      const partners = readTable_('Partners').filter(p => p.Status === 'Approved' && String(p.BusinessName).indexOf(DEMO_TAG) !== -1);
      const done = readTable_('Tickets').filter(t => t.OpStatus === 'COMPLETED' && String(t.Description).indexOf('[DEMO]') === 0).map(t => t.Ref);
      const refs = done.concat(['DEMO-OLD-1', 'DEMO-OLD-2', 'DEMO-OLD-3']);
      const statuses = ['Paid', 'Paid', 'Approved', 'Pending', 'On hold', 'Paid'];
      let k = 0;
      partners.forEach(p => refs.slice(0, 3).forEach((ref, i) => {
        const j = demoCall_('saveJob', T.fin, { job: { partnerId: p.ID, bookingRef: ref, service: p.PartnerType === 'accommodation' ? '2 nights, 2 guests' : 'Kruger day trip', guests: 2 + i, gross: 2500 + 900 * i, commissionPct: 15, date: dIso_(-30 + i * 9), notes: '[DEMO]' } });
        const s = statuses[k++ % statuses.length];
        if (s !== 'Pending') demoCall_('setPayoutStatus', T.fin, { id: j.id, status: s });
        if (i < 2) submitRating_({ partnerId: p.ID, bookingRef: ref, name: ['Lerato K.', 'Johan P.', 'Grace C.'][i] + ' ' + DEMO_TAG, stars: 5 - (k % 2), comment: '[DEMO] ' + ['Friendly, on time and very knowledgeable.', 'Great experience, the kids loved it.'][i] });
      }));
    } },
    { name: 'Spread the dates over the last two months', run: () => demoBackdate_() },
  ];
}

/** Gives the demo records realistic "received" dates over the past ~9 weeks so the charts have a shape. */
function demoBackdate_() {
  withLock_(() => {
    const back = (tab, cols, pick) => {
      const sh = sheet_(tab), values = sh.getDataRange().getValues();
      const idx = cols.map(c => TABS[tab].indexOf(c));
      let n = 0;
      for (let r = 1; r < values.length; r++) {
        if (!pick(values[r])) continue;
        const d = new Date(Date.now() - ((n * 37) % 62 + 1) * DAY_MS - (n % 9) * 3600000); n++;
        idx.forEach(i => { if (i !== -1) values[r][i] = d; });
      }
      if (values.length > 1) sh.getRange(1, 1, values.length, values[0].length).setValues(values);
    };
    const isDemo = row => row.join(' ').indexOf('[DEMO]') !== -1 || row.join(' ').indexOf(DEMO_DOMAIN) !== -1 || row.join(' ').indexOf(DEMO_TAG) !== -1;
    const demoCust = {}; readTable_('Customers').forEach(c => { if (String(c.Email).indexOf(DEMO_DOMAIN) !== -1) demoCust[c.CustomerRef] = 1; });
    // keep tickets that are still NEW recent so the "incoming" view looks fresh
    back('Tickets', ['Created', 'Received'], r => demoCust[r[1]] && ['NEW ENQUIRY', 'UNASSIGNED', 'AWAITING REVIEW'].indexOf(r[TABS.Tickets.indexOf('OpStatus')]) === -1);
    back('Bookings', ['Created'], isDemo);
    back('Partners', ['Created'], isDemo);
    back('Messages', ['Created'], isDemo);
    back('Ratings', ['Created'], isDemo);
  });
}

/* ------------------------------------------------------------------ run / remove */
function loadDemoData_() {
  const props = PropertiesService.getScriptProperties();
  const steps = demoSteps_();
  let start = Number(props.getProperty('DEMO_PROGRESS') || 0);
  if (start >= steps.length) return { done: true, message: 'Demo data is already loaded. Use "Remove demo data" first if you want to load it again.' };
  const t0 = Date.now(), errors = [];
  DEMO_MODE_ = true;
  try {
    if (start === 0) steps[0].run(), start = 1, props.setProperty('DEMO_PROGRESS', '1');
    const T = demoTokens_();
    for (let i = start; i < steps.length; i++) {
      if (Date.now() - t0 > 4.3 * 60000) return { done: false, message: `Part loaded (${i} of ${steps.length} steps). Click "Load demo data" again to continue.` };
      try { steps[i].run(T); } catch (e) { errors.push(steps[i].name + ': ' + e.message); console.error('Demo step failed', steps[i].name, e && e.stack); }
      props.setProperty('DEMO_PROGRESS', String(i + 1));
    }
  } finally { DEMO_MODE_ = false; }
  log_('system', 'demo_data_loaded', 'demo', errors.length ? errors.join(' | ').slice(0, 1500) : 'all steps');
  return { done: true, errors, message: 'Demo data loaded.' + (errors.length ? ' Some steps had problems:\n• ' + errors.join('\n• ') : '') };
}

/** Removes every demo record (and only demo records) from every tab. */
function removeDemoData_() {
  const demoCust = {}, demoTickets = {}, demoPartners = {}, demoJobs = {};
  readTable_('Customers').forEach(c => { if (String(c.Email).indexOf(DEMO_DOMAIN) !== -1 || String(c.FullName).indexOf(DEMO_TAG) !== -1) demoCust[c.CustomerRef] = 1; });
  readTable_('Tickets').forEach(t => { if (demoCust[t.CustomerRef] || String(t.Description).indexOf('[DEMO]') === 0) demoTickets[t.Ref] = 1; });
  const folders = [];
  readTable_('Partners').forEach(p => { if (String(p.Email).indexOf(DEMO_DOMAIN) !== -1) { demoPartners[p.ID] = 1; if (p.DriveFolderId) folders.push(p.DriveFolderId); } });
  readTable_('Jobs').forEach(j => { if (demoPartners[j.PartnerID]) demoJobs[j.JobID] = 1; });
  const keys = Object.keys(demoCust).concat(Object.keys(demoTickets), Object.keys(demoPartners), Object.keys(demoJobs));
  const isDemo = row => {
    const s = row.map(String).join('\u0001');
    if (s.indexOf(DEMO_DOMAIN) !== -1 || s.indexOf(DEMO_TAG) !== -1 || s.indexOf('[DEMO]') !== -1) return true;
    return row.some(v => keys.indexOf(String(v)) !== -1);
  };
  const removed = {};
  withLock_(() => {
    Object.keys(TABS).forEach(tab => {
      if (['ChecklistTemplates', 'OpsSettings'].indexOf(tab) !== -1) return;
      const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tab);
      if (!sh || sh.getLastRow() < 2) return;
      const values = sh.getDataRange().getValues();
      const keep = [values[0]].concat(values.slice(1).filter(r => !isDemo(r)));
      const n = values.length - keep.length;
      if (!n) return;
      sh.getRange(1, 1, keep.length, keep[0].length).setValues(keep);
      sh.deleteRows(keep.length + 1, n); // drop the rows freed at the bottom
      removed[tab] = n;
    });
  });
  folders.forEach(id => { try { DriveApp.getFolderById(id).setTrashed(true); } catch (e) { /* already gone */ } });
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty('DEMO_PROGRESS');
  // restart ticket numbering for this year if no real tickets exist yet
  const year = Utilities.formatDate(new Date(), 'Africa/Johannesburg', 'yyyy');
  if (!readTable_('Tickets').length) { props.deleteProperty('SEQ_TICKET_' + year); }
  if (!readTable_('Customers').length) { props.deleteProperty('SEQ_CUSTOMER'); }
  log_('system', 'demo_data_removed', 'demo', JSON.stringify(removed));
  return removed;
}

function menuLoadDemo_() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Load demo data?', 'This adds FAKE customers, tickets, quotations, payments, staff and partners for testing. Everything is labelled "(demo)" and can be removed with "Remove demo data". No emails or WhatsApp messages are sent.\n\nDemo staff password: ' + DEMO_PASSWORD, ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  const r = loadDemoData_();
  ui.alert(r.message);
}
function menuRemoveDemo_() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Remove all demo data?', 'Every record marked "(demo)", "[DEMO]" or @demo.kcm.test is deleted from every tab, including the demo staff and partner accounts. Real records are not touched. This cannot be undone.', ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  const r = removeDemoData_();
  const lines = Object.keys(r).map(k => '• ' + k + ': ' + r[k]);
  ui.alert(lines.length ? 'Demo data removed:\n' + lines.join('\n') : 'No demo data was found.');
}
