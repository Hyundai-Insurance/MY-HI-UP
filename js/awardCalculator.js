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

    // 9월 예상 시상금 표시 기준
    // - 실제 9월 데이터가 있으면: 실제 9월 기본 시상금을 사용
    // - 실제 9월 데이터가 아직 없고 7·8월 모두 달성했다면:
    //   8월 시상금을 9월 기본 시상금으로 가정하여 × 200%
    //   (화면 문구는 실제 제도 기준인 “9월 시상금 × 200%”로 표시)
    let septemberExpectedAmount = 0;
    let sepStatusLabel = "미달성";
    let beta200Applied = false;

    const hasSeptemberData =
      (Number(sep.actual) || 0) > 0 ||
      (Number(sep.award) || 0) > 0 ||
      sepAchievedActual;

    const consecutiveEligible = julAchieved && augAchieved;

    if (consecutiveEligible && !hasSeptemberData) {
      // 테스트용 예상치: 9월 데이터가 없으므로 8월 기본 시상금을 대체값으로 사용
      const projectedSeptemberBaseAward = augAward;
      septemberExpectedAmount = projectedSeptemberBaseAward * 2;
      sepStatusLabel = "달성 예상";
      beta200Applied = true;
    } else if (consecutiveEligible && sepAchievedActual) {
      // 실제 9월 달성 데이터가 생긴 뒤에는 실제 9월 시상금 × 200%
      septemberExpectedAmount = (Number(sep.award) || 0) * 2;
      sepStatusLabel = "달성";
    } else if (sepAchievedActual) {
      septemberExpectedAmount = Number(sep.award) || 0;
      sepStatusLabel = "달성";
    } else if (consecutiveEligible && hasSeptemberData) {
      // 9월 데이터가 일부 들어왔지만 아직 달성 전인 경우, 현재 시점에서는 예상 200% 미반영
      septemberExpectedAmount = 0;
      sepStatusLabel = "미달성";
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
