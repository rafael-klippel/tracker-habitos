// Gera ícones PNG placeholder (quadrado sólido + "T") para o manifest do PWA.
// Rode com: node scripts/generate-icons.cjs
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

function crc32(buf) {
  let c
  const table = crc32.table || (crc32.table = (() => {
    const t = []
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c
    }
    return t
  })())
  c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function makePng(size, bg, fg) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type RGB
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const stride = 4 // margin ratio denominator for the "T" glyph
  const raw = Buffer.alloc(size * (1 + size * 3))
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 3)
    raw[rowStart] = 0 // filter none
    for (let x = 0; x < size; x++) {
      const isBar = y < size / stride && x > size * 0.2 && x < size * 0.8
      const isStem = x > size * 0.42 && x < size * 0.58 && y >= size / stride && y < size * 0.82
      const isGlyph = isBar || isStem
      const [r, g, b] = isGlyph ? fg : bg
      const off = rowStart + 1 + x * 3
      raw[off] = r
      raw[off + 1] = g
      raw[off + 2] = b
    }
  }

  const idat = zlib.deflateSync(raw, { level: 9 })
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
  return png
}

const bg = [79, 70, 229] // #4f46e5 indigo
const fg = [255, 255, 255]

const outDir = path.join(__dirname, '..', 'public')
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), makePng(192, bg, fg))
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), makePng(512, bg, fg))
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), makePng(180, bg, fg))
console.log('Ícones gerados em public/')
