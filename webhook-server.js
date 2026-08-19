const http = require('http');
const { exec } = require('child_process');
const crypto = require('crypto');

const SECRET = process.env.KAU_WEBHOOK_SECRET || 'change-me';
const PORT = process.env.KAU_WEBHOOK_PORT || 9000;
const SCRIPT = '/home/hermes/.hermes/scripts/deploy-kau-gis.sh';

function verifySignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(payload, 'utf8');
  const expected = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/deploy') {
    res.writeHead(404).end('Not found');
    return;
  }

  const signature = req.headers['x-hub-signature-256'] || '';
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const payload = Buffer.concat(chunks).toString('utf8');
    try {
      if (!verifySignature(payload, signature)) {
        res.writeHead(401).end('Unauthorized');
        return;
      }
      const data = JSON.parse(payload);
      if (data.ref !== 'refs/heads/master') {
        res.writeHead(200).end('Ignored non-master push');
        return;
      }
      res.writeHead(202).end('Deployment started');
      exec(SCRIPT, (err, stdout, stderr) => {
        console.log(stdout);
        if (stderr) console.error(stderr);
        if (err) console.error('Deploy failed:', err);
      });
    } catch (e) {
      res.writeHead(400).end('Bad request');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
