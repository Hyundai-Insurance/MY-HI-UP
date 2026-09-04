const CONFIG = {
  DATA_FILE: "data/MY_HI_UP_DATA.xlsx",

  SHEET_NAMES: {
    personalIncrease: "1) 7,8,9월 개인환산순증",
    honors: "2) 매출 아너스",
    tcStepUp: "3) TC 스텝업 대상자",
  },

  // 새 통합 백데이터의 실제 열 위치(0부터 시작)
  INDEX: {
    personalIncrease: {
      region: 1, branch: 3, code: 4, name: 5, careerMonth: 6,
      julTarget: 7, julActual: 8, julShortfall: 9, julAward: 10, julStatus: 11,
      augTarget: 12, augActual: 13, augShortfall: 14, augAward: 15, augStatus: 16,
      sepTarget: 17, sepActual: 18, sepShortfall: 19, sepAward: 20, sepStatus: 21,
      currentTotal: 23,
      julFlag: 25, augFlag: 26, sepFlag: 27,
      sep200Rule: 28, sep200Preview: 29,
    },
    honors: {
      region: 1, branch: 3, team: 4, code: 5, name: 6, careerMonth: 7,
      q1Grade: 8, q2Grade: 9,
      jul: 10, aug: 11, sep: 12, average: 13, grade: 14, award: 15,
    },
    tcStepUp: {
      region: 2, branch: 3, code: 4, name: 5, careerMonth: 6,
      lifeInsurance: 7, autoPerformance: 8, conversionPerformance: 9,
      incomeProgress: 10, awardAmount: 11, prevMonthNote: 12,
      status: 13,
    },
  },

  DATA_START_ROWS: {
    personalIncrease: 4, // Excel 5행부터 데이터
    honors: 7,          // Excel 8행부터 데이터
    tcStepUp: 7,        // Excel 8행부터 데이터
  },

  AWARD_RULES: {
    personalIncrease: {
      quarterMonths: [7, 8, 9],
      betaSeptember200: true,
    },
    tcStepUp: {
      goldHalfDonAmount: 500000,
      earlyText: "조기 달성",
      maintainText: "유지 달성 도전자",
    },
  },
};
