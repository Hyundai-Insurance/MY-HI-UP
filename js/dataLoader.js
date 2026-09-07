const dataLoader = {
  _cache: {
    personalIncrease: null,
    honors: null,
    tcStepUp: null,
  },

  normalizePlannerCode(rawCode) {
    if (rawCode === null || rawCode === undefined) return "";
    const str = String(rawCode).trim().toUpperCase();
    if (!str) return "";
    return /^\d+$/.test(str) ? str.padStart(6, "0") : str;
  },

  _toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },

  _cell(row, idx) {
    return row && row[idx] !== undefined ? row[idx] : null;
  },

  async _loadWorkbook() {
    const bustUrl = `${CONFIG.DATA_FILE}?t=${Date.now()}`;
    const response = await fetch(bustUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`FILE_NOT_FOUND:${CONFIG.DATA_FILE}`);
    const arrayBuffer = await response.arrayBuffer();
    return await xlsxLite.readWorkbook(arrayBuffer);
  },

  _getRows(workbook, sheetName) {
    const rows = workbook.sheets[sheetName];
    if (!rows) throw new Error(`SHEET_NOT_FOUND:${sheetName}`);
    return rows;
  },

  _parsePersonalIncrease(rows) {
    const I = CONFIG.INDEX.personalIncrease;
    return rows.slice(CONFIG.DATA_START_ROWS.personalIncrease)
      .map((r) => {
        const target = this._toNumber(this._cell(r, I.commonTarget)) || 0;
        return {
          region: this._cell(r, I.region),
          branch: this._cell(r, I.branch),
          code: this.normalizePlannerCode(this._cell(r, I.code)),
          name: this._cell(r, I.name),
          careerMonth: this._toNumber(this._cell(r, I.careerMonth)),
          months: {
            7: {
              target,
              actual: this._toNumber(this._cell(r, I.julActual)) || 0,
              shortfall: this._toNumber(this._cell(r, I.julShortfall)),
              award: this._toNumber(this._cell(r, I.julAward)) || 0,
              flag: this._toNumber(this._cell(r, I.julFlag)),
            },
            8: {
              target,
              actual: this._toNumber(this._cell(r, I.augActual)) || 0,
              shortfall: this._toNumber(this._cell(r, I.augShortfall)),
              award: this._toNumber(this._cell(r, I.augAward)) || 0,
              flag: this._toNumber(this._cell(r, I.augFlag)),
            },
            9: {
              target,
              actual: this._toNumber(this._cell(r, I.sepActual)) || 0,
              shortfall: this._toNumber(this._cell(r, I.sepShortfall)),
              award: this._toNumber(this._cell(r, I.sepAward)) || 0,
              flag: this._toNumber(this._cell(r, I.sepFlag)),
            },
          },
        };
      })
      .filter((r) => r.code);
  },

  _parseHonors(rows) {
    const I = CONFIG.INDEX.honors;
    return rows.slice(CONFIG.DATA_START_ROWS.honors)
      .map((r) => ({
        region: this._cell(r, I.region),
        branch: this._cell(r, I.branch),
        team: this._cell(r, I.team),
        code: this.normalizePlannerCode(this._cell(r, I.code)),
        name: this._cell(r, I.name),
        careerMonth: this._toNumber(this._cell(r, I.careerMonth)),
        monthlyPerformance: {
          7: this._toNumber(this._cell(r, I.jul)) || 0,
          8: this._toNumber(this._cell(r, I.aug)) || 0,
          9: this._toNumber(this._cell(r, I.sep)) || 0,
        },
        averagePerformance: this._toNumber(this._cell(r, I.average)) || 0,
        grade: this._cell(r, I.grade) || "-",
        awardAmount: this._toNumber(this._cell(r, I.award)) || 0,
      }))
      .filter((r) => r.code);
  },

  _parseTCStepUp(rows) {
    const I = CONFIG.INDEX.tcStepUp;
    return rows.slice(CONFIG.DATA_START_ROWS.tcStepUp)
      .map((r) => {
        const earlyNote = String(this._cell(r, I.earlyNote) || "").trim();
        return {
          region: this._cell(r, I.region),
          branch: this._cell(r, I.branch),
          code: this.normalizePlannerCode(this._cell(r, I.code)),
          name: this._cell(r, I.name),
          careerMonth: this._toNumber(this._cell(r, I.careerMonth)),
          lifeInsurance: this._toNumber(this._cell(r, I.lifeInsurance)) || 0,
          autoPerformance: this._toNumber(this._cell(r, I.autoPerformance)) || 0,
          conversionPerformance: this._toNumber(this._cell(r, I.conversionPerformance)) || 0,
          incomeProgress: this._toNumber(this._cell(r, I.incomeProgress)) || 0,
          awardAmount: this._toNumber(this._cell(r, I.awardAmount)) || 0,
          prevMonthNote: earlyNote,
          status: earlyNote ? CONFIG.AWARD_RULES.tcStepUp.earlyText : CONFIG.AWARD_RULES.tcStepUp.maintainText,
        };
      })
      .filter((r) => r.code);
  },

  async loadExcelFiles() {
    const workbook = await this._loadWorkbook();
    const S = CONFIG.SHEET_NAMES;

    this._cache.personalIncrease = this._parsePersonalIncrease(this._getRows(workbook, S.personalIncrease));
    this._cache.honors = this._parseHonors(this._getRows(workbook, S.honors));
    this._cache.tcStepUp = this._parseTCStepUp(this._getRows(workbook, S.tcStepUp));

    return this._cache;
  },

  isCodeRegistered(code) {
    const normalized = this.normalizePlannerCode(code);
    return this._cache.personalIncrease.some((r) => r.code === normalized) ||
           this._cache.honors.some((r) => r.code === normalized);
  },

  findPlannerData(code) {
    const normalized = this.normalizePlannerCode(code);
    return {
      code: normalized,
      personalIncrease: this._cache.personalIncrease.find((r) => r.code === normalized) || null,
      honors: this._cache.honors.find((r) => r.code === normalized) || null,
      tcStepUp: this._cache.tcStepUp.find((r) => r.code === normalized) || null,
    };
  },
};
