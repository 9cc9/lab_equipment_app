import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button, Card, Space, Spin, Typography, message } from 'antd'
import { BorrowApplicationDetailView } from 'components/borrow-application'
import { useBorrowActionModal } from 'components/borrow-application/useBorrowActionModal.jsx'
import {
  approveBorrowApplication,
  cancelBorrowApplication,
  fetchBorrowApplication,
  rejectBorrowApplication,
  requestReturnBorrowApplication,
  returnBorrowApplication,
} from 'entities/borrow'
import { isAdminUser, isStudentUser, useAuthStore } from 'entities/auth'
import { ROUTES } from 'shared/constants/routes'

const { Title } = Typography

export const BorrowApplicationDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const student = isStudentUser(user)
  const admin = isAdminUser(user)
  const { runWithRemark, runConfirm } = useBorrowActionModal()
  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState(null)
  const [acting, setActing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchBorrowApplication(id)
      setApplication(data)
    } catch (e) {
      message.error(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const goBack = () => {
    const from = searchParams.get('from')
    if (from === 'admin') {
      navigate(`${ROUTES.STAFF_BORROW}?tab=approval`)
      return
    }
    if (student) {
      navigate(ROUTES.BORROW_MINE)
      return
    }
    navigate(-1)
  }

  const runAction = async (runner, successText) => {
    setActing(true)
    try {
      await runner()
      message.success(successText)
      await load()
    } catch (e) {
      if (e.message === 'cancel' || e.message === 'validation') return
      message.error(e.message || '操作失败')
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
  }

  if (!application) {
    return (
      <div className="page-container">
        <Button onClick={goBack}>返回</Button>
      </div>
    )
  }

  const pending = application.status === 'PENDING'
  const borrowing = application.status === 'APPROVED'
  const returnPending = application.status === 'RETURN_PENDING'
  const canEndBorrow = borrowing || returnPending

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button onClick={goBack}>返回</Button>
          <Title level={3} style={{ margin: 0 }}>借用申请详情</Title>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <BorrowApplicationDetailView application={application} />
      </Card>

      <Space wrap>
        {admin && pending && (
          <>
            <Button
              type="primary"
              loading={acting}
              onClick={() =>
                runAction(
                  () =>
                    runWithRemark({
                      title: '审批意见（选填）',
                      required: false,
                      okText: '确认通过',
                      onSubmit: (remark) => approveBorrowApplication(id, remark),
                    }),
                  '已通过'
                )
              }
            >
              通过
            </Button>
            <Button
              danger
              loading={acting}
              onClick={() =>
                runAction(
                  () =>
                    runWithRemark({
                      title: '驳回原因',
                      required: true,
                      okText: '确认驳回',
                      danger: true,
                      onSubmit: (remark) => rejectBorrowApplication(id, remark),
                    }),
                  '已驳回'
                )
              }
            >
              驳回
            </Button>
          </>
        )}
        {admin && canEndBorrow && (
          <Button
            type="primary"
            loading={acting}
            onClick={() =>
              runAction(
                () =>
                  runWithRemark({
                    title: '借用结束',
                    required: false,
                    okText: '确认结束',
                    onSubmit: (remark) => returnBorrowApplication(id, remark),
                  }),
                '借用已结束'
              )
            }
          >
            借用结束
          </Button>
        )}
        {student && borrowing && (
          <Button
            loading={acting}
            onClick={() =>
              runAction(
                () =>
                  runWithRemark({
                    title: '申请借用结束',
                    required: false,
                    okText: '提交申请',
                    onSubmit: (remark) => requestReturnBorrowApplication(id, remark),
                  }),
                '已提交结束申请，等待管理员确认'
              )
            }
          >
            申请借用结束
          </Button>
        )}
        {student && pending && (
          <Button
            danger
            loading={acting}
            onClick={() =>
              runAction(
                () =>
                  runConfirm({
                    title: '撤销申请',
                    content: '确定撤销该借用申请吗？',
                    okText: '确认撤销',
                    danger: true,
                    onSubmit: () => cancelBorrowApplication(id),
                  }),
                '已撤销'
              )
            }
          >
            撤销申请
          </Button>
        )}
      </Space>
    </div>
  )
}
