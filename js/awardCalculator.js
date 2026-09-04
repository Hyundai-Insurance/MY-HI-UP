const awardCalculator = {
  calculatePersonalIncreaseAward(piRow, month) {
    if (!piRow) {
      return {
        month, targetAmount: 0, actualAmount: 0, shortfall: 0,
        achieved: false, awardAmount: 0, displayAwardAmount: 0,
        beta200Applied: false, betaLabel: "", monthStatuses: {}
      };
    }

    const monthData = piRow.months[month] || { target: 0, actual: 0, shortfall: 0, award: 0, flag: null };
    const jul = piRow.months[7];
    const aug = piRow.months[8];
    const sep = piRow.months[9];

    const hasRealSeptemberFlag = sep.flag === 0 || sep.flag === 1;
    const betaSeptemberAchieved = CONFIG.AWARD_RULES.personalIncrease.betaSeptember200 && jul.flag === 1 && aug.flag === 1;

    let sepAchieved;
    let sepStatusLabel;
    if (hasRealSeptemberFlag) {
      sepAchieved = sep.flag === 1;
      sepStatusLabel = sepAchieved ? "달성" : "미달성";
    } else if (betaSeptemberAchieved) {
      sepAchieved = true;
      sepStatusLabel = "달성 (테스트)";
    } else {
      sepAchieved = false;
      sepStatusLabel = "데이터 준비중";
    }

    const allThreeAchieved = jul.flag === 1 && aug.flag === 1 && sepAchieved;

    let displayAwardAmount = monthData.award || 0;
    let beta200Applied = false;
    let betaLabel = "";

    if (month === 9 && allThreeAchieved) {
      const septemberBaseAward = hasRealSeptemberFlag
        ? (sep.award || 0)
        : (aug.award || 0);
      displayAwardAmount = septemberBaseAward * 2;
      beta200Applied = !hasRealSeptemberFlag;
      betaLabel = hasRealSeptemberFlag
        ? "7·8·9월 연속 달성 · 9월 시상금 200% 적용"
        : "7·8월 달성 기준 베타테스트 · 9월 시상금 200% 적용";
    }

    return {
      month,
      targetAmount: monthData.target || 0,
      actualAmount: monthData.actual || 0,
      shortfall: monthData.shortfall !== null && monthData.shortfall !== undefined
        ? Math.max(Number(monthData.shortfall) || 0, 0)
        : Math.max((monthData.target || 0) - (monthData.actual || 0), 0),
      achieved: month === 9 ? sepAchieved : monthData.flag === 1,
      awardAmount: monthData.award || 0,
      displayAwardAmount,
      beta200Applied,
      betaLabel,
      monthStatuses: {
        7: jul.flag === 1 ? "달성" : "미달성",
        8: aug.flag === 1 ? "달성" : "미달성",
        9: sepStatusLabel,
      },
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
    const cashTotal = (piResult.displayAwardAmount || 0) + (honorsResult.awardAmount || 0);
    return {
      cashTotal,
      tcEligible: !!tcResult.eligible,
      tcEarly: !!tcResult.isEarly,
      tcMaintain: !!tcResult.isMaintain,
      tcRewardText: tcResult.eligible ? tcResult.rewardText : "",
    };
  },
};
