// utils/zegoTokenGenerator.js
import crypto from 'crypto';

/**
 * ZEGO Token Generator for Node.js
 * Basit versiyon - Production için kullanılabilir
 */

export function generateToken04(appID, userID, secret, effectiveTimeInSeconds, payload = '') {
  try {
    const time = Math.floor(Date.now() / 1000);
    const expire = time + effectiveTimeInSeconds;
    
    // Token body
    const body = {
      app_id: appID,
      user_id: userID,
      nonce: Math.floor(Math.random() * 2147483647),
      ctime: time,
      expire: expire
    };
    
    if (payload) {
      body.payload = payload;
    }
    
    // AES encryption
    const key = Buffer.from(secret, 'utf8');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-128-cbc', key);
    cipher.setAutoPadding(true);
    
    let encrypted = cipher.update(JSON.stringify(body), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Create final token
    const tokenData = {
      version: '04',
      expire: expire,
      iv: iv.toString('base64'),
      encrypted: encrypted
    };
    
    const token = '04' + Buffer.from(JSON.stringify(tokenData)).toString('base64');
    
    return {
      errorCode: 0,
      token: token,
      errorMessage: 'success'
    };
    
  } catch (error) {
    return {
      errorCode: 1,
      token: '',
      errorMessage: error.message
    };
  }
}