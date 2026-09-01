/**
 * uiRenderer.js
 * ------------------------------------------------------------------
 * 계산된 데이터를 실제 화면(DOM)에 그리는 역할만 담당합니다.
 * 계산 로직은 절대 이 파일에 넣지 않고 awardCalculator.js 를 그대로 사용합니다.
 * ------------------------------------------------------------------
 */

const uiRenderer = {

  /** 숫자를 "8,935,818원" 형태로 표시. null/undefined/NaN 이면 "-" */
  formatWon(amount) {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return "-";
    return `${Math.round(Number(amount)).toLocaleString("ko-KR")}원`;
  },

  /** 순수 숫자만 콤마 포맷 (단위 없이) */
  formatNumber(amount) {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return "-";
    return Math.round(Number(amount)).toLocaleString("ko-KR");
  },

  el(id) {
    return document.getElementById(id);
  },

  /* ============================================================
   * 화면 전환
   * ============================================================ */

  showScreen(screenName) {
    this.el("screen-login").classList.toggle("hidden", screenName !== "login");
    this.el("screen-loading").classList.toggle("hidden", screenName !== "loading");
    this.el("screen-error").classList.toggle("hidden", screenName !== "error");
    this.el("screen-result").classList.toggle("hidden", screenName !== "result");
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  },

  renderLogin() {
    this.showScreen("login");
    this.el("login-error").classList.add("hidden");
    this.el("planner-code-input").value = "";
  },

  renderLoading() {
    this.showScreen("loading");
  },

  /**
   * @param {string} type - 'load_fail' | 'not_registered'
   * @param {string} detail - 개발자 확인용 상세 메시지(파일 경로 등)
   */
  renderError(type, detail = "") {
    if (type === "not_registered") {
      // 로그인 화면에 인라인 오류로 표시 (요청서 3~4 화면 오류 안내 규칙)
      this.showScreen("login");
      const box = this.el("login-error");
      box.textContent = "등록되지 않은 코드입니다.";
      box.classList.remove("hidden");
      return;
    }

    // 파일 로드 실패 등 시스템 오류는 별도 오류 화면으로 안내
    this.showScreen("error");
    this.el("error-detail").textContent = detail
      ? `개발자 확인용 : ${detail}`
      : "";
  },

  renderLoginFormatError() {
    this.showScreen("login");
    const box = this.el("login-error");
    box.textContent = "플래너 코드를 확인해주세요.";
    box.classList.remove("hidden");
  },

  /* ============================================================
   * 결과 화면 - 상단 가이드 헤더
   * ============================================================ */
  renderGuideHeader() {
    this.el("guide-title").textContent = dateHelper.getGuideTitle();
    this.el("guide-closing").textContent = dateHelper.getClosingDateLabel();
  },

  /* ============================================================
   * 결과 화면 - 플래너 공통 프로필
   * ============================================================ */
  renderPlannerProfile(plannerData) {
    const c = plannerData.conversion;
    const t = plannerData.target;
    const COLS = CONFIG.COLUMNS;

    const region = (t && t[COLS.target.region]) || (c && c[COLS.conversion.hq]) || "-";
    const branch = (c && c[COLS.conversion.branch]) || (t && t[COLS.target.branch]) || "-";
    const office = (c && c[COLS.conversion.office]) || "-";
    const name = (c && c[COLS.conversion.name]) || "-";
    const careerMonth = c ? c[COLS.conversion.careerMonth] : null;

    this.el("profile-region").textContent = region;
    this.el("profile-branch").textContent = branch;
    this.el("profile-office").textContent = office;
    this.el("profile-name").textContent = name;
    this.el("profile-code").textContent = plannerData.code;
    this.el("profile-month").textContent = careerMonth !== null ? `${careerMonth}차월` : "-";
  },

  /* ============================================================
   * 시상 1. 개인환산순증
   * ============================================================ */
  renderPersonalIncrease(result) {
    const monthLabel = dateHelper.getMonthLabel();
    this.el("pi-title").textContent = `${monthLabel} 환산순증 목표`;
    this.el("pi-target").textContent = this.formatWon(result.targetAmount);
    this.el("pi-actual").textContent = this.formatWon(result.actualAmount);
    this.el("pi-shortfall").textContent = this.formatWon(result.shortfall);
    this.el("pi-award").textContent = this.formatWon(result.awardAmount);

    // 진행률 게이지 (최대 100%)
    const percent = result.targetAmount > 0
      ? Math.min(100, Math.round((result.actualAmount / result.targetAmount) * 100))
      : 0;
    this.el("pi-progress-fill").style.width = `${percent}%`;
    this.el("pi-progress-percent").textContent = `${percent}%`;

    const statusBadge = this.el("pi-status-badge");
    if (result.achieved) {
      statusBadge.textContent = "목표 달성";
      statusBadge.className = "badge badge-success";
    } else {
      statusBadge.textContent = "목표 미달성";
      statusBadge.className = "badge badge-warning";
    }

    this.el("pi-tier-label").textContent = result.tierLabel
      ? `달성 구간 · ${result.tierLabel}`
      : "달성 구간 없음";
  },

  /* ============================================================
   * 시상 2. 매출아너스
   * ============================================================ */
  renderHonors(result, quarterMonths, highlightMonth) {
    this.el("honors-grade").textContent = result.grade;
    this.el("honors-average").textContent = this.formatWon(result.averagePerformance);
    this.el("honors-award").textContent = this.formatWon(result.awardAmount);

    const wrap = this.el("honors-monthly-wrap");
    wrap.innerHTML = "";

    quarterMonths.forEach((m) => {
      const value = result.monthlyPerformance[m];
      const hasData = value !== null && value !== undefined;
      const isCurrent = m === highlightMonth;

      const card = document.createElement("div");
      card.className = `honors-month-card${isCurrent ? " is-current" : ""}`;
      card.innerHTML = `
        <div class="honors-month-label">${m}월 실적${isCurrent ? " · 이번달" : ""}</div>
        <div class="honors-month-value">${hasData ? this.formatWon(value) : "데이터 없음"}</div>
      `;
      wrap.appendChild(card);
    });

    // 참고 안내 문구 (평균 계산 방식 투명하게 안내)
    const note = this.el("honors-note");
    if (result.availableMonths.length < quarterMonths.length) {
      note.textContent = "현재 집계된 달의 실적만으로 계산된 잠정 평균실적입니다. 월별 데이터가 추가되면 3개월 평균으로 자동 반영됩니다.";
    } else {
      note.textContent = "";
    }
  },

  /* ============================================================
   * 시상 3. TC스텝업
   * ============================================================ */
  renderTCStepUp(plannerData, tcResult) {
    const COLS = CONFIG.COLUMNS;
    const c = plannerData.conversion;
    const inc = plannerData.income;
    const monthLabel = dateHelper.getMonthLabel();

    this.el("tc-progress-title").textContent = `${monthLabel} 실적진도`;

    this.el("tc-life-insurance").textContent = c ? this.formatWon(c[COLS.conversion.lifeInsurance]) : "-";
    this.el("tc-auto").textContent = c ? this.formatWon(c[COLS.conversion.autoPerformance]) : "-";
    this.el("tc-conversion").textContent = c ? this.formatWon(c[COLS.conversion.conversionPerformance]) : "-";

    // 소득진도 (백데이터에 이미 계산되어 있는 값을 그대로 표시)
    this.el("tc-income-progress").textContent = inc ? this.formatWon(inc[COLS.income.incomeProgress]) : "-";
    this.el("tc-income-sub").textContent = inc
      ? `전월유지율 ${Math.round((inc[COLS.income.prevMonthRetention] || 0) * 100)}% · 실적인정률 ${Math.round((inc[COLS.income.recognitionRate] || 0) * 100)}%`
      : "";

    // TC스텝업 시상 결과
    const awardBox = this.el("tc-award-box");
    const badge = this.el("tc-award-badge");
    const desc = this.el("tc-award-desc");

   badge.textContent = tcResult.rewardLabel;

if (tcResult.achieved) {
  badge.className = "badge badge-success";
  desc.textContent = `소득진도 500만원 이상 달성`;
  awardBox.classList.remove("is-pending");
    } else {
      badge.className = "badge badge-muted";
      desc.textContent = `500만원까지 ${this.formatWon(tcResult.shortfall)} 부족`;
      awardBox.classList.remove("is-pending");
    }
  },

};
