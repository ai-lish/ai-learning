#!/usr/bin/env python3
import re, json, os

BASE = "/Users/zachli/ai-learning"

def parse_options(text):
    if not text:
        return {"question": "", "options": {"A":"","B":"","C":"","D":""}}
    parts = re.split(r'(?=\n?[ABCD]\.\s*)', text)
    question_text = parts[0].strip() if parts else text
    options = {"A":"","B":"","C":"","D":""}
    for part in parts[1:]:
        part = part.strip()
        m = re.match(r'^([ABCD])\.\s*(.*)', part, re.DOTALL)
        if m:
            options[m.group(1)] = re.sub(r'\n+', ' ', m.group(2).strip())
    return {"question": question_text, "options": options}

def smart_parse_questions(raw_text, answers_dict):
    lines = raw_text.split('\n')
    questions = []
    current_q = None
    current_lines = []
    
    skip_patterns = [
        r'^2425', r'^中[三四五]級', r'^中華聖潔會', r'^試卷[二三]',
        r'^考生須知', r'^姓名', r'^班別', r'^學號', r'^日期', r'^時限',
        r'^頁數', r'^任教老師', r'^總分', r'^時間', r'^\s*$',
        r'^嘉駿老師', r'^鈺霞老師', r'^沛權老師', r'^慧敏老師',
        r'^Tam Sir', r'^Winsome', r'^Ling Ling', r'^Kennis',
        r'^頁\d+', r'^第[一二三]頁',
    ]
    
    def should_skip(line):
        s = line.strip()
        if not s: return True
        for p in skip_patterns:
            if re.search(p, s): return True
        return False
    
    current_section = '甲'
    for line in lines:
        line = line.rstrip()
        if '丙部' in line: current_section = '丙'
        elif '乙部' in line: current_section = '乙'
        if should_skip(line): continue
        m = re.match(r'^(\d+)\.\s*(.*)', line)
        if m:
            if current_q is not None:
                qtext = '\n'.join(current_lines).strip()
                parsed = parse_options(qtext)
                qnum = int(re.search(r'\d+', current_q).group())
                if 1 <= qnum <= 60:
                    questions.append({
                        "id": current_q,
                        "section": current_section,
                        "question": parsed["question"],
                        "options": parsed["options"],
                        "answer": answers_dict.get(current_q, ""),
                    })
            current_q = "Q%d" % int(m.group(1))
            rest = m.group(2).strip()
            current_lines = [rest] if rest else []
        elif current_q is not None:
            current_lines.append(line)
    
    if current_q is not None:
        qtext = '\n'.join(current_lines).strip()
        parsed = parse_options(qtext)
        qnum = int(re.search(r'\d+', current_q).group())
        if 1 <= qnum <= 60:
            questions.append({
                "id": current_q,
                "section": current_section,
                "question": parsed["question"],
                "options": parsed["options"],
                "answer": answers_dict.get(current_q, ""),
            })
    return questions


