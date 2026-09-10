const dataLoader = {
  _cache: {
    personalIncrease: [],
    honors: [],
    tcStepUp: [],
  },
  _plannerCache: new Map(),
  _meta: null,

  async loadMeta() {
    try {
      const response = await fetch("data/meta.json", { cache: "no-cache" });
      if (!response.ok) throw new Error(`META_LOAD_FAILED:${response.status}`);
      this._meta = await response.json();
    } catch (err) {
      console.warn("[MY HI-UP] 마감 기준일 파일을 불러오지 못해 기존 날짜 계산을 사용합니다.", err);
      this._meta = null;
    }
    return this._meta;
  },

  getClosingDate() {
    return this._meta?.closingDate || null;
  },

  normalizePlannerCode(rawCode) {
    if (rawCode === null || rawCode === undefined) return "";
    const str = String(rawCode).trim().toUpperCase();
    if (!str) return "";
    return /^\d+$/.test(str) ? str.padStart(6, "0") : str;
  },

  _prefixForCode(code) {
    return this.normalizePlannerCode(code).slice(0, CONFIG.DATA_SHARD_PREFIX_LENGTH);
  },

  async loadPlannerData(code) {
    const normalized = this.normalizePlannerCode(code);
    if (!normalized) return null;

    if (this._plannerCache.has(normalized)) {
      return this._plannerCache.get(normalized);
    }

    const prefix = this._prefixForCode(normalized);
    const url = `${CONFIG.DATA_SHARD_DIR}/${encodeURIComponent(prefix)}.json`;

    let response;
    try {
      // no-cache: 매번 전체 파일을 다시 받지 않고, 변경 여부만 확인해 최신 데이터 유지
      response = await fetch(url, { cache: "no-cache" });
    } catch (err) {
      throw new Error(`DATA_LOAD_FAILED:${url}`);
    }

    // 해당 prefix 파일 자체가 없으면 미등록 코드
    if (response.status === 404) {
      this._plannerCache.set(normalized, null);
      return null;
    }
    if (!response.ok) {
      throw new Error(`DATA_LOAD_FAILED:${url}`);
    }

    const shard = await response.json();
    const planner = shard[normalized] || null;
    this._plannerCache.set(normalized, planner);

    // 기존 렌더러/계산기 인터페이스를 그대로 유지하기 위한 1인 캐시
    this._cache.personalIncrease = planner?.personalIncrease ? [planner.personalIncrease] : [];
    this._cache.honors = planner?.honors ? [planner.honors] : [];
    this._cache.tcStepUp = planner?.tcStepUp ? [planner.tcStepUp] : [];

    return planner;
  },

  // 기존 코드와의 호환용. 이제 엑셀 전체를 미리 읽지 않는다.
  async loadExcelFiles() {
    return this._cache;
  },

  isCodeRegistered(code) {
    const normalized = this.normalizePlannerCode(code);
    const planner = this._plannerCache.get(normalized);
    return !!(planner && (planner.personalIncrease || planner.honors));
  },

  findPlannerData(code) {
    const normalized = this.normalizePlannerCode(code);
    const planner = this._plannerCache.get(normalized);
    return planner || {
      code: normalized,
      personalIncrease: null,
      honors: null,
      tcStepUp: null,
    };
  },
};
