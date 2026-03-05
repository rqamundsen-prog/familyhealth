/**
 * 短信服务封装
 *
 * 开发环境：验证码打印到控制台（无需配置）
 * 生产环境：阿里云 SMS（需配置以下环境变量）
 *   - SMS_ENABLED=true
 *   - ALIYUN_ACCESS_KEY_ID=your_key
 *   - ALIYUN_ACCESS_KEY_SECRET=your_secret
 *   - ALIYUN_SMS_SIGN_NAME=你的签名
 *   - ALIYUN_SMS_TEMPLATE_CODE=SMS_xxxxxxxx
 */

interface SmsResult {
  success: boolean
  error?: string
}

// 生成6位随机验证码
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 发送短信验证码
export async function sendSms(phone: string, code: string): Promise<SmsResult> {
  const isDev = process.env.NODE_ENV === 'development'
  const smsEnabled = process.env.SMS_ENABLED === 'true'

  // 开发模式或未配置SMS：打印到控制台
  if (isDev || !smsEnabled) {
    console.log(`\n📱 [短信验证码] 手机: ${phone}  验证码: ${code}  (有效5分钟)\n`)
    return { success: true }
  }

  // 生产环境：阿里云 SMS
  try {
    const result = await sendAliyunSms(phone, code)
    return result
  } catch (error) {
    console.error('SMS error:', error)
    return { success: false, error: '短信发送失败，请稍后重试' }
  }
}

// 阿里云 SMS（通过 HTTP API 调用，无需 SDK）
async function sendAliyunSms(phone: string, code: string): Promise<SmsResult> {
  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID!
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET!
  const signName = process.env.ALIYUN_SMS_SIGN_NAME!
  const templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE!

  if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
    console.error('阿里云 SMS 环境变量未配置')
    return { success: false, error: '短信服务未配置' }
  }

  // 阿里云签名算法
  const timestamp = new Date().toISOString()
  const nonce = Math.random().toString(36).substring(2)

  const params: Record<string, string> = {
    AccessKeyId: accessKeyId,
    Action: 'SendSms',
    Format: 'JSON',
    PhoneNumbers: phone,
    RegionId: 'cn-hangzhou',
    SignName: signName,
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: nonce,
    SignatureVersion: '1.0',
    TemplateCode: templateCode,
    TemplateParam: JSON.stringify({ code }),
    Timestamp: timestamp,
    Version: '2017-05-25',
  }

  // 排序并编码参数
  const sortedKeys = Object.keys(params).sort()
  const canonicalQuery = sortedKeys
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')

  const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(canonicalQuery)}`

  // HMAC-SHA1 签名
  const { createHmac } = await import('crypto')
  const signature = createHmac('sha1', `${accessKeySecret}&`)
    .update(stringToSign)
    .digest('base64')

  const url = `https://dysmsapi.aliyuncs.com/?${canonicalQuery}&Signature=${encodeURIComponent(signature)}`

  const response = await fetch(url)
  const data = await response.json() as { Code: string; Message: string }

  if (data.Code === 'OK') {
    return { success: true }
  } else {
    return { success: false, error: data.Message || '短信发送失败' }
  }
}