def build_js(questions_json_str, exam_title, paper_name, repo_file, data_subdir):
    # Build JS without any Python string formatting issues
    lines = [
        '    <script>',
        '        var embeddedData = ' + questions_json_str + ';',
        '        var allQuestions = [];',
        '        var currentIndex = 0;',
        '        var isEditMode = true;',
        '',
        '        async function loadData() {',
        '            try {',
        '                var resp = await fetch("" + data_subdir + "/questions.json");',
        '                if (resp.ok) {',
        '                    var jsonData = await resp.json();',
        '                    allQuestions = Object.entries(jsonData).map(function(entry) {',
        '                        var id = entry[0];',
        '                        var item = entry[1];',
        '                        return {',
        '                            id: id,',
        '                            section: item.section || "",',
        '                            question: item.text || item.question || "",',
        '                            options: item.options || { A:"",B:"",C:"",D:"" },',
        '                            answer: item.answer || "",',
        '                            verified: item.verified || false',
        '                        };',
        '                    });',
        '                    console.log("Loaded from data/questions.json:", allQuestions.length);',
        '                } else {',
        '                    loadEmbeddedData();',
        '                }',
        '            } catch(e) {',
        '                console.log("Using embedded data:", e.message);',
        '                loadEmbeddedData();',
        '            }',
        '            var saved = localStorage.getItem("review_local_' + paper_name + '");',
        '            if (saved) {',
        '                try {',
        '                    var savedData = JSON.parse(saved);',
        '                    savedData.forEach(function(s) {',
        '                        var idx = allQuestions.findIndex(function(q) { return q.id === s.id; });',
        '                        if (idx !== -1) Object.assign(allQuestions[idx], s);',
        '                    });',
        '                } catch(e) {}',
        '            }',
        '            populateFilters();',
        '            renderQuestion();',
        '            updateStats();',
        '        }',
        '',
        '        function loadEmbeddedData() {',
        '            var data = embeddedData;',
        '            allQuestions = Object.entries(data).map(function(entry) {',
        '                var id = entry[0];',
        '                var item = entry[1];',
        '                return {',
        '                    id: id,',
        '                    section: item.section || "",',
        '                    question: item.text || item.question || "",',
        '                    options: item.options || { A:"",B:"",C:"",D:"" },',
        '                    answer: item.answer || "",',
        '                    verified: item.verified || false',
        '                };',
        '            });',
        '            console.log("Using embedded data:", allQuestions.length);',
        '        }',
        '',
        '        function populateFilters() {}',
        '',
        '        function filterQuestions() {',
        '            var section = document.getElementById("sectionFilter").value;',
        '            return allQuestions.filter(function(q) {',
        '                if (section !== "all" && q.section !== section) return false;',
        '                return true;',
        '            });',
        '        }',
        '',
        '        function updateStats() {',
        '            var filtered = filterQuestions();',
        '            var verified = filtered.filter(function(q) { return q.verified; }).length;',
        '            document.getElementById("stats").textContent = " ' + "\u202d" + '總題數: " + filtered.length + " | 已確認: " + verified;',
        '        }',
        '',
        '        function escapeHtml(text) {',
        '            if (!text) return "";',
        '            return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");',
        '        }',
        '',
        '        function renderQuestion() {',
        '            var filtered = filterQuestions();',
        '            if (filtered.length === 0) {',
        '                document.getElementById("questionsContainer").innerHTML = "<p style=\'text-align:center;padding:50px;\'>沒有符合條件的題目</p>";',
        '                return;',
        '            }',
        '            if (currentIndex >= filtered.length) currentIndex = filtered.length - 1;',
        '            if (currentIndex < 0) currentIndex = 0;',
        '            var q = filtered[currentIndex];',
        '            var modeClass = isEditMode ? "edit-mode" : "preview-mode";',
        '            var html = "<div class=\'question-card " + modeClass + "\'>";',
        '            html += "<div class=\'question-header\'><div><span class=\'q-id\'>" + escapeHtml(q.id) + "</span>";',
        '            html += "<span class=\'q-meta\'> | 第" + escapeHtml(q.section) + "部</span></div>";',
        '            if (q.verified) html += "<span class=\'verified-badge\'>✓ 已確認</span>";',
        '            html += "</div><div class=\'question-body\'>";',
        '            html += "<div class=\'data-note\'>📄 數據：data/questions.json（主 agent 生成）| 臨時：HTML 內嵌</div>";',
        '            html += "<div class=\'question-text\'><strong>題目：</strong><br>";',
        '            if (isEditMode) {',
        '                html += "<textarea id=\'questionText\' style=\'width:100%;min-height:80px;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;line-height:1.6;\' onchange=\\" + "updateQuestion(\'" + q.id + "\',\'question\',this.value)">" + escapeHtml(q.question || "") + "<\/textarea>";',
        '            } else {',
        '                html += "<div>" + escapeHtml(q.question || "") + "<\/div>";',
        '            }',
        '            html += "<\/div>";',
        '            html += "<div class=\'options-container\'>";',
        '            ["A", "B", "C", "D"].forEach(function(opt) {',
        '                var isCorrect = q.answer === opt && !isEditMode;',
        '                html += "<div class=\'option-item" + (isCorrect ? " correct" : "") + "\'>";',
        '                html += "<div class=\'option-label\'>" + opt + "<\/div>";',
        '                if (isEditMode) {',
        '                    html += "<textarea id=\'option" + opt + "\' onchange=\\" + "updateQuestion(\'" + q.id + "\',\'option" + opt + "\',this.value)">" + escapeHtml(q.options[opt] || "") + "<\/textarea>";',
        '                } else {',
        '                    html += "<div style=\'flex:1;\'>" + escapeHtml(q.options[opt] || "") + "<\/div>";',
        '                }',
        '                html += "<\/div>";',
        '            });',
        '            html += "<\/div>";',
        '            html += "<div class=\'answer-section\'><label>答案：</label>";',
        '            if (isEditMode) {',
        '                html += "<select id=\'answerSelect\' onchange=\\" + "updateQuestion(\'" + q.id + "\',\'answer\',this.value)">";',
        '                html += "<option value=\'\'>請選擇</option>";',
        '                ["A", "B", "C", "D"].forEach(function(o) {',
        '                    html += "<option value=\'"+o+"\'" + (q.answer === o ? " selected" : "") + ">"+o+"<\/option>";',
        '                });',
        '                html += "<\/select>";',
        '            } else {',
        '                html += "<strong>" + (q.answer || "未設定") + "<\/strong>";',
        '            }',
        '            html += "<\/div>";',
        '            html += "<div class=\'status-row\'><label><input type=\'checkbox\'" + (q.verified ? " checked" : "") + " onchange=\\" + "updateQuestion(\'" + q.id + "\',\'verified\',this.checked)>確認正確 ✓</label></div>";',
        '            html += "<div class=\'nav-buttons\'>";',
        '            html += "<button class=\'prev\' onclick=\'prevQuestion()\'>⬆ 上一題</button>";',
        '            html += "<button class=\'next\' onclick=\'nextQuestion()\'>⬇ 下一題 (" + (currentIndex + 1) + "/" + filtered.length + ")</button>";',
        '            html += "<\/div><\/div><\/div>";',
        '            document.getElementById("questionsContainer").innerHTML = html;',
        '            if (window.MathJax && window.MathJax.typesetPromise) {',
        '                MathJax.typesetPromise().catch(function(e) {});',
        '            }',
        '            var indicator = document.getElementById("modeIndicator");',
        '            indicator.textContent = isEditMode ? "📝 編輯模式" : "👁️ 預覽模式";',
        '            indicator.className = "mode-indicator " + (isEditMode ? "edit-mode" : "preview-mode");',
        '        }',
        '',
        '        function toggleMode() { isEditMode = !isEditMode; renderQuestion(); }',
        '',
        '        function updateQuestion(id, field, value) {',
        '            var q = allQuestions.find(function(q) { return q.id === id; });',
        '            if (!q) return;',
        '            if (field === "question") q.question = value;',
        '            else if (field.startsWith("option")) { var opt = field.replace("option", ""); q.options[opt] = value; }',
        '            else if (field === "answer") q.answer = value;',
        '            else if (field === "verified") q.verified = value;',
        '            q.edited = true;',
        '            saveToLocalStorage();',
        '            if (isEditMode && field !== "answer" && field !== "verified") return;',
        '            renderQuestion();',
        '        }',
        '',
        '        function showToast(msg) {',
        '            var toast = document.getElementById("toast");',
        '            toast.textContent = msg || "✓ 已保存";',
        '            toast.classList.add("show");',
        '            setTimeout(function() { toast.classList.remove("show"); }, 2000);',
        '        }',
        '',
        '        function saveToLocalStorage() {',
        '            var toSave = allQuestions.filter(function(q) {',
        '                return q.edited || q.verified || q.answer || Object.values(q.options).some(function(v) { return v; });',
        '            }).map(function(q) {',
        '                return { id: q.id, verified: q.verified, options: q.options, answer: q.answer, question: q.question, edited: q.edited };',
        '            });',
        '            localStorage.setItem("review_local_' + paper_name + '", JSON.stringify(toSave));',
        '            showToast("✓ 已保存");',
        '        }',
        '',
        '        function prevQuestion() { currentIndex = Math.max(0, currentIndex - 1); renderQuestion(); }',
        '        function nextQuestion() { var f = filterQuestions(); currentIndex = Math.min(f.length - 1, currentIndex + 1); renderQuestion(); }',
        '',
        '        function exportData() {',
        '            var data = { export_date: new Date().toISOString(), total: allQuestions.length, questions: allQuestions.map(function(q) {',
        '                return { id: q.id, section: q.section, question: q.question, options: q.options, answer: q.answer, verified: q.verified };',
        '            })};',
        '            var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });',
        '            var a = document.createElement("a");',
        '            a.href = URL.createObjectURL(blob);',
        '            a.download = "' + paper_name + '_" + new Date().toISOString().split("T")[0] + ".json";',
        '            a.click();',
        '        }',
        '',
        '        async function syncToGitHub() {',
        '            var token = document.getElementById("ghToken").value.trim();',
        '            if (!token) { alert("請先輸入 GitHub Token！"); return; }',
        '            var verified = allQuestions.filter(function(q) { return q.verified; });',
        '            if (verified.length === 0) { alert("目前沒有已驗證的題目！"); return; }',
        '            var payload = {',
        '                description: "' + exam_title + ' - verified questions",',
        '                version: "1.0",',
        '                last_sync: new Date().toISOString(),',
        '                verified_count: verified.length,',
        '                verified_questions: {}',
        '            };',
        '            verified.forEach(function(q) {',
        '                payload.verified_questions[q.id] = { verified: true, verified_at: new Date().toISOString(), question: q.question, options: q.options, answer: q.answer };',
        '            });',
        '            var content = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));',
        '            var repoFile = "' + repo_file + '";',
        '            try {',
        '                var response = await fetch("https://api.github.com/repos/ai-lish/ai-learning/contents/" + repoFile, {',
        '                    method: "GET",',
        '                    headers: { "Authorization": "token " + token, "Accept": "application/vnd.github.v3+json" }',
        '                });',
        '                var sha = null;',
        '                if (response.ok) { var existing = await response.json(); sha = existing.sha; }',
        '                var putResponse = await fetch("https://api.github.com/repos/ai-lish/ai-learning/contents/" + repoFile, {',
        '                    method: "PUT",',
        '                    headers: { "Authorization": "token " + token, "Accept": "application/vnd.github.v3+json", "Content-Type": "application/json" },',
        '                    body: JSON.stringify({ message: "Sync: ' + exam_title + ' " + verified.length + " items", content: content, sha: sha })',
        '                });',
        '                if (putResponse.ok) {',
        '                    alert("✅ 已同步 " + verified.length + " 題到 GitHub！");',
        '                    showToast("☁️ 已同步！");',
        '                } else {',
        '                    var err = await putResponse.json();',
        '                    alert("同步失敗：" + (err.message || "未知錯誤"));',
        '                }',
        '            } catch(e) { alert("同步失敗：" + e.message); }',
        '        }',
        '',
        '        document.getElementById("sectionFilter").addEventListener("change", function() { currentIndex = 0; renderQuestion(); updateStats(); });',
        '        document.addEventListener("keydown", function(e) {',
        '            if (e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;',
        '            if (e.key === "ArrowUp") prevQuestion();',
        '            if (e.key === "ArrowDown") nextQuestion();',
        '        });',
        '        loadData();',
        '    </script>',
    ]
    return '\n'.join(lines)


