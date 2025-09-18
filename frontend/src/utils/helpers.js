export const isOnlyEmoji = (text) => {
  const emojiRegex = /^[\u{1F600}-\u{1F64F}]$/u;
  return emojiRegex.test(text.trim());
};

export const isLink = (text) => {
  const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  return urlRegex.test(text.trim());
};

export const getUserDisplayName = (userId, userName, currentUserId) => {
  return userId === currentUserId ? 'You' : userName;
};

export const isCurrentUser = (userId, currentUserId) => {
  return userId === currentUserId;
};

export const getContentType = (file, message) => {
  if (file && message) {
    return 'hybrid';
  } else if (file) {
    const fileType = file.type;
    if (fileType.includes('gif')) return 'gif'; // move this above
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    return 'file';
  } else if (isOnlyEmoji(message)) {
    return 'emoji';
  } else if (isLink(message)) {
    return 'link';
  }
  return 'text';
};