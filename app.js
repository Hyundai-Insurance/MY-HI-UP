/**
 * app.js
 * ------------------------------------------------------------------
 * 각 모듈(dataLoader / awardCalculator / dateHelper / uiRenderer)을
 * 연결하여 실제 서비스 흐름을 제어하는 메인 컨트롤러입니다.
 * ------------------------------------------------------------------
 */

const app = {

  async init() {
    uiRenderer.renderLogin();
    this._bindEvents();

    // 첫 진입 시 미리 엑셀 데이터를 불러와 둔다 (조회 버튼을 눌렀을 때 대기시간 최소화)
    uiRenderer.renderLoading();
    try {
      await dataLoader.loadExcelFiles();
      uiRenderer.renderLogin();
    } catch (err) {
      this._handleLoadError(err);
    }
  },

  _bindEvents() {
    const input = uiRenderer.el("planner-code-input");
    const submitBtn = uiRenderer.el("submit-btn");
    const backBtn = uiRenderer.el("back-btn");
    const retryBtn = uiRenderer.el("retry-btn");

    // 숫자만 입력되도록 강제
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^0-9]/g, "").slice(0, 6);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this._handleSubmit();
    });

    submitBtn.addEventListener("click", () => this._handleSubmit());
    backBtn.addEventListener("click", () => uiRenderer.renderLogin());
    retryBtn.addEventListener("click", () => this.init());
  },

  async _handleSubmit() {
    const rawInput = uiRenderer.el("planner-code-input").value.trim();

    // 정확히 6자리 숫자일 때만 조회 가능
    if (!/^\d{6}$/.test(rawInput)) {
      uiRenderer.renderLoginFormatError();
      return;
    }

    // 데이터가 아직 로드되지 않았다면 다시 로드 시도
    if (!dataLoader._cache.conversion) {
      uiRenderer.renderLoading();
      try {
        await dataLoader.loadExcelFiles();
      } catch (err) {
        this._handleLoadError(err);
        return;
      }
    }

    if (!dataLoader.isCodeRegistered(rawInput)) {
      uiRenderer.renderError("not_registered");
      return;
    }

    this._renderResultScreen(rawInput);
  },

  _renderResultScreen(code) {
    const plannerData = dataLoader.findPlannerData(code);
    const COLS = CONFIG.COLUMNS;

    uiRenderer.renderGuideHeader();
    uiRenderer.renderPlannerProfile(plannerData);

    // ---- 1) 개인환산순증 ----
    const targetAmount = plannerData.target ? plannerData.target[COLS.target.increaseGoal] : 0;
    const actualAmount = plannerData.conversion ? plannerData.conversion[COLS.conversion.conversionPerformance] : 0;
    const piResult = awardCalculator.calculatePersonalIncreaseAward(targetAmount, actualAmount);
    uiRenderer.renderPersonalIncrease(piResult);

    // ---- 2) 매출아너스 ----
    // 현재 데이터 구조상 "이번 달 환산실적" 스냅샷만 존재하므로,
    // 현재 월에만 실제 값을 채우고 나머지 두 달은 null(데이터 없음)로 둔다.
    // (자세한 이유는 awardCalculator.calculateHonorsAward 주석 참고)
    const quarterMonths = CONFIG.AWARD_RULES.honors.quarterMonths;
    const highlightMonth = dateHelper.getQuarterMonthHighlight();
    const monthlyPerformance = {};
    quarterMonths.forEach((m) => {
      monthlyPerformance[m] = m === highlightMonth ? actualAmount : null;
    });
    const honorsResult = awardCalculator.calculateHonorsAward(monthlyPerformance);
    uiRenderer.renderHonors(honorsResult, quarterMonths, highlightMonth);

    // ---- 3) TC스텝업 ----
    // TC 월별 달성이력 컬럼이 현재 데이터에 없으므로 빈 이력을 전달한다.
    // (컬럼이 추가되면 dataLoader에서 실제 이력을 만들어 여기로 전달하면 됨)
    // ---- 3) TC스텝업 ----
const incomeProgress = plannerData.income
  ? plannerData.income[COLS.income.incomeProgress]
  : 0;

const tcResult = awardCalculator.calculateTCStepUpAward(incomeProgress);
uiRenderer.renderTCStepUp(plannerData, tcResult);

    uiRenderer.showScreen("result");
  },

  _handleLoadError(err) {
    console.error("[MY HI-UP] 데이터 로드 실패:", err);
    const message = String(err && err.message ? err.message : err);
    let detail = message;

    if (message.startsWith("FILE_NOT_FOUND:")) {
      const path = message.split(":")[1];
      detail = `${path} 파일을 찾을 수 없습니다. data 폴더 경로와 파일명을 확인하세요.`;
    } else if (message.startsWith("SHEET_NOT_FOUND:")) {
      detail = `엑셀 시트를 찾을 수 없습니다. (${message})`;
    }

    uiRenderer.renderError("load_fail", detail);
  },
};

document.addEventListener("DOMContentLoaded", () => app.init());
