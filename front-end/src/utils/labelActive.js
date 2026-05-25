export function isLabelActive(row) {
  const active = row?.Active;
  if (active === undefined || active === null || active === '') {
    return true;
  }
  return String(active).toUpperCase() === 'Y';
}

export function labelActiveLabel(row) {
  return isLabelActive(row) ? 'Active' : 'Inactive';
}
