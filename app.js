const app = {
  async init() {
    uiRenderer.renderLogin();
    this._bindEvents();
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

    input.addEventListener("input", () => {
      input.value = input.value
        .toUpperCase()
        .replace(/[^0-9A-Z]/g, "")
        .slice(0, 6);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this._handleSubmit();
    });

    submitBtn.addEventListener("click", () => this._handleSubmit());
    backBtn.addEventListener("click", () => uiRenderer.renderLogin());
    retryBtn.addEventListener("click", () => window.location.reload());
  },

  async _handleSubmit() {
    const rawInput = uiRenderer.el("planner-code-input").value.trim().toUpperCase();

    if (!/^[0-9A-Z]{6}$/.test(rawInput)) {
      uiRenderer.renderLoginFormatError();
      return;
    }

    if (!dataLoader._cache.personalIncrease) {
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
    const currentMonth = new Date().getMonth() + 1;
    const displayMonth = [7, 8, 9].includes(currentMonth) ? currentMonth : 9;

    uiRenderer.renderGuideHeader();
    uiRenderer.renderPlannerProfile(plannerData);

    const piResult = awardCalculator.calculatePersonalIncreaseAward(
      plannerData.personalIncrease,
      displayMonth
    );
    uiRenderer.renderPersonalIncrease(piResult);

    const honorsResult = awardCalculator.getHonorsResult(plannerData.honors);
    const highlightMonth = [7, 8, 9].includes(currentMonth) ? currentMonth : 9;
    uiRenderer.renderHonors(honorsResult, highlightMonth);

    const tcResult = awardCalculator.getTCStepUpResult(plannerData.tcStepUp);
    uiRenderer.renderTCStepUp(tcResult);

    const totalSummary = awardCalculator.calculateTotalSummary(piResult, honorsResult, tcResult);
    uiRenderer.renderTotalAward(totalSummary);

    uiRenderer.showScreen("result");
  },

  _handleLoadError(err) {
    console.error("[MY HI-UP] 데이터 로드 실패:", err);
    const message = String(err && err.message ? err.message : err);
    let detail = message;

    if (message.startsWith("FILE_NOT_FOUND:")) {
      detail = `${CONFIG.DATA_FILE} 파일을 찾을 수 없습니다. data 폴더와 파일명을 확인하세요.`;
    } else if (message.startsWith("SHEET_NOT_FOUND:")) {
      detail = `통합 백데이터의 시트명을 확인하세요. (${message})`;
    }

    uiRenderer.renderError("load_fail", detail);
  },
};

document.addEventListener("DOMContentLoaded", () => app.init());
