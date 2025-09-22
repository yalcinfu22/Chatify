// utils/zegoTokenGenerator.js
import crypto from 'crypto';

/**
 * ZEGO Token Generator for Node.js - Production Ready
 * Implements token04 format for ZEGO Express SDK 2.17.0+
 */

// Error codes for token generation
const ErrorCode = {
  SUCCESS: 0,
  APP_ID_INVALID: 1,
  USER_ID_INVALID: 3,
  SECRET_INVALID: 5,
  EFFECTIVE_TIME_INVALID: 6,
  PAYLOAD_INVALID: 7
};

// Privilege constants for room permissions
const Privilege = {
  PrivilegeKeyLogin: 1,    // Room login permission
  PrivilegeKeyPublish: 2,  // Stream publishing permission
  PrivilegeEnable: 1,      // Grant privilege
  PrivilegeDisable: 0      // Deny privilege
};

/**
 * Validates input parameters
 */
function validateParams(appID, userID, secret, effectiveTimeInSeconds) {
  if (!appID || typeof appID !== 'number') {
    return { isValid: false, errorCode: ErrorCode.APP_ID_INVALID, errorMessage: 'AppID invalid' };
  }
  
  if (!userID || typeof userID !== 'string') {
    return { isValid: false, errorCode: ErrorCode.USER_ID_INVALID, errorMessage: 'UserID invalid' };
  }
  
  if (!secret || typeof secret !== 'string' || secret.length !== 32) {
    return { isValid: false, errorCode: ErrorCode.SECRET_INVALID, errorMessage: 'Secret must be a 32 character string' };
  }
  
  if (!effectiveTimeInSeconds || typeof effectiveTimeInSeconds !== 'number' || effectiveTimeInSeconds <= 0) {
    return { isValid: false, errorCode: ErrorCode.EFFECTIVE_TIME_INVALID, errorMessage: 'EffectiveTimeInSeconds invalid' };
  }
  
  // Maximum token validity is 24 days (2073600 seconds)
  if (effectiveTimeInSeconds > 2073600) {
    return { isValid: false, errorCode: ErrorCode.EFFECTIVE_TIME_INVALID, errorMessage: 'EffectiveTimeInSeconds cannot exceed 24 days' };
  }
  
  return { isValid: true };
}

/**
 * Makes padding for the payload
 */
function makeNonce() {
  return crypto.randomBytes(8).readBigUInt64BE();
}

/**
 * Generates ZEGO Token04
 * @param {number} appID - Application ID from ZEGO Console
 * @param {string} userID - User identifier
 * @param {string} secret - 32-byte ServerSecret from ZEGO Console
 * @param {number} effectiveTimeInSeconds - Token validity period in seconds (max 24 days)
 * @param {string} payload - Optional JSON string for room/stream permissions
 * @returns {Object} Token result with errorCode, token, and errorMessage
 */
export function generateToken04(appID, userID, secret, effectiveTimeInSeconds, payload = '') {
  try {
    // Validate parameters
    const validation = validateParams(appID, userID, secret, effectiveTimeInSeconds);
    if (!validation.isValid) {
      return {
        errorCode: validation.errorCode,
        token: '',
        errorMessage: validation.errorMessage
      };
    }
    
    // Validate payload if provided
    if (payload && typeof payload !== 'string') {
      return {
        errorCode: ErrorCode.PAYLOAD_INVALID,
        token: '',
        errorMessage: 'Payload must be a string'
      };
    }
    
    // Create token data
    const currentTime = Math.floor(Date.now() / 1000);
    const expire = currentTime + effectiveTimeInSeconds;
    
    // Create authentication payload
    const authInfo = {
      app_id: appID,
      user_id: userID,
      nonce: parseInt(makeNonce()),
      ctime: currentTime,
      expire: expire
    };
    
    // Add custom payload if provided
    if (payload) {
      try {
        // Validate JSON format
        JSON.parse(payload);
        authInfo.payload = payload;
      } catch (e) {
        return {
          errorCode: ErrorCode.PAYLOAD_INVALID,
          token: '',
          errorMessage: 'Payload must be valid JSON string'
        };
      }
    }
    
    // Convert authInfo to JSON string
    const plainText = JSON.stringify(authInfo);
    
    // Generate random IV (16 bytes for AES-128-CBC)
    const iv = crypto.randomBytes(16);
    
    // Create key buffer from secret (ensure it's 16 bytes for AES-128)
    // ZEGO uses the first 16 bytes of the 32-character secret
    const keyBuffer = Buffer.from(secret.substring(0, 16), 'utf8');
    
    // Create cipher using modern createCipheriv method
    const cipher = crypto.createCipheriv('aes-128-cbc', keyBuffer, iv);
    
    // Encrypt the payload
    let encrypted = cipher.update(plainText, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Build the token
    // Format: expire_time(8 bytes) + iv_size(2 bytes) + iv(16 bytes) + encrypted_size(2 bytes) + encrypted_data
    const resultSize = 8 + 2 + 16 + 2 + encrypted.length;
    const result = Buffer.allocUnsafe(resultSize);
    
    // Write expire time (8 bytes, big endian)
    result.writeBigInt64BE(BigInt(expire), 0);
    
    // Write IV size (2 bytes, big endian)
    result.writeUInt16BE(16, 8);
    
    // Write IV (16 bytes)
    iv.copy(result, 10);
    
    // Write encrypted data size (2 bytes, big endian)
    result.writeUInt16BE(encrypted.length, 26);
    
    // Write encrypted data
    encrypted.copy(result, 28);
    
    // Create final token: "04" + base64(result)
    const token = '04' + result.toString('base64');
    
    return {
      errorCode: ErrorCode.SUCCESS,
      token: token,
      errorMessage: 'success'
    };
    
  } catch (error) {
    console.error('Token generation error:', error);
    return {
      errorCode: 1,
      token: '',
      errorMessage: error.message
    };
  }
}

/**
 * Helper function to generate token with room privileges
 * @param {number} appID - Application ID
 * @param {string} userID - User ID
 * @param {string} secret - Server secret
 * @param {number} effectiveTimeInSeconds - Token validity
 * @param {string} roomID - Room ID
 * @param {Object} privileges - Privileges object (optional)
 * @returns {Object} Token result
 */
export function generateRoomToken(appID, userID, secret, effectiveTimeInSeconds, roomID, privileges = null) {
  const payloadObject = {
    room_id: roomID || '',
    privilege: privileges || {
      [Privilege.PrivilegeKeyLogin]: Privilege.PrivilegeEnable,
      [Privilege.PrivilegeKeyPublish]: Privilege.PrivilegeEnable
    },
    stream_id_list: null
  };
  
  return generateToken04(appID, userID, secret, effectiveTimeInSeconds, JSON.stringify(payloadObject));
}

/**
 * Helper function for basic token generation (no room restrictions)
 */
export function generateBasicToken(appID, userID, secret, effectiveTimeInSeconds) {
  return generateToken04(appID, userID, secret, effectiveTimeInSeconds, '');
}

// Export privilege constants for external use
export { Privilege, ErrorCode };

// Default export for backwards compatibility
export default {
  generateToken04,
  generateRoomToken,
  generateBasicToken,
  Privilege,
  ErrorCode
};