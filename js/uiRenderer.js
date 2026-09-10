const uiRenderer = {
  formatWon(amount) {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return "-";
    return `${Math.round(Number(amount)).toLocaleString("ko-KR")}원`;
  },

  el(id) { return document.getElementById(id); },

  showScreen(screenName) {
    this.el("screen-login").classList.toggle("hidden", screenName !== "login");
    this.el("screen-loading").classList.toggle("hidden", screenName !== "loading");
    this.el("screen-error").classList.toggle("hidden", screenName !== "error");
    this.el("screen-result").classList.toggle("hidden", screenName !== "result");
    window.scrollTo({ top: 0, behavior: "auto" });
  },

  renderLogin() {
    this.showScreen("login");
    this.el("login-error").classList.add("hidden");
    this.el("planner-code-input").value = "";
  },

  renderLoading() { this.showScreen("loading"); },

  renderError(type, detail = "") {
    if (type === "not_registered") {
      this.showScreen("login");
      const box = this.el("login-error");
      box.textContent = "등록되지 않은 코드입니다.";
      box.classList.remove("hidden");
      return;
    }
    this.showScreen("error");
    this.el("error-detail").textContent = detail ? `개발자 확인용 : ${detail}` : "";
  },

  renderLoginFormatError() {
    this.showScreen("login");
    const box = this.el("login-error");
    box.textContent = "플래너 코드를 확인해주세요. (영문/숫자 6자리)";
    box.classList.remove("hidden");
  },

  renderGuideHeader() {
    this.el("guide-title").textContent = "3분기 HI-UP";
    this.el("guide-closing").textContent = dateHelper.getClosingDateLabel(dataLoader.getClosingDate());
  },

  renderPlannerProfile(plannerData) {
    const base = plannerData.personalIncrease || plannerData.honors || plannerData.tcStepUp;
    const honors = plannerData.honors;

    this.el("profile-region").textContent = base?.region || "-";
    this.el("profile-branch").textContent = base?.branch || "-";
    this.el("profile-office").textContent = honors?.team ? `팀 ${honors.team}` : "";
    this.el("profile-name").textContent = base?.name || "-";
    this.el("profile-code").textContent = plannerData.code;
    this.el("profile-month").textContent = base?.careerMonth !== null && base?.careerMonth !== undefined
      ? `${base.careerMonth}차월`
      : "-";
  },

  renderTotalAward(summary) {
    this.el("total-award-cash").textContent = this.formatWon(summary.cashTotal);
    const extra = this.el("total-award-extra");

    if (summary.tcEarly) {
      extra.textContent = `+ ${summary.tcRewardText}`;
      extra.className = "total-award-extra is-gold";
      extra.classList.remove("hidden");
    } else if (summary.tcMaintain) {
      extra.textContent = summary.tcRewardText;
      extra.className = "total-award-extra is-challenge";
      extra.classList.remove("hidden");
    } else {
      extra.textContent = "";
      extra.classList.add("hidden");
    }
  },

  renderPersonalIncrease(result) {
    const monthLabel = `${result.month}월`;
    this.el("pi-title").textContent = `${monthLabel} 환산순증 목표`;
    this.el("pi-target").textContent = this.formatWon(result.targetAmount);
    this.el("pi-actual").textContent = this.formatWon(result.actualAmount);
    this.el("pi-shortfall").textContent = this.formatWon(result.shortfall);

    const setText = (id, value) => { const node = this.el(id); if (node) node.textContent = value; };
    setText("pi-current-award", this.formatWon(result.currentSecuredAmount));
    setText("pi-september-award", this.formatWon(result.septemberExpectedAmount));
    setText("pi-final-award", this.formatWon(result.totalAwardAmount));
    setText("pi-additional-award", this.formatWon(result.septemberExpectedAmount));
    setText("pi-forecast-note", result.forecastNote || "9월 목표 달성 시 받을 수 있는 예상 금액입니다.");
    setText("pi-september-rule", result.septemberMultiplier === 2 ? "9월 시상금 × 200% 적용" : "9월 시상금 100% 적용");
    setText("pi-award", this.formatWon(result.totalAwardAmount));

    const motivationWrap = this.el("pi-motivation-wrap");
    const forecastNote = this.el("pi-forecast-note");
    if (motivationWrap) motivationWrap.classList.toggle("hidden", !result.showSeptemberForecast);
    if (forecastNote) forecastNote.classList.toggle("hidden", !result.showSeptemberForecast);

    const percent = result.targetAmount > 0
      ? Math.min(100, Math.round((result.actualAmount / result.targetAmount) * 100))
      : 0;
    this.el("pi-progress-fill").style.width = `${percent}%`;
    this.el("pi-progress-percent").textContent = `${percent}%`;

    // 개인환산순증 제목 옆 상태 배지는 사용하지 않음
    const statusBadge = this.el("pi-status-badge");
    if (statusBadge) statusBadge.classList.add("hidden");

    this.el("pi-tier-label").textContent = "7·8·9월 개인환산순증 시상 현황";

    const statusWrap = this.el("pi-month-status-wrap");
    statusWrap.innerHTML = "";
    [7, 8, 9].forEach((m) => {
      const status = result.monthStatuses[m];
      const award = result.monthAwards[m] || 0;
      const item = document.createElement("div");
      const safeStatus = String(status || "데이터 준비중");
      const success = safeStatus.startsWith("달성");
      item.className = `month-status-item ${success ? "is-success" : safeStatus === "데이터 준비중" ? "is-ready" : "is-fail"}`;
      item.innerHTML = `
        <div class="month-status-month">${m}월</div>
        <div class="month-status-text">${safeStatus}</div>
        <div class="month-status-award">${this.formatWon(award)}</div>
      `;
      statusWrap.appendChild(item);
    });
  },

  renderHonors(result, highlightMonth) {
    this.el("honors-grade").textContent = result.grade || "-";
    this.el("honors-average").textContent = this.formatWon(result.averagePerformance || 0);
    this.el("honors-award").textContent = this.formatWon(result.awardAmount || 0);

    const wrap = this.el("honors-monthly-wrap");
    wrap.innerHTML = "";
    [7, 8, 9].forEach((m) => {
      const value = result.monthlyPerformance?.[m] || 0;
      const card = document.createElement("div");
      card.className = `honors-month-card${m === highlightMonth ? " is-current" : ""}`;
      card.innerHTML = `
        <div class="honors-month-label">${m}월 실적${m === highlightMonth ? " · 이번달" : ""}</div>
        <div class="honors-month-value">${this.formatWon(value)}</div>
      `;
      wrap.appendChild(card);
    });

    this.el("honors-note").textContent = (result.monthlyPerformance?.[9] || 0) === 0
      ? "9월 실적 데이터 준비중 · 평균실적/등급/시상금은 백데이터의 현재 계산값을 표시합니다."
      : "";
  },

  renderTCStepUp(tcResult) {
    const section = this.el("section-tc");
    const nav = this.el("nav-tc");

    if (!tcResult.eligible) {
      section.classList.add("hidden");
      nav.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");
    nav.classList.remove("hidden");

    const monthLabel = dateHelper.getMonthLabel();
    this.el("tc-progress-title").textContent = `${monthLabel} 실적진도`;
    this.el("tc-life-insurance").textContent = this.formatWon(tcResult.lifeInsurance);
    this.el("tc-auto").textContent = this.formatWon(tcResult.autoPerformance);
    this.el("tc-conversion").textContent = this.formatWon(tcResult.conversionPerformance);
    this.el("tc-income-progress").textContent = this.formatWon(tcResult.incomeProgress);
    this.el("tc-income-sub").textContent = tcResult.prevMonthNote || "";

    const badge = this.el("tc-award-badge");
    const desc = this.el("tc-award-desc");
    const awardBox = this.el("tc-award-box");

    badge.textContent = tcResult.rewardText;
    if (tcResult.isEarly) {
      badge.className = "badge badge-success";
      desc.textContent = "조기달성 대상자";
      awardBox.classList.remove("is-pending");
    } else if (tcResult.isMaintain) {
      badge.className = "badge badge-warning";
      desc.textContent = "유지달성 시상 도전 대상자";
      awardBox.classList.add("is-pending");
    } else {
      badge.className = "badge badge-muted";
      desc.textContent = "현재 시상 구분을 확인해주세요.";
      awardBox.classList.add("is-pending");
    }
  },
};
