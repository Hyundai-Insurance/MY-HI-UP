const awardCalculator = {
  calculatePersonalIncreaseAward(piRow, month) {
    if (!piRow) {
      return {
        month, targetAmount: 0, actualAmount: 0, shortfall: 0,
        achieved: false, awardAmount: 0,
        currentSecuredAmount: 0, septemberExpectedAmount: 0,
        totalAwardAmount: 0, showSeptemberForecast: false,
        monthStatuses: {}, monthAwards: {}
      };
    }

    const monthData = piRow.months[month] || { target: 0, actual: 0, shortfall: 0, award: 0, flag: null };
    const jul = piRow.months[7] || {};
    const aug = piRow.months[8] || {};
    const sep = piRow.months[9] || {};

    const julAchieved = jul.flag === 1;
    const augAchieved = aug.flag === 1;
    const sepAchieved = sep.flag === 1;
    const consecutiveEligible = julAchieved && augAchieved;

    const julAward = julAchieved ? (Number(jul.award) || 0) : 0;
    const augAward = augAchieved ? (Number(aug.award) || 0) : 0;
    const sepBaseAward = sepAchieved ? (Number(sep.award) || 0) : 0;
    const currentSecuredAmount = julAward + augAward;

    // 7·8월 모두 달성한 사람만 9월 달성 예상 영역을 노출한다.
    // 9월 미달성: 8월 시상금 × 200%를 9월 달성 예상금액으로 표시
    // 9월 실제 달성: 실제 9월 시상금 × 200% 적용
    const multiplier = CONFIG.AWARD_RULES.personalIncrease.september200Multiplier || 2;
    let septemberExpectedAmount = 0;
    let septemberIncludedAmount = sepBaseAward;

    if (consecutiveEligible) {
      septemberExpectedAmount = sepAchieved
        ? sepBaseAward * multiplier
        : augAward * multiplier;
      septemberIncludedAmount = septemberExpectedAmount;
    }

    const monthAwards = {
      7: julAward,
      8: augAward,
      // 위 월별 현황은 현재 달성 상태만 표시한다. 미달성이면 0원.
      9: sepAchieved
        ? (consecutiveEligible ? sepBaseAward * multiplier : sepBaseAward)
        : 0,
    };

    const totalAwardAmount = currentSecuredAmount + septemberIncludedAmount;

    return {
      month,
      targetAmount: Number(monthData.target) || 0,
      actualAmount: Number(monthData.actual) || 0,
      shortfall: monthData.shortfall !== null && monthData.shortfall !== undefined
        ? Math.max(-(Number(monthData.shortfall) || 0), 0)
        : Math.max((Number(monthData.target) || 0) - (Number(monthData.actual) || 0), 0),
      achieved: monthData.flag === 1,
      awardAmount: Number(monthData.award) || 0,
      currentSecuredAmount,
      septemberExpectedAmount,
      totalAwardAmount,
      showSeptemberForecast: consecutiveEligible,
      forecastNote: "7·8월 연속 달성자 기준, 9월 달성을 가정한 예상 금액입니다.",
      monthStatuses: {
        7: julAchieved ? "달성" : "미달성",
        8: augAchieved ? "달성" : "미달성",
        9: sepAchieved ? "달성" : "미달성",
      },
      monthAwards,
    };
  },

  getHonorsResult(honorsRow) {
    if (!honorsRow) {
      return {
        monthlyPerformance: { 7: 0, 8: 0, 9: 0 },
        averagePerformance: 0,
        grade: "-",
        awardAmount: 0,
      };
    }
    return honorsRow;
  },

  getTCStepUpResult(tcRow) {
    if (!tcRow) return { eligible: false };

    const status = String(tcRow.status || "").replace(/\s+/g, " ");
    const isEarly = status.includes("조기") && status.includes("달성");
    const isMaintain = status.includes("유지") && status.includes("도전자");

    return {
      eligible: true,
      ...tcRow,
      isEarly,
      isMaintain,
      rewardText: isEarly
        ? "금 반돈 (500,000원)"
        : isMaintain
          ? "금 반돈 (500,000원) 도전!"
          : "해당 없음",
      confirmedGoldAmount: isEarly ? CONFIG.AWARD_RULES.tcStepUp.goldHalfDonAmount : 0,
    };
  },

  calculateTotalSummary(piResult, honorsResult, tcResult) {
    const cashTotal = (piResult.totalAwardAmount || 0) + (honorsResult.awardAmount || 0);
    return {
      cashTotal,
      tcEligible: !!tcResult.eligible,
      tcEarly: !!tcResult.isEarly,
      tcMaintain: !!tcResult.isMaintain,
      tcRewardText: tcResult.eligible ? tcResult.rewardText : "",
    };
  },
};
