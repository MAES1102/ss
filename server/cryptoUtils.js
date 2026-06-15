const crypto = require('crypto');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

console.log('[crypto] RSA-2048 key pair generated.');

function signData(data) {
  const payload = JSON.stringify(data);
  const sign    = crypto.createSign('SHA256');
  sign.update(payload);
  sign.end();
  const signature = sign.sign(privateKey, 'base64');
  return signature;
}

function verifySignature(data, signature) {
  const payload = JSON.stringify(data);
  const verify  = crypto.createVerify('SHA256');
  verify.update(payload);
  verify.end();
  return verify.verify(publicKey, signature, 'base64');
}

const AES_KEY = crypto.randomBytes(32);
console.log('[crypto] AES-256-GCM key generated.');

function encryptData(data) {
  const iv     = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);

  const plaintext = JSON.stringify(data);
  let ciphertext  = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext     += cipher.final('base64');
  const authTag   = cipher.getAuthTag().toString('base64');

  return {
    iv:         iv.toString('base64'),
    ciphertext,
    authTag,
  };
}

function decryptData({ iv, ciphertext, authTag }) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    AES_KEY,
    Buffer.from(iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  let plaintext  = decipher.update(ciphertext, 'base64', 'utf8');
  plaintext     += decipher.final('utf8');
  return JSON.parse(plaintext);
}

module.exports = { publicKey, signData, verifySignature, encryptData, decryptData };
