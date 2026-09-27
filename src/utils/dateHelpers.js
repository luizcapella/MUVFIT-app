// src/utils/dateHelpers.js

export function calculateAge(birthDateString) {
  if (!birthDateString || birthDateString.length < 10) return null;
  const parts = birthDateString.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  const birthDate = new Date(year, month, day);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return isNaN(age) ? null : age;
}

export function formatDateBR(dateObj) {
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  return `${d}/${m}/${y}`; // CORRIGIDO: Template string corrigida aqui
}

export function calculateSeasonDates(periodType, isRenewal = false, referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  let startDateObj = new Date(referenceDate);
  let endDateObj = new Date(referenceDate);

  if (periodType === 'Weekly') {
    if (isRenewal) {
      const dayOfWeek = referenceDate.getDay();
      startDateObj.setDate(referenceDate.getDate() - dayOfWeek);
    }
    const dayOfWeek = startDateObj.getDay();
    const distanceToSaturday = 6 - dayOfWeek;
    endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + distanceToSaturday);
  } else if (periodType === 'Yearly') {
    if (isRenewal) {
      startDateObj = new Date(year, 0, 1);
    }
    endDateObj = new Date(year, 11, 31);
  } else {
    if (isRenewal) {
      startDateObj = new Date(year, month, 1);
    }
    endDateObj = new Date(year, month + 1, 0);
  }

  return {
    startDateStr: formatDateBR(startDateObj),
    endDateStr: formatDateBR(endDateObj),
    startDateObj,
    endDateObj
  };
}
