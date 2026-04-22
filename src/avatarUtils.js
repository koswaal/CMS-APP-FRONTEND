const AVATAR_SIZE = 96;
const BG_COLOR = '#c8f135';
const FG_COLOR = '#0a0a0a';

function getInitials(name = 'User') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function getLocalAvatar(name = 'User') {
  const initials = getInitials(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" viewBox="0 0 ${AVATAR_SIZE} ${AVATAR_SIZE}"><rect width="100%" height="100%" rx="9999" fill="${BG_COLOR}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${FG_COLOR}" font-family="Arial, sans-serif" font-size="34" font-weight="700">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getProfileImage(profilePhoto, name = 'User', apiUrlBase = '') {
  if (profilePhoto && apiUrlBase) {
    return `${apiUrlBase}/storage/profile_photos/${profilePhoto}`;
  }
  return getLocalAvatar(name);
}
