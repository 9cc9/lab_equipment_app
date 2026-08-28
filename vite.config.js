import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const cookieRewriter = (proxy, { isHttpsDev = false } = {}) => {
  proxy.on('proxyRes', (proxyRes) => {
    const setCookieHeaders = proxyRes.headers['set-cookie']
    if (setCookieHeaders) {
      proxyRes.headers['set-cookie'] = setCookieHeaders.map((cookie) => {
        let rewritten = cookie
          .replace(/Domain=[^;]+/gi, '')
          .replace(/Path=[^;]+/gi, '')
          .replace(/SameSite=[^;]+/gi, '')
          .replace(/Secure/gi, '')
          .replace(/;\s*$/, '')
          + '; Path=/; SameSite=Lax'
        if (isHttpsDev) {
          rewritten += '; Secure'
        }
        return rewritten
      })
    }
  })
}

const loadHttpsConfig = () => {
  const certDir = path.resolve(__dirname, '.cert')
  const keyPath = path.join(certDir, 'dev-key.pem')
  const certPath = path.join(certDir, 'dev-cert.pem')
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.warn('[vite] 未找到 .cert/dev-*.pem，请先运行: npm run cert:generate')
    return false
  }
  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiPort = env.VITE_API_PORT || '8085'
  const devPort = Number(env.VITE_DEV_PORT || 5174)
  const apiTarget = env.VITE_API_BASE_URL || `http://127.0.0.1:${apiPort}`
  const useHttps = env.VITE_DEV_HTTPS === 'true'

  const createProxyConfig = () => ({
    target: apiTarget,
    changeOrigin: true,
    secure: false,
    configure: (proxy) => cookieRewriter(proxy, { isHttpsDev: useHttps }),
  })

  const httpsConfig = useHttps ? loadHttpsConfig() : false

  return {
    plugins: [react()],
    resolve: {
      alias: {
        shared: path.resolve(__dirname, './src/shared'),
        entities: path.resolve(__dirname, './src/entities'),
        components: path.resolve(__dirname, './src/components'),
        pages: path.resolve(__dirname, './src/pages'),
        app: path.resolve(__dirname, './src/app'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: devPort,
      strictPort: true,
      https: httpsConfig || undefined,
      proxy: {
        // Vite 只支持「前缀匹配」或「^ 开头的正则」；`**/*.json` 无法匹配 /rooms.json
        '^/[^?]*\\.json': createProxyConfig(),
      },
    },
  }
})
