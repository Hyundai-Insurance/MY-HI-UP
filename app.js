const app = {
  async init() {
    // 첫 화면에서는 무거운 백데이터를 읽지 않습니다.
    // 마감 기준일(meta.json)만 가볍게 불러옵니다.
    await dataLoader.loadMeta();
    uiRenderer.renderLogin();
    this._bindEvents();
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

    // 입력한 사번에 필요한 작은 JSON 조각만 불러옵니다.
    uiRenderer.renderLoading();
    try {
      await dataLoader.loadPlannerData(rawInput);
    } catch (err) {
      this._handleLoadError(err);
      return;
    }

    if (!dataLoader.isCodeRegistered(rawInput)) {
      uiRenderer.renderError("not_registered");
      return;
    }

    try {
      this._renderResultScreen(rawInput);
    } catch (err) {
      console.error("[MY HI-UP] 조회 화면 렌더링 실패:", err);
      uiRenderer.renderError("render_fail", String(err && err.message ? err.message : err));
    }
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

    if (message.startsWith("DATA_LOAD_FAILED:")) {
      detail = "웹용 데이터 파일을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
    }

    uiRenderer.renderError("load_fail", detail);
  },
};

document.addEventListener("DOMContentLoaded", () => app.init());