def generate_review_html(questions, exam_title, paper_name, output_path, nav_links):
    sections = sorted(set(q["section"] for q in questions))
    
    nav_html = '\n            '.join(
        '<button onclick="window.open(\'%s\', \'_blank\')" style="background:#95a5a6;color:white;border:none;padding:8px 15px;border-radius:5px;cursor:pointer;font-size:13px;">%s</button>' % (url, label)
        for label, url in nav_links.items()
    )
    
    questions_json = {}
    for q in questions:
        qid = q["id"]
        questions_json[qid] = {
            "text": q["question"],
            "options": q["options"],
            "answer": q["answer"],
            "section": q["section"],
            "verified": False
        }
    
    questions_json_str = json.dumps(questions_json, ensure_ascii=False)
    
    section_opts = ''.join('<option value="%s">第%s部</option>' % (s, s) for s in sections)
    
    # Data dir per paper
    data_dir_map = {
        "s3p2": "paper2_data",
        "s3p3": "paper3_data",
        "s5p2": "paper2_data",
    }
    data_subdir = data_dir_map.get(paper_name, "data")
    
    repo_map = {
        "s3p2": "exam/2025-26-s3-term3/paper2_data/verified.json",
        "s3p3": "exam/2025-26-s3-term3/paper3_data/verified.json",
        "s5p2": "exam/2025-26-s5-term3/paper2_data/verified.json"
    }
    repo_file = repo_map.get(paper_name, "review_verified.json")
    
    css = """
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Noto Sans TC', sans-serif; background: #f5f5f5; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 15px; margin-bottom: 20px; }
        .header h1 { font-size: 22px; margin-bottom: 10px; }
        .toolbar { background: white; padding: 15px; border-radius: 10px; margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .toolbar select, .toolbar button { padding: 8px 15px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; }
        .toolbar button { background: #667eea; color: white; cursor: pointer; border: none; }
        .toolbar button:hover { background: #5568d3; }
        .mode-indicator { padding: 8px 15px; background: #e0e0e0; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .mode-indicator.edit-mode { background: #fff3cd; color: #856404; }
        .mode-indicator.preview-mode { background: #d4edda; color: #155724; }
        .question-card { background: white; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden; }
        .question-header { background: #34495e; color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
        .question-header .q-id { font-size: 18px; font-weight: bold; }
        .question-header .q-meta { font-size: 14px; opacity: 0.9; }
        .question-body { padding: 20px; }
        .question-text { background: #f8f9fa; border-radius: 10px; padding: 15px; margin-bottom: 15px; font-size: 15px; line-height: 1.8; }
        .options-container { display: grid; gap: 10px; margin-bottom: 15px; }
        .option-item { display: flex; gap: 10px; align-items: flex-start; }
        .option-label { min-width: 30px; height: 30px; background: #667eea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; }
        .edit-mode .option-item textarea { flex: 1; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; line-height: 1.6; resize: vertical; min-height: 60px; font-family: inherit; }
        .edit-mode .option-item textarea:focus { border-color: #667eea; outline: none; }
        .preview-mode .option-item { background: #f8f9fa; padding: 12px 15px; border-radius: 8px; border-left: 4px solid #667eea; }
        .preview-mode .option-item.correct { background: #d4edda; border-left-color: #27ae60; }
        .answer-section { background: #fff3cd; border: 2px solid #ffc107; border-radius: 10px; padding: 15px; margin-bottom: 15px; }
        .answer-section label { font-weight: bold; margin-right: 10px; }
        .status-row { display: flex; gap: 15px; margin-top: 15px; flex-wrap: wrap; }
        .status-row label { display: flex; align-items: center; gap: 5px; cursor: pointer; }
        .status-row input[type="checkbox"] { width: 18px; height: 18px; }
        .verified-badge { background: #27ae60; color: white; padding: 3px 10px; border-radius: 3px; font-size: 12px; }
        .nav-buttons { display: flex; gap: 10px; margin-top: 15px; }
        .nav-buttons button { padding: 8px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; }
        .nav-buttons .prev { background: #e0e0e0; }
        .nav-buttons .next { background: #667eea; color: white; }
        .toast { position: fixed; top: 20px; right: 20px; background: #27ae60; color: white; padding: 15px 20px; border-radius: 8px; font-size: 14px; opacity: 0; transition: opacity 0.3s; z-index: 1000; }
        .toast.show { opacity: 1; }
        .data-note { background: #e8f4f8; border: 1px solid #17a2b8; border-radius: 8px; padding: 10px 15px; margin-bottom: 15px; font-size: 12px; color: #17a2b8; }
        @media (max-width: 768px) { .options-container { grid-template-columns: 1fr; } }
    </style>"""
    
    toolbar_select = """
        <select id="sectionFilter">
            <option value="all">全部部門</option>
            %s
        </select>""" % section_opts
    
    html_parts = [
        '<!DOCTYPE html>',
        '<html lang="zh-HK">',
        '<head>',
        '    <meta charset="UTF-8">',
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '    <title>' + exam_title + '</title>',
        '    <script>',
        '        window.MathJax = {',
        '            tex: { inlineMath: [["$", "$"], ["\\\\(", "\\\\)"]] },',
        '            startup: { typeset: false }',
        '        };',
        '    </script>',
        '    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js" async crossorigin="anonymous"></script>',
        css,
        '</head>',
        '<body>',
        '    <div class="toast" id="toast">\u2713 已保存</div>',
        '    <div class="header">',
        '        <h1>\U0001f4da ' + exam_title + '</h1>',
        '        <div id="stats"></div>',
        '    </div>',
        '    <div class="toolbar">',
        toolbar_select,
        '        <span class="mode-indicator edit-mode" id="modeIndicator">\U0001f4dd 編輯模式</span>',
        '        <button onclick="toggleMode()">\U0001f504 切換模式</button>',
        '        <button onclick="exportData()">\U0001f4be 匯出 JSON</button>',
        '        <button onclick="syncToGitHub()" style="background:#27ae60;color:white;">\u2601\ufe0f 同步到 GitHub</button>',
        '        <input type="password" id="ghToken" placeholder="GitHub Token" style="width:120px;font-size:11px;" title="GitHub PAT">',
        '            ' + nav_html,
        '        <button class="prev" onclick="prevQuestion()">\u2b06 \u4e0a\u4e00\u984e</button>',
        '        <button class="next" onclick="nextQuestion()">\u2b07 \u4e0b\u4e00\u984e</button>',
        '    </div>',
        '    <div id="questionsContainer"></div>',
        build_js(questions_json_str, exam_title, paper_name, repo_file, data_subdir),
        '</body>',
        '</html>',
    ]
    
    html = '\n'.join(html_parts)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        f.write(html)
    print("Written: %s" % output_path)
    
    data_dir = os.path.join(os.path.dirname(output_path), data_subdir)
    os.makedirs(data_dir, exist_ok=True)
    json_path = os.path.join(data_dir, 'questions.json')
    with open(json_path, 'w') as f:
        json.dump(questions_json, f, ensure_ascii=False, indent=2)
    print("Written: %s" % json_path)
    
    return len(questions)


