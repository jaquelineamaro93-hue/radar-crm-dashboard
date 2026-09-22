import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapTalentCSV} from '../supabase/functions/_shared/talents-csv.ts';
const fixture='Nome,Linkedin,Localização,Número de WhatsApp ,Senioridade\nPessoa Teste,linkedin.com/in/teste,Salvador,71999999999,Pleno';
test('preserves existing data and stable source IDs',()=>{
 const [p]=mapTalentCSV(fixture);
 assert.equal(p.id,'csv-'+encodeURIComponent('Pessoa Teste|linkedin.com/in/teste'));
 assert.equal(p.local,'Salvador');assert.equal(p.whatsapp,'71999999999');
});
test('ignores titles, notes, blank lines and BOM before header',()=>{
 assert.deepEqual(mapTalentCSV('\uFEFFLista de profissionais\n\nAtualizado hoje\n'+fixture),mapTalentCSV(fixture));
});
test('normalizes header case, accents and whitespace',()=>{
 assert.deepEqual(mapTalentCSV(fixture.replace('Nome,Linkedin,Localização',' NOME , LINKEDIN ,LOCALIZACAO')),mapTalentCSV(fixture));
});
test('parses quoted fields and skips rows without a name',()=>{
 const result=mapTalentCSV('Nome,Linkedin\r\n"Pessoa, Teste","linkedin.com/in/teste"\r\n,\r\n');
 assert.equal(result.length,1);assert.equal(result[0].nome,'Pessoa, Teste');
});
test('rejects unrelated, missing and malformed headers',()=>{
 for(const value of ['<html>Unavailable</html>','Nome,Telefone\nTeste,123','Nome,Linkedin\n"unclosed'])assert.throws(()=>mapTalentCSV(value));
});
