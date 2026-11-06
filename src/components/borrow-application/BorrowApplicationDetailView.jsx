import { Descriptions, Tag } from 'antd'
import { formatBorrowStatus, formatBorrowType, formatDateTime } from 'shared/utils/borrowApplication'

const statusColor = (status, overdue) => {
  if (status === 'PENDING') return 'gold'
  if (status === 'APPROVED') return overdue ? 'red' : 'green'
  if (status === 'RETURN_PENDING') return 'processing'
  if (status === 'REJECTED') return 'default'
  return 'default'
}

export const BorrowApplicationDetailView = ({ application }) => {
  if (!application) return null
  const { status, overdue } = application
  const showApproval =
    status === 'APPROVED'
    || status === 'RETURN_PENDING'
    || status === 'REJECTED'
    || status === 'RETURNED'
  const showReturn = status === 'RETURNED'
  const showReturnRequest = status === 'RETURN_PENDING'

  return (
    <Descriptions column={1} bordered size="small">
      <Descriptions.Item label="状态">
        <Tag color={statusColor(status, overdue)}>
          {formatBorrowStatus(status, overdue)}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="设备">
        {application.assetCode} · {application.equipmentName}
      </Descriptions.Item>
      <Descriptions.Item label="借用类型">
        {formatBorrowType(application.borrowType)}
      </Descriptions.Item>
      <Descriptions.Item label="借用人">
        {application.borrowerName}（{application.studentNo}）· {application.borrowerPhone || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="预计开始">
        {formatDateTime(application.expectedStartAt)}
      </Descriptions.Item>
      <Descriptions.Item label="预计归还">
        {formatDateTime(application.expectedEndAt)}
      </Descriptions.Item>
      {application.actualStartAt && (
        <Descriptions.Item label="实际开始">
          {formatDateTime(application.actualStartAt)}
        </Descriptions.Item>
      )}
      {application.actualEndAt && (
        <Descriptions.Item label="实际归还">
          {formatDateTime(application.actualEndAt)}
        </Descriptions.Item>
      )}
      <Descriptions.Item label="借用用途">
        {application.purpose || '-'}
      </Descriptions.Item>
      {application.borrowType === 'EXTERNAL' && (
        <Descriptions.Item label="外带目的地">
          {application.destination || '-'}
        </Descriptions.Item>
      )}
      {application.remark && (
        <Descriptions.Item label="申请备注">
          {application.remark}
        </Descriptions.Item>
      )}
      {showApproval && (
        <>
          <Descriptions.Item label="审批人">
            {application.approverName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="审批时间">
            {formatDateTime(application.approvedAt)}
          </Descriptions.Item>
          <Descriptions.Item label={status === 'REJECTED' ? '驳回原因' : '审批意见'}>
            {application.approveRemark || '（无）'}
          </Descriptions.Item>
        </>
      )}
      {showReturnRequest && application.returnRemark && (
        <Descriptions.Item label="结束申请说明">
          {application.returnRemark}
        </Descriptions.Item>
      )}
      {showReturn && (
        <>
          <Descriptions.Item label="结束确认人">
            {application.returnerName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="结束备注">
            {application.returnRemark || '（无）'}
          </Descriptions.Item>
        </>
      )}
      <Descriptions.Item label="提交时间">
        {formatDateTime(application.createdAt)}
      </Descriptions.Item>
    </Descriptions>
  )
}