# ======================== Main ========================
with open(BASE + "/exam/2025-26-s3-term3/paper2.txt") as f:
    s3p2_raw = f.read()
with open(BASE + "/exam/2025-26-s3-term3/paper3.txt") as f:
    s3p3_raw = f.read()
with open(BASE + "/exam/2025-26-s5-term3/paper2.txt") as f:
    s5p2_raw = f.read()

s3_p2_answers = {
    "Q1":"B","Q2":"C","Q3":"B","Q4":"C","Q5":"A","Q6":"B","Q7":"C","Q8":"C",
    "Q9":"C","Q10":"B","Q11":"D","Q12":"C","Q13":"D","Q14":"A","Q15":"C",
    "Q16":"B","Q17":"A","Q18":"A","Q19":"B","Q20":"B","Q21":"B",
    "Q22":"A","Q23":"C","Q24":"A","Q25":"B","Q26":"C","Q27":"C","Q28":"D","Q29":"C","Q30":"A"
}
s3_p3_answers = {}
s5_p2_answers = {
    "Q1":"A","Q2":"A","Q3":"B","Q4":"C","Q5":"D","Q6":"D","Q7":"A","Q8":"B",
    "Q9":"C","Q10":"C","Q11":"C","Q12":"D","Q13":"A","Q14":"B","Q15":"A",
    "Q16":"B","Q17":"B","Q18":"C","Q19":"C","Q20":"B","Q21":"D","Q22":"A",
    "Q23":"C","Q24":"D","Q25":"B","Q26":"D","Q27":"B","Q28":"B","Q29":"A","Q30":"D",
    "Q31":"A","Q32":"D","Q33":"C","Q34":"D","Q35":"C","Q36":"C","Q37":"B","Q38":"C",
    "Q39":"D","Q40":"B","Q41":"C","Q42":"C","Q43":"D","Q44":"B","Q45":"C"
}

