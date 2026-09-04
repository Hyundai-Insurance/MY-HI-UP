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
    this.el("guide-title").textContent = dateHelper.getGuideTitle();
    this.el("guide-closing").textContent = dateHelper.getClosingDateLabel();
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
    this.el("pi-award").textContent = this.formatWon(result.displayAwardAmount);

    const percent = result.targetAmount > 0
      ? Math.min(100, Math.round((result.actualAmount / result.targetAmount) * 100))
      : 0;
    this.el("pi-progress-fill").style.width = `${percent}%`;
    this.el("pi-progress-percent").textContent = `${percent}%`;

    const statusBadge = this.el("pi-status-badge");
    if (result.month === 9 && result.beta200Applied) {
      statusBadge.textContent = "베타 200%";
      statusBadge.className = "badge badge-success";
    } else if (result.achieved) {
      statusBadge.textContent = "목표 달성";
      statusBadge.className = "badge badge-success";
    } else {
      statusBadge.textContent = result.month === 9 ? "데이터 준비중" : "목표 미달성";
      statusBadge.className = "badge badge-warning";
    }

    this.el("pi-tier-label").textContent = result.betaLabel || "월별 환산순증 시상 현황";

    const statusWrap = this.el("pi-month-status-wrap");
    statusWrap.innerHTML = "";
    [7, 8, 9].forEach((m) => {
      const status = result.monthStatuses[m];
      const item = document.createElement("div");
      const success = status.startsWith("달성");
      item.className = `month-status-item ${success ? "is-success" : status === "데이터 준비중" ? "is-ready" : "is-fail"}`;
      item.innerHTML = `<div class="month-status-month">${m}월</div><div class="month-status-text">${status}</div>`;
      statusWrap.appendChild(item);
    });
  },

  renderHonors(result, highlightMonth) {
    this.el("honors-grade").textContent = result.grade || "-";
    this.el("honors-average").textContent = this.formatWon(result.averagePerformance || 0);
    this.el("honors-award").textContent = this.formatWon(result.awardAmount || 0);
    this.el("honors-q1").textContent = result.q1Grade || "-";
    this.el("honors-q2").textContent = result.q2Grade || "-";

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
