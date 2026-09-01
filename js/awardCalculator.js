/**
 * awardCalculator.js
 * ------------------------------------------------------------------
 * 3가지 시상(개인환산순증 / 매출아너스 / TC스텝업)의 계산 로직만 모아둔 파일.
 * UI 코드(uiRenderer.js)는 이 파일의 결과 객체를 받아서 화면에 그리기만 합니다.
 * ------------------------------------------------------------------
 */

const awardCalculator = {

  /* ============================================================
   * 1) 개인환산순증
   * ============================================================ */

  /**
   * @param {number} targetAmount  개인목표.xlsx의 "순증 목표 최저 40 적용"
   * @param {number} actualAmount  환산실적.xlsx의 "환산실적"
   * @returns {{
   *   targetAmount:number, actualAmount:number,
   *   shortfall:number, achieved:boolean,
   *   tierLabel:string|null, awardAmount:number
   * }}
   */
  calculatePersonalIncreaseAward(targetAmount, actualAmount) {
    const target = Number(targetAmount) || 0;
    const actual = Number(actualAmount) || 0;

    // 부족실적 = 목표 - 실적 (초과 달성 시 0, 음수 표시 금지)
    const shortfall = Math.max(target - actual, 0);
    const achieved = actual >= target && target > 0;

    const rule = CONFIG.AWARD_RULES.personalIncrease;
    let tierLabel = null;
    let awardAmount = 0;

    // 목표를 달성한 경우에만 시상금 지급 대상
    if (achieved || !rule.requireGoalMet) {
      const matchedTier = rule.tiers.find((tier) => actual >= tier.min);
      if (matchedTier) {
        tierLabel = matchedTier.label;
        awardAmount = matchedTier.amount;
      }
    }

    return { targetAmount: target, actualAmount: actual, shortfall, achieved, tierLabel, awardAmount };
  },

  /* ============================================================
   * 2) 매출아너스
   * ============================================================ */

  /**
   * 월별 실적으로부터 평균실적/등급/시상금을 계산.
   *
   * ⚠️ 데이터 구조 안내
   * 현재 첨부된 환산실적.xlsx 에는 "이번 달 환산실적" 스냅샷 1건만 존재하고,
   * 7월/8월/9월을 각각 구분하는 월별 컬럼은 없습니다.
   * 따라서 이번 버전에서는 "현재 월"의 실적만 실제 데이터로 채우고,
   * 나머지 두 달은 monthlyPerformance 값이 null(데이터 없음)로 표시됩니다.
   * 평균실적은 "값이 존재하는 달"만으로 계산하도록 설계했으므로,
   * 향후 관리자가 월별 실적 컬럼(예: 7월실적/8월실적/9월실적)을
   * 환산실적.xlsx 에 추가하면 이 함수 수정 없이 자동으로 3개월 평균이 반영됩니다.
   *
   * @param {{[month:number]: number|null}} monthlyPerformance  예: {7:null, 8:700000, 9:null}
   * @returns {{
   *   monthlyPerformance:object, availableMonths:number[],
   *   averagePerformance:number, grade:string, awardAmount:number
   * }}
   */
  calculateHonorsAward(monthlyPerformance) {
    const months = CONFIG.AWARD_RULES.honors.quarterMonths;
    const availableValues = months
      .map((m) => monthlyPerformance[m])
      .filter((v) => v !== null && v !== undefined);

    const availableMonths = months.filter(
      (m) => monthlyPerformance[m] !== null && monthlyPerformance[m] !== undefined
    );

    const averagePerformance =
      availableValues.length > 0
        ? Math.round(availableValues.reduce((sum, v) => sum + v, 0) / availableValues.length)
        : 0;

    const rule = CONFIG.AWARD_RULES.honors;
    const matchedTier = rule.tiers.find((tier) => averagePerformance >= tier.min);

    return {
      monthlyPerformance,
      availableMonths,
      averagePerformance,
      grade: matchedTier ? matchedTier.grade : rule.notAchievedGrade,
      awardAmount: matchedTier ? matchedTier.amount : 0,
    };
  },

    /* ============================================================
   * 3) TC스텝업
   * ============================================================ */

  /**
   * 현재 소득진도를 기준으로 TC스텝업 시상을 계산합니다.
   * 소득진도 500만원 이상이면 50만원(금 반돈) 달성.
   *
   * @param {number} incomeProgress 현재 소득진도
   */
  calculateTCStepUpAward(incomeProgress) {
    const income = Number(incomeProgress) || 0;
    const target = 5000000;

    const achieved = income >= target;
    const shortfall = Math.max(target - income, 0);

    return {
      status: "ready",
      achieved: achieved,
      incomeProgress: income,
      targetAmount: target,
      shortfall: shortfall,
      rewardLabel: achieved ? "50만원 (금 반돈)" : "미달성",
    };
  },

};
