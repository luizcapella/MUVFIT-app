// src/services/pointsEngine.js

export const calculateWorkoutPoints = (activity, durationMins, kmDistance, modalitySettings) => {
  if (!modalitySettings) return 0;
  const config = modalitySettings[activity];
  if (!config || config.enabled === false) return 0;

  let pts = 0;
  const mode = config.scoringMode || 'simple';

  if (mode === 'simple') {
    const reqMin = parseFloat(config.simplePerMin) || 0;
    const awardPts = parseFloat(config.simplePts) || 0;
    if (reqMin > 0 && durationMins >= reqMin) {
      pts = awardPts;
    }
  } else if (mode === 'timeSteps') {
    const steps = config.timeSteps || [];
    for (let st of steps) {
      const minT = parseFloat(st.minTime) || 0;
      const maxT = st.modeType === 'Acima' ? Infinity : (parseFloat(st.maxTime) || Infinity);
      if (durationMins >= minT && durationMins <= maxT) {
        pts = parseFloat(st.pts) || 0;
        break;
      }
    }
  } else if (mode === 'kmSimple') {
    const reqKm = parseFloat(config.kmPerX) || 0;
    const awardPts = parseFloat(config.kmSimplePts) || 0;
    if (reqKm > 0 && kmDistance >= reqKm) {
      pts = awardPts;
    }
  } else if (mode === 'kmSteps') {
    const steps = config.kmSteps || [];
    for (let st of steps) {
      const minK = parseFloat(st.minKm) || 0;
      const maxK = st.modeType === 'Acima' ? Infinity : (parseFloat(st.maxKm) || Infinity);
      if (kmDistance >= minK && kmDistance <= maxK) {
        pts = parseFloat(st.pts) || 0;
        break;
      }
    }
  }

  return pts;
};
