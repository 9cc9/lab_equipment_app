/** @returns {{ borrowType: string, borrowTypeLocked: boolean, externalOptionDisabled: boolean }} */
export function resolveBorrowTypeField(allowedBorrowTypes, externalBorrowBlocked) {
  const allowed = allowedBorrowTypes || 'ALL'

  if (allowed === 'IN_LAB') {
    return { borrowType: 'IN_LAB', borrowTypeLocked: true, externalOptionDisabled: true }
  }
  if (allowed === 'EXTERNAL') {
    return {
      borrowType: 'EXTERNAL',
      borrowTypeLocked: true,
      externalOptionDisabled: externalBorrowBlocked,
    }
  }
  return {
    borrowType: 'IN_LAB',
    borrowTypeLocked: false,
    externalOptionDisabled: Boolean(externalBorrowBlocked),
  }
}

export function defaultBorrowerFields(user, isStudent) {
  if (!isStudent || !user) {
    return { borrowerName: undefined, studentNo: undefined, borrowerPhone: undefined }
  }
  return {
    borrowerName: user.name || undefined,
    studentNo: user.studentNo || undefined,
    borrowerPhone: user.phone || undefined,
  }
}
