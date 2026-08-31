/**
 * dataLoader.js
 * ------------------------------------------------------------------
 * data 폴더의 엑셀 3개(환산실적/소득진도/개인목표)를 불러와서
 * 자바스크립트 배열로 변환하고, 플래너 코드로 조회하는 기능을 담당합니다.
 *
 * ⚠️ 플래너 코드 처리 규칙 (매우 중요)
 * - 플래너 코드는 항상 문자열(String)로 다룬다.
 * - 엑셀 원본에는 코드가 숫자(116563)로 들어있는 행과
 *   문자열("086027")로 들어있는 행이 섞여 있다.
 * - 숫자로 저장된 코드는 앞자리 0이 이미 사라진 상태이므로,
 *   반드시 6자리로 0을 채워서(zero-pad) 비교해야 한다.
 * ------------------------------------------------------------------
 */

const dataLoader = {

  // 불러온 원본 데이터를 캐싱해두는 저장소
  _cache: {
    conversion: null, // 환산실적.xlsx 데이터 배열
    income: null,      // 소득진도.xlsx 데이터 배열
    target: null,      // 개인목표.xlsx 데이터 배열
  },

  /**
   * 플래너 코드를 6자리 문자열로 정규화한다.
   * 예) 86027 -> "086027", "086027" -> "086027", " 116563 " -> "116563"
   */
  normalizePlannerCode(rawCode) {
    if (rawCode === null || rawCode === undefined) return "";
    const str = String(rawCode).trim();
    if (str === "") return "";
    return str.padStart(6, "0");
  },

  /** 엑셀 파일 하나를 fetch로 읽어 JSON 배열(행 객체 배열)로 변환 */
  async _loadSheet(filePath, sheetName) {
    // 캐시 무효화(cache-busting): GitHub Pages 캐시로 최신 데이터가
    // 반영되지 않는 문제를 줄이기 위해 매 요청마다 no-store + 타임스탬프 사용
    const bustUrl = `${filePath}?t=${Date.now()}`;

    const response = await fetch(bustUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`FILE_NOT_FOUND:${filePath}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    // xlsxLite.js: 외부 CDN 없이 자체 구현한 경량 XLSX 리더 사용
    const workbook = await xlsxLite.readWorkbook(arrayBuffer);

    const rows2D = workbook.sheets[sheetName] || workbook.sheets[workbook.sheetNames[0]];
    if (!rows2D) {
      throw new Error(`SHEET_NOT_FOUND:${filePath}:${sheetName}`);
    }
    if (rows2D.length === 0) return [];

    const headers = rows2D[0];
    const dataRows = rows2D.slice(1);

    return dataRows
      .filter((row) => row.some((cell) => cell !== null && cell !== ""))
      .map((row) => {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] !== undefined ? row[i] : null;
        });
        return obj;
      });
  },

  /**
   * 3개 엑셀 파일을 모두 불러온다.
   * 실패 시 어떤 파일이 문제였는지 구분해서 예외를 던진다. (오류 처리에서 활용)
   */
  async loadExcelFiles() {
    const files = CONFIG.DATA_FILES;
    const sheets = CONFIG.SHEET_NAMES;

    const [conversion, income, target] = await Promise.all([
      this._loadSheet(files.conversion, sheets.conversion),
      this._loadSheet(files.income, sheets.income),
      this._loadSheet(files.target, sheets.target),
    ]);

    this._cache.conversion = conversion;
    this._cache.income = income;
    this._cache.target = target;

    return { conversion, income, target };
  },

  /** 특정 플래너 코드가 실제로 데이터에 존재하는지 확인 */
  isCodeRegistered(code) {
    const normalized = this.normalizePlannerCode(code);
    const col = CONFIG.COLUMNS.conversion.code;
    return this._cache.conversion.some(
      (row) => this.normalizePlannerCode(row[col]) === normalized
    );
  },

  /**
   * 코드 기준으로 3개 데이터 소스에서 각각 해당 플래너의 행을 찾아 반환.
   * 하나라도 없으면 null로 채워서 반환(화면단에서 "-" 등으로 처리).
   */
  findPlannerData(code) {
    const normalized = this.normalizePlannerCode(code);

    const conversionRow =
      this._cache.conversion.find(
        (row) => this.normalizePlannerCode(row[CONFIG.COLUMNS.conversion.code]) === normalized
      ) || null;

    const incomeRow =
      this._cache.income.find(
        (row) => this.normalizePlannerCode(row[CONFIG.COLUMNS.income.code]) === normalized
      ) || null;

    const targetRow =
      this._cache.target.find(
        (row) => this.normalizePlannerCode(row[CONFIG.COLUMNS.target.code]) === normalized
      ) || null;

    return {
      code: normalized,
      conversion: conversionRow,
      income: incomeRow,
      target: targetRow,
    };
  },
};
