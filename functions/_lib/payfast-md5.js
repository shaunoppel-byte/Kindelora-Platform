// Pure JavaScript RFC 1321 MD5 for PayFast's legacy ITN signature protocol.
// MD5 is not appropriate for new cryptographic designs; PayFast requires it here.
export function md5(input){
 const bytes=new TextEncoder().encode(input),length=bytes.length;
 const padded=new Uint8Array(Math.ceil((length+9)/64)*64);padded.set(bytes);padded[length]=128;
 const bitLength=BigInt(length)*8n;
 for(let i=0;i<8;i++)padded[padded.length-8+i]=Number((bitLength>>BigInt(i*8))&255n);
 const shifts=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21];
 const k=Array.from({length:64},(_,i)=>Math.floor(Math.abs(Math.sin(i+1))*4294967296)>>>0);
 let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
 const view=new DataView(padded.buffer);
 for(let offset=0;offset<padded.length;offset+=64){
  let a=a0,b=b0,c=c0,d=d0;
  for(let i=0;i<64;i++){
   let f,g,s;
   if(i<16){f=(b&c)|(~b&d);g=i;s=shifts[i%4]}
   else if(i<32){f=(d&b)|(~d&c);g=(5*i+1)%16;s=shifts[4+i%4]}
   else if(i<48){f=b^c^d;g=(3*i+5)%16;s=shifts[8+i%4]}
   else{f=c^(b|~d);g=(7*i)%16;s=shifts[12+i%4]}
   const sum=(a+f+k[i]+view.getUint32(offset+g*4,true))>>>0;
   const rotated=((sum<<s)|(sum>>>(32-s)))>>>0;
   [a,b,c,d]=[d,(b+rotated)>>>0,b,c];
  }
  a0=(a0+a)>>>0;b0=(b0+b)>>>0;c0=(c0+c)>>>0;d0=(d0+d)>>>0;
 }
 return [a0,b0,c0,d0].map(x=>Array.from({length:4},(_,i)=>(x>>>(i*8)&255).toString(16).padStart(2,'0')).join('')).join('');
}
