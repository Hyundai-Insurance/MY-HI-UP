const CONFIG = {
  // 웹에서는 8MB대 XLSX 전체를 읽지 않고, 사번 앞 3자리의 작은 JSON만 읽습니다.
  DATA_SHARD_DIR: "data/planners",
  DATA_SHARD_PREFIX_LENGTH: 3,

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
