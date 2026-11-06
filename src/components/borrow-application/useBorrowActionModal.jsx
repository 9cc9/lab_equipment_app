import { useCallback } from 'react'
import { App, Input } from 'antd'

/** 在 modal.onOk 内执行 onSubmit，确保会等待异步并发起后端请求 */
export function useBorrowActionModal() {
  const { modal, message } = App.useApp()

  const runWithRemark = useCallback(
    ({ title, required, okText, danger, onSubmit }) =>
      new Promise((resolve, reject) => {
        let value = ''
        modal.confirm({
          title,
          okText: okText || '确定',
          okButtonProps: danger ? { danger: true } : undefined,
          content: (
            <Input.TextArea
              rows={4}
              placeholder={required ? '必填' : '选填'}
              onChange={(e) => {
                value = e.target.value
              }}
            />
          ),
          onCancel: () => reject(new Error('cancel')),
          onOk: async () => {
            const trimmed = value.trim()
            if (required && !trimmed) {
              message.warning('请填写内容')
              throw new Error('validation')
            }
            try {
              await onSubmit(trimmed)
              resolve()
            } catch (e) {
              reject(e)
              throw e
            }
          },
        })
      }),
    [modal, message]
  )

  const runConfirm = useCallback(
    ({ title, content, okText, danger, onSubmit }) =>
      new Promise((resolve, reject) => {
        modal.confirm({
          title,
          content,
          okText: okText || '确定',
          okButtonProps: danger ? { danger: true } : undefined,
          onCancel: () => reject(new Error('cancel')),
          onOk: async () => {
            try {
              await onSubmit()
              resolve()
            } catch (e) {
              reject(e)
              throw e
            }
          },
        })
      }),
    [modal]
  )

  return { runWithRemark, runConfirm }
}
