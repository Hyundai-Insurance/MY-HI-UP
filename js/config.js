const CONFIG = {
  DATA_FILE: "data/MY_HI_UP_DATA.xlsx",

  SHEET_NAMES: {
    personalIncrease: "개인환산",
    honors: "매출아너스",
    tcStepUp: "TC스텝업",
  },

  // 백데이터.xlsx의 실제 열 위치 (0부터 시작)
  INDEX: {
    personalIncrease: {
      region: 1, branch: 2, code: 3, name: 4, careerMonth: 5,
      commonTarget: 6,
      julActual: 7, julShortfall: 8, julAward: 9,
      augActual: 10, augShortfall: 11, augAward: 12,
      sepActual: 13, sepShortfall: 14, sepAward: 15,
      julFlag: 17, augFlag: 18, sepFlag: 19,
    },
    honors: {
      region: 1, branch: 2, team: 3, code: 4, name: 5, careerMonth: 6,
      jul: 8, aug: 9, sep: 10, average: 11, grade: 12, award: 13,
    },
    tcStepUp: {
      region: 1, branch: 2, code: 3, name: 4, careerMonth: 5,
      lifeInsurance: 6, autoPerformance: 7, conversionPerformance: 8,
      performanceIncome: 9, proportionalIncome: 10, incomeProgress: 11,
      awardAmount: 12, earlyNote: 13,
    },
  },

  DATA_START_ROWS: {
    personalIncrease: 4, // Excel 5행부터 데이터
    honors: 4,          // Excel 5행부터 데이터
    tcStepUp: 4,        // Excel 5행부터 데이터
  },

  AWARD_RULES: {
    personalIncrease: {
      quarterMonths: [7, 8, 9],
      september200Multiplier: 2,
    },
    tcStepUp: {
      goldHalfDonAmount: 500000,
      earlyText: "조기 달성",
      maintainText: "유지 달성 도전자",
    },
  },
};
