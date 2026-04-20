const fs = require('fs')
const path = require('path')

// 模拟登录态
const tokens = new Set()

module.exports = (req, res) => {
  const { method, url } = req
  const apiPath = url.replace('/api/', '').split('?')[0]

  // 跨域
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  // 1. 图片验证码（GET）
  if (apiPath === 'captcha') {
    res.setHeader('Content-Type', 'image/svg+xml')
    return res.end(`<svg width="100" height="40"><text x="10" y="30" font-size="25">5G8S</text></svg>`)
  }

  // 2. 登录（POST）
  if (apiPath === 'login' && method === 'POST') {
    let body = ''
    req.on('data', d => body += d)
    req.on('end', () => {
      const token = 'TOKEN_' + Date.now()
      tokens.add(token)
      const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'login.json'), 'utf8'))
      data.token = token
      res.json(data)
    })
    return
  }

  // 3. 注册（POST）
  if (apiPath === 'register' && method === 'POST') {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'register.json'), 'utf8'))
    return res.json(data)
  }

  // ==========================
  // 下面：所有接口必须登录才能访问
  // ==========================
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!tokens.has(token)) {
    return res.json({ code: 401, message: '请先登录' })
  }

  // 自动读取你对应的 JSON 文件
  const jsonFile = path.join(__dirname, `${apiPath}.json`)
  if (fs.existsSync(jsonFile)) {
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'))
    return res.json(data)
  }

  res.json({ code: 404, message: '接口不存在' })
}
