import { Tag } from 'antd'

const LABELS = {
  ALL: { text: '外借 + 室内', color: 'green' },
  EXTERNAL: { text: '仅外借', color: 'purple' },
  IN_LAB: { text: '仅室内', color: 'blue' },
}

export const AllowedBorrowTypeTag = ({ allowedBorrowTypes }) => {
  const code = allowedBorrowTypes || 'ALL'
  const meta = LABELS[code] || { text: code, color: 'default' }
  return <Tag color={meta.color}>{meta.text}</Tag>
}
