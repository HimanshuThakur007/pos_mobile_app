export const formatDateToYYYYMMDD = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatCurrency = (val: string | number | null | undefined): string => {
  const num = Number(val || 0);
  if (isNaN(num)) return '₹0.00';
  return (
    '₹' +
    num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

export const formatDateTimeDisplay = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateStr);
  }
};

export const formatNumber = (val: string | number | null | undefined): string => {
  const num = Number(val || 0);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
};

export interface SimpleBranch {
  branch_code: string;
  branch_name?: string;
}

export const getStoreFilterLabel = (
  selectedBranchCodes: string[],
  branches: SimpleBranch[] = []
): string => {
  if (!selectedBranchCodes || selectedBranchCodes.length === 0) {
    return 'All Stores';
  }
  if (branches.length > 0 && selectedBranchCodes.length === branches.length) {
    return 'All Stores';
  }
  if (selectedBranchCodes.length === 1) {
    const code = selectedBranchCodes[0];
    const found = branches.find(
      (b) => String(b.branch_code).trim().toLowerCase() === String(code).trim().toLowerCase()
    );
    if (found && found.branch_name && found.branch_name.trim().length > 0) {
      return found.branch_name;
    }
    return code.startsWith('Store') ? code : `Store ${code}`;
  }
  if (selectedBranchCodes.length <= 2 && branches.length > 0) {
    const names = selectedBranchCodes.map((code) => {
      const found = branches.find(
        (b) => String(b.branch_code).trim().toLowerCase() === String(code).trim().toLowerCase()
      );
      return found?.branch_name || code;
    });
    return names.join(', ');
  }
  return `${selectedBranchCodes.length} Stores Selected`;
};
