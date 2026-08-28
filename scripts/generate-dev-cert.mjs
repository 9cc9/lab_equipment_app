/**
 * 生成本地 HTTPS 开发证书（含 127.0.0.1 + 局域网 IP，供手机 https://192.168.x.x:5174 访问）
 */
import { execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const certDir = path.join(__dirname, '../.cert')
const keyPath = path.join(certDir, 'dev-key.pem')
const certPath = path.join(certDir, 'dev-cert.pem')

const getLanIps = () => {
  const ips = new Set(['127.0.0.1'])
  const extra = (process.env.DEV_CERT_EXTRA_IPS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  extra.forEach((ip) => ips.add(ip))

  try {
    for (const interfaces of Object.values(os.networkInterfaces())) {
      for (const iface of interfaces || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          ips.add(iface.address)
        }
      }
    }
  } catch {
    console.warn('⚠️  无法自动检测局域网 IP，可通过环境变量补充: DEV_CERT_EXTRA_IPS=192.168.1.106')
  }
  return [...ips]
}

const buildSan = (ips) => {
  const parts = ['DNS:localhost']
  for (const ip of ips) {
    parts.push(`IP:${ip}`)
  }
  return parts.join(',')
}

const generate = () => {
  const ips = getLanIps()
  const san = buildSan(ips)
  fs.mkdirSync(certDir, { recursive: true })

  execSync(
    [
      'openssl req -x509',
      '-newkey rsa:2048',
      `-keyout "${keyPath}"`,
      `-out "${certPath}"`,
      '-days 365',
      '-nodes',
      '-subj "/CN=lab-equipment-dev"',
      `-addext "subjectAltName=${san}"`,
    ].join(' '),
    { stdio: 'inherit' }
  )

  const lanIp = ips.find((ip) => ip.startsWith('192.168.') || ip.startsWith('10.'))
  console.log('\n✅ 本地 HTTPS 证书已生成')
  console.log('   证书目录:', certDir)
  console.log('   包含 IP:', ips.join(', '))
  if (lanIp) {
    console.log(`\n📱 手机访问: https://${lanIp}:5174`)
    console.log('   首次需在浏览器点「高级 → 继续访问」信任证书')
  }
}

generate()
