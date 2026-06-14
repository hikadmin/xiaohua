// ============ 全局主题状态管理 ============
// 管理壁纸和主题颜色，通过 localStorage 持久化

export const THEME_COLORS = [
  { name: '珊瑚橙', value: '#e07a5f', gradient: 'linear-gradient(135deg, #e07a5f, #d4a574)' },
  { name: '玫瑰红', value: '#e06377', gradient: 'linear-gradient(135deg, #e06377, #c84b8a)' },
  { name: '薰衣紫', value: '#9b72cf', gradient: 'linear-gradient(135deg, #9b72cf, #7c5cbf)' },
  { name: '海天蓝', value: '#5fa8e0', gradient: 'linear-gradient(135deg, #5fa8e0, #4a90d9)' },
  { name: '翡翠绿', value: '#5fb88e', gradient: 'linear-gradient(135deg, #5fb88e, #4a9e78)' },
  { name: '琥珀金', value: '#d4a554', gradient: 'linear-gradient(135deg, #d4a554, #c4903e)' },
  { name: '蜜桃粉', value: '#f0a0b0', gradient: 'linear-gradient(135deg, #f0a0b0, #e8889a)' },
  { name: '靛青色', value: '#5f9ea0', gradient: 'linear-gradient(135deg, #5f9ea0, #4a8a8c)' },
];

const DEFAULT_THEME_COLOR = '#e07a5f';

let _wallpaper: string | null = null;
let _themeColor: string = DEFAULT_THEME_COLOR;
let _listeners: Array<() => void> = [];

function loadFromStorage() {
  if (typeof window === 'undefined') return;
  try {
    const savedWallpaper = localStorage.getItem('luna_wallpaper');
    const savedThemeColor = localStorage.getItem('luna_theme_color');
    if (savedWallpaper !== null) _wallpaper = savedWallpaper;
    if (savedThemeColor) _themeColor = savedThemeColor;
  } catch {
    // ignore
  }
}

function saveToStorage() {
  if (typeof window === 'undefined') return;
  try {
    if (_wallpaper !== null) {
      localStorage.setItem('luna_wallpaper', _wallpaper);
    } else {
      localStorage.removeItem('luna_wallpaper');
    }
    localStorage.setItem('luna_theme_color', _themeColor);
  } catch {
    // ignore
  }
}

function notifyListeners() {
  _listeners.forEach(fn => fn());
}

// Initialize on first import
if (typeof window !== 'undefined') {
  loadFromStorage();
}

export function getWallpaper(): string | null {
  return _wallpaper;
}

export function setWallpaper(url: string | null) {
  _wallpaper = url;
  saveToStorage();
  notifyListeners();
}

export function getThemeColor(): string {
  return _themeColor;
}

export function setThemeColor(color: string) {
  _themeColor = color;
  saveToStorage();
  notifyListeners();
}

export function getThemeGradient(): string {
  const found = THEME_COLORS.find(c => c.value === _themeColor);
  return found ? found.gradient : `linear-gradient(135deg, ${_themeColor}, ${_themeColor}cc)`;
}

export function subscribeTheme(listener: () => void): () => void {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter(fn => fn !== listener);
  };
}

/**
 * Apply theme color to CSS custom properties on the document root
 */
export function applyThemeToDOM() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const color = getThemeColor();
  
  root.style.setProperty('--primary', color);
  root.style.setProperty('--ring', color);
  root.style.setProperty('--chart-1', color);
  root.style.setProperty('--sidebar-primary', color);
  root.style.setProperty('--sidebar-ring', color);
  
  // Also update wallpaper
  const wallpaper = getWallpaper();
  if (wallpaper) {
    root.style.setProperty('--wallpaper', `url(${wallpaper})`);
  } else {
    root.style.removeProperty('--wallpaper');
  }
}
