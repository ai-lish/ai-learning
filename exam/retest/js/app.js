(function () {
  'use strict';

  var STORAGE_KEY = 'aiLearning.retest.printHistory.v1';
  var UI_LANGUAGE_STORAGE_KEY = 'aiLearning.retest.uiLanguage.v1';
  var FIRESTORE_HISTORY_PAGE_SIZE = 50;
  var SCHOOL_DEFAULT = '神召會康樂中學';
  var SCHOOL_DEFAULT_EN = 'Assembly of God Hebron Secondary School';
  var UI_TEXT = {
    zh: {
      'browser.title': '測考專區｜補測生成',
      'home.link': '← 返回首頁',
      'home.aria': '返回首頁',
      'auth.aria': '登入狀態',
      'auth.loading': '登入狀態載入中',
      'auth.loadingLabel': '登入…',
      'auth.unavailable': '登入系統暫時不可用',
      'auth.user': '已登入用戶',
      'auth.teacher': '老師',
      'auth.logout': '登出',
      'auth.googleSignIn': '使用 Google 登入',
      'auth.toast.preparing': '登入系統準備中，請稍候…',
      'auth.toast.notReady': '登入系統尚未就緒',
      'auth.toast.persistence': '登入偏好設定失敗，將使用預設值',
      'auth.toast.unauthorized': '此帳戶未獲授權',
      'auth.toast.cancelled': '已取消登入',
      'auth.toast.popupBlocked': '瀏覽器已阻擋登入視窗',
      'auth.toast.network': '網絡連線失敗，請稍後再試',
      'auth.toast.domain': '此網站暫未獲授權登入',
      'auth.toast.setup': '登入服務尚未完成設定',
      'auth.toast.failure': '登入失敗，請稍後再試',
      'intro.eyebrow': 'AI Learning · 考試與溫習',
      'intro.title': '測考專區',
      'intro.description': '選擇已建立的補測，輸入版本、日期及學校名稱，產生可列印的 A4 試卷與評卷參考。',
      'language.group': '語言',
      'language.label': '語言',
      'language.zh': '中文',
      'language.en': 'English',
      'language.status': '中文模式；選擇 English 切換。',
      'record.loading': '登入狀態載入中；補測可免登入使用，列印記錄保存在此瀏覽器。',
      'record.authStateUnavailable': '登入狀態無法讀取；補測照常免登入使用，列印記錄保存在此瀏覽器。',
      'record.cloudFallback': '雲端記錄未能同步；記錄仍保存在此帳戶的本機儲存，列印不受影響。',
      'record.missingUid': '登入狀態缺少帳戶識別；補測照常使用，列印記錄保存在本機。',
      'record.syncing': '登入同步中；本機列印記錄會合併到此帳戶。',
      'record.synced': '已登入；列印記錄已同步到此帳戶，可在其他裝置繼續。',
      'record.serviceUnavailable': '登入服務暫不可用；補測照常免登入使用，列印記錄保存在此瀏覽器。',
      'record.guest': '訪客可完整使用；列印記錄保存在此瀏覽器。',
      'catalog.eyebrow': '可用補測',
      'catalog.title': '按級別選擇',
      'grade.s1': 'S1 · 中一',
      'grade.s4': 'S4 · 中四',
      'grade.m2': 'M2 · 延伸單元二',
      'catalog.empty': '暫未有補測',
      'assessment.s1q9.name': 'S1Ch1.2-2Test 補測',
      'assessment.s1q9.description': '1A 級測一第 9 題 · 有向數四則 · 13 分',
      'assessment.s1class2.name': 'S1 班測2 重測（代數式及數列）',
      'assessment.s1class2.description': '1A 代數式及數列 · 20 分鐘 · 22 分',
      'assessment.s1class3.name': 'S1 班測3 重測（代數、方程及數列）',
      'assessment.s1class3.description': '1A 四則運算、代數式、方程及數列 · 20 分鐘 · 20 分',
      'assessment.s4ch1.name': 'S4Ch1Test 補測',
      'assessment.s4ch1.description': '第一章一元二次方程 · Q7、Q8、Q9、Q10、Q12 · 21 分',
      'assessment.s4class4.name': '4CD3 班測4 補測（Ch2–3 及初中課題）',
      'assessment.s4class4.description': 'V1 固定題目；V2 起可持續生成 · 30 分 · 25 分鐘',
      'assessment.m2test3.name': 'M2 Test 3 補測（二項式定理）',
      'assessment.m2test3.description': '二項式定理 · 4 題 · 20 分',
      'assessment.m2test4.name': 'M2 Test 4 補測',
      'assessment.m2test4.description': '數學歸納法、二項式定理及三角學 · 5 題 · 20 分',
      'generator.eyebrow': '出卷設定',
      'generator.title': '產生補測',
      'field.assessment': '補測',
      'field.assessmentPlaceholder': '請選擇補測',
      'field.date': '日期',
      'field.version': '版本',
      'field.layout': '版式',
      'field.school': '學校名稱',
      'version.help.none': '請先選擇補測；可輸入 V1、V2… 或 V12。',
      'version.help.selected': '可輸入 V1、V2… 或 V12。V1–V{fixedThrough} 沿用已派發題目，V{generated} 起按補測代號及版本固定生成。',
      'school.help': '可搜尋中英文名稱或部分字眼；沒有建議時仍可自行輸入，最多 120 字。',
      'layout.general': '一般版式',
      'layout.exam': '公開試版式（試題答題簿）',
      'version.recommendation': '建議下一個未用版本：{version}',
      'status.chooseAssessment': '請先選擇補測。',
      'status.versionMissing': '請輸入版本。',
      'status.dateMissing': '日期不可留空。',
      'status.dateSchoolMissing': '日期及學校名稱不可留空。',
      'status.loading': '正在載入題目並驗算…',
      'status.mathjaxLoading': '正在載入數學排版…',
      'status.mathjaxError': '數學排版未能載入，暫不能列印。',
      'status.ready': '題目已驗算。試卷 {paperPages} 頁，答案 {answerPages} 頁。',
      'status.generationError': '無法生成這個版本。',
      'status.localSaveError': '無法保存本機列印記錄；出卷及列印仍可使用。',
      'placeholder.chooseAssessment': '選擇補測及版本後，這裡會顯示試卷與答案預覽。',
      'placeholder.version': '請輸入版本，例如 V4。',
      'placeholder.date': '請填寫日期。',
      'placeholder.dateSchool': '請填寫日期及學校名稱。',
      'placeholder.mathjaxLoading': '正在載入數學排版…',
      'placeholder.mathjaxError': '數學排版未能載入；請重新載入頁面後再列印。',
      'action.group': '列印選項',
      'action.paper': '列印補測卷',
      'action.answers': '列印答案',
      'action.practice': '匯出練習',
      'action.newVersion': '再出一份',
      'action.practiceNote': '「匯出練習」會同時列印試卷及答案頁。',
      'settings.aria': '出卷設定及列印記錄',
      'history.eyebrow': '列印記錄',
      'history.title': '最近列印',
      'history.empty': '尚未有列印記錄。',
      'history.restoreLast': '回復上次設定',
      'history.restore': '回復此設定',
      'category.paper': '補測卷',
      'category.answers': '答案',
      'category.practice': '練習',
      'preview.eyebrow': '列印預覽',
      'preview.title': 'A4 試卷與評卷參考',
      'preview.summaryEmpty': '選擇補測後顯示版本、版式及頁數。',
      'preview.versionUnknown': '版本未確認',
      'preview.pageCount': '試卷 {pages} 頁',
      'preview.pagePending': '頁數待計算',
      'preview.layoutGeneral': '一般版式',
      'preview.layoutExam': '公開試版式',
      'footer.privacy': '列印記錄只包含補測代號、版本、日期、學校名稱、輸出類別及時間，不記錄姓名或成績。',
      'school.noMatch': '未找到學校名稱；可保留或自行輸入。',
      'school.listUnavailable': '學校名單未能載入；仍可手動輸入任何名稱。'
    },
    en: {
      'browser.title': 'Test & Retest | Retest Generator',
      'home.link': '← Home',
      'home.aria': 'Return to home page',
      'auth.aria': 'Sign-in status',
      'auth.loading': 'Loading sign-in status',
      'auth.loadingLabel': 'Loading…',
      'auth.unavailable': 'Sign-in unavailable',
      'auth.user': 'Signed-in user',
      'auth.teacher': 'Teacher',
      'auth.logout': 'Sign out',
      'auth.googleSignIn': 'Sign in with Google',
      'auth.toast.preparing': 'Sign-in is starting. Please wait…',
      'auth.toast.notReady': 'Sign-in is not ready yet.',
      'auth.toast.persistence': 'Could not save sign-in preference; using the default.',
      'auth.toast.unauthorized': 'This account is not authorized.',
      'auth.toast.cancelled': 'Sign-in cancelled.',
      'auth.toast.popupBlocked': 'The browser blocked the sign-in window.',
      'auth.toast.network': 'Network error. Please try again later.',
      'auth.toast.domain': 'This website is not authorized for sign-in yet.',
      'auth.toast.setup': 'Sign-in is not fully configured yet.',
      'auth.toast.failure': 'Sign-in failed. Please try again later.',
      'intro.eyebrow': 'AI Learning · Assessments and Revision',
      'intro.title': 'Test & Retest',
      'intro.description': 'Choose a retest, enter its version, date and school name, then create printable A4 papers and marking schemes.',
      'language.group': 'Language',
      'language.label': 'Language',
      'language.zh': '中文',
      'language.en': 'English',
      'language.status': 'English mode; choose 中文 to switch.',
      'record.loading': 'Checking sign-in status; the retest remains available without sign-in and print history stays in this browser.',
      'record.authStateUnavailable': 'Sign-in status could not be read; the retest remains available and print history stays in this browser.',
      'record.cloudFallback': 'Cloud history could not sync. This account’s local copy is kept; printing is unaffected.',
      'record.missingUid': 'The signed-in account ID is unavailable; the retest remains available and print history is kept locally.',
      'record.syncing': 'Syncing sign-in; local print history will be merged into this account.',
      'record.synced': 'Signed in; print history is synced to this account and available on other devices.',
      'record.serviceUnavailable': 'Sign-in is temporarily unavailable; the retest remains open to visitors and print history stays in this browser.',
      'record.guest': 'Visitors can use all retest features; print history stays in this browser.',
      'catalog.eyebrow': 'Available retests',
      'catalog.title': 'Choose a level',
      'grade.s1': 'S1 · Form 1',
      'grade.s4': 'S4 · Form 4',
      'grade.m2': 'M2 · Extended Module 2',
      'catalog.empty': 'No retest is available yet.',
      'assessment.s1q9.name': 'S1 Form Test 1 Q9 Retest',
      'assessment.s1q9.description': '1A Form Test 1, Question 9 · operations with directed numbers · 13 marks',
      'assessment.s1class2.name': 'S1 Class Test 2 Retest (Algebraic Expressions and Sequences)',
      'assessment.s1class2.description': 'Form 1 algebraic expressions and sequences · 20 minutes · 22 marks',
      'assessment.s1class3.name': 'S1 Class Test 3 Retest (Algebra, Equations and Sequences)',
      'assessment.s1class3.description': 'Form 1 arithmetic, algebraic expressions, equations and sequences · 20 minutes · 20 marks',
      'assessment.s4ch1.name': 'S4 Chapter 1 Retest',
      'assessment.s4ch1.description': 'Quadratic equations · Questions 7, 8, 9, 10 and 12 · 21 marks',
      'assessment.s4class4.name': '4CD3 Class Test 4 Retest (Chapters 2–3 and junior topics)',
      'assessment.s4class4.description': 'Fixed V1; generate more versions from V2 · 30 marks · 25 minutes',
      'assessment.m2test3.name': 'M2 Test 3 Retest (Binomial Theorem)',
      'assessment.m2test3.description': 'Binomial theorem · 4 questions · 20 marks',
      'assessment.m2test4.name': 'M2 Test 4 Retest',
      'assessment.m2test4.description': 'Mathematical induction, binomial theorem and trigonometry · 5 questions · 20 marks',
      'generator.eyebrow': 'Paper settings',
      'generator.title': 'Generate a retest',
      'field.assessment': 'Retest',
      'field.assessmentPlaceholder': 'Choose a retest',
      'field.date': 'Date',
      'field.version': 'Version',
      'field.layout': 'Layout',
      'field.school': 'School name',
      'version.help.none': 'Choose a retest first. Enter a version such as V1, V2 or V12.',
      'version.help.selected': 'Enter V1, V2 or V12. V1–V{fixedThrough} use the issued questions; V{generated} and later are generated deterministically from the retest ID and version.',
      'school.help': 'Search Chinese or English names, including partial text. If there is no suggestion, enter any school name (up to 120 characters).',
      'layout.general': 'General layout',
      'layout.exam': 'Public-exam layout (Question-Answer Book)',
      'version.recommendation': 'Suggested next unused version: {version}',
      'status.chooseAssessment': 'Choose a retest first.',
      'status.versionMissing': 'Enter a version.',
      'status.dateMissing': 'Enter a date.',
      'status.dateSchoolMissing': 'Enter a date and school name.',
      'status.loading': 'Loading and checking the questions…',
      'status.mathjaxLoading': 'Loading mathematical typesetting…',
      'status.mathjaxError': 'Mathematical typesetting failed to load; printing is unavailable.',
      'status.ready': 'Questions verified. Paper: {paperPages} page(s); answers: {answerPages} page(s).',
      'status.generationError': 'This version could not be generated.',
      'status.localSaveError': 'Local print history could not be saved; paper generation and printing are still available.',
      'placeholder.chooseAssessment': 'Choose a retest and version to preview the paper and answers here.',
      'placeholder.version': 'Enter a version, for example V4.',
      'placeholder.date': 'Enter a date.',
      'placeholder.dateSchool': 'Enter a date and school name.',
      'placeholder.mathjaxLoading': 'Loading mathematical typesetting…',
      'placeholder.mathjaxError': 'Mathematical typesetting failed to load. Reload the page before printing.',
      'action.group': 'Print options',
      'action.paper': 'Print retest paper',
      'action.answers': 'Print answers',
      'action.practice': 'Export practice copy',
      'action.newVersion': 'Generate another version',
      'action.practiceNote': 'Export practice copy prints the paper and answer pages together.',
      'settings.aria': 'Paper settings and print history',
      'history.eyebrow': 'Print history',
      'history.title': 'Recent prints',
      'history.empty': 'There is no print history yet.',
      'history.restoreLast': 'Restore last settings',
      'history.restore': 'Restore these settings',
      'category.paper': 'Paper',
      'category.answers': 'Answers',
      'category.practice': 'Practice',
      'preview.eyebrow': 'Print preview',
      'preview.title': 'A4 paper and marking scheme',
      'preview.summaryEmpty': 'Choose a retest to see its version, layout and page count.',
      'preview.versionUnknown': 'Version not confirmed',
      'preview.pageCount': 'Paper: {pages} page(s)',
      'preview.pagePending': 'Page count pending',
      'preview.layoutGeneral': 'General layout',
      'preview.layoutExam': 'Public-exam layout',
      'footer.privacy': 'Print history contains only the retest ID, version, date, school name, output type and time. It does not store student names or marks.',
      'school.noMatch': 'No school name was found. Keep your entry or type any name.',
      'school.listUnavailable': 'The school list could not be loaded; you can still enter any school name manually.'
    }
  };
  var EXAM_NOTICE_TEXT = [
    '（一）在本試題答題簿內預留的空位作答。',
    '（二）寫於邊界以外的答案，將不予評閱。',
    '（三）除特別指明外，須詳細列出所有算式。'
  ];
  var EXAM_BOUNDARY_TEXT = '寫於邊界以外的答案，將不予評閱。';
  var EXAM_NOTICE_TEXT_EN = [
    '(1) Write your answers in the spaces provided in this Question-Answer Book.',
    '(2) Answers written in the margins will not be marked.',
    '(3) Unless otherwise specified, all working must be clearly shown.'
  ];
  var EXAM_BOUNDARY_TEXT_EN = 'Answers written in the margins will not be marked.';
  var ASSESSMENTS = [
    {
      id: 's1-ch1-2-test-q9', grade: 's1', gradeLabelKey: 'grade.s1',
      labelKey: 'assessment.s1q9.name', descriptionKey: 'assessment.s1q9.description', paperLanguage: 'zh',
      filenameClass: '1A', filenameShort: '級測一Q9',
      firstGeneratedVersion: 4,
      script: './js/s1-ch1-2-test-q9.js', exportName: 'RetestS1Ch12Q9'
    },
    {
      id: 's1-class-test-2', grade: 's1', gradeLabelKey: 'grade.s1',
      labelKey: 'assessment.s1class2.name', descriptionKey: 'assessment.s1class2.description', paperLanguage: 'zh',
      filenameClass: '1A', filenameShort: '班測2',
      firstGeneratedVersion: 3,
      script: './js/s1-class-test-2.js', exportName: 'RetestS1ClassTest2'
    },
    {
      id: 's1-class-test-3', grade: 's1', gradeLabelKey: 'grade.s1',
      labelKey: 'assessment.s1class3.name', descriptionKey: 'assessment.s1class3.description', paperLanguage: 'zh',
      examAnswerStyle: 'blank',
      examFirstPageCapacity: 20,
      filenameClass: '1A', filenameShort: '班測3',
      firstGeneratedVersion: 3,
      script: './js/s1-class-test-3.js', exportName: 'RetestS1ClassTest3'
    },
    {
      id: 's4-ch1-test', grade: 's4', gradeLabelKey: 'grade.s4',
      labelKey: 'assessment.s4ch1.name', descriptionKey: 'assessment.s4ch1.description', paperLanguage: 'zh',
      filenameClass: '4CD3', filenameShort: '第一章級測',
      firstGeneratedVersion: 4,
      script: './js/s4-ch1-test.js', exportName: 'RetestS4Ch1'
    },
    {
      id: 's4-class-test-4', grade: 's4', gradeLabelKey: 'grade.s4',
      labelKey: 'assessment.s4class4.name', descriptionKey: 'assessment.s4class4.description', paperLanguage: 'zh',
      filenameClass: '4CD3', filenameShort: '班測4',
      firstGeneratedVersion: 2,
      script: './js/s4-class-test-4.js', exportName: 'RetestS4ClassTest4'
    },
    {
      id: 'm2-test-3', grade: 'm2', gradeLabelKey: 'grade.m2',
      labelKey: 'assessment.m2test3.name', descriptionKey: 'assessment.m2test3.description', paperLanguage: 'en',
      filenameClass: 'M2', filenameShort: 'Test3',
      firstGeneratedVersion: 3,
      script: './js/m2-test-3.js', exportName: 'RetestM2Test3'
    },
    {
      id: 'm2-test-4', grade: 'm2', gradeLabelKey: 'grade.m2',
      labelKey: 'assessment.m2test4.name', descriptionKey: 'assessment.m2test4.description', paperLanguage: 'en',
      filenameClass: 'M2', filenameShort: 'Test4',
      firstGeneratedVersion: 3,
      script: './js/m2-test-4.js', exportName: 'RetestM2Test4'
    }
  ];
  var AUTH_TOAST_TEXT_KEYS = [
    'auth.toast.preparing', 'auth.toast.notReady', 'auth.toast.persistence', 'auth.toast.unauthorized',
    'auth.toast.cancelled', 'auth.toast.popupBlocked', 'auth.toast.network', 'auth.toast.domain',
    'auth.toast.setup', 'auth.toast.failure', 'auth.unavailable'
  ];
  var elements = {};
  var currentLanguage = 'zh';
  var selectionStatusKey = 'status.chooseAssessment';
  var selectionStatusParams = null;
  var recordModeKey = 'record.loading';
  var selectedSchool = { zh: SCHOOL_DEFAULT, en: SCHOOL_DEFAULT_EN, isDefault: true };
  var modulePromises = Object.create(null);
  var currentModule = null;
  var currentResult = null;
  var schoolList = [];
  var historyRecords = loadHistory();
  var activeHistoryUid = null;
  var historySyncPromises = Object.create(null);
  var syncedHistoryUids = Object.create(null);
  var pendingCloudWrites = Object.create(null);
  var cloudWrittenTimestamps = Object.create(null);
  var renderEpoch = 0;
  var mathJaxFailed = false;
  var originalDocumentTitle = document.title;
  var printTitleFallbackTimer = null;
  var printTitlePending = false;

  function byId(id) { return document.getElementById(id); }

  function translate(key, params) {
    var language = UI_TEXT[currentLanguage] ? currentLanguage : 'zh';
    var template = UI_TEXT[language][key] || UI_TEXT.zh[key] || key;
    return String(template).replace(/\{([A-Za-z0-9_.-]+)\}/g, function (match, name) {
      return params && Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match;
    });
  }

  function preferredUiLanguage() {
    try {
      var saved = localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
      return saved === 'en' ? 'en' : 'zh';
    } catch (error) { return 'zh'; }
  }

  function localizeAuthWidgetLabels() {
    var root = byId('auth-widget-root');
    if (!root) return;
    var labels = [
      ['.aw-loading', 'auth.loading'], ['.aw-unavailable', 'auth.unavailable'],
      ['.aw-user-pill', 'auth.user'], ['.aw-role-teacher', 'auth.teacher'],
      ['.aw-logout', 'auth.logout'], ['.aw-guest', 'auth.googleSignIn']
    ];
    labels.forEach(function (entry) {
      var element = root.querySelector(entry[0]);
      if (element) element.setAttribute('aria-label', translate(entry[1]));
    });
    var loadingLabel = root.querySelector('.aw-loading .aw-name');
    if (loadingLabel && loadingLabel.textContent !== translate('auth.loadingLabel')) {
      loadingLabel.textContent = translate('auth.loadingLabel');
    }
  }

  function localizeAuthToast() {
    var toast = byId('auth-toast');
    if (!toast) return;
    var message = toast.textContent;
    var key = AUTH_TOAST_TEXT_KEYS.find(function (candidate) {
      return UI_TEXT.zh[candidate] === message || UI_TEXT.en[candidate] === message;
    });
    if (key) toast.dataset.retestTranslationKey = key;
    var activeKey = toast.dataset.retestTranslationKey;
    if (activeKey && message !== translate(activeKey)) toast.textContent = translate(activeKey);
  }

  function refreshAuthWidgetLanguage() {
    if (window.AuthState && typeof window.AuthState.renderWidget === 'function') {
      window.AuthState.renderWidget();
    }
    localizeAuthWidgetLabels();
  }

  function observeAuthWidget() {
    var root = byId('auth-widget-root');
    if (typeof MutationObserver !== 'function') return;
    if (root) new MutationObserver(localizeAuthWidgetLabels).observe(root, { childList: true, subtree: true });
    new MutationObserver(localizeAuthToast).observe(document.body,
      { childList: true, subtree: true, characterData: true });
    localizeAuthToast();
  }

  function assessmentName(assessment) { return assessment ? translate(assessment.labelKey) : ''; }

  function assessmentDescription(assessment) { return assessment ? translate(assessment.descriptionKey) : ''; }

  function paperLanguageFor(assessment) {
    return assessment && assessment.paperLanguage === 'en' ? 'en' : 'zh';
  }

  function paperSchoolName(assessment, inputValue, selected) {
    var raw = String(inputValue == null ? '' : inputValue);
    if (!raw.trim()) return '';
    var language = paperLanguageFor(assessment);
    if (selected && typeof selected.zh === 'string' && typeof selected.en === 'string') {
      return language === 'en' ? selected.en : selected.zh;
    }
    return raw;
  }

  function updateSchoolDefaultForAssessment(assessmentId) {
    var assessment = assessmentById(assessmentId);
    if (!assessment || !selectedSchool || !selectedSchool.isDefault) return;
    var useEnglish = paperLanguageFor(assessment) === 'en';
    selectedSchool = {
      zh: SCHOOL_DEFAULT,
      en: SCHOOL_DEFAULT_EN,
      isDefault: true
    };
    elements.schoolInput.value = useEnglish ? SCHOOL_DEFAULT_EN : SCHOOL_DEFAULT;
  }

  function applyLanguage(language, persist) {
    currentLanguage = language === 'en' ? 'en' : 'zh';
    document.documentElement.lang = currentLanguage === 'en' ? 'en-HK' : 'zh-Hant-HK';
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (element) {
      element.textContent = translate(element.dataset.i18n);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-aria]'), function (element) {
      element.setAttribute('aria-label', translate(element.dataset.i18nAria));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-placeholder]'), function (element) {
      element.setAttribute('placeholder', translate(element.dataset.i18nPlaceholder));
    });
    refreshAuthWidgetLanguage();
    localizeAuthToast();
    Array.prototype.forEach.call(document.querySelectorAll('[data-language]'), function (button) {
      var active = button.dataset.language === currentLanguage;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    originalDocumentTitle = translate('browser.title');
    if (!printTitlePending) document.title = originalDocumentTitle;
    if (persist) {
      try { localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, currentLanguage); } catch (error) { /* language remains available for this page */ }
    }
    if (!elements.assessmentSelect) return;
    var selectedAssessment = elements.assessmentSelect.value;
    renderCatalog();
    elements.assessmentSelect.value = selectedAssessment;
    updateVersionHelp(selectedAssessment);
    updateRecommendation();
    renderHistory();
    if (elements.selectionStatus) {
      elements.selectionStatus.textContent = translate(selectionStatusKey, selectionStatusParams);
    }
    if (elements.recordMode) elements.recordMode.textContent = translate(recordModeKey);
    var currentAssessment = assessmentById(selectedAssessment);
    var paperCount = elements.printRoot ? elements.printRoot.querySelectorAll('.exam-page').length : 0;
    updatePreviewSummary(currentAssessment, currentResult ? currentResult.version : elements.versionInput.value.trim(),
      elements.layoutSelect.value, paperCount);
    if (elements.schoolSuggestions && !elements.schoolSuggestions.hidden) renderSuggestions(elements.schoolInput.value);
  }

  function setRecordMode(key) {
    recordModeKey = key;
    if (elements.recordMode) elements.recordMode.textContent = translate(key);
  }

  function buildPrintFilename(assessment, dateValue, version, category, fallbackDate) {
    if (!assessment || !assessment.filenameClass || !assessment.filenameShort) return '';
    var versionMatch = /^V([1-9][0-9]*)$/.exec(String(version || ''));
    var suffixByCategory = { paper: '', answers: '_評卷參考', practice: '_練習' };
    if (!versionMatch || !Object.prototype.hasOwnProperty.call(suffixByCategory, category)) return '';

    var dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateValue || ''));
    var dateStamp = '';
    if (dateMatch) {
      var year = Number(dateMatch[1]);
      var month = Number(dateMatch[2]);
      var day = Number(dateMatch[3]);
      var enteredDate = new Date(0);
      enteredDate.setFullYear(year, month - 1, day);
      if (year > 0 && enteredDate.getFullYear() === year && enteredDate.getMonth() === month - 1 &&
          enteredDate.getDate() === day) {
        dateStamp = dateMatch[1] + dateMatch[2] + dateMatch[3];
      }
    }
    if (!dateStamp) {
      var today = fallbackDate instanceof Date && Number.isFinite(fallbackDate.getTime()) ? fallbackDate : new Date();
      var todayYear = String(today.getFullYear()).padStart(4, '0');
      var todayMonth = String(today.getMonth() + 1).padStart(2, '0');
      var todayDay = String(today.getDate()).padStart(2, '0');
      dateStamp = todayYear + todayMonth + todayDay;
    }

    return dateStamp + '_' + assessment.filenameClass + '_' + assessment.filenameShort +
      '_補測V' + versionMatch[1] + suffixByCategory[category];
  }

  function restorePrintDocumentTitle() {
    if (!printTitlePending) return;
    printTitlePending = false;
    if (printTitleFallbackTimer !== null) {
      window.clearTimeout(printTitleFallbackTimer);
      printTitleFallbackTimer = null;
    }
    window.removeEventListener('afterprint', restorePrintDocumentTitle);
    document.title = originalDocumentTitle;
  }

  function setPrintDocumentTitle(filename) {
    if (!filename) return;
    restorePrintDocumentTitle();
    document.title = filename;
    printTitlePending = true;
    window.addEventListener('afterprint', restorePrintDocumentTitle, { once: true });
    printTitleFallbackTimer = window.setTimeout(restorePrintDocumentTitle, 60000);
  }

  function loadHistory(storageKey) {
    try {
      var parsed = JSON.parse(localStorage.getItem(storageKey || STORAGE_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (record) {
        return record && typeof record.assessmentId === 'string' &&
          /^V[1-9][0-9]*$/.test(record.version) &&
          typeof record.date === 'string' && typeof record.schoolName === 'string' &&
          ['paper', 'answers', 'practice'].indexOf(record.category) !== -1 &&
          Number.isFinite(record.timestamp);
      });
    } catch (e) {
      return [];
    }
  }

  function saveHistory() {
    try {
      var storageKey = activeHistoryUid ? userHistoryStorageKey(activeHistoryUid) : STORAGE_KEY;
      var storedRecords = loadHistory(storageKey);
      var mergedRecords = mergeHistoryRecords(storedRecords.concat(historyRecords));
      var storedJson = JSON.stringify(mergeHistoryRecords(storedRecords));
      var mergedJson = JSON.stringify(mergedRecords);
      historyRecords = mergedRecords;
      if (storedJson !== mergedJson) localStorage.setItem(storageKey, mergedJson);
      return true;
    } catch (e) {
      setSelectionStatus('status.localSaveError', true);
      return false;
    }
  }

  function userHistoryStorageKey(uid) {
    return STORAGE_KEY + '.user.' + encodeURIComponent(uid);
  }

  function mergeHistoryRecords(records) {
    var byCreatedAt = Object.create(null);
    records.forEach(function (record) {
      if (!record || !Number.isSafeInteger(record.timestamp) || record.timestamp < 0) return;
      var key = String(record.timestamp);
      if (!Object.prototype.hasOwnProperty.call(byCreatedAt, key)) byCreatedAt[key] = record;
    });
    return Object.keys(byCreatedAt).map(function (key) { return byCreatedAt[key]; })
      .sort(function (left, right) { return right.timestamp - left.timestamp; });
  }

  function activateHistoryUser(uid) {
    if (activeHistoryUid === uid) return;
    if (activeHistoryUid) delete syncedHistoryUids[activeHistoryUid];
    var guestRecords = loadHistory(STORAGE_KEY);
    var userRecords = loadHistory(userHistoryStorageKey(uid));
    activeHistoryUid = uid;
    historyRecords = mergeHistoryRecords(guestRecords.concat(userRecords));
    if (saveHistory()) {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* keep its local fallback copy */ }
    }
    renderHistory();
  }

  function deactivateHistoryUser() {
    if (activeHistoryUid) delete syncedHistoryUids[activeHistoryUid];
    activeHistoryUid = null;
    historyRecords = loadHistory(STORAGE_KEY);
    renderHistory();
  }

  function cloudHistoryCollection(uid) {
    if (!window.firebase || typeof window.firebase.firestore !== 'function') {
      throw new Error('Firestore SDK 未能載入。');
    }
    return window.firebase.firestore().collection('users').doc(uid).collection('retestPrintHistory');
  }

  function toCloudHistoryRecord(record) {
    return {
      testId: record.assessmentId,
      version: record.version,
      date: record.date,
      school: record.schoolName,
      kind: record.category,
      createdAt: new Date(record.timestamp).toISOString()
    };
  }

  function fromCloudHistoryRecord(data) {
    if (!data || !assessmentById(data.testId) || !/^V[1-9][0-9]*$/.test(data.version) ||
        typeof data.date !== 'string' || typeof data.school !== 'string' ||
        ['paper', 'answers', 'practice'].indexOf(data.kind) === -1 ||
        typeof data.createdAt !== 'string') return null;
    var timestamp = Date.parse(data.createdAt);
    if (!Number.isSafeInteger(timestamp) || new Date(timestamp).toISOString() !== data.createdAt) return null;
    return {
      assessmentId: data.testId,
      version: data.version,
      date: data.date,
      schoolName: data.school,
      category: data.kind,
      timestamp: timestamp
    };
  }

  function noteCloudHistoryWrite(uid, timestamp) {
    if (!cloudWrittenTimestamps[uid]) cloudWrittenTimestamps[uid] = Object.create(null);
    cloudWrittenTimestamps[uid][String(timestamp)] = true;
  }

  function sameCloudHistoryRecord(left, right) {
    return left && right && left.testId === right.testId && left.version === right.version &&
      left.date === right.date && left.school === right.school && left.kind === right.kind &&
      left.createdAt === right.createdAt;
  }

  function showCloudHistoryFallback(uid) {
    delete syncedHistoryUids[uid];
    if (activeHistoryUid === uid) {
      setRecordMode('record.cloudFallback');
    }
  }

  function writeHistoryRecordToCloud(uid, record, collection) {
    var timestampKey = String(record.timestamp);
    var writeKey = uid + ':' + timestampKey;
    if (cloudWrittenTimestamps[uid] && cloudWrittenTimestamps[uid][timestampKey]) return Promise.resolve(true);
    if (pendingCloudWrites[writeKey]) return pendingCloudWrites[writeKey];
    var targetCollection;
    try { targetCollection = collection || cloudHistoryCollection(uid); }
    catch (error) { showCloudHistoryFallback(uid); return Promise.resolve(false); }
    var write;
    try {
      var document = targetCollection.doc(timestampKey);
      var data = toCloudHistoryRecord(record);
      write = (async function () {
        if (activeHistoryUid !== uid) return false;
        try {
          var existing = await document.get();
          if (existing.exists) {
            if (!sameCloudHistoryRecord(existing.data(), data)) throw new Error('A record already exists for this timestamp.');
            noteCloudHistoryWrite(uid, record.timestamp);
            return true;
          }
          if (activeHistoryUid !== uid) return false;
          await document.set(data);
          noteCloudHistoryWrite(uid, record.timestamp);
          return true;
        } catch (error) {
          // Concurrent tabs may both observe a missing document. The second
          // create is denied by the append-only rule, so accept it only when
          // the first tab stored the exact same record.
          try {
            var afterConflict = await document.get();
            if (afterConflict.exists && sameCloudHistoryRecord(afterConflict.data(), data)) {
              noteCloudHistoryWrite(uid, record.timestamp);
              return true;
            }
          } catch (readError) { /* Firestore is unavailable or the rule is not deployed. */ }
          showCloudHistoryFallback(uid);
          return false;
        }
      })();
    } catch (error) {
      showCloudHistoryFallback(uid);
      return Promise.resolve(false);
    }
    pendingCloudWrites[writeKey] = write;
    write.then(function () { delete pendingCloudWrites[writeKey]; }, function () { delete pendingCloudWrites[writeKey]; });
    return write;
  }

  async function readCloudHistory(collection) {
    var records = [];
    var cursor = null;
    while (true) {
      var query = collection.orderBy('createdAt', 'desc').limit(FIRESTORE_HISTORY_PAGE_SIZE);
      if (cursor) query = query.startAfter(cursor);
      var snapshot = await query.get();
      var documents = snapshot.docs || [];
      documents.forEach(function (document) {
        var record = fromCloudHistoryRecord(document.data());
        if (record) records.push(record);
      });
      if (documents.length < FIRESTORE_HISTORY_PAGE_SIZE) break;
      cursor = documents[documents.length - 1];
    }
    return records;
  }

  async function synchronizeHistory(uid) {
    try {
      var collection = cloudHistoryCollection(uid);
      var cloudRecords = await readCloudHistory(collection);
      if (activeHistoryUid !== uid) return false;
      var cloudTimestamps = Object.create(null);
      cloudRecords.forEach(function (record) {
        cloudTimestamps[String(record.timestamp)] = true;
        noteCloudHistoryWrite(uid, record.timestamp);
      });
      historyRecords = mergeHistoryRecords(historyRecords.concat(cloudRecords));
      saveHistory();
      renderHistory();

      var missing = historyRecords.filter(function (record) {
        return !cloudTimestamps[String(record.timestamp)] &&
          !(cloudWrittenTimestamps[uid] && cloudWrittenTimestamps[uid][String(record.timestamp)]);
      });
      var allWritesSucceeded = true;
      for (var start = 0; start < missing.length; start += FIRESTORE_HISTORY_PAGE_SIZE) {
        if (activeHistoryUid !== uid) return false;
        var chunk = missing.slice(start, start + FIRESTORE_HISTORY_PAGE_SIZE);
        var results = await Promise.all(chunk.map(function (record) {
          return writeHistoryRecordToCloud(uid, record, collection);
        }));
        if (activeHistoryUid !== uid) return false;
        if (results.some(function (result) { return !result; })) allWritesSucceeded = false;
      }
      if (activeHistoryUid !== uid) return false;
      if (!allWritesSucceeded) {
        showCloudHistoryFallback(uid);
        return false;
      }
      setRecordMode('record.synced');
      return true;
    } catch (error) {
      showCloudHistoryFallback(uid);
      return false;
    }
  }

  function syncHistoryForUser(uid) {
    if (syncedHistoryUids[uid]) return Promise.resolve(true);
    if (historySyncPromises[uid]) return historySyncPromises[uid];
    var promise = synchronizeHistory(uid).then(function (success) {
      if (success) syncedHistoryUids[uid] = true;
      return success;
    });
    historySyncPromises[uid] = promise;
    promise.then(function () { delete historySyncPromises[uid]; }, function () { delete historySyncPromises[uid]; });
    return promise;
  }

  function localDateValue() {
    var today = new Date();
    var year = today.getFullYear();
    var month = String(today.getMonth() + 1).padStart(2, '0');
    var day = String(today.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function setSelectionStatus(messageKey, isError, params) {
    var status = elements.selectionStatus;
    selectionStatusKey = messageKey;
    selectionStatusParams = params || null;
    status.textContent = translate(messageKey, params);
    status.dataset.state = isError ? 'error' : 'ready';
  }

  function updatePreviewSummary(assessment, version, layout, pageCount) {
    if (!elements.previewSummary) return;
    if (!assessment) {
      elements.previewSummary.textContent = translate('preview.summaryEmpty');
      return;
    }
    var layoutLabel = translate(layout === 'exam' ? 'preview.layoutExam' : 'preview.layoutGeneral');
    var pageLabel = Number.isInteger(pageCount) && pageCount > 0 ?
      translate('preview.pageCount', { pages: pageCount }) : translate('preview.pagePending');
    elements.previewSummary.textContent = [assessmentName(assessment), version || translate('preview.versionUnknown'), layoutLabel, pageLabel].join(' · ');
  }

  function updatePreviewScale() {
    if (!elements.printRoot || !elements.previewSection) return;
    var useTwoColumns = window.matchMedia && window.matchMedia('(min-width: 1100px)').matches;
    var naturalPageWidth = 210 * 96 / 25.4;
    var availableWidth = elements.previewSection.clientWidth;
    var scale = useTwoColumns && availableWidth > 0 ? Math.min(1, availableWidth / naturalPageWidth) : 1;
    elements.printRoot.style.setProperty('--preview-scale', scale.toFixed(4));
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function normalizeSearch(value) {
    return String(value || '').normalize('NFKC').trim().toLocaleLowerCase();
  }

  function loadModule(assessment) {
    if (modulePromises[assessment.id]) return modulePromises[assessment.id];
    modulePromises[assessment.id] = new Promise(function (resolve, reject) {
      var existing = window[assessment.exportName];
      if (existing) { resolve(existing); return; }
      var script = document.createElement('script');
      script.src = assessment.script;
      script.async = true;
      script.onload = function () {
        var module = window[assessment.exportName];
        if (!module) reject(new Error('補測模組沒有提供 ' + assessment.exportName + '。'));
        else resolve(module);
      };
      script.onerror = function () { reject(new Error('未能載入補測模組。')); };
      document.head.appendChild(script);
    });
    return modulePromises[assessment.id];
  }

  function renderCatalog() {
    ['s1', 's4', 'm2'].forEach(function (grade) {
      var list = elements['catalog' + grade.toUpperCase()];
      list.textContent = '';
      var assessments = ASSESSMENTS.filter(function (assessment) { return assessment.grade === grade; });
      assessments.forEach(function (assessment) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'assessment-choice';
        button.dataset.assessmentId = assessment.id;
        var strong = document.createElement('strong');
        strong.textContent = assessmentName(assessment);
        var detail = document.createElement('span');
        detail.textContent = assessmentDescription(assessment);
        button.appendChild(strong);
        button.appendChild(detail);
        list.appendChild(button);
      });
      var emptyState = elements['catalog' + grade.toUpperCase() + 'Empty'];
      if (emptyState) emptyState.hidden = assessments.length > 0;
    });
    var selectedValue = elements.assessmentSelect.value;
    elements.assessmentSelect.textContent = '';
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = translate('field.assessmentPlaceholder');
    elements.assessmentSelect.appendChild(placeholder);
    ASSESSMENTS.forEach(function (assessment) {
      var option = document.createElement('option');
      option.value = assessment.id;
      option.textContent = assessmentName(assessment) + ' · ' + translate(assessment.gradeLabelKey);
      elements.assessmentSelect.appendChild(option);
    });
    elements.assessmentSelect.value = selectedValue;
  }

  function assessmentById(id) {
    return ASSESSMENTS.find(function (assessment) { return assessment.id === id; }) || null;
  }

  function recommendationFor(assessmentId) {
    var assessment = assessmentById(assessmentId);
    var firstGeneratedVersion = assessment ? assessment.firstGeneratedVersion : 4;
    var used = new Set();
    for (var fixedVersion = 1; fixedVersion < firstGeneratedVersion; fixedVersion += 1) used.add(fixedVersion);
    historyRecords.forEach(function (record) {
      if (record.assessmentId !== assessmentId) return;
      var match = record.version.match(/^V([1-9][0-9]*)$/);
      if (match) used.add(Number(match[1]));
    });
    var candidate = firstGeneratedVersion;
    while (used.has(candidate)) candidate += 1;
    return 'V' + candidate;
  }

  function updateRecommendation() {
    var id = elements.assessmentSelect.value;
    elements.nextVersion.textContent = translate('version.recommendation', { version: id ? recommendationFor(id) : 'V4' });
  }

  function updateVersionHelp(assessmentId) {
    var assessment = assessmentById(assessmentId);
    if (!assessment) {
      elements.versionHelp.textContent = translate('version.help.none');
      return;
    }
    var fixedThrough = assessment.firstGeneratedVersion - 1;
    elements.versionHelp.textContent = translate('version.help.selected', {
      fixedThrough: fixedThrough,
      generated: assessment.firstGeneratedVersion
    });
  }

  function renderHistory() {
    var list = elements.historyList;
    list.textContent = '';
    elements.historyEmpty.hidden = historyRecords.length > 0;
    historyRecords.slice(0, 5).forEach(function (record, index) {
      var assessment = assessmentById(record.assessmentId);
      var item = document.createElement('li');
      item.className = 'history-item';
      var detail = document.createElement('div');
      detail.className = 'history-detail';
      var title = document.createElement('strong');
      title.textContent = (assessment ? assessmentName(assessment) : record.assessmentId) + ' · ' + record.version + ' · ' + record.schoolName;
      var subline = document.createElement('span');
      subline.textContent = record.date + ' · ' + categoryLabel(record.category) + ' · ' + formatTimestamp(record.timestamp);
      detail.appendChild(title);
      detail.appendChild(subline);
      var restore = document.createElement('button');
      restore.type = 'button';
      restore.className = 'restore-button';
      restore.textContent = translate(index === 0 ? 'history.restoreLast' : 'history.restore');
      restore.addEventListener('click', function () { restoreRecord(record); });
      item.appendChild(detail);
      item.appendChild(restore);
      list.appendChild(item);
    });
    updateRecommendation();
  }

  function categoryLabel(category) {
    var key = { paper: 'category.paper', answers: 'category.answers', practice: 'category.practice' }[category];
    return key ? translate(key) : category;
  }

  function formatTimestamp(timestamp) {
    try {
      return new Intl.DateTimeFormat(currentLanguage === 'en' ? 'en-HK' : 'zh-HK',
        { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
    } catch (e) {
      return new Date(timestamp).toLocaleString();
    }
  }

  function restoreRecord(record) {
    elements.assessmentSelect.value = record.assessmentId;
    updateVersionHelp(record.assessmentId);
    elements.dateInput.value = record.date;
    elements.versionInput.value = record.version;
    elements.schoolInput.value = record.schoolName;
    selectedSchool = null;
    hideSuggestions();
    updateRecommendation();
    refreshPreview();
  }

  function appendPlainOrMath(parent, content) {
    var text = String(content == null ? '' : content);
    var pattern = /\$([^$]+)\$/g;
    var cursor = 0;
    var match;
    while ((match = pattern.exec(text))) {
      if (match.index > cursor) parent.appendChild(document.createTextNode(text.slice(cursor, match.index)));
      var math = document.createElement('span');
      math.className = 'math-inline';
      math.textContent = '\\(\\displaystyle ' + match[1] + '\\)';
      parent.appendChild(math);
      cursor = pattern.lastIndex;
    }
    if (cursor < text.length) parent.appendChild(document.createTextNode(text.slice(cursor)));
  }

  function appendMath(parent, formula) {
    var math = document.createElement('span');
    math.className = 'math-inline';
    math.textContent = '\\(\\displaystyle ' + String(formula || '') + '\\)';
    parent.appendChild(math);
  }

  function textElement(tag, className, value) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (value != null) element.textContent = String(value);
    return element;
  }

  function marksText(marks, language) {
    return '(' + marks + (language === 'en' ? (Number(marks) === 1 ? ' mark' : ' marks') : ' 分') + ')';
  }

  function renderBlock(block, options) {
    options = options || {};
    if (block.kind === 'spacer') {
      var spacer = document.createElement('div');
      spacer.className = 'work-space';
      spacer.setAttribute('aria-hidden', 'true');
      spacer.style.height = Number(block.cm || 0) + 'cm';
      return spacer;
    }
    if (block.kind === 'question') {
      var question = textElement('div', 'question-row' + (block.subquestionLabel ? ' question-row--labelled' : ''));
      question.appendChild(textElement('div', 'question-number', block.number ? block.number + '.' : ''));
      if (block.subquestionLabel) {
        question.appendChild(textElement('div', 'question-subquestion-label', '(' + block.subquestionLabel + ')'));
      }
      var body = textElement('div', 'question-body');
      appendPlainOrMath(body, block.text || '');
      question.appendChild(body);
      var displayMarks = block.displayMarks != null ? block.displayMarks : block.marks;
      question.appendChild(textElement('div', 'question-marks', displayMarks ? marksText(displayMarks, options.language) : ''));
      return question;
    }
    if (block.kind === 'choices') {
      var choices = textElement('div', 'choice-row');
      (block.options || []).forEach(function (option, index) {
        var choice = textElement('div', 'choice-option');
        choice.appendChild(textElement('span', 'choice-label', ['A', 'B', 'C', 'D'][index] + '.'));
        var choiceMath = textElement('span', 'choice-math');
        appendMath(choiceMath, option);
        choice.appendChild(choiceMath);
        choices.appendChild(choice);
      });
      if (!options.hideChoiceAnswer) {
        choices.appendChild(textElement('div', 'choice-answer', block.answerText || '答案：______'));
      }
      return choices;
    }
    if (block.kind === 'functionGraphChoices') {
      var graphRow = textElement('div', 'function-graph-row');
      (block.options || []).forEach(function (type, index) {
        var option = textElement('div', 'function-graph-option');
        var letter = ['A', 'B', 'C', 'D'][index];
        option.appendChild(textElement('span', 'function-graph-label', letter + '.'));
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 180 120');
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', '選項 ' + letter + ' 圖像');
        function svgNode(name, attributes) {
          var node = document.createElementNS('http://www.w3.org/2000/svg', name);
          Object.keys(attributes).forEach(function (key) { node.setAttribute(key, attributes[key]); });
          svg.appendChild(node);
          return node;
        }
        var axisStyle = { stroke: '#111', 'stroke-width': '1.2', fill: 'none' };
        svgNode('line', Object.assign({ x1: '18', y1: '60', x2: '162', y2: '60' }, axisStyle));
        svgNode('line', Object.assign({ x1: '90', y1: '12', x2: '90', y2: '108' }, axisStyle));
        var curveStyle = { stroke: '#111', 'stroke-width': '2.2', fill: 'none', 'stroke-linecap': 'round' };
        if (type === 'sideways') {
          svgNode('path', Object.assign({ d: 'M58 60 C82 58 94 37 145 22' }, curveStyle));
          svgNode('path', Object.assign({ d: 'M58 60 C82 62 94 83 145 98' }, curveStyle));
        } else if (type === 'upward') {
          svgNode('path', Object.assign({ d: 'M34 20 Q90 118 146 20' }, curveStyle));
        } else if (type === 'circle') {
          svgNode('ellipse', Object.assign({ cx: '90', cy: '60', rx: '42', ry: '32' }, curveStyle));
        } else if (type === 'vertical') {
          svgNode('line', { x1: '116', y1: '20', x2: '116', y2: '100', stroke: '#111', 'stroke-width': '2.2' });
        }
        option.appendChild(svg);
        graphRow.appendChild(option);
      });
      return graphRow;
    }
    if (block.kind === 'table') {
      var dataTable = document.createElement('table');
      dataTable.className = 'paper-data-table';
      (block.rows || []).forEach(function (row, rowIndex) {
        var tableRow = document.createElement('tr');
        row.forEach(function (cell, cellIndex) {
          var isHeader = rowIndex === 0 || cellIndex === 0;
          var tableCell = document.createElement(isHeader ? 'th' : 'td');
          if (rowIndex === 0) tableCell.setAttribute('scope', 'col');
          else if (cellIndex === 0) tableCell.setAttribute('scope', 'row');
          if (cell && Array.isArray(cell.parts)) {
            cell.parts.forEach(function (part) {
              if (part.math != null) appendMath(tableCell, part.math);
              else appendPlainOrMath(tableCell, part.text || '');
            });
          } else if (cell && cell.math != null) appendMath(tableCell, cell.math);
          else appendPlainOrMath(tableCell, cell && cell.text != null ? cell.text : cell);
          tableRow.appendChild(tableCell);
        });
        dataTable.appendChild(tableRow);
      });
      return dataTable;
    }
    if (block.kind === 'subquestion') {
      var subquestionBlock = document.createElement('div');
      subquestionBlock.className = 'subquestion-block';
      var subquestion = textElement('div', 'subquestion-row' + (block.alignWithQuestion ? ' subquestion-row--aligned' : ''));
      subquestion.appendChild(textElement('div', 'subquestion-label', block.label ? '(' + block.label + ')' : ''));
      var subBody = textElement('div', 'subquestion-body');
      if (block.math != null) appendMath(subBody, block.math);
      else appendPlainOrMath(subBody, block.text || '');
      subquestion.appendChild(subBody);
      subquestion.appendChild(textElement('div', 'question-marks', block.marks ? marksText(block.marks, options.language) : ''));
      subquestionBlock.appendChild(subquestion);
      if (Number(block.blankCm) > 0) {
        var subquestionSpace = document.createElement('div');
        subquestionSpace.className = 'work-space';
        subquestionSpace.setAttribute('aria-hidden', 'true');
        subquestionSpace.style.height = Number(block.blankCm) + 'cm';
        subquestionBlock.appendChild(subquestionSpace);
      }
      return subquestionBlock;
    }
    if (block.kind === 'answerHeading') {
      var heading = textElement('div', 'answer-heading');
      appendPlainOrMath(heading, block.text || '');
      return heading;
    }
    if (block.kind === 'answerStep') {
      var answer = textElement('div', 'answer-step');
      var answerBody = textElement('div', 'answer-body');
      appendPlainOrMath(answerBody, block.text || '');
      answer.appendChild(answerBody);
      answer.appendChild(textElement('div', 'answer-mark', block.mark || ''));
      return answer;
    }
    return document.createTextNode('');
  }

  function joinPaperHeaderParts(schoolName, titleParts) {
    var parts = [];
    var school = String(schoolName || '').trim();
    if (school) parts.push(school);
    (titleParts || []).forEach(function (part) {
      var value = String(part || '').trim();
      if (value) parts.push(value);
    });
    return parts.join('　');
  }

  function generalHeaderFontSize(widthAtFourteen, availableWidth) {
    var measuredWidth = Number(widthAtFourteen);
    var maximumWidth = Number(availableWidth);
    if (!Number.isFinite(measuredWidth) || measuredWidth <= 0 ||
        !Number.isFinite(maximumWidth) || maximumWidth <= 0) return 11;
    var fontSize = 14;
    while (fontSize > 11 && measuredWidth * fontSize / 14 > maximumWidth) {
      fontSize = Math.max(11, fontSize - 0.5);
    }
    return fontSize;
  }

  function measurePaperHeaderWidthAtFourteen(element) {
    var measurement = element.cloneNode(true);
    var computed = window.getComputedStyle(element);
    measurement.removeAttribute('id');
    measurement.setAttribute('aria-hidden', 'true');
    measurement.style.position = 'fixed';
    measurement.style.left = '-10000px';
    measurement.style.top = '0';
    measurement.style.display = 'inline-block';
    measurement.style.width = 'max-content';
    measurement.style.maxWidth = 'none';
    measurement.style.margin = '0';
    measurement.style.padding = '0';
    measurement.style.border = '0';
    measurement.style.whiteSpace = 'nowrap';
    measurement.style.fontFamily = computed.fontFamily;
    measurement.style.fontWeight = computed.fontWeight;
    measurement.style.fontStyle = computed.fontStyle;
    measurement.style.letterSpacing = computed.letterSpacing;
    measurement.style.wordSpacing = computed.wordSpacing;
    measurement.style.fontSize = '14pt';
    document.body.appendChild(measurement);
    var width = measurement.getBoundingClientRect().width;
    measurement.remove();
    return width;
  }

  function fitGeneralHeaderLines() {
    if (!elements.printRoot) return;
    var headings = elements.printRoot.querySelectorAll('.paper-title--combined');
    Array.prototype.forEach.call(headings, function (heading) {
      var availableWidth = heading.clientWidth;
      if (!availableWidth) return;
      var widthAtFourteen = measurePaperHeaderWidthAtFourteen(heading);
      heading.style.fontSize = generalHeaderFontSize(widthAtFourteen, availableWidth) + 'pt';
    });
  }

  function renderPageHeader(page, assessment, result, isAnswer) {
    var header = textElement('header', 'paper-heading');
    var language = paperLanguageFor(assessment);
    var titleParts = [];
    if (result.academicYear) titleParts.push(result.academicYear);
    titleParts.push(result.gradeLabel, result.subject, result.name + (language === 'en' ?
      ' (' + result.version + ')' : '（' + result.version + '）'));
    if (isAnswer) titleParts.push(language === 'en' ? 'Marking Scheme' : '評卷參考');
    var schoolName = paperSchoolName(assessment, elements.schoolInput.value, selectedSchool);
    if (elements.layoutSelect.value === 'general') {
      var headerText = language === 'en' ?
        (schoolName ? schoolName + ' ' : '') + result.gradeLabel + ' ' + result.academicYear + ' ' + result.name +
          ' (' + result.version + ')' + (isAnswer ? ' Marking Scheme' : '') :
        joinPaperHeaderParts(schoolName, titleParts);
      header.appendChild(textElement('div', 'paper-title paper-title--combined', headerText));
    } else {
      header.appendChild(textElement('div', 'paper-school', schoolName));
      header.appendChild(textElement('div', 'paper-title', titleParts.join(language === 'en' ? ' ' : '　')));
    }
    if (!isAnswer && page.withStudentInfo) {
      var hasDuration = !!result.durationMinutes;
      var classValue = language === 'en' ? '________(    )' :
        (result.defaultClass ? result.defaultClass + '（　　）' : '________(　　)');
      var infoClass = 'paper-info';
      var nameLine = '______________';
      if (hasDuration) {
        infoClass += ' paper-info--duration';
        nameLine = '__________';
      }
      if (language === 'en') {
        header.appendChild(textElement('div', infoClass, 'Name：_______________　Class：' + classValue +
          '　Date：' + elements.dateInput.value + '　Mark：_____/' + result.totalMarks));
      } else {
        var duration = hasDuration ? '　限時：' + result.durationMinutes + '分鐘' : '';
        header.appendChild(textElement('div', infoClass, '姓名：' + nameLine + '　班別：' + classValue + '　日期：' +
          elements.dateInput.value + duration + '　總分：_____/' + result.totalMarks + ' 分'));
      }
    }
    return header;
  }

  function buildPages(pages, assessment, result, isAnswer) {
    return pages.map(function (page) {
      var section = textElement('section', 'print-page ' + (isAnswer ? 'answer-page' : 'exam-page'));
      section.appendChild(renderPageHeader(page, assessment, result, isAnswer));
      (page.blocks || []).forEach(function (block) {
        section.appendChild(renderBlock(block, { language: paperLanguageFor(assessment) }));
      });
      return section;
    });
  }

  function answerLineCount(marks) {
    var value = Number(marks);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.max(3, Math.min(12, Math.round(value) * 3));
  }

  function questionMarks(question, result) {
    if (Number.isFinite(Number(question.marks)) && Number(question.marks) > 0) return Number(question.marks);
    var marks = result && result.marks ? result.marks : {};
    var number = String(question.number == null ? '' : question.number);
    return Number(marks[number] || marks['q' + number] || 0);
  }

  function subquestionMarks(subquestion, question, result) {
    if (Number.isFinite(Number(subquestion.marks)) && Number(subquestion.marks) > 0) return Number(subquestion.marks);
    var marks = result && result.marks ? result.marks : {};
    var number = String(question.number == null ? '' : question.number);
    var label = String(subquestion.label || '');
    if (!label) return 0;
    return Number(marks[number + label] || marks['q' + number + label] || 0);
  }

  function sharedSubquestionLineCounts(marks, count) {
    if (!count) return [];
    var total = Math.max(count * 3, Math.min(count * 12, Math.round(Number(marks) || 0) * 3));
    var base = Math.floor(total / count);
    var remainder = total - base * count;
    var counts = [];
    for (var index = 0; index < count; index += 1) {
      counts.push(base + (index >= count - remainder ? 1 : 0));
    }
    return counts;
  }

  function estimateBlockHeight(block) {
    if (block.kind === 'answerHeading') return 0.9;
    if (block.kind === 'choices') return 0.85;
    if (block.kind === 'functionGraphChoices') return 4.4;
    if (block.kind === 'table') return 0.45 + Math.max(1, (block.rows || []).length) * 0.72;
    if (block.kind === 'question' || block.kind === 'subquestion') {
      var text = String(block.text || block.math || '').replace(/\\[A-Za-z]+/g, 'x').replace(/[{}$]/g, '');
      var rows = Math.max(1, Math.ceil(text.length / 42));
      return rows * 0.6;
    }
    return 0.45;
  }

  function estimateExamUnitHeight(unit) {
    var height = unit.headingBefore ? 0.68 : 0;
    (unit.blocks || []).forEach(function (block) { height += estimateBlockHeight(block); });
    if (unit.lineCount) height += unit.lineCount * 0.77;
    height += 0.05;
    return height;
  }

  function customExamAnswerRows(block) {
    var rows = block && block.examAnswerRows;
    return Number.isInteger(rows) && rows >= 0 ? rows : null;
  }

  function buildExamItems(pages, result) {
    var items = [];
    var part = 'B';
    var seenPartHeading = Object.create(null);
    var pendingHeading = '';

    function pushQuestionUnits(blocks, question) {
      var subquestionIndexes = [];
      blocks.forEach(function (block, index) {
        if (block.kind === 'subquestion') subquestionIndexes.push(index);
      });
      var choiceBlock = blocks.some(function (block) {
        return block.kind === 'choices' || block.kind === 'functionGraphChoices';
      });
      var questionNumber = question.number == null ? '' : String(question.number);

      if (!subquestionIndexes.length) {
        var customRows = customExamAnswerRows(question);
        var lineCount = choiceBlock ? 0 : (customRows == null ? answerLineCount(questionMarks(question, result)) : customRows);
        var unit = {
          kind: 'question',
          part: part,
          hasSectionHeading: !!seenPartHeading[part],
          questionNumber: questionNumber,
          pageBreakBefore: !!question.pageBreakBefore,
          blocks: blocks.filter(function (block) { return block.kind !== 'spacer'; }),
          lineCount: lineCount,
          choiceRow: choiceBlock ? questionNumber : '',
          atomicGroup: choiceBlock ? 'multiple-choice-' + part : ''
        };
        if (pendingHeading) {
          unit.headingBefore = pendingHeading;
          pendingHeading = '';
        }
        unit.estimatedHeight = estimateExamUnitHeight(unit);
        items.push(unit);
        return;
      }

      var firstSubquestionIndex = subquestionIndexes[0];
      var prefix = blocks.slice(0, firstSubquestionIndex).filter(function (block) { return block.kind !== 'spacer'; });
      var separateFirstAnswer = Number(question.answerLineCount) > 0 && prefix.length > 0;
      if (separateFirstAnswer) {
        var firstAnswerUnit = {
          kind: 'question',
          part: part,
          hasSectionHeading: !!seenPartHeading[part],
          questionNumber: questionNumber,
          blocks: prefix,
          lineCount: answerLineCount(question.answerLineCount),
          choiceRow: ''
        };
        if (pendingHeading) {
          firstAnswerUnit.headingBefore = pendingHeading;
          pendingHeading = '';
        }
        firstAnswerUnit.estimatedHeight = estimateExamUnitHeight(firstAnswerUnit);
        items.push(firstAnswerUnit);
        prefix = [];
      }
      var unresolvedIndexes = [];
      var marksByIndex = Object.create(null);
      subquestionIndexes.forEach(function (blockIndex) {
        var subquestionMarksValue = subquestionMarks(blocks[blockIndex], question, result);
        if (subquestionMarksValue) marksByIndex[blockIndex] = subquestionMarksValue;
        else unresolvedIndexes.push(blockIndex);
      });
      var sharedCounts = sharedSubquestionLineCounts(questionMarks(question, result), unresolvedIndexes.length);
      var sharedCountsByIndex = Object.create(null);
      unresolvedIndexes.forEach(function (blockIndex, sharedIndex) {
        sharedCountsByIndex[blockIndex] = sharedCounts[sharedIndex] || 0;
      });
      subquestionIndexes.forEach(function (blockIndex, sequenceIndex) {
        var subquestion = blocks[blockIndex];
        var nextIndex = sequenceIndex + 1 < subquestionIndexes.length ? subquestionIndexes[sequenceIndex + 1] : blocks.length;
        var between = blocks.slice(blockIndex + 1, nextIndex);
        var currentBlocks = (sequenceIndex === 0 ? prefix : []).concat([subquestion]);
        var customRows = customExamAnswerRows(subquestion);
        between.forEach(function (block) {
          if (block.kind !== 'spacer') currentBlocks.push(block);
        });
        var subUnit = {
          kind: 'subquestion',
          part: part,
          hasSectionHeading: !!seenPartHeading[part],
          questionNumber: questionNumber,
          pageBreakBefore: sequenceIndex === 0 && !!question.pageBreakBefore,
          continuation: sequenceIndex > 0 || separateFirstAnswer,
          blocks: currentBlocks,
          lineCount: customRows != null ? customRows :
            (marksByIndex[blockIndex] ? answerLineCount(marksByIndex[blockIndex]) : sharedCountsByIndex[blockIndex]),
          choiceRow: ''
        };
        if (sequenceIndex === 0 && pendingHeading) {
          subUnit.headingBefore = pendingHeading;
          pendingHeading = '';
        }
        subUnit.estimatedHeight = estimateExamUnitHeight(subUnit);
        items.push(subUnit);
      });
    }

    (pages || []).forEach(function (page) {
      var blocks = page.blocks || [];
      for (var index = 0; index < blocks.length;) {
        var block = blocks[index];
        if (block.kind === 'answerHeading') {
          var heading = String(block.text || '');
          if (heading.indexOf('甲部') !== -1) {
            part = 'A';
            if (!seenPartHeading.A) {
              pendingHeading = heading.replace(/（續）/g, '');
              seenPartHeading.A = true;
            }
          } else if (heading.indexOf('乙部') !== -1) {
            part = 'B';
            if (!seenPartHeading.B) {
              pendingHeading = heading.replace(/（續）/g, '');
              seenPartHeading.B = true;
            }
          } else pendingHeading = heading.replace(/（續）/g, '');
          index += 1;
          continue;
        }
        if (block.kind !== 'question') {
          index += 1;
          continue;
        }
        var questionBlocks = [block];
        index += 1;
        while (index < blocks.length && blocks[index].kind !== 'question' && blocks[index].kind !== 'answerHeading') {
          questionBlocks.push(blocks[index]);
          index += 1;
        }
        pushQuestionUnits(questionBlocks, block);
      }
    });

    var withAnswerSheets = [];
    var multipleChoiceRows = [];
    items.forEach(function (item) {
      if (item.choiceRow) {
        multipleChoiceRows.push(item.choiceRow);
        withAnswerSheets.push(item);
        return;
      }
      if (multipleChoiceRows.length) {
        var answerSheet = {
          kind: 'multipleChoiceAnswerSheet',
          part: 'A',
          rows: multipleChoiceRows.slice(),
          blocks: [],
          lineCount: 0,
          estimatedHeight: 0.7 + multipleChoiceRows.length * 0.82,
          atomicGroup: 'multiple-choice-A'
        };
        withAnswerSheets.push(answerSheet);
        multipleChoiceRows = [];
      }
      withAnswerSheets.push(item);
    });
    if (multipleChoiceRows.length) {
      withAnswerSheets.push({
        kind: 'multipleChoiceAnswerSheet',
        part: 'A',
        rows: multipleChoiceRows.slice(),
        blocks: [],
        lineCount: 0,
        estimatedHeight: 0.7 + multipleChoiceRows.length * 0.82,
        atomicGroup: 'multiple-choice-A'
      });
    }
    return withAnswerSheets;
  }

  function paginateExamItems(items, firstPageCapacityOverride) {
    var pages = [];
    var current = { items: [], part: '', usedCm: 0, continuationHeading: '', questionContinuation: '' };
    // Keep room for the first-page header and notice inside the same fixed frame.
    var firstPageCapacity = Number.isFinite(firstPageCapacityOverride) && firstPageCapacityOverride > 0 ?
      firstPageCapacityOverride : 18.3;
    var laterPageCapacity = 25;

    function pageCapacity() {
      return pages.length === 0 ? firstPageCapacity : laterPageCapacity;
    }

    function finishPage() {
      if (current.items.length) pages.push(current);
      current = { items: [], part: '', usedCm: 0, continuationHeading: '', questionContinuation: '' };
    }

    function itemHeight(item) {
      return Number(item.estimatedHeight || 0);
    }

    function pageStartHeadings(item) {
      var section = pages.length > 0 && item.part === 'B' && item.hasSectionHeading &&
        !item.headingBefore && !item.continuation;
      var question = !!(item.continuation && item.questionNumber);
      return {
        section: section ? '乙部　解答題（續）' : '',
        question: question ? item.questionNumber + '.（續）' : '',
        height: (section ? 0.9 : 0) + (question ? 0.7 : 0)
      };
    }

    function preparePageFor(item) {
      if (current.items.length) return;
      current.part = item.part || 'B';
      var headings = pageStartHeadings(item);
      current.continuationHeading = headings.section;
      current.questionContinuation = headings.question;
      current.usedCm += headings.height;
    }

    function appendItemWithoutBreak(item) {
      preparePageFor(item);
      current.items.push(item);
      current.usedCm += itemHeight(item);
    }

    function appendItem(item) {
      if (current.items.length && current.usedCm + itemHeight(item) > pageCapacity()) finishPage();
      appendItemWithoutBreak(item);
    }

    function groupAt(index) {
      var first = items[index];
      var group = [first];
      var next = index + 1;
      if (first.atomicGroup) {
        while (next < items.length && items[next].atomicGroup === first.atomicGroup) {
          group.push(items[next]);
          next += 1;
        }
      } else if (first.questionNumber && first.kind !== 'multipleChoiceAnswerSheet') {
        while (next < items.length && !items[next].atomicGroup &&
            items[next].kind !== 'multipleChoiceAnswerSheet' &&
            items[next].questionNumber === first.questionNumber) {
          group.push(items[next]);
          next += 1;
        }
      }
      return group;
    }

    function groupHeight(group) {
      return group.reduce(function (height, item) { return height + itemHeight(item); }, 0);
    }

    function appendWholeGroup(group) {
      if (current.items.length && current.usedCm + groupHeight(group) > pageCapacity()) finishPage();
      group.forEach(appendItemWithoutBreak);
    }

    for (var index = 0; index < items.length;) {
      var group = groupAt(index);
      var first = group[0];
      if (first.pageBreakBefore && current.items.length) finishPage();
      var capacity = pageCapacity();
      var startHeight = current.items.length ? 0 : pageStartHeadings(first).height;
      var completeHeight = startHeight + groupHeight(group);

      if (first.atomicGroup || group.length === 1 || completeHeight <= capacity - current.usedCm) {
        appendWholeGroup(group);
      } else {
        var firstUnitFits = current.items.length && current.usedCm + itemHeight(first) <= capacity;
        if (!firstUnitFits && current.items.length) finishPage();

        var freshPageHeight = pageStartHeadings(first).height + groupHeight(group);
        if (!current.items.length && freshPageHeight <= pageCapacity()) {
          appendWholeGroup(group);
        } else {
          group.forEach(appendItem);
        }
      }
      index += group.length;
    }
    finishPage();
    return pages;
  }

  function renderExamQuestion(block, result, hideMarks, assessment) {
    var question = textElement('div', 'question-row exam-question-row' + (block.subquestionLabel ? ' question-row--labelled' : ''));
    question.appendChild(textElement('div', 'question-number', block.number ? block.number + '.' : ''));
    if (block.subquestionLabel) {
      question.appendChild(textElement('div', 'question-subquestion-label', '(' + block.subquestionLabel + ')'));
    }
    var body = textElement('div', 'question-body');
    appendPlainOrMath(body, block.text || '');
    question.appendChild(body);
    var marks = block.examMarks != null ? block.examMarks : block.marks || (block.number != null && result.marks ?
      (result.marks[String(block.number)] || result.marks['q' + block.number]) : 0);
    question.appendChild(textElement('div', 'question-marks', !hideMarks && marks ? marksText(marks, paperLanguageFor(assessment)) : ''));
    return question;
  }

  function renderExamWritingLines(lineCount, assessment) {
    if (assessment && assessment.examAnswerStyle === 'blank') {
      var space = textElement('div', 'exam-writing-space');
      space.setAttribute('aria-label', paperLanguageFor(assessment) === 'en' ? 'Answer space' : '作答空間');
      space.style.height = (lineCount * 0.77) + 'cm';
      return space;
    }
    var lines = textElement('div', 'exam-writing-lines');
    lines.setAttribute('aria-label', paperLanguageFor(assessment) === 'en' ?
      lineCount + ' answer lines' : lineCount + ' 行作答空間');
    for (var index = 0; index < lineCount; index += 1) {
      lines.appendChild(textElement('div', 'exam-writing-line'));
    }
    return lines;
  }

  function renderMultipleChoiceAnswerSheet(rows, assessment) {
    var sheet = textElement('section', 'exam-mc-answer-sheet');
    var english = paperLanguageFor(assessment) === 'en';
    sheet.appendChild(textElement('h3', '', english ? 'Multiple Choice Answer Sheet' : '多項選擇題答題紙'));
    sheet.appendChild(textElement('p', '', english ?
      'Use an HB pencil to completely fill in the circle for the correct answer.' :
      '請用 HB 鉛筆把正確答案的圓圈塗滿。'));
    var letters = ['A', 'B', 'C', 'D'];
    rows.forEach(function (number) {
      var row = textElement('div', 'exam-mc-answer-row');
      row.appendChild(textElement('span', 'exam-mc-answer-number', number + '.'));
      letters.forEach(function (letter) {
        var option = textElement('span', 'exam-mc-answer-option');
        option.appendChild(textElement('span', '', letter));
        option.appendChild(textElement('i', 'exam-mc-bubble'));
        row.appendChild(option);
      });
      sheet.appendChild(row);
    });
    return sheet;
  }

  function renderExamUnit(unit, result, assessment) {
    if (unit.kind === 'multipleChoiceAnswerSheet') return renderMultipleChoiceAnswerSheet(unit.rows, assessment);
    var wrapper = textElement('div', 'exam-question-unit');
    if (unit.headingBefore) {
      var headingText = unit.headingBefore.replace(/請將選項字母填在答案空格。?/, '');
      wrapper.appendChild(textElement('div', 'exam-section-heading', headingText));
    }
    (unit.blocks || []).forEach(function (block) {
      if (block.kind === 'spacer') return;
      if (block.kind === 'question') wrapper.appendChild(renderExamQuestion(block, result, !!unit.choiceRow, assessment));
      else if (block.kind === 'subquestion') {
        var withoutBlank = Object.assign({}, block, { blankCm: 0 });
        wrapper.appendChild(renderBlock(withoutBlank));
      } else wrapper.appendChild(renderBlock(block, { hideChoiceAnswer: true, language: paperLanguageFor(assessment) }));
    });
    if (unit.lineCount) wrapper.appendChild(renderExamWritingLines(unit.lineCount, assessment));
    return wrapper;
  }

  function schoolYearFor(result) {
    if (result.academicYear) return result.academicYear;
    var parts = elements.dateInput.value.split('-').map(Number);
    var startYear = parts[1] >= 9 ? parts[0] : parts[0] - 1;
    return startYear + '-' + (startYear + 1);
  }

  function renderExamPaperHeader(result, assessment) {
    var header = textElement('header', 'exam-paper-heading');
    var english = paperLanguageFor(assessment) === 'en';
    var schoolName = paperSchoolName(assessment, elements.schoolInput.value, selectedSchool);
    header.appendChild(textElement('div', 'exam-paper-school', schoolName));
    header.appendChild(textElement('div', 'exam-paper-course', english ?
      schoolYearFor(result) + ' ' + result.gradeLabel + ' ' + result.subject :
      schoolYearFor(result) + '　' + result.gradeLabel + '　' + result.subject));
    header.appendChild(textElement('div', 'exam-paper-name', english ?
      result.name + ' (' + result.version + ')' : result.name + '（' + result.version + '）'));
    header.appendChild(textElement('div', 'exam-paper-book-title', english ? 'Question-Answer Book' : '試題答題簿'));
    var limits = [];
    if (result.durationMinutes) limits.push(english ? 'Time allowed: ' + result.durationMinutes + ' minutes' : '限時：' + result.durationMinutes + ' 分鐘');
    limits.push(english ? 'Total marks: ' + result.totalMarks : '總分：' + result.totalMarks + ' 分');
    header.appendChild(textElement('div', 'exam-paper-limits', limits.join(english ? ' · ' : '　')));

    var studentGrid = textElement('div', 'exam-student-grid');
    var studentFields = english ? [
      ['Name', ''], ['Class', ''], ['Class No.', ''], ['Date', elements.dateInput.value]
    ] : [
      ['姓名', ''], ['班別', ''], ['學號', ''], ['日期', elements.dateInput.value]
    ];
    studentFields.forEach(function (field) {
      var cell = textElement('div', 'exam-student-cell');
      cell.appendChild(textElement('span', 'exam-student-label', english ? field[0] + ':' : field[0] + '：'));
      cell.appendChild(textElement('span', 'exam-student-value', field[1] || (english ? '________________' : '　　　　　　　　　')));
      studentGrid.appendChild(cell);
    });
    header.appendChild(studentGrid);
    return header;
  }

  function renderExamNotice(assessment) {
    var english = paperLanguageFor(assessment) === 'en';
    var notice = textElement('section', 'exam-candidate-notice');
    notice.appendChild(textElement('h2', '', english ? 'INSTRUCTIONS' : '考生須知'));
    var list = document.createElement('ol');
    (english ? EXAM_NOTICE_TEXT_EN : EXAM_NOTICE_TEXT).forEach(function (text) {
      var item = document.createElement('li');
      item.textContent = text;
      list.appendChild(item);
    });
    notice.appendChild(list);
    return notice;
  }

  function renderExamPaperPage(page, result, assessment, pageIndex, pageCount) {
    var english = paperLanguageFor(assessment) === 'en';
    var section = textElement('section', 'print-page exam-page exam-format-page' + (pageIndex === 0 ? ' exam-format-page--first' : ''));
    var printableArea = textElement('div', 'exam-printable-area');
    var answerArea = textElement('div', 'exam-answer-area');
    answerArea.setAttribute('aria-label', english ? 'Question-answer area' : '試題答題範圍');
    var boundaryText = english ? EXAM_BOUNDARY_TEXT_EN : EXAM_BOUNDARY_TEXT;
    var sideBoundaryClass = 'exam-boundary-note' + (english ? ' exam-boundary-note--english' : '');
    answerArea.appendChild(textElement('span', sideBoundaryClass + ' exam-boundary-note--left', boundaryText));
    answerArea.appendChild(textElement('span', sideBoundaryClass + ' exam-boundary-note--right', boundaryText));
    if (pageIndex === 0) {
      answerArea.appendChild(renderExamPaperHeader(result, assessment));
      answerArea.appendChild(renderExamNotice(assessment));
    }
    if (page.continuationHeading) answerArea.appendChild(textElement('div', 'exam-section-heading', page.continuationHeading));
    if (page.questionContinuation && english) {
      answerArea.appendChild(textElement('div', 'exam-question-continuation', page.questionContinuation.replace('（續）', ' (continued)')));
    } else if (page.questionContinuation) answerArea.appendChild(textElement('div', 'exam-question-continuation', page.questionContinuation));
    page.items.forEach(function (unit) { answerArea.appendChild(renderExamUnit(unit, result, assessment)); });
    if (pageIndex === pageCount - 1) answerArea.appendChild(textElement('div', 'exam-end-mark', english ? 'END OF PAPER' : '試卷完'));
    answerArea.appendChild(textElement('span', 'exam-boundary-note exam-boundary-note--bottom', boundaryText));
    printableArea.appendChild(answerArea);

    var footer = textElement('footer', 'exam-page-footer');
    footer.appendChild(textElement('span', 'exam-page-number', english ? 'Page ' + (pageIndex + 1) : '第 ' + (pageIndex + 1) + ' 頁'));
    if (pageIndex < pageCount - 1) footer.appendChild(textElement('span', 'exam-continuation', english ? 'Go on to the next page' : '續後頁'));
    printableArea.appendChild(footer);
    section.appendChild(printableArea);
    return section;
  }

  function buildExamPages(pages, result, assessment) {
    var layoutPages = paginateExamItems(buildExamItems(pages, result), assessment && assessment.examFirstPageCapacity);
    return layoutPages.map(function (page, index) {
      return renderExamPaperPage(page, result, assessment, index, layoutPages.length);
    });
  }

  function makePlaceholder(messageKey, isError) {
    var placeholder = textElement('div', 'preview-placeholder no-print', translate(messageKey));
    placeholder.dataset.i18n = messageKey;
    if (isError) placeholder.dataset.state = 'error';
    return placeholder;
  }

  function setPrintButtonState(enabled) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-print-kind]'), function (button) {
      button.disabled = !enabled;
    });
    if (elements.newVersionButton) elements.newVersionButton.disabled = !enabled;
  }

  function hasPrintedVersion(assessmentId, version) {
    return historyRecords.some(function (record) {
      return record.assessmentId === assessmentId && record.version === version;
    });
  }

  async function generateAnotherVersion() {
    var assessment = assessmentById(elements.assessmentSelect.value);
    if (!assessment || !currentResult) return false;
    var currentMatch = currentResult.version.match(/^V([1-9][0-9]*)$/);
    if (!currentMatch) return false;
    var nextVersion = hasPrintedVersion(assessment.id, currentResult.version)
      ? recommendationFor(assessment.id)
      : 'V' + (Number(currentMatch[1]) + 1);
    elements.versionInput.value = nextVersion;
    return refreshPreview();
  }

  async function refreshPreview() {
    var epoch = ++renderEpoch;
    var assessment = assessmentById(elements.assessmentSelect.value);
    currentResult = null;
    setPrintButtonState(false);
    var examLayout = elements.layoutSelect.value === 'exam';
    elements.printRoot.dataset.layout = examLayout ? 'exam' : 'general';
    elements.previewSection.classList.toggle('preview-section--exam-layout', examLayout);
    elements.previewSection.scrollTop = 0;
    updatePreviewSummary(assessment, elements.versionInput.value.trim(), elements.layoutSelect.value);
    updatePreviewScale();
    if (!assessment) {
      if (window.MathJax && window.MathJax.typesetClear) window.MathJax.typesetClear([elements.printRoot]);
      elements.printRoot.replaceChildren(makePlaceholder('placeholder.chooseAssessment'));
      currentModule = null;
      setSelectionStatus('status.chooseAssessment', false);
      updateRecommendation();
      return false;
    }
    var version = elements.versionInput.value.trim();
    if (!version) {
      elements.printRoot.replaceChildren(makePlaceholder('placeholder.version', true));
      setSelectionStatus('status.versionMissing', true);
      return false;
    }
    if (!elements.dateInput.value || (examLayout && !elements.schoolInput.value.trim())) {
      elements.printRoot.replaceChildren(makePlaceholder(
        examLayout ? 'placeholder.dateSchool' : 'placeholder.date', true));
      setSelectionStatus(examLayout ? 'status.dateSchoolMissing' : 'status.dateMissing', true);
      return false;
    }
    setSelectionStatus('status.loading', false);
    try {
      var loadedModule = await loadModule(assessment);
      if (epoch !== renderEpoch) return false;
      var result = loadedModule.generate(version);
      var validation = loadedModule.verify(result.version);
      if (!validation || validation.valid !== true) throw new Error('這個版本未通過驗算。');
      if (!Array.isArray(result.paperPages) || !Array.isArray(result.answerPages)) {
        throw new Error('補測模組缺少通用 A4 頁面資料。');
      }
      var paperPages = examLayout ? buildExamPages(result.paperPages, result, assessment) :
        buildPages(result.paperPages, assessment, result, false);
      var answerPages = buildPages(result.answerPages, assessment, result, true);
      if (window.MathJax && window.MathJax.typesetClear) window.MathJax.typesetClear([elements.printRoot]);
      elements.printRoot.replaceChildren.apply(elements.printRoot,
        paperPages.concat(answerPages));
      if (!examLayout) fitGeneralHeaderLines();
      updatePreviewScale();
      if (!window.MathJax || typeof window.MathJax.typesetPromise !== 'function') {
        elements.printRoot.replaceChildren(makePlaceholder(mathJaxFailed ?
          'placeholder.mathjaxError' : 'placeholder.mathjaxLoading'));
        setSelectionStatus(mathJaxFailed ? 'status.mathjaxError' : 'status.mathjaxLoading', mathJaxFailed);
        return false;
      }
      if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) await window.MathJax.startup.promise;
      if (window.MathJax && window.MathJax.typesetPromise) await window.MathJax.typesetPromise([elements.printRoot]);
      if (epoch !== renderEpoch) return false;
      updatePreviewSummary(assessment, result.version, elements.layoutSelect.value, paperPages.length);
      updatePreviewScale();
      currentModule = loadedModule;
      currentResult = result;
      setPrintButtonState(true);
      setSelectionStatus('status.ready', false, {
        paperPages: paperPages.length,
        answerPages: result.answerPages.length
      });
      updateRecommendation();
      return true;
    } catch (error) {
      if (epoch !== renderEpoch) return false;
      if (window.MathJax && window.MathJax.typesetClear) window.MathJax.typesetClear([elements.printRoot]);
      elements.printRoot.replaceChildren(makePlaceholder('status.generationError', true));
      currentResult = null;
      currentModule = null;
      setPrintButtonState(false);
      setSelectionStatus('status.generationError', true);
      return false;
    }
  }

  function addPrintRecord(category) {
    var assessment = assessmentById(elements.assessmentSelect.value);
    if (!assessment || !currentResult) return;
    var record = {
      assessmentId: assessment.id,
      version: currentResult.version,
      date: elements.dateInput.value,
      schoolName: paperSchoolName(assessment, elements.schoolInput.value, selectedSchool),
      category: category,
      timestamp: Date.now()
    };
    historyRecords = mergeHistoryRecords([record].concat(historyRecords));
    saveHistory();
    renderHistory();
    if (activeHistoryUid) writeHistoryRecordToCloud(activeHistoryUid, record);
  }

  function handleHistoryStorageChange(event) {
    if (event.key === STORAGE_KEY) {
      if (!activeHistoryUid && event.newValue === null) {
        historyRecords = [];
        renderHistory();
      }
      return;
    }
    if (!activeHistoryUid || event.key !== userHistoryStorageKey(activeHistoryUid)) return;
    if (event.newValue === null) {
      saveHistory();
      return;
    }
    historyRecords = mergeHistoryRecords(historyRecords.concat(loadHistory(event.key)));
    saveHistory();
    renderHistory();
    delete syncedHistoryUids[activeHistoryUid];
    syncHistoryForUser(activeHistoryUid);
  }

  function setPrintLastPage(category) {
    Array.prototype.forEach.call(elements.printRoot.querySelectorAll('.print-page'), function (page) {
      page.classList.remove('print-last');
    });
    var visiblePages = Array.prototype.filter.call(elements.printRoot.querySelectorAll('.print-page'), function (page) {
      return category === 'practice' || (category === 'paper' && page.classList.contains('exam-page')) ||
        (category === 'answers' && page.classList.contains('answer-page'));
    });
    if (visiblePages.length) visiblePages[visiblePages.length - 1].classList.add('print-last');
  }

  async function printCategory(category) {
    if (!currentResult || !currentModule) return;
    var previewReady = await refreshPreview();
    if (!previewReady || !currentResult) return;
    var assessment = assessmentById(elements.assessmentSelect.value);
    var printFilename = buildPrintFilename(assessment, elements.dateInput.value, currentResult.version, category);
    document.body.dataset.printMode = category;
    setPrintLastPage(category);
    addPrintRecord(category);
    setPrintDocumentTitle(printFilename);
    try {
      window.print();
    } catch (error) {
      restorePrintDocumentTitle();
      throw error;
    } finally {
      delete document.body.dataset.printMode;
      Array.prototype.forEach.call(elements.printRoot.querySelectorAll('.print-page'), function (page) {
        page.classList.remove('print-last');
      });
    }
  }

  function renderSuggestions(query) {
    var box = elements.schoolSuggestions;
    box.textContent = '';
    var needle = normalizeSearch(query);
    if (!needle) { box.hidden = true; return; }
    var matches = schoolList.filter(function (school) {
      return normalizeSearch(school.zh).indexOf(needle) !== -1 || normalizeSearch(school.en).indexOf(needle) !== -1;
    }).slice(0, 10);
    if (!matches.length) {
      var noMatch = textElement('div', 'suggestion-option', translate('school.noMatch'));
      box.appendChild(noMatch);
      box.hidden = false;
      return;
    }
    matches.forEach(function (school) {
      var option = textElement('button', 'suggestion-option');
      option.type = 'button';
      option.setAttribute('role', 'option');
      option.dataset.schoolZh = school.zh;
      option.dataset.schoolEn = school.en;
      option.appendChild(textElement('strong', '', school.zh));
      option.appendChild(textElement('span', '', school.en));
      box.appendChild(option);
    });
    box.hidden = false;
  }

  function hideSuggestions() { elements.schoolSuggestions.hidden = true; }

  function restoreFocus(target) {
    elements.assessmentSelect.value = target;
    updateSchoolDefaultForAssessment(target);
    updateVersionHelp(target);
    elements.versionInput.value = recommendationFor(target);
    updateRecommendation();
    refreshPreview();
    elements.generator.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setAuthRecordMode(state) {
    if (!state || state.state === 'loading') return;
    var element = elements.recordMode;
    if (state.state === 'student' || state.state === 'teacher') {
      var uid = state.user && state.user.uid;
      if (!uid) {
        deactivateHistoryUser();
        setRecordMode('record.missingUid');
        return;
      }
      activateHistoryUser(uid);
      var syncPromise = syncHistoryForUser(uid);
      if (syncedHistoryUids[uid]) {
        setRecordMode('record.synced');
      } else {
        setRecordMode('record.syncing');
      }
      syncPromise.then(function (success) {
        if (activeHistoryUid !== uid) return;
        if (success) setRecordMode('record.synced');
        else showCloudHistoryFallback(uid);
      });
    } else if (state.state === 'unavailable') {
      deactivateHistoryUser();
      setRecordMode('record.serviceUnavailable');
    } else {
      deactivateHistoryUser();
      setRecordMode('record.guest');
    }
  }

  async function loadSchools() {
    try {
      var response = await fetch('./data/schools.json');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var payload = await response.json();
      schoolList = Array.isArray(payload.schools) ? payload.schools : [];
      if (schoolList.length < 500) throw new Error('secondary school list is incomplete');
    } catch (error) {
      elements.schoolInput.setAttribute('aria-describedby', 'school-list-status');
      var status = document.createElement('small');
      status.id = 'school-list-status';
      status.dataset.i18n = 'school.listUnavailable';
      status.textContent = translate('school.listUnavailable');
      elements.schoolInput.parentNode.appendChild(status);
    }
  }

  function bindEvents() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-language]'), function (button) {
      button.addEventListener('click', function () { applyLanguage(button.dataset.language, true); });
    });
    elements.assessmentSelect.addEventListener('change', function () {
      updateRecommendation();
      var assessmentId = elements.assessmentSelect.value;
      updateSchoolDefaultForAssessment(assessmentId);
      updateVersionHelp(assessmentId);
      if (assessmentId) elements.versionInput.value = recommendationFor(assessmentId);
      refreshPreview();
    });
    elements.dateInput.addEventListener('change', refreshPreview);
    elements.versionInput.addEventListener('input', refreshPreview);
    elements.layoutSelect.addEventListener('change', refreshPreview);
    elements.newVersionButton.addEventListener('click', function () { generateAnotherVersion(); });
    elements.schoolInput.addEventListener('input', function () {
      selectedSchool = null;
      renderSuggestions(elements.schoolInput.value);
      refreshPreview();
    });
    elements.schoolInput.addEventListener('focus', function () {
      renderSuggestions(elements.schoolInput.value);
    });
    window.addEventListener('resize', function () {
      updatePreviewScale();
      fitGeneralHeaderLines();
    });
    window.addEventListener('beforeprint', fitGeneralHeaderLines);
    window.addEventListener('afterprint', function () {
      updatePreviewScale();
      fitGeneralHeaderLines();
    });
    elements.schoolSuggestions.addEventListener('mousedown', function (event) {
      if (event.target.closest('button')) event.preventDefault();
    });
    elements.schoolSuggestions.addEventListener('click', function (event) {
      var option = event.target.closest('[data-school-zh]');
      if (!option) return;
      elements.schoolInput.value = option.dataset.schoolZh;
      selectedSchool = {
        zh: option.dataset.schoolZh,
        en: option.dataset.schoolEn,
        isDefault: option.dataset.schoolZh === SCHOOL_DEFAULT && option.dataset.schoolEn === SCHOOL_DEFAULT_EN
      };
      hideSuggestions();
      refreshPreview();
    });
    document.addEventListener('click', function (event) {
      if (!elements.schoolSuggestions.contains(event.target) && event.target !== elements.schoolInput) hideSuggestions();
    });
    document.addEventListener('click', function (event) {
      var catalogChoice = event.target.closest('[data-assessment-id]');
      if (catalogChoice) restoreFocus(catalogChoice.dataset.assessmentId);
      var printButton = event.target.closest('[data-print-kind]');
      if (printButton && !printButton.disabled) printCategory(printButton.dataset.printKind);
    });
    function bindAuthState() {
      if (!window.AuthState || typeof window.AuthState.onChange !== 'function') return false;
      window.AuthState.onChange(setAuthRecordMode);
      return true;
    }
    if (!bindAuthState()) {
      setRecordMode('record.loading');
      window.addEventListener('auth-state-ready', function () {
        Promise.resolve().then(function () {
          if (!bindAuthState()) {
            setRecordMode('record.authStateUnavailable');
          }
        });
      }, { once: true });
    }
    window.addEventListener('mathjax-ready', function () {
      mathJaxFailed = false;
      if (elements.assessmentSelect.value) refreshPreview();
    }, { once: true });
    window.addEventListener('mathjax-error', function () {
      mathJaxFailed = true;
      if (elements.assessmentSelect.value) refreshPreview();
    }, { once: true });
    window.addEventListener('storage', handleHistoryStorageChange);
  }

  function initialize() {
    var elementIds = {
      catalogS1: 'catalog-s1', catalogS4: 'catalog-s4', catalogM2: 'catalog-m2',
      catalogM2Empty: 'catalog-m2-empty', assessmentSelect: 'assessment-select',
      dateInput: 'date-input', versionInput: 'version-input', versionHelp: 'version-help', layoutSelect: 'layout-select',
      schoolInput: 'school-input', newVersionButton: 'new-version-button', previewSection: 'preview-section',
      schoolSuggestions: 'school-suggestions', nextVersion: 'next-version',
      selectionStatus: 'selection-status', printRoot: 'print-root', historyList: 'history-list',
      historyEmpty: 'history-empty', generator: 'generator', recordMode: 'record-mode',
      previewSummary: 'preview-summary'
    };
    Object.keys(elementIds).forEach(function (key) { elements[key] = byId(elementIds[key]); });
    elements.dateInput.value = localDateValue();
    elements.schoolInput.value = SCHOOL_DEFAULT;
    selectedSchool = { zh: SCHOOL_DEFAULT, en: SCHOOL_DEFAULT_EN, isDefault: true };
    applyLanguage(preferredUiLanguage(), false);
    observeAuthWidget();
    updateVersionHelp('');
    bindEvents();
    loadSchools();
    updatePreviewScale();
    if (window.AuthState && typeof window.AuthState.whenReady === 'function') {
      window.AuthState.whenReady().then(setAuthRecordMode).catch(function () {});
    }
    setPrintButtonState(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
