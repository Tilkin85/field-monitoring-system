const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../form-data.js');
test('old drafts move all category descriptions into separate fields without losing context',()=>{
 const defaults={schemaVersion:2,fossils:'',prehistoricArtifacts:'',historicArtifacts:'',architecturalFeatures:'',stratigraphySelections:[]};
 const saved={mapData:{markers:[]},fossils:'Existing text',stratigraphy:'Existing layers',fieldObservations:[
  {type:'fossil',description:'Shells',depth:'1 m',notes:'Retain notes'},
  {type:'fossil',description:'Bone'},
  {type:'prehistoric',description:'Flake'},
  {type:'historic',description:'Glass'},
  {type:'architectural',description:'Wall'},
  {type:'geological',description:'Channel'}]};
 const restored=APForm.restore(defaults,saved);
 assert.equal(restored.fossils,'Existing text\nShells\nBone');
 assert.equal(restored.prehistoricArtifacts,'Flake');assert.equal(restored.historicArtifacts,'Glass');assert.equal(restored.architecturalFeatures,'Wall');
 assert.equal(restored.fieldObservations[0].description,'');assert.equal(restored.fieldObservations[0].depth,'1 m');assert.equal(restored.fieldObservations[0].notes,'Retain notes');
 assert.equal(restored.fieldObservations[5].description,'Channel');assert.equal(restored.stratigraphy,'Existing layers');
 assert.equal(saved.fieldObservations[0].description,'Shells');
 assert.deepEqual(APForm.restore(defaults,restored),restored);
});
test('new drafts preserve separate selections and free text',()=>{
 const draft={schemaVersion:2,mapData:{markers:[]},fieldObservations:[],stratigraphySelections:['beds','laminations'],stratigraphy:'Thin layers',fossils:'Shells'};
 assert.deepEqual(APForm.restore({},draft),{...draft,additionalFindings:[]});
});
test('additional findings survive restoration without changing the primary locality',()=>{
 const saved={schemaVersion:2,mapData:{markers:[]},fieldObservations:[],fieldNumber:'FIRST',additionalFindings:[{id:'second',fieldNumber:'SECOND',location:'Trench 2',utmE:'123'}]};
 const restored=APForm.restore({},saved);
 assert.equal(restored.fieldNumber,'FIRST');assert.deepEqual(restored.additionalFindings,saved.additionalFindings);
});
