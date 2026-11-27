// Dependency-free ASCII PDF writer for fictional preview reports only.
export function makeFinancePdf(lines){
 const safe=s=>String(s).replace(/[^\x20-\x7e]/g,'?').replace(/([\\()])/g,'\\$1');
 const pages=[];for(let i=0;i<lines.length;i+=42)pages.push(lines.slice(i,i+42));if(!pages.length)pages.push([]);
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
 const ids=[];
 pages.forEach((rows,i)=>{const page=objects.length+1,stream=page+1;ids.push(page);const commands=['0.12 0.19 0.31 rg','0 800 595 42 re f','0.78 0.65 0.33 rg','40 790 515 2 re f','BT /F1 11 Tf 0.12 0.19 0.31 rg 40 770 Td 16 TL',...rows.map((s,j)=>(j?'T* ':'')+'('+safe(s)+') Tj'),'ET','BT /F1 9 Tf 40 40 Td (Page '+(i+1)+' of '+pages.length+' - DEMO) Tj ET'].join('\n');objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents '+stream+' 0 R >>','<< /Length '+commands.length+' >>\nstream\n'+commands+'\nendstream');});
 objects[1]='<< /Type /Pages /Count '+ids.length+' /Kids ['+ids.map(x=>x+' 0 R').join(' ')+'] >>';
 let out='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(out.length);out+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});const xref=out.length;out+='xref\n0 '+offsets.length+'\n0000000000 65535 f \n'+offsets.slice(1).map(x=>String(x).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';return out;
}
