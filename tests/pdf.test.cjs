/* Run with: node --test tests/pdf.test.cjs (no package install required). */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
global.PDFLib=require('../vendor/pdf-lib.min.js');
global.fontkit=require('../vendor/fontkit.umd.min.js');
require('../report-pdf.js');
const root=path.resolve(__dirname,'..');
const options={template:fs.readFileSync(path.join(root,'assets/ap-monitoring-sheet.pdf')),font:fs.readFileSync(path.join(root,'assets/NotoSans-Regular.ttf'))};
test('blank export preserves original sheet dimensions and content streams',async()=>{
 const original=await PDFLib.PDFDocument.load(options.template);
 const pdf=await PDFLib.PDFDocument.load(await APReport.build({includeMap:false},options));
 assert.equal(pdf.getPageCount(),1);assert.deepEqual(pdf.getPages()[0].getSize(),{width:612,height:792});
 const streams=p=>{const c=p.node.Contents();return c instanceof PDFLib.PDFArray?c.asArray().map(ref=>p.doc.context.lookup(ref).getContents()):[c.getContents()];};
 const source=streams(original.getPages()[0]),out=streams(pdf.getPages()[0]);
 for(const stream of source)assert(out.some(s=>Buffer.from(s).equals(Buffer.from(stream))));
});
test('overflow, long words, map fallback and photos paginate without failure',async()=>{
 const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aU1cAAAAASUVORK5CYII=';
 const pdf=await PDFLib.PDFDocument.load(await APReport.build({monitor:'María Sánchez',projectName:'Test project',includeMap:false,prehistoricArtifacts:'long observation '.repeat(50),extraNotes:('Long note '+ 'x'.repeat(150)+'\n').repeat(80),mapData:{center:[34,-118],zoom:12,markers:[{lat:34,lng:-118,type:'fossil',description:'Recorded find'}]},fieldPhotos:{general:[{preview:png}]}},options));
 assert(pdf.getPageCount()>4);
 for(const p of pdf.getPages())assert.deepEqual(p.getSize(),{width:612,height:792});
});
test('long header fields cannot consume the notes-page body',async()=>{
 const pdf=await PDFLib.PDFDocument.load(await APReport.build({projectName:'long-name '.repeat(400),monitor:'M'.repeat(400),extraNotes:'Last note',includeMap:false},options));
 assert(pdf.getPageCount()>1 && pdf.getPageCount()<20);
});
