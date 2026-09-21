/* The first page is the supplied PDF, loaded verbatim; never redraw its artwork. */
(function (root) {
  'use strict';
  const labels = {
    monitor:'Monitor', projectName:'Project name', projectNumber:'Project number', projectLocation:'Project location', date:'Date', totalHrs:'Total hours', totalMi:'Total miles', timeIn:'Time in', timeOut:'Time out', projectAreas:'Project areas monitored', fossils:'Fossils', prehistoricArtifacts:'Prehistoric artifacts/ecofacts', historicArtifacts:'Historic artifacts/ecofacts', architecturalFeatures:'Architectural features', stratigraphy:'Stratigraphy', color:'Color', texture:'Texture', sorting:'Sorting', siteConditions:'Site conditions & personnel', excavationConditions:'Excavation conditions', otherObservations:'Other observations & comments', fieldNumber:'Field number', fieldId:'Field ID', datum:'Datum detail', condition:'Condition', contextDescription:'Artifact/ecofact context', approxAge:'Approximate age', soils:'Soils', location:'Finding location', fateOfLocality:'Fate of locality', utmE:'UTM easting', utmN:'UTM northing', latitude:'Latitude N', longitude:'Longitude W', elevation:'Elevation', numberOfArtifacts:'Number of artifacts/ecofacts'
  };
  // Each rectangle is [x, top of baseline, width, number of lines] in PDF points.
  // Coordinates are measured against the original 612 x 792 point sheet.
  const fields = {
    monitor:[406,57,146,1], projectName:[125,78,217,1], projectNumber:[196,102,148,1],
    projectLocation:[145,117,196,1], date:[409,78,143,1], totalHrs:[407,102,42,1], totalMi:[502,102,48,1], timeIn:[405,117,139,1], timeOut:[405,133,139,1],
    projectAreas:[58,144,293,1], fossils:[106,158,447,2], prehistoricArtifacts:[58,201,447,1], historicArtifacts:[191,225,363,1], architecturalFeatures:[173,264,381,1], stratigraphy:[217,322,333,1],
    color:[291,361,52,1], texture:[407,361,47,1], sorting:[504,361,47,1], siteConditions:[58,425,494,1], excavationConditions:[332,458,213,1], otherObservations:[218,493,334,1],
    fieldNumber:[127,548,77,1], fieldId:[248,548,107,1], datum:[473,548,80,1], condition:[364,565,179,1], contextDescription:[219,582,152,1], approxAge:[474,582,75,1], soils:[87,600,465,1], location:[215,617,334,1], fateOfLocality:[299,634,240,1], utmE:[145,652,62,1], utmN:[220,652,57,1], latitude:[323,652,64,1], longitude:[428,652,59,1], elevation:[513,652,36,1], numberOfArtifacts:[466,667,70,1]
  };
  function str(v) { return v == null ? '' : String(v); }
  function wrap(text, width, font, size) {
    const result = [];
    for (const paragraph of str(text).replace(/\r/g,'').split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        if (line && font.widthOfTextAtSize(line + ' ' + word,size) <= width) { line += ' ' + word; continue; }
        if (line) { result.push(line); line = ''; }
        for (const char of word) {
          if (line && font.widthOfTextAtSize(line + char,size) > width) { result.push(line); line = ''; }
          line += char;
        }
      }
      result.push(line);
    }
    return result;
  }
  async function build(data, options = {}) {
    const { PDFDocument, rgb } = root.PDFLib;
    const read = async path => { const r = await fetch(path); if (!r.ok) throw new Error('Could not load ' + path); return r.arrayBuffer(); };
    const doc = await PDFDocument.load(options.template || await read('assets/ap-monitoring-sheet.pdf'));
    doc.registerFontkit(root.fontkit);
    const font = await doc.embedFont(options.font || await read('assets/NotoSans-Regular.ttf'), {subset:true});
    const sheet = doc.getPages()[0];
    const ink = rgb(0.07,0.16,0.22);
    const additions = [];
    const values = {...data};
    values.stratigraphy = [
      (data.stratigraphySelections || []).join(' / '), data.stratigraphy
    ].filter(Boolean).join('; ');
    const categories = {fossil:'fossils',prehistoric:'prehistoricArtifacts',historic:'historicArtifacts',architectural:'architecturalFeatures'};
    for (const [type,key] of Object.entries(categories)) {
      values[key] = [data[key],...(data.fieldObservations || []).filter(o=>o.type===type).map(o=>o.description)].filter(Boolean).join('; ');
    }
    function text(page,value,x,top,size=9) { page.drawText(str(value),{x,y:page.getHeight()-top,size,font,color:ink}); }
    function ellipse(x,top,width,height=12) { sheet.drawEllipse({x:x+width/2,y:792-top-height/2,xScale:width/2+2,yScale:height/2,borderColor:ink,borderWidth:0.8}); }
    const continued = {};
    for (const [key,[x,top,width,lines]] of Object.entries(fields)) {
      const value = str(values[key]).trim();
      if (!value) continue;
      const wrapped = wrap(value,width,font,8);
      // Never shrink long entries into unreadable text or silently truncate them.
      if (wrapped.length > lines) {
        text(sheet,'See notes',x,top,7);
        additions.push([labels[key],value]); continued[key] = true;
      } else wrapped.forEach((line,i)=>text(sheet,line,x,top+i*10,8));
    }
    const choices = {
      grainSize:{F:[169,352,7],M:[183,352,10],C:[199,352,9]},
      seds:{'mud/s':[91,365,28],'silt/s':[124,365,20],'sand/s':[150,365,29],'lime/s':[185,365,26],shale:[216,365,24],conglomerate:[246,365,60],breccia:[312,365,32],concretions:[349,365,51]},
      mineralization:{caliche:[133,379,31],siliceous:[173,379,38],paleosol:[219,379,37],alluvium:[264,379,37],'lag deposits':[309,379,53]}
    };
    for (const [key,positions] of Object.entries(choices)) {
      const selected = Array.isArray(data[key]) ? data[key] : data[key] ? [data[key]] : [];
      for (const value of selected) {
        if (positions[value]) ellipse(...positions[value]);
        else additions.push([key,value]);
      }
    }
    for (const [key,top] of Object.entries({prehistoricArtifacts:193,historicArtifacts:232,architecturalFeatures:270,otherObservations:520})) {
      if (values[key]) ellipse(continued[key]?537:549,top,8);
    }
    if ((data.seds || []).length) ellipse(549,365,8);
    // Notes pages are independent of the original sheet and paginate every line.
    let page, y;
    function newPage(title='Notes & supporting information') {
      page=doc.addPage([612,792]); y=55;
      text(page,title,42,y,16); y+=23;
      const heading=[data.projectName,data.date,data.monitor].filter(Boolean).join(' | ');
      const headerLines=wrap(heading,528,font,9);
      for (const line of headerLines.slice(0,2)) { text(page,line,42,y,9); y+=13; }
      page.drawLine({start:{x:42,y:792-y},end:{x:570,y:792-y},color:rgb(.8,.84,.85),thickness:1}); y+=23;
      text(page,'Supporting page '+(doc.getPageCount()-1),42,767,8);
    }
    function block(title,value) {
      if (!str(value).trim()) return;
      if (!page || y>698) newPage();
      for (const line of wrap(title,528,font,11)) { if(y>724)newPage(); text(page,line,42,y,11);y+=15; }
      for (const line of wrap(value,528,font,10)) { if(y>728)newPage(); text(page,line,42,y,10);y+=15; }
      y+=14;
    }
    for(const [label,value] of additions) block(label+' (continued from sheet)',value);
    block('Extra notes',data.extraNotes);
    for(const [i,o] of (data.fieldObservations||[]).entries()) {
      const extra = Object.entries(o).filter(([k,v])=>!['id','type','description'].includes(k)&&str(v).trim()).map(([k,v])=>k+': '+v);
      if (!categories[o.type] && o.description) extra.unshift('Description: '+o.description);
      if(extra.length) block('Observation '+(i+1)+' - '+o.type,extra.join('\n'));
    }
    async function picture(src,title) {
      if (!src) return;
      let embedded;
      try {
        embedded = /^data:image\/png/.test(src) ? await doc.embedPng(src) : await doc.embedJpg(src);
      } catch (error) {
        // Browser-supported uploads such as WebP are converted without losing them.
        if (!root.document) throw error;
        const img=new Image(); img.src=src; await img.decode();
        const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
        canvas.getContext('2d').drawImage(img,0,0); embedded=await doc.embedPng(canvas.toDataURL('image/png'));
      }
      const scale=Math.min(528/embedded.width,470/embedded.height);
      const width=embedded.width*scale, height=embedded.height*scale;
      if(!page || y+height+42>735)newPage();
      text(page,title,42,y,11);y+=18;
      page.drawImage(embedded,{x:42,y:792-y-height,width,height});y+=height+22;
    }
    if (data.includeMap !== false || (data.mapData?.markers||[]).length) {
      newPage('Notes - monitoring map');
      const markers=data.mapData?.markers||[];
      if(options.mapImage) {
        await picture(options.mapImage,'Map at time of export');
        block('Map attribution','© OpenStreetMap contributors');
      } else if(markers.length) {
        block('Location overview','Coordinate plot of recorded markers (no street or terrain basemap). Marker numbers match the key below.');
        const xs=markers.map(m=>Number(m.lng)),ys=markers.map(m=>Number(m.lat));
        const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys),maxY=Math.max(...ys);
        const top=y; const h=260;
        page.drawRectangle({x:42,y:792-top-h,width:528,height:h,borderColor:ink,borderWidth:.6});
        markers.forEach((m,i)=>{const x=65+(Number(m.lng)-minX)/(maxX-minX||1)*475;const t=top+235-(Number(m.lat)-minY)/(maxY-minY||1)*210;page.drawCircle({x,y:792-t,size:4,color:ink});text(page,String(i+1),x+6,t-4,9);});
        y+=h+22;
      } else block('Map snapshot unavailable','No markers were recorded. A basemap could not be captured; the map view is listed below.');
      if(data.mapData?.center) block('Map view','Center: '+data.mapData.center.join(', ')+'; zoom: '+data.mapData.zoom);
      for(const [i,m] of markers.entries())block('Marker '+(i+1)+' - '+m.type,'Latitude: '+m.lat+'; longitude: '+m.lng+'\n'+str(m.description));
    }
    for(const [i,p] of (data.fieldPhotos?.general||[]).entries()) {
      await picture(p.preview,'Field photo '+(i+1)); block('Photo details',[p.file?.name,p.timestamp].filter(Boolean).join(' | '));
    }
    for(const [i,p] of (data.photoLog||[]).entries()) {
      const detail=Object.entries(p).filter(([k,v])=>!['id','photoFile','photoPreview'].includes(k)&&str(v).trim()).map(([k,v])=>k+': '+v).join('\n');
      block('Photo log '+(i+1),detail); await picture(p.photoPreview,'Photo log image '+(i+1));
    }
    return doc.save();
  }
  root.APReport = {build, fields, wrap};
})(typeof window !== 'undefined' ? window : globalThis);