s3p2_qs = smart_parse_questions(s3p2_raw, s3_p2_answers)
s3p3_qs = smart_parse_questions(s3p3_raw, s3_p3_answers)
s5p2_qs = smart_parse_questions(s5p2_raw, s5_p2_answers)

print("S3 P2: %d questions" % len(s3p2_qs))
print("S3 P3: %d questions" % len(s3p3_qs))
print("S5 P2: %d questions" % len(s5p2_qs))

generate_review_html(
    s3p2_qs,
    "中三級 第三學期 卷二 OCR 審核系統",
    "s3p2",
    BASE + "/exam/2025-26-s3-term3/review.html",
    {
        "\U0001f4ca HKDSE P2": "../hkdse/pages/review_p2.html",
        "\U0001f4ca S5 P2 卷二": "../../2025-26-s5-term3/review.html",
    }
)

generate_review_html(
    s3p3_qs,
    "中三級 第三學期 卷三 OCR 審核系統",
    "s3p3",
    BASE + "/exam/2025-26-s3-term3/review_p3.html",
    {
        "\U0001f4ca S3 P2 卷二": "review.html",
        "\U0001f4ca S5 P2 卷二": "../../2025-26-s5-term3/review.html",
    }
)

generate_review_html(
    s5p2_qs,
    "中五級 第三學期 卷二 OCR 審核系統",
    "s5p2",
    BASE + "/exam/2025-26-s5-term3/review.html",
    {
        "\U0001f4ca HKDSE P2": "../../hkdse/pages/review_p2.html",
        "\U0001f4ca S3 P3 卷三": "../../2025-26-s3-term3/review_p3.html",
    }
)

print("\n✅ All review pages generated!")
