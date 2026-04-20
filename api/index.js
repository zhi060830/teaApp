const fs = require('fs')
const path = require('path')

// 模拟登录态
const tokens = new Set()

module.exports = (req, res) => {
  const { method, url } = req
  const apiPath = url.replace('/api/', '').split('?')[0]

  // 跨域
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  // 预检请求直接返回
  if (method === 'OPTIONS') {
    return res.end()
  }

  // ==========================================
  // 1. 图片验证码接口（你要的图三效果！）
  // ==========================================
  if (apiPath === 'captcha' && method === 'GET') {
    // 随机4位验证码
    const code = Math.random().toString(36).slice(2,6).toUpperCase()
    
    // 存起来，注册时可以校验（这里先固定演示用）
    req.sessionCaptcha = code

    res.setHeader('Content-Type', 'image/svg+xml')
    return res.end(`
      <svg width="120" height="40">
        <rect width="100%" height="100%" fill="#f5f5f5"/>
        <text x="15" y="30" font-size="26" fill="#333">${code}</text>
      </svg>
    `)
  }

  // ==========================================
  // 2. 登录接口
  // ==========================================
  if (apiPath === 'login' && method === 'POST') {
    let body = ''
    req.on('data', d => body += d)
    req.on('end', () => {
      const token = 'TOKEN_' + Date.now()
      tokens.add(token)
      const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'login.json'), 'utf8'))
      data.data = data.data || {}
      data.data.token = token
      res.json(data)
    })
    return
  }

  // ==========================================
  // 3. 注册接口
  // ==========================================
  if (apiPath === 'register' && method === 'POST') {
    let body = ''
    req.on('data', d => body += d)
    req.on('end', () => {
      const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'register.json'), 'utf8'))
      res.json(data)
    })
    return
  }

  // ==========================================
  // 需登录的接口校验
  // ==========================================
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!tokens.has(token)) {
    return res.json({ code: 401, message: '请先登录' })
  }

  // 自动读取JSON文件
  const jsonFile = path.join(__dirname, `${apiPath}.json`)
  if (fs.existsSync(jsonFile)) {
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'))
    return res.json(data)
  }

  res.json({ code: 404, message: '接口不存在' })
}
