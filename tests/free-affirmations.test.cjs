const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const slugs=['small-steps-still-count','rest-is-part-of-growing','the-light-returns'];
const freeCardCount=4; // Three committed PNG artworks plus the fourth scenic artwork card.
test('four free affirmation cards render exactly once',()=>{
 assert.equal((html.match(/<article class="free-affirmation-card">/g)||[]).length,freeCardCount);
 for(const slug of slugs){assert.ok(html.includes('src="/affirmations/artwork/'+slug+'.png"'));assert.ok(html.includes('download="'+slug+'.png"'));}
 assert.ok(html.includes('I am enough as I am'), 'Fourth scenic affirmation is missing');
});
test('free artwork is committed and linked for download without payment',()=>{
 for(const slug of slugs){const file='affirmations/artwork/'+slug+'.png';assert.ok(fs.existsSync(file),'Missing '+file);assert.ok(fs.statSync(file).size>10000,'Artwork unexpectedly small '+file);assert.ok(html.includes('href="/'+file+'"'));}
 assert.match(html,/Free to download/);
});
test('each gallery card provides Plus-gated save action without blocking free downloads',()=>{
 for(const slug of ['small-steps','rest-is-worthy','light-returns','i-am-enough'])assert.ok(html.includes('data-heart="gallery-'+slug+'" data-heart-type="affirmation"'));
 assert.equal((html.match(/class="heart-save gallery-heart"/g)||[]).length,3);
 const gate=fs.readFileSync('member-favourites.js','utf8');assert.match(gate,/data-heart-type="affirmation"/);
 assert.match(html,/Saving to favourites requires Plus membership/);
});
test('gallery is not dependent on external QR code providers',()=>{
 assert.doesNotMatch(html,/api\\.qrserver\\.com/);
 assert.equal((html.match(/class="btn gallery-download"/g)||[]).length,3);
});
