const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { FormData } = require('undici');

async function main() {
  const tmp = path.join(process.cwd(), 'tmp-video.mp4');
  fs.writeFileSync(tmp, Buffer.from('000000186674797069736f6d00000200', 'hex'));
  const form = new FormData();
  form.append('file', fs.createReadStream(tmp), { contentType: 'video/mp4', filename: 'test.mp4' });

  try {
    const res = await fetch('http://127.0.0.1:3000/api/upload', { method: 'POST', body: form });
    console.log('status', res.status);
    console.log('headers', JSON.stringify([...res.headers.entries()], null, 2));
    const text = await res.text();
    console.log('body', text);
  } catch (err) {
    console.error('error', err);
  } finally {
    fs.unlinkSync(tmp);
  }
}

main();
