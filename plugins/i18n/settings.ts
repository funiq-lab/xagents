export const fallbackLng = 'zh_CN'
export const languages = [fallbackLng, 'en']
export const defaultNS = ['global']
export const headerName = 'x-i18next-current-language'

export type Locale = typeof languages[number]

export const languagesOptions = [{
  value: 'en',
  label: 'English',
}, {
  value: 'zh_CN',
  label: '简体中文',
}]
