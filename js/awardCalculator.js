const awardCalculator = {
  calculatePersonalIncreaseAward(piRow, month) {
    if (!piRow) {
      return {
        month, targetAmount: 0, actualAmount: 0, shortfall: 0,
        achieved: false, awardAmount: 0,
        currentSecuredAmount: 0, septemberExpectedAmount: 0,
        totalAwardAmount: 0, beta200Applied: false,
        monthStatuses: {}, monthAwards: {}
      };
    }

    const monthData = piRow.months[month] || { target: 0, actual: 0, shortfall: 0, award: 0, flag: null };
    const jul = piRow.months[7] || {};
    const aug = piRow.months[8] || {};
    const sep = piRow.months[9] || {};

    const julAchieved = jul.flag === 1;
    const augAchieved = aug.flag === 1;
    const sepAchievedActual = sep.flag === 1;

    const julAward = julAchieved ? (Number(jul.award) || 0) : 0;
    const augAward = augAchieved ? (Number(aug.award) || 0) : 0;
    const currentSecuredAmount = julAward + augAward;

    const hasSeptemberActualData =
      (Number(sep.target) || 0) !== 0 ||
      (Number(sep.actual) || 0) !== 0 ||
      (Number(sep.award) || 0) !== 0 ||
      sep.flag === 0 || sep.flag === 1;

    let septemberExpectedAmount = 0;
    let sepStatusLabel = "데이터 준비중";
    let beta200Applied = false;

    if (hasSeptemberActualData) {
      if (sepAchievedActual) {
        sepStatusLabel = "달성";
        // 실제 운영 기준: 7·8·9월 모두 달성 시 9월 시상금의 200%
        septemberExpectedAmount = julAchieved && augAchieved
          ? (Number(sep.award) || 0) * 2
          : (Number(sep.award) || 0);
      } else {
        sepStatusLabel = "미달성";
        septemberExpectedAmount = 0;
      }
    } else if (CONFIG.AWARD_RULES.personalIncrease.betaSeptember200 && julAchieved && augAchieved) {
      // 베타테스트: 7·8월 달성자는 9월도 달성한다고 가정.
      // 아직 실제 9월 시상금이 없으므로 8월 시상금을 '예상 9월 기본 시상금'으로 사용한다.
      // 화면에는 실제 제도 기준인 '9월 시상금 × 200%'로 안내한다.
      const projectedSeptemberBaseAward = Number(aug.award) || 0;
      septemberExpectedAmount = projectedSeptemberBaseAward * 2;
      sepStatusLabel = "달성 예상";
      beta200Applied = true;
    }

    const monthAwards = {
      7: julAward,
      8: augAward,
      9: septemberExpectedAmount,
    };

    const totalAwardAmount = currentSecuredAmount + septemberExpectedAmount;

    return {
      month,
      targetAmount: Number(monthData.target) || 0,
      actualAmount: Number(monthData.actual) || 0,
      shortfall: monthData.shortfall !== null && monthData.shortfall !== undefined
        ? Math.max(Number(monthData.shortfall) || 0, 0)
        : Math.max((Number(monthData.target) || 0) - (Number(monthData.actual) || 0), 0),
      achieved: month === 9 ? (sepAchievedActual || beta200Applied) : monthData.flag === 1,
      awardAmount: Number(monthData.award) || 0,
      currentSecuredAmount,
      septemberExpectedAmount,
      totalAwardAmount,
      beta200Applied,
      forecastNote: beta200Applied
        ? "7·8월 달성자 기준, 9월도 달성한다고 가정한 예상 금액입니다."
        : "9월 시상금 × 200% 기준을 반영한 예상 금액입니다.",
      monthStatuses: {
        7: julAchieved ? "달성" : "미달성",
        8: augAchieved ? "달성" : "미달성",
        9: sepStatusLabel,
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
        q1Grade: "-",
        q2Grade: "-",
      };
    }
    return honorsRow;
  },

  getTCStepUpResult(tcRow) {
    if (!tcRow) return { eligible: false };

    const status = tcRow.status.replace(/\s+/g, " ");
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
