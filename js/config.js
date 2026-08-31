/**
 * config.js
 * ------------------------------------------------------------------
 * MY HI-UP 서비스의 모든 "기준값"을 한 곳에 모아둔 설정 파일입니다.
 * - 엑셀 파일 경로 / 시트명 / 컬럼명 매핑
 * - 시상 기준(구간, 등급, 금액)
 * 시상 기준이나 엑셀 컬럼명이 바뀌면 이 파일만 수정하면 됩니다.
 * (uiRenderer, awardCalculator, dataLoader 코드는 건드릴 필요 없음)
 * ------------------------------------------------------------------
 */

const CONFIG = {

  /* ============================================================
   * 1) 데이터 파일 경로
   *    - GitHub Pages에 올릴 때 이 경로에 실제 엑셀 파일을 넣어야 합니다.
   *    - 관리자가 매일 아침 같은 파일명으로 교체하면 자동 반영됩니다.
   * ============================================================ */
  DATA_FILES: {
    conversion: "data/환산실적.xlsx",   // 환산실적.xlsx
    income:     "data/소득진도.xlsx",   // 소득진도.xlsx
    target:     "data/개인목표.xlsx",   // 개인목표.xlsx
  },

  /* ============================================================
   * 2) 시트명 (첨부 파일 분석 결과: 3개 파일 모두 "Sheet1" 사용)
   * ============================================================ */
  SHEET_NAMES: {
    conversion: "Sheet1",
    income: "Sheet1",
    target: "Sheet1",
  },

  /* ============================================================
   * 3) 실제 엑셀 컬럼명 매핑
   *    첨부 파일을 직접 분석하여 확인한 "진짜 컬럼명"입니다.
   *    (임의로 추측한 이름이 아닙니다)
   * ============================================================ */
  COLUMNS: {
    // 환산실적.xlsx
    conversion: {
      hq: "본부명",
      branch: "지점명",
      office: "영업소명",
      teamCode: "팀코드",
      code: "사원번호",              // 플래너 코드 매칭 기준 컬럼
      name: "성명",
      careerMonth: "경력위촉차월",     // 차월 표시에 사용
      insuredCount: "인건수",
      lifeInsurance: "인보험",         // TC스텝업 - 인보험 실적진도
      guaranteeCount: "보장건수",
      guaranteePerformance: "보장실적",
      autoCount: "자동차건수",
      autoPerformance: "자동차실적",   // TC스텝업 - 자동차 실적진도
      conversionPerformance: "환산실적", // 개인환산순증 실적 / TC스텝업 - 장기환산
      totalPerformance: "총량실적",
      newActivityBonus: "신인활동성과수당",
      totalIncome: "총소득",
    },
    // 소득진도.xlsx
    income: {
      branch: "지점",
      team: "팀",
      name: "하이플래너",
      code: "코드",                  // 플래너 코드 매칭 기준 컬럼
      prepayType: "선지급유형",
      month: "차월",
      prevMonthRetention: "전월유지율",
      recognitionRate: "실적인정률",
      longTermConversion: "장기신환산",     // 환산실적.xlsx의 환산실적과 동일 값 계열
      prevMonthContinuous: "전월장기\n계속비례",
      incomeProgress: "비례+성과",          // 소득진도 대표값(이미 계산되어 있는 값)
    },
    // 개인목표.xlsx
    target: {
      region: "지역단",
      branch: "지점",
      month: "차월",
      reappointed: "26년 재위촉여부",
      code: "플래너코드",              // 플래너 코드 매칭 기준 컬럼
      increaseGoal: "순증 목표 최저 40 적용", // 개인환산순증 목표값
    },
  },

  /* ============================================================
   * 4) 시상 기준 (요청서 원문 기준 그대로 반영)
   * ============================================================ */
  AWARD_RULES: {

    // ---- 1) 개인환산순증 ----
    // 목표를 달성한 경우에만 시상금 지급. 가장 높은 충족 구간 1개만 적용.
    personalIncrease: {
      requireGoalMet: true,
      tiers: [
        { min: 1000000, label: "100만원 이상", amount: 150000 },
        { min: 800000,  label: "80만원 이상",  amount: 100000 },
        { min: 600000,  label: "60만원 이상",  amount: 70000 },
        { min: 400000,  label: "40만원 이상",  amount: 50000 },
      ],
    },

    // ---- 2) 매출아너스 ----
    // 3분기(7~9월) 평균실적 기준 등급/시상금. 가장 높은 충족 등급 1개만 적용.
    honors: {
      tiers: [
        { min: 5000000, grade: "Summit",     amount: 5000000 },
        { min: 4000000, grade: "Master 3",   amount: 4000000 },
        { min: 3000000, grade: "Master 2",   amount: 2500000 },
        { min: 2000000, grade: "Master 1",   amount: 1500000 },
        { min: 1500000, grade: "Prestige 2", amount: 1000000 },
        { min: 1000000, grade: "Prestige 1", amount: 700000 },
        { min: 700000,  grade: "PRIME 2",    amount: 500000 },
        { min: 500000,  grade: "PRIME 1",    amount: 300000 },
      ],
      notAchievedGrade: "미달성",
      quarterMonths: [7, 8, 9], // 3분기 구성 월 (향후 분기 추가 시 이 배열만 확장)
    },

    // ---- 3) TC스텝업 ----
    // 조기달성(3분기 내 TC등급 달성) → 금 반돈
    // 유지달성(12월 TC달성 + 7~12월 중 3회 이상 TC달성) → 금 반돈
    // 둘 다 달성 → 금 한돈
    //
    // ⚠️ 현재 첨부된 3개 백데이터에는 "TC등급 달성 여부"를 판단할 수 있는
    //    컬럼이 존재하지 않습니다 (환산실적/소득진도/개인목표 어디에도 없음).
    //    아래 rewardLabels 는 기준 금액표 표시이며, 실제 달성여부 계산은
    //    js/awardCalculator.js 의 calculateTCStepUpAward() 주석을 참고하세요.
    tcStepUp: {
      earlyAchieveMonths: [7, 8, 9],      // 조기달성 판단 구간(3분기)
      maintainMonths: [7, 8, 9, 10, 11, 12], // 유지달성 판단 구간(7~12월)
      maintainRequiredCount: 3,            // 유지달성에 필요한 TC 달성 횟수
      maintainFinalMonth: 12,              // 유지달성은 12월 TC 달성이 필수
      rewardLabels: {
        early: "금 반돈",
        maintain: "금 반돈",
        both: "금 한돈",
        none: "해당 없음",
      },
    },
  },
};
