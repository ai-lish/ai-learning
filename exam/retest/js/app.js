(function () {
  'use strict';

  var STORAGE_KEY = 'aiLearning.retest.printHistory.v1';
  var FIRESTORE_HISTORY_PAGE_SIZE = 50;
  var SCHOOL_DEFAULT = '神召會康樂中學';
  var EXAM_NOTICE_TEXT = [
    '（一）在本試題答題簿內預留的空位作答。',
    '（二）寫於邊界以外的答案，將不予評閱。',
    '（三）除特別指明外，須詳細列出所有算式。'
  ];
  var EXAM_BOUNDARY_TEXT = '寫於邊界以外的答案，將不予評閱。';
  var ASSESSMENTS = [
    {
      id: 's1-ch1-2-test-q9', grade: 's1', gradeLabel: '中一級',
      label: 'S1Ch1.2-2Test 補測', description: '1A 級測一第 9 題 · 有向數四則 · 13 分',
      firstGeneratedVersion: 4,
      script: './js/s1-ch1-2-test-q9.js', exportName: 'RetestS1Ch12Q9'
    },
    {
      id: 's1-class-test-2', grade: 's1', gradeLabel: '中一級',
      label: 'S1 班測2 重測（代數式及數列）', description: '1A 代數式及數列 · 20 分鐘 · 22 分',
      firstGeneratedVersion: 3,
      script: './js/s1-class-test-2.js', exportName: 'RetestS1ClassTest2'
    },
    {
      id: 's4-ch1-test', grade: 's4', gradeLabel: '中四級',
      label: 'S4Ch1Test 補測', description: '第一章一元二次方程 · Q7、Q8、Q9、Q10、Q12 · 21 分',
      firstGeneratedVersion: 4,
      script: './js/s4-ch1-test.js', exportName: 'RetestS4Ch1'
    }
  ];

  var elements = {};
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

  function byId(id) { return document.getElementById(id); }

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
      setSelectionStatus('無法保存本機列印記錄；出卷及列印仍可使用。', true);
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
      elements.recordMode.textContent = '雲端記錄未能同步；記錄仍保存在此帳戶的本機儲存，列印不受影響。';
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
      elements.recordMode.textContent = '已登入；列印記錄已同步到此帳戶，可在其他裝置繼續。';
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

  function setSelectionStatus(message, isError) {
    var status = elements.selectionStatus;
    status.textContent = message;
    status.dataset.state = isError ? 'error' : 'ready';
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
    ['s1', 's4'].forEach(function (grade) {
      var list = elements['catalog' + grade.toUpperCase()];
      list.textContent = '';
      ASSESSMENTS.filter(function (assessment) { return assessment.grade === grade; }).forEach(function (assessment) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'assessment-choice';
        button.dataset.assessmentId = assessment.id;
        var strong = document.createElement('strong');
        strong.textContent = assessment.label;
        var detail = document.createElement('span');
        detail.textContent = assessment.description;
        button.appendChild(strong);
        button.appendChild(detail);
        list.appendChild(button);
      });
    });
    elements.assessmentSelect.textContent = '';
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '請選擇補測';
    elements.assessmentSelect.appendChild(placeholder);
    ASSESSMENTS.forEach(function (assessment) {
      var option = document.createElement('option');
      option.value = assessment.id;
      option.textContent = assessment.label + ' · ' + assessment.gradeLabel;
      elements.assessmentSelect.appendChild(option);
    });
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
    elements.nextVersion.textContent = '建議下一個未用版本：' + (id ? recommendationFor(id) : 'V4');
  }

  function updateVersionHelp(assessmentId) {
    var assessment = assessmentById(assessmentId);
    if (!assessment) {
      elements.versionHelp.textContent = '請先選擇補測；可輸入 V1、V2… 或 V12。';
      return;
    }
    var fixedThrough = assessment.firstGeneratedVersion - 1;
    elements.versionHelp.textContent = '可輸入 V1、V2… 或 V12。V1–V' + fixedThrough +
      ' 沿用已派發題目，V' + assessment.firstGeneratedVersion + ' 起按補測代號及版本固定生成。';
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
      title.textContent = (assessment ? assessment.label : record.assessmentId) + ' · ' + record.version + ' · ' + record.schoolName;
      var subline = document.createElement('span');
      subline.textContent = record.date + ' · ' + categoryLabel(record.category) + ' · ' + formatTimestamp(record.timestamp);
      detail.appendChild(title);
      detail.appendChild(subline);
      var restore = document.createElement('button');
      restore.type = 'button';
      restore.className = 'restore-button';
      restore.textContent = index === 0 ? '回復上次設定' : '回復此設定';
      restore.addEventListener('click', function () { restoreRecord(record); });
      item.appendChild(detail);
      item.appendChild(restore);
      list.appendChild(item);
    });
    updateRecommendation();
  }

  function categoryLabel(category) {
    return { paper: '補測卷', answers: '答案', practice: '練習' }[category] || category;
  }

  function formatTimestamp(timestamp) {
    try {
      return new Intl.DateTimeFormat('zh-HK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
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
      var question = textElement('div', 'question-row');
      question.appendChild(textElement('div', 'question-number', block.number ? block.number + '.' : ''));
      var body = textElement('div', 'question-body');
      appendPlainOrMath(body, block.text || '');
      question.appendChild(body);
      question.appendChild(textElement('div', 'question-marks', block.marks ? '(' + block.marks + ' 分)' : ''));
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
      var subquestion = textElement('div', 'subquestion-row');
      subquestion.appendChild(textElement('div', 'subquestion-label', block.label ? '(' + block.label + ')' : ''));
      var subBody = textElement('div', 'subquestion-body');
      if (block.math != null) appendMath(subBody, block.math);
      else appendPlainOrMath(subBody, block.text || '');
      subquestion.appendChild(subBody);
      subquestion.appendChild(textElement('div', 'question-marks', block.marks ? '(' + block.marks + ' 分)' : ''));
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

  function renderPageHeader(page, assessment, result, isAnswer) {
    var header = textElement('header', 'paper-heading');
    header.appendChild(textElement('div', 'paper-school', elements.schoolInput.value.trim()));
    var titleParts = [];
    if (result.academicYear) titleParts.push(result.academicYear);
    titleParts.push(result.gradeLabel, result.subject, result.name + '（' + result.version + '）');
    if (isAnswer) titleParts.push('評卷參考');
    header.appendChild(textElement('div', 'paper-title', titleParts.join('　')));
    if (!isAnswer && page.withStudentInfo) {
      var hasDuration = !!result.durationMinutes;
      var classValue = result.defaultClass ? result.defaultClass + '（　　）' : '________(　　)';
      var infoClass = 'paper-info';
      var nameLine = '______________';
      if (hasDuration) {
        infoClass += ' paper-info--duration';
        nameLine = '__________';
      }
      var duration = hasDuration ? '　限時：' + result.durationMinutes + '分鐘' : '';
      header.appendChild(textElement('div', infoClass, '姓名：' + nameLine + '　班別：' + classValue + '　日期：' +
        elements.dateInput.value + duration + '　總分：_____/' + result.totalMarks + ' 分'));
    }
    return header;
  }

  function buildPages(pages, assessment, result, isAnswer) {
    return pages.map(function (page) {
      var section = textElement('section', 'print-page ' + (isAnswer ? 'answer-page' : 'exam-page'));
      section.appendChild(renderPageHeader(page, assessment, result, isAnswer));
      (page.blocks || []).forEach(function (block) { section.appendChild(renderBlock(block)); });
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
      var choiceBlock = blocks.some(function (block) { return block.kind === 'choices'; });
      var questionNumber = question.number == null ? '' : String(question.number);

      if (!subquestionIndexes.length) {
        var lineCount = choiceBlock ? 0 : answerLineCount(questionMarks(question, result));
        var unit = {
          kind: 'question',
          part: part,
          hasSectionHeading: !!seenPartHeading[part],
          questionNumber: questionNumber,
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
        between.forEach(function (block) {
          if (block.kind !== 'spacer') currentBlocks.push(block);
        });
        var subUnit = {
          kind: 'subquestion',
          part: part,
          hasSectionHeading: !!seenPartHeading[part],
          questionNumber: questionNumber,
          continuation: sequenceIndex > 0,
          blocks: currentBlocks,
          lineCount: marksByIndex[blockIndex] ? answerLineCount(marksByIndex[blockIndex]) : sharedCountsByIndex[blockIndex],
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

  function paginateExamItems(items) {
    var pages = [];
    var current = { items: [], part: '', usedCm: 0, continuationHeading: '', questionContinuation: '' };
    // Keep room for the first-page header and notice inside the same fixed frame.
    var firstPageCapacity = 18.3;
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

  function renderExamQuestion(block, result, hideMarks) {
    var question = textElement('div', 'question-row exam-question-row');
    question.appendChild(textElement('div', 'question-number', block.number ? block.number + '.' : ''));
    var body = textElement('div', 'question-body');
    appendPlainOrMath(body, block.text || '');
    question.appendChild(body);
    var marks = block.marks || (block.number != null && result.marks ?
      (result.marks[String(block.number)] || result.marks['q' + block.number]) : 0);
    question.appendChild(textElement('div', 'question-marks', !hideMarks && marks ? '(' + marks + ' 分)' : ''));
    return question;
  }

  function renderExamWritingLines(lineCount) {
    var lines = textElement('div', 'exam-writing-lines');
    lines.setAttribute('aria-label', lineCount + ' 行作答空間');
    for (var index = 0; index < lineCount; index += 1) {
      lines.appendChild(textElement('div', 'exam-writing-line'));
    }
    return lines;
  }

  function renderMultipleChoiceAnswerSheet(rows) {
    var sheet = textElement('section', 'exam-mc-answer-sheet');
    sheet.appendChild(textElement('h3', '', '多項選擇題答題紙'));
    sheet.appendChild(textElement('p', '', '請用 HB 鉛筆把正確答案的圓圈塗滿。'));
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

  function renderExamUnit(unit, result) {
    if (unit.kind === 'multipleChoiceAnswerSheet') return renderMultipleChoiceAnswerSheet(unit.rows);
    var wrapper = textElement('div', 'exam-question-unit');
    if (unit.headingBefore) {
      var headingText = unit.headingBefore.replace(/請將選項字母填在答案空格。?/, '');
      wrapper.appendChild(textElement('div', 'exam-section-heading', headingText));
    }
    (unit.blocks || []).forEach(function (block) {
      if (block.kind === 'spacer') return;
      if (block.kind === 'question') wrapper.appendChild(renderExamQuestion(block, result, !!unit.choiceRow));
      else if (block.kind === 'subquestion') {
        var withoutBlank = Object.assign({}, block, { blankCm: 0 });
        wrapper.appendChild(renderBlock(withoutBlank));
      } else wrapper.appendChild(renderBlock(block, { hideChoiceAnswer: true }));
    });
    if (unit.lineCount) wrapper.appendChild(renderExamWritingLines(unit.lineCount));
    return wrapper;
  }

  function schoolYearFor(result) {
    if (result.academicYear) return result.academicYear;
    var parts = elements.dateInput.value.split('-').map(Number);
    var startYear = parts[1] >= 9 ? parts[0] : parts[0] - 1;
    return startYear + '-' + (startYear + 1);
  }

  function renderExamPaperHeader(result) {
    var header = textElement('header', 'exam-paper-heading');
    header.appendChild(textElement('div', 'exam-paper-school', elements.schoolInput.value.trim()));
    header.appendChild(textElement('div', 'exam-paper-course', schoolYearFor(result) + '　' + result.gradeLabel + '　' + result.subject));
    header.appendChild(textElement('div', 'exam-paper-name', result.name + '（' + result.version + '）'));
    header.appendChild(textElement('div', 'exam-paper-book-title', '試題答題簿'));
    var limits = [];
    if (result.durationMinutes) limits.push('限時：' + result.durationMinutes + ' 分鐘');
    limits.push('總分：' + result.totalMarks + ' 分');
    header.appendChild(textElement('div', 'exam-paper-limits', limits.join('　')));

    var studentGrid = textElement('div', 'exam-student-grid');
    [
      ['姓名', ''],
      ['班別', ''],
      ['學號', ''],
      ['日期', elements.dateInput.value]
    ].forEach(function (field) {
      var cell = textElement('div', 'exam-student-cell');
      cell.appendChild(textElement('span', 'exam-student-label', field[0] + '：'));
      cell.appendChild(textElement('span', 'exam-student-value', field[1] || '　　　　　　　　　'));
      studentGrid.appendChild(cell);
    });
    header.appendChild(studentGrid);
    return header;
  }

  function renderExamNotice() {
    var notice = textElement('section', 'exam-candidate-notice');
    notice.appendChild(textElement('h2', '', '考生須知'));
    var list = document.createElement('ol');
    EXAM_NOTICE_TEXT.forEach(function (text) {
      var item = document.createElement('li');
      item.textContent = text;
      list.appendChild(item);
    });
    notice.appendChild(list);
    return notice;
  }

  function renderExamPaperPage(page, result, pageIndex, pageCount) {
    var section = textElement('section', 'print-page exam-page exam-format-page' + (pageIndex === 0 ? ' exam-format-page--first' : ''));
    var printableArea = textElement('div', 'exam-printable-area');
    var answerArea = textElement('div', 'exam-answer-area');
    answerArea.setAttribute('aria-label', '試題答題範圍');
    answerArea.appendChild(textElement('span', 'exam-boundary-note exam-boundary-note--left', EXAM_BOUNDARY_TEXT));
    answerArea.appendChild(textElement('span', 'exam-boundary-note exam-boundary-note--right', EXAM_BOUNDARY_TEXT));
    if (pageIndex === 0) {
      answerArea.appendChild(renderExamPaperHeader(result));
      answerArea.appendChild(renderExamNotice());
    }
    if (page.continuationHeading) answerArea.appendChild(textElement('div', 'exam-section-heading', page.continuationHeading));
    if (page.questionContinuation) answerArea.appendChild(textElement('div', 'exam-question-continuation', page.questionContinuation));
    page.items.forEach(function (unit) { answerArea.appendChild(renderExamUnit(unit, result)); });
    if (pageIndex === pageCount - 1) answerArea.appendChild(textElement('div', 'exam-end-mark', '試卷完'));
    answerArea.appendChild(textElement('span', 'exam-boundary-note exam-boundary-note--bottom', EXAM_BOUNDARY_TEXT));
    printableArea.appendChild(answerArea);

    var footer = textElement('footer', 'exam-page-footer');
    footer.appendChild(textElement('span', 'exam-page-number', '第 ' + (pageIndex + 1) + ' 頁'));
    if (pageIndex < pageCount - 1) footer.appendChild(textElement('span', 'exam-continuation', '續後頁'));
    printableArea.appendChild(footer);
    section.appendChild(printableArea);
    return section;
  }

  function buildExamPages(pages, result) {
    var layoutPages = paginateExamItems(buildExamItems(pages, result));
    return layoutPages.map(function (page, index) {
      return renderExamPaperPage(page, result, index, layoutPages.length);
    });
  }

  function makePlaceholder(message, isError) {
    var placeholder = textElement('div', 'preview-placeholder no-print', message);
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
    if (!assessment) {
      if (window.MathJax && window.MathJax.typesetClear) window.MathJax.typesetClear([elements.printRoot]);
      elements.printRoot.replaceChildren(makePlaceholder('選擇補測及版本後，這裡會顯示試卷與答案預覽。'));
      currentModule = null;
      setSelectionStatus('請先選擇補測。', false);
      updateRecommendation();
      return false;
    }
    var version = elements.versionInput.value.trim();
    if (!version) {
      elements.printRoot.replaceChildren(makePlaceholder('請輸入版本，例如 V4。', true));
      setSelectionStatus('請輸入版本。', true);
      return false;
    }
    if (!elements.dateInput.value || !elements.schoolInput.value.trim()) {
      elements.printRoot.replaceChildren(makePlaceholder('請填寫日期及學校名稱。', true));
      setSelectionStatus('日期及學校名稱不可留空。', true);
      return false;
    }
    setSelectionStatus('正在載入題目並驗算…', false);
    try {
      var loadedModule = await loadModule(assessment);
      if (epoch !== renderEpoch) return false;
      var result = loadedModule.generate(version);
      var validation = loadedModule.verify(result.version);
      if (!validation || validation.valid !== true) throw new Error('這個版本未通過驗算。');
      if (!Array.isArray(result.paperPages) || !Array.isArray(result.answerPages)) {
        throw new Error('補測模組缺少通用 A4 頁面資料。');
      }
      var paperPages = examLayout ? buildExamPages(result.paperPages, result) :
        buildPages(result.paperPages, assessment, result, false);
      var answerPages = buildPages(result.answerPages, assessment, result, true);
      if (window.MathJax && window.MathJax.typesetClear) window.MathJax.typesetClear([elements.printRoot]);
      elements.printRoot.replaceChildren.apply(elements.printRoot,
        paperPages.concat(answerPages));
      if (!window.MathJax || typeof window.MathJax.typesetPromise !== 'function') {
        elements.printRoot.replaceChildren(makePlaceholder(mathJaxFailed ?
          '數學排版未能載入；請重新載入頁面後再列印。' : '正在載入數學排版…'));
        setSelectionStatus(mathJaxFailed ? '數學排版未能載入，暫不能列印。' : '正在載入數學排版…', mathJaxFailed);
        return false;
      }
      if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) await window.MathJax.startup.promise;
      if (window.MathJax && window.MathJax.typesetPromise) await window.MathJax.typesetPromise([elements.printRoot]);
      if (epoch !== renderEpoch) return false;
      currentModule = loadedModule;
      currentResult = result;
      setPrintButtonState(true);
      setSelectionStatus('題目已驗算。試卷 ' + paperPages.length + ' 頁，答案 ' + result.answerPages.length + ' 頁。', false);
      updateRecommendation();
      return true;
    } catch (error) {
      if (epoch !== renderEpoch) return false;
      if (window.MathJax && window.MathJax.typesetClear) window.MathJax.typesetClear([elements.printRoot]);
      elements.printRoot.replaceChildren(makePlaceholder(error && error.message ? error.message : '無法生成這個版本。', true));
      currentResult = null;
      currentModule = null;
      setPrintButtonState(false);
      setSelectionStatus(error && error.message ? error.message : '無法生成這個版本。', true);
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
      schoolName: elements.schoolInput.value.trim(),
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
    document.body.dataset.printMode = category;
    setPrintLastPage(category);
    addPrintRecord(category);
    try {
      window.print();
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
      var noMatch = textElement('div', 'suggestion-option', '未找到學校名稱；可保留或自行輸入。');
      box.appendChild(noMatch);
      box.hidden = false;
      return;
    }
    matches.forEach(function (school) {
      var option = textElement('button', 'suggestion-option');
      option.type = 'button';
      option.setAttribute('role', 'option');
      option.dataset.schoolZh = school.zh;
      option.appendChild(textElement('strong', '', school.zh));
      option.appendChild(textElement('span', '', school.en));
      box.appendChild(option);
    });
    box.hidden = false;
  }

  function hideSuggestions() { elements.schoolSuggestions.hidden = true; }

  function restoreFocus(target) {
    elements.assessmentSelect.value = target;
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
        element.textContent = '登入狀態缺少帳戶識別；補測照常使用，列印記錄保存在本機。';
        return;
      }
      activateHistoryUser(uid);
      var syncPromise = syncHistoryForUser(uid);
      if (syncedHistoryUids[uid]) {
        element.textContent = '已登入；列印記錄已同步到此帳戶，可在其他裝置繼續。';
      } else {
        element.textContent = '登入同步中；本機列印記錄會合併到此帳戶。';
      }
      syncPromise.then(function (success) {
        if (activeHistoryUid !== uid) return;
        if (success) element.textContent = '已登入；列印記錄已同步到此帳戶，可在其他裝置繼續。';
        else showCloudHistoryFallback(uid);
      });
    } else if (state.state === 'unavailable') {
      deactivateHistoryUser();
      element.textContent = '登入服務暫不可用；補測照常免登入使用，列印記錄保存在此瀏覽器。';
    } else {
      deactivateHistoryUser();
      element.textContent = '訪客可完整使用；列印記錄保存在此瀏覽器。';
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
      status.textContent = '學校名單未能載入；仍可手動輸入任何名稱。';
      elements.schoolInput.parentNode.appendChild(status);
    }
  }

  function bindEvents() {
    elements.assessmentSelect.addEventListener('change', function () {
      updateRecommendation();
      var assessmentId = elements.assessmentSelect.value;
      updateVersionHelp(assessmentId);
      if (assessmentId) elements.versionInput.value = recommendationFor(assessmentId);
      refreshPreview();
    });
    elements.dateInput.addEventListener('change', refreshPreview);
    elements.versionInput.addEventListener('input', refreshPreview);
    elements.layoutSelect.addEventListener('change', refreshPreview);
    elements.newVersionButton.addEventListener('click', function () { generateAnotherVersion(); });
    elements.schoolInput.addEventListener('input', function () {
      renderSuggestions(elements.schoolInput.value);
      refreshPreview();
    });
    elements.schoolInput.addEventListener('focus', function () {
      renderSuggestions(elements.schoolInput.value);
    });
    elements.schoolSuggestions.addEventListener('mousedown', function (event) {
      if (event.target.closest('button')) event.preventDefault();
    });
    elements.schoolSuggestions.addEventListener('click', function (event) {
      var option = event.target.closest('[data-school-zh]');
      if (!option) return;
      elements.schoolInput.value = option.dataset.schoolZh;
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
      elements.recordMode.textContent = '登入狀態載入中；補測可免登入使用，列印記錄保存在此瀏覽器。';
      window.addEventListener('auth-state-ready', function () {
        Promise.resolve().then(function () {
          if (!bindAuthState()) {
            elements.recordMode.textContent = '登入狀態無法讀取；補測照常免登入使用，列印記錄保存在此瀏覽器。';
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
      catalogS1: 'catalog-s1', catalogS4: 'catalog-s4', assessmentSelect: 'assessment-select',
      dateInput: 'date-input', versionInput: 'version-input', versionHelp: 'version-help', layoutSelect: 'layout-select',
      schoolInput: 'school-input', newVersionButton: 'new-version-button', previewSection: 'preview-section',
      schoolSuggestions: 'school-suggestions', nextVersion: 'next-version',
      selectionStatus: 'selection-status', printRoot: 'print-root', historyList: 'history-list',
      historyEmpty: 'history-empty', generator: 'generator', recordMode: 'record-mode'
    };
    Object.keys(elementIds).forEach(function (key) { elements[key] = byId(elementIds[key]); });
    elements.dateInput.value = localDateValue();
    elements.schoolInput.value = SCHOOL_DEFAULT;
    renderCatalog();
    renderHistory();
    updateVersionHelp('');
    bindEvents();
    loadSchools();
    if (window.AuthState && typeof window.AuthState.whenReady === 'function') {
      window.AuthState.whenReady().then(setAuthRecordMode).catch(function () {});
    }
    setPrintButtonState(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
