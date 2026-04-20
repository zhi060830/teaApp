const fs = require('fs')
const path = require('path')

// 模拟用户库（注册成功就存在这里）
const users = new Map()

// 模拟登录态
const tokens = new Set()

module.exports = (req, res) => {
  const { method, url } = req
  const apiPath = url.replace('/api/', '').split('?')[0]

  // 跨域
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  if (method === 'OPTIONS') return res.end()

  // 图片验证码
  if (apiPath === 'captcha') {
    const code = Math.random().toString(36).slice(2,6).toUpperCase()
    res.setHeader('Content-Type','image/svg+xml')
    return res.end(`
      <svg width="120" height="40">
        <rect width="100%" height="100%" fill="#f5f5f5"/>
        <text x="15" y="30" font-size="26">${code}</text>
      </svg>
    `)
  }

  // 登录：必须是注册过的手机号 + 对应密码
  if (apiPath === 'login' && method === 'POST') {
    let body = ''
    req.on('data', d => body += d)
    req.on('end', () => {
      try {
        const { phone, password } = JSON.parse(body)
        const user = users.get(phone)

        if (!user) {
          return res.json({ code: 400, msg: '该手机号未注册' })
        }
        if (user.password !== password) {
          return res.json({ code: 400, msg: '密码不正确' })
        }

        const token = 'TOKEN_' + Date.now()
        tokens.add(token)
        res.json({ code: 200, msg: '登录成功', data: { token } })
      } catch (e) {
        res.json({ code: 400, msg: '参数错误' })
      }
    })
    return
  }

  // 注册：保存手机号+密码
  if (apiPath === 'register' && method === 'POST') {
    let body = ''
    req.on('data', d => body += d)
    req.on('end', () => {
      try {
        const { phone, password } = JSON.parse(body)
        // 已注册则不让重复注册
        if (users.has(phone)) {
          return res.json({ code: 400, msg: '该手机号已注册' })
        }
        // 保存用户
        users.set(phone, { phone, password })
        res.json({ code: 200, msg: '注册成功' })
      } catch (e) {
        res.json({ code: 400, msg: '参数错误' })
      }
    })
    return
  }

  // 需要登录的接口校验
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!tokens.has(token)) {
    return res.json({ code: 401, message: '请先登录' })
  }

  res.json({ code: 404, msg: '接口不存在' })
}
