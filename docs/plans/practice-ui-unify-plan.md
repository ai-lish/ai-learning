# 練習介面一致化規劃書

## 文件資料、基準更正與盤點方法

- 盤點 repo：ai-lish/ai-learning。
- 本次實際讀取的 main HEAD：2855298a01008f8d64b33ecf217fb90a49ffee9d。
- 上一份規劃書記錄的讀取 commit：6df9a7b7a336bef08f91426b3d6ffdc95b9cb36。該 commit 不在 ai-lish/ai-learning 的公開 remote，不能作為本次基準。
- 本次以 GitHub main 分支 tree、各頁原始 HTML、頁內 script、外部 script／CSS 作唯讀靜態盤點；沒有把靜態讀碼描述成瀏覽器功能測試。
- 盤點時工作樹另有三個與本規劃無關的未提交修改：S1Ch1.html、games/M2Ch1-CountingGame.html、games/M2Ch1-SummationNotationTest.html。本規劃沒有修改或採用它們的差異。
- 標記定義：[V] 純視覺差異；[F] 操作流程差異；[D] 判分、題目資料、分數或本機紀錄差異。

### 基準更正

1. 上版把只在本地工作樹或其他分支出現的 S1Ch4 至 S1Ch13、S4Ch2、S4Ch3 系列根頁當作可遷移頁面。本次確認它們不在 main，全部改列「待確認」，不列入本次 main 遷移清單。
2. main 實際存在而上版漏列的頁面包括 S1Ch3Ex1.html、S1Ch3Ex2.html、S4Ch1GraphicalMethod.html；本次加入盤點及遷移清單。
3. main 的 S1Ch1.html practice panel 實際有四個入口：S1Ch1HcfLcm.html、S1Ch1Operations.html、S1Ch1Divisibility.html、games/S1Ch1-1-PrimeFactor.html。
4. main 的 S4Ch1.html practice panel 實際只有三張卡：S4Ch1NumberSets.html、S4Ch1QuadraticEquations.html、S4Ch1GraphicalMethod.html。S4Ch1RealNumbers.html 及 S4Ch1ComplexNumbers.html 不在 main。
5. main 的 S4Ch1NumberSets.html 有五個 mode，包含 factorization；上版四 mode 的描述已更正。
6. main 的 S4Ch1QuadraticEquations.html 使用動態 step-input-list，並有 records、CSV／JSON 及三種列印入口；上版較舊的描述已更正。
7. 本節只修訂盤點範圍、頁面存在性及頁數；方案 A、B、C 的介面統一方向不因基準更正而改變。

## Part 1：現況盤點

## A. 盤點清單

### A1. main 存在的 S1 根頁練習 tab

| 頁面 | main | 練習 tab DOM／題型／流程 | 回饋、詳解、重做、下一題、進度、分數 | 判分、CSS、儲存、隨機 |
|---|---|---|---|---|
| S1Ch1.html | 是 | .main-tabs 的 #tab-practice；#panel-practice 有 practice-card-list 四張入口卡；另有 #quiz-form 固定 8 題 radio 小測及 quick tools。 | 入口卡沒有作答；#quiz-check 後由 #quiz-score 及每題結果顯示；#quiz-reset 重設；沒有逐題下一題或隨機進度。 | #quiz-form data-answer 與 #quiz-check 監聽器；頁內 style；無 localStorage、無 random。 |
| S1Ch2.html | 是 | .main-tabs 的 #tab-practice／#practice-panel；.practice-layout、.quiz-card、#quiz-question、#quiz-choices；六題選擇題。 | #quiz-feedback 即時解釋；#quiz-next、#quiz-reset；#quiz-progress、#quiz-score、#quiz-streak；沒有獨立詳解面板。 | startQuiz、renderQuestion、answerQuestion；頁內 style；無 localStorage；questionBank shuffle 使用 Math.random。 |
| S1Ch3.html | 是 | #practice-panel；.practice-layout、.quiz-card、#quiz-scope-label、#quiz-question、#quiz-choices；scope buttons all、3.1、3.2、3.3。 | #quiz-feedback、#quiz-next、#quiz-reset；#quiz-progress、#quiz-score、#quiz-streak；沒有 localStorage。 | setQuizScope、startQuiz、renderQuestion、answerQuestion；頁內 style、MathJax；randomInt／randomNonZeroInt 生成題目。 |

### A2. main 存在且由 S1 練習 tab 連到的頁面

| 頁面 | main | DOM、題型與操作 | 回饋／詳解／重做／下一題／進度／分數 | 判分／CSS／儲存／隨機 |
|---|---|---|---|---|
| S1Ch1HcfLcm.html | 是 | .app、[data-view]、#practice-view、.game.card、#practice-prompt、#practice-choices；H.C.F./L.C.M. 四選一，另有 challenge。 | #practice-feedback 顯示正誤、分解及答案；#practice-next、#practice-finish、#practice-restart；round、score、correct、wrong、accuracy；challenge 有 best。 | 共用 s1/ch1-practice.js：renderPractice、answerPractice、finishPractice、startChallenge；外部 s1/ch1-practice.css；localStorage s1ch1.learning.v1；pick random。 |
| S1Ch1Operations.html | 是 | .operations-app、#stage-list、#question-progress、#question-formula、#answer-input、#submit-answer、keypad、#feedback；整數、小數、分數輸入及 standard／infinite／60 秒 challenge。 | submit 後即時 feedback；#next-question、#finish-session；階段統計、challenge 計時、分數、CSV／JSON 匯出。 | parseAnswer、sameFraction、submitCurrentAnswer、next、finishSession、startChallenge；外部 operations-game.css/js；localStorage s1ch1.operations.game.v1；部分題型 random。 |
| S1Ch1Divisibility.html | 是 | 與 HcfLcm 共用 .app、#practice-view、#practice-choices；整除性四選一及 challenge／guide。 | 即時答案與解釋；next、finish、restart、challenge、record export；round／score／accuracy。 | 共用 ch1-practice.js 的 answerPractice 等；外部 CSS/JS；localStorage s1ch1.learning.v1；pick random。 |
| games/S1Ch1-1-PrimeFactor.html | 是 | canvas、遊戲 HUD、#final-score、#restart-button；點選數字／質因數遊戲。 | 即時遊戲結果、wave review、終局分數及 restart；沒有傳統提交、逐題詳解或下一題。 | getPrimeFactorization、generateNewNumbers、handlePlayerClick、endGame、startGame；單檔 inline CSS/JS；無 localStorage；random。 |
| games/S1Ch2-1-DirectedNumber.html | 是 | LV1–9 selector；#mc-options-area、#btn-mc-confirm、#mc-feedback；高 LV 使用 calculator／virtual keypad。 | submitMC、submitCalc、handleResult、nextQuestion；顯示 LV、題號、分數、正誤及提示；有 print worksheet。 | generateQuestion、prepareQ、submitMC、submitCalc；單檔 inline CSS/JS、MathJax；無 localStorage；random。 |
| s1/selfstudy/chapter-2-quiz.html | 是 | #progressText、#progressFill、#questionArea、#answerInput、#btnCheck、#feedback；文字輸入 quiz。 | checkAnswer 後 showResult，約 1.2 秒自動下一題；結果頁 retry／回首頁；有 progress，沒有分數卡。 | normalizeAnswer、buildQuiz、renderQuestion、checkAnswer；外部 CSS 加頁內 style；localStorage chapter_quiz_progress；題庫 random。 |
| S1Ch3Ex1.html | 是 | 四個 mode container；mode 2 有五步輸入框，mode 3/4 有數式輸入；#keypad-grid、#score-display、#print-worksheet-container、#score-card-modal。 | 各 mode 有進度、feedback、hint modal、reset；mode 2 逐步提交；有 score card、虛擬鍵盤及 print PDF；無 localStorage。 | checkAlgebraicEquivalence、checkSimplifiedForm、submitMode3Lines、submitCurrentActive、generateMode1Question 至 generateMode4Question；Tailwind、Font Awesome、QRCode.js CDN、頁內 style；Math.random。 |
| S1Ch3Ex2.html | 是 | 三個 mode；mode 3 有 #m3-line1-input、#m3-line2-input 及各自 status；#keypad-grid、#print-worksheet-container。 | 單行／雙行提交、即時 feedback、reset、print worksheet、score/progress；虛擬鍵盤；無 localStorage。 | switchMode、resetCurrentMode、pressKey、checkAlgebraicEquivalence、checkSimplifiedForm、submitMode3Lines、submitCurrentActive；Tailwind、Font Awesome、QRCode.js CDN、頁內 style；Math.random。 |

### A3. main 存在的 S1 其他互動頁及自學頁

| 頁面 | main | 現況摘要 |
|---|---|---|
| games/S1Ch5-1-AreaVolume.html | 是 | canvas 面積／體積數值輸入；pressKey、checkAnswer、nextQuestion；即時正誤及 score；inline、無 localStorage、random。 |
| games/S1Ch5-6-GeometryHunter.html | 是 | canvas Geometry Hunter；fire、nextMission；任務式答案及 score；inline、無 localStorage、random。 |
| games/S1Ch5-7-GeometryHunterTimed.html | 是 | 限時 Geometry Hunter；startTimer、fire、nextQuestion、endGame；timer、score、終局；inline、無 localStorage、random。 |
| games/S1Ch5-10-Area.html | 是 | canvas 面積數值輸入；pressKey、checkAnswer、nextQuestion；inline、無 localStorage、random。 |
| games/S1Ch5-11-ComplexArea.html | 是 | 複合面積任務；fire、nextMission；即時 feedback／score；inline、無 localStorage、random。 |
| games/S1Ch5-12-AreaDetective.html | 是 | 面積推理、選項及 help modal；handleAnswer；level、timer、score；inline、MathJax、無 localStorage、random。 |
| games/S1Ch5-13-AreaFormula.html | 是 | 面積公式選擇／答案；handleAnswer、endGame、nextBtn；timer、score；inline、MathJax、無 localStorage、random。 |
| games/S1Ch5-14-AreaPerimeterTimed.html | 是 | 限時面積／周界複合題；startTimer、fire、nextQuestion、endGame；inline、無 localStorage、random。 |
| games/S1Ch6-1-AlgebraLanguage.html | 是 | 三階段代數語言、輸入及排序；game.selectL1、game.checkL3、game.pickL3；inline、無 localStorage、random。 |
| games/S1Ch6-2-AlgebraAddSub.html | 是 | 代數加減計算及 timed round；submitAnswer、finalizeRound、endGame；inline、無 localStorage、random、timer。 |
| games/S1Ch6-3-Monomial.html | 是 | 單項式選項／輸入；selectOption、submitAnswer、showHint、checkCompletion；inline、無 localStorage、random。 |
| games/S1Ch6-4-AlgebraChallenge.html | 是 | Algebra Challenge 選擇／輸入分流；checkChoice、checkInputAnswer、nextQuestion；inline、無 localStorage、random。 |
| games/S1Ch8-TallyGame.html | 是 | tally／統計圖數值題；checkAnswer、nextQuestion、showFinal、resetGame；progress、答對／答錯、終局；inline、無 localStorage、random。 |
| games/S1Ch8-StemLeaf.html | 是 | 資料輸入工具；generate、generateSingle、generateBackToBack、showError；無計分 quiz、無 random、無 localStorage。 |
| games/S1Ch8-BarChart-Exercise.html | 是 | 長條圖練習頁；有自己的題目、提交及回饋外殼；需下一階段逐頁核對細節。 |
| games/S1Ch8-PieChart-Exercise.html | 是 | 圓形圖練習頁；有自己的題目、提交及回饋外殼；需下一階段逐頁核對細節。 |
| games/S1Ch8-BarPieChart.html | 是 | 長條圖／圓形圖互動頁；有自己的題目及圖表操作；需下一階段逐頁核對細節。 |
| games/S1Ch9-1-MixOpsPercent.html | 是 | 百分數混合運算互動題；逐題提交及回饋；需下一階段逐頁核對 storage/random。 |
| games/S1Ch9-2-PercentChange.html | 是 | 百分數變化互動題；逐題提交及回饋；需下一階段逐頁核對 storage/random。 |
| games/S1Ch9-3-ProfitLoss.html | 是 | 盈虧互動題；逐題提交及回饋；需下一階段逐頁核對 storage/random。 |
| games/S1Ch9-4-Discount.html | 是 | 折扣互動題；逐題提交及回饋；需下一階段逐頁核對 storage/random。 |
| games/S1Ch9-5-CostMarkupSellingPrice.html | 是 | 成本、加成、售價互動題；逐題提交及回饋；需下一階段逐頁核對 storage/random。 |
| games/S1Ch10-1-CoordinateGeometry.html | 是 | 坐標幾何互動題；逐題提交及回饋；需下一階段逐頁核對 storage/random。 |
| games/S1Ch10-3-CoordinateAdventure.html | 是 | 坐標探險遊戲；任務、score 及下一題流程；需下一階段逐頁核對 storage/random。 |
| games/S1Ch11-1-Angles.html | 是 | 角度互動題；提交、提示及分數；需下一階段逐頁核對 storage/random。 |
| games/S1Ch13-1-PlaceValue.html | 是 | 位值互動題；逐題提交及回饋；需下一階段逐頁核對 storage/random。 |
| games/S1Ch13-2-SignificantFigures.html | 是 | 有效數字互動題；逐題提交及回饋；需下一階段逐頁核對 storage/random。 |
| s1/selfstudy/chapter-1-quiz.html | 是 | S1 Ch1 自學 quiz；獨立題庫、作答及結果流程。 |
| s1/selfstudy/chapter-3-quiz.html | 是 | S1 Ch3 自學 quiz；獨立題庫、作答及結果流程。 |
| s1/selfstudy/chapter-4-quiz.html | 是 | S1 Ch4 自學 quiz；獨立題庫、作答及結果流程。 |
| s1/selfstudy/practice-01.html | 是 | 自學 practice 01；獨立題型及回饋。 |
| s1/selfstudy/practice-02.html | 是 | 自學 practice 02；獨立題型及回饋。 |
| s1/selfstudy/practice-03.html | 是 | 自學 practice 03；獨立題型及回饋。 |
| s1/selfstudy/practice-04.html | 是 | 自學 practice 04；獨立題型及回饋。 |
| s1/selfstudy/practice-05.html | 是 | 自學 practice 05；獨立題型及回饋。 |
| s1/selfstudy/practice-06.html | 是 | 自學 practice 06；獨立題型及回饋。 |
| s1/selfstudy/practice-07.html | 是 | 自學 practice 07；獨立題型及回饋。 |
| s1/selfstudy/practice-08.html | 是 | 自學 practice 08；獨立題型及回饋。 |
| s1/selfstudy/practice-09.html | 是 | 自學 practice 09；獨立題型及回饋。 |
| s1/selfstudy/practice-10.html | 是 | 自學 practice 10；獨立題型及回饋。 |
| s1/selfstudy/practice-11.html | 是 | 自學 practice 11；獨立題型及回饋。 |
| s1/selfstudy/practice-12.html | 是 | 自學 practice 12；獨立題型及回饋。 |
| s1/selfstudy/practice-13.html | 是 | 自學 practice 13；獨立題型及回饋。 |
| s1/selfstudy/practice-14.html | 是 | 自學 practice 14；獨立題型及回饋。 |
| s1/selfstudy/practice-15.html | 是 | 自學 practice 15；獨立題型及回饋。 |
| s1/selfstudy/practice-16.html | 是 | 自學 practice 16；獨立題型及回饋。 |
| s1/selfstudy/practice-17.html | 是 | 自學 practice 17；獨立題型及回饋。 |
| s1/selfstudy/practice-18.html | 是 | 自學 practice 18；獨立題型及回饋。 |
| s1/selfstudy/practice-19.html | 是 | 自學 practice 19；獨立題型及回饋。 |
| s1/selfstudy/practice-20.html | 是 | 自學 practice 20；獨立題型及回饋。 |
| s1/selfstudy/practice-21.html | 是 | 自學 practice 21；獨立題型及回饋。 |
| s1/selfstudy/practice-22.html | 是 | 自學 practice 22；獨立題型及回饋。 |
| s1/selfstudy/practice-23.html | 是 | 自學 practice 23；獨立題型及回饋。 |

### A4. main 存在的 S4 根頁及練習頁

| 頁面 | main | DOM、題型與流程 | 回饋／詳解／重做／下一題／進度／分數 | 判分／CSS／儲存／隨機 |
|---|---|---|---|---|
| S4Ch1.html | 是 | .tabs 的 #tab-practice／#practice-panel；三張 practice-card 連 NumberSets、QuadraticEquations、GraphicalMethod；另有 #quiz-list 固定 quiz。 | 根頁卡片沒有作答；固定 quiz 有 #check-quiz、#reset-quiz、#quiz-game-score、#quiz-correct、#quiz-wrong；沒有逐題下一題。 | quizQuestions、updateQuizStats 及事件監聽器；頁內 style、MathJax；無 localStorage／random。 |
| S4Ch1NumberSets.html | 是 | 五個 mode：polynomials、factorization、radicals、complex、number_systems；#latex-display、#raw-echo、#mc-options-section、#mc-options-grid、#feedback-box、#keypad。 | text mode 兩次機會；number_systems 四選一一次機會；即時 feedback、score、correct、wrong、count；scorecard overlay、reset、print worksheet。 | generatePolynomialProblem、generateFactorizationProblem、generateRadicalProblem、generateComplexProblem、generateNumberSystemProblem、checkMcAnswer、checkTextInputAnswer；Tailwind、MathJax、頁內 style；無 localStorage；random。 |
| S4Ch1QuadraticEquations.html | 是 | practice/challenge/guide shell；#step-input-list 動態步驟欄、#step-input-display、#answer-input、#answer-input-display、#feedback、#check-btn、#retry-btn、#next-btn；readonly keypad。 | 每題逐步答案及 roots；#score、#steps-correct、#answer-correct；completion dialog、record dialog、CSV／JSON、print-history、print-worksheet、print-comprehensiveWorksheet。 | normalizeRaw、parsePolynomial、samePolynomial、parseExpression、checkRoots、generateQuestion、renderStepInputList、submit、finishQuestion、nextQuestion；頁內 style、MathJax；localStorage learner／records；random。 |
| S4Ch1GraphicalMethod.html | 是 | 三步 tab；step 1 方程輸入及 preview，step 2 y table、canvas，step 3 canvas、root boxes；#main-action-btn、#feedback-box、#keypad-grid-container、#print-container。 | step 1/2/3 feedback；basic／advanced、score、max-score、count；下一步／完成及 print worksheet。 | switchStep、switchLevel、checkStep1、checkStep2、checkStep3、awardScore；Tailwind、MathJax、頁內 style；無 localStorage；generateProblem／generateStep3Problem random。 |

### A5. 不在 target main 的頁面：待確認，不列入本次遷移清單

以下路徑在本地 sandbox branch codex/fix-lesson-sigma-position 或上一版盤點中出現，但本次以 target main tree 查不到。它們不是 target main 的「本地練習實作頁」，目前沒有以 target remote 的其他分支證實；未確認前不安排遷移。

| 路徑 | main 狀態 | 目前列為 |
|---|---|---|
| S1Ch4.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S1Ch5.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S1Ch6.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S1Ch7.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S1Ch8.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S1Ch9.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S1Ch10.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S1Ch11.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S1Ch12.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S1Ch13.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| games/S1Ch5-8-GeometryMaster.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| games/S1Ch8-LineGraph-Exercise.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| games/S1Ch9-geogebra.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| ch11-geometry-flashcard/index.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| s1/selfstudy/S1Ch8-Worksheet.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| s1/selfstudy/S1CH12-1.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S4Ch1RealNumbers.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S4Ch1ComplexNumbers.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S4Ch2.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S4Ch3.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S4Ch3-CoordinateGeometry.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S4Ch3-EquationOfLine.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S4Ch3-ParallelPerpendicular.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |
| S4Ch3-DistanceMidpoint.html | 不存在 | 待確認；本地 sandbox branch codex/fix-lesson-sigma-position |

## B. 差異矩陣

| 元件／行為 | S1Ch1 根頁 | S1Ch2 | S1Ch3 | S1Ch1 Hcf／Divisibility | S1Ch1 Operations | S1Ch2 DirectedNumber | S1Ch3Ex1／Ex2 | S4Ch1 根頁 | S4Ch1 NumberSets | S4Ch1 Quadratic | S4Ch1 Graphical |
|---|---|---|---|---|---|---|---|---|---|---|
| 練習入口 | 四卡加內嵌 quiz | 內嵌 quiz 加兩連結 | scope quiz 加兩卡 | 直接遊戲頁 | 直接遊戲頁 | LV 選擇後進題 | mode selector | 三卡加內嵌 quiz | 五 mode | 三步動態輸入 | 三步圖像／輸入 |
| 題型 | radio、工具 | 選擇 | 動態 quiz | 選項 | 數式 | 選擇／計算器 | 代數多步 | radio | 數式／MC | 多項式／roots | 方程／表格／圖像 |
| 輸入面 | 沒有 | 選項按鈕 | 選項按鈕 | 選項按鈕 | input 加 keypad | MC 或 keypad | keypad | 沒有 | keypad 或 MC | readonly keypad | keypad |
| 提交流程 | check/reset | answer/next/reset | answer/next/reset | answer/next/finish/restart | submit/next/finish | submitMC/submitCalc/next | mode submit/reset | check/reset | 主按鈕/reset | check/retry/next | main action/step |
| feedback／詳解 | 結果文字 | feedback 解釋 | feedback 解釋 | 分解及標準答案 | 解析 | hint | feedback、hint | 結果統計 | hint、scorecard | steps、roots、records | plot、step feedback |
| 進度／分數 | quiz score | progress、score、streak | scope、progress、score、streak | round、score、accuracy | stage、progress、score | LV、題號、score | mode score、progress | score、correct、wrong | score、correct、wrong、count | score、steps、roots | score、max、count |
| 重做／記錄／列印 | reset | reset | reset | restart、record、export | finish、CSV/JSON | reset、print | reset、scorecard、print | reset | reset、scorecard、print | retry、records、三種 print | level／step reset、print |
| 判分及資料 | data-answer | questionBank | generated question | 共用 CONFIG | fraction parser/state | mode checker | algebra checker/multi-step state | quizQuestions | 五 generators、機會制 | parser/root checks/records | step checkers/appState |
| CSS | 頁內 | 頁內 | 頁內 | shared CSS | external CSS | 頁內 | 頁內加 Tailwind | 頁內 | Tailwind 加頁內 | 頁內 | Tailwind 加頁內 |
| 儲存／隨機 | 無／無 | 無／有 | 無／有 | localStorage／有 | localStorage／有 | 無／有 | 無／有 | 無／無 | 無／有 | localStorage／有 | 無／有 |

矩陣解讀：

- [V] 標題列、卡片、按鈕、欄距、feedback 色彩、統計徽章及 keypad 位置，原則上可在外殼層統一。
- [F] 普通 input 與 readonly keypad、逐題下一題與逐步提交、一次作答與兩次機會、LV／mode／challenge 入口，需以 adapter 處理，不能只改 CSS。
- [D] parser、checker、題目物件、localStorage schema、分數機制不可在介面遷移中改寫。

## Part 2：統一方案

## C. 統一規格方案

### 方案 A：以 S1Ch2／S1Ch3 內嵌 quiz 為輕量標準

- 外殼：題目卡、進度列、分數列、選項／輸入區、feedback、下一題／重設。
- 優點：結構簡單、手機空間少、不需抽出新共用檔案。
- 風險：不能自然容納 Quadratic 多步欄位、GraphicalMethod canvas、Operations challenge 及 records。
- 預計改動：main 現行根頁 4 頁及直接練習頁 12 頁；其餘 main 存在但未直接連出的頁面另排。
- checker 觸碰：低至中，只包裝 render、feedback、next。

### 方案 B：以 S4Ch1Quadratic／GraphicalMethod 分步外殼為標準

- 外殼：header 統計、題目卡、步驟列、keypad／輸入區、feedback、retry／next、print／record。
- 優點：可表達逐步作答、MathJax、圖像題、roots 題及工作紙入口。
- 風險：對簡單選擇題過重，手機資訊密度增加。
- 預計改動：main 現行根頁 4 頁及直接練習頁 12 頁；簡單 quiz 需精簡變體。
- checker 觸碰：中，每頁需 adapter，但 checker 本身不改。

### 方案 C：新訂介面契約，外殼與頁面 checker 分離

- 外殼：統一 header、題目區、answer surface、feedback、progress、score、retry／next、print slot；各頁保留題目狀態及既有 callback。
- 優點：同時容納選擇、填充、數式、多步、canvas、LV、challenge；長期減少頁面自行處理版面。
- 風險：首批要處理所有 main 現行練習頁、localStorage、外部 CSS、MathJax、QRCode.js、canvas 邊界。
- 預計改動：第一階段 14 個直接根頁／練習頁，另把 main 已存在但未直接連出的頁面逐頁排期；A5 不在 main 的頁面不納入。
- checker 觸碰：低至中，契約只包裝既有 checker，禁止重寫 parser、分數規則或題目資料。

### 建議

建議採方案 C。先以 S1Ch2.html 作簡單選擇題樣板，再以 S4Ch1QuadraticEquations.html 作多步數式樣板，最後處理 S1Ch3Ex1.html 的多 mode 及 S4Ch1GraphicalMethod.html 的 canvas。方案 C 是唯一能在不削弱特殊功能的情況下，為四選一、數式、逐步、LV、challenge 及圖像題提供同一套外殼契約的方案。最終採用方案由使用者決定。

## D. 逐課題遷移清單

以下只列 target main 已存在的頁面。A5 不存在於 main 的頁面已剔出，須待合併或確認正確分支後另案。

| 次序 | 頁面 | 改動區塊 | 風險 | 是否改 checker 呼叫 | 相依 |
|---:|---|---|---|---|---|
| 1 | S1Ch2.html | practice-layout、stats、choice、feedback、next/reset | 低 | 否，包裝 answerQuestion | 無外部依賴；作 choice 樣板。 |
| 2 | S4Ch1QuadraticEquations.html | step-input-list、feedback、completion／record、print | 高 | 否，保留 parser、checkRoots、submit | localStorage records、三種 print；作多步樣板。 |
| 3 | S1Ch1HcfLcm.html | practice／challenge／record header | 中 | 否，包裝 answerPractice／finishPractice | 共用 ch1-practice.js 及 storage。 |
| 4 | S1Ch1Divisibility.html | practice／challenge／guide 外殼 | 中 | 否，包裝 answerPractice | 與 HcfLcm 共用 CSS/JS。 |
| 5 | S1Ch3.html | scope、quiz、progress、feedback、next/reset | 低 | 否，包裝 answerQuestion | 依賴兩張 Ex 卡片入口不變。 |
| 6 | S4Ch1.html | 三卡、內嵌 quiz、stats、button | 低 | 否，保留 quizQuestions 事件流程 | 三張 main 卡片名稱固定。 |
| 7 | S1Ch1.html | 四卡、內嵌 quiz、quick tools 排列 | 低 | 否 | 不可移除四個 main 入口。 |
| 8 | S1Ch1Operations.html | stage、input/keypad、feedback、challenge、records | 高 | 否，保留 fraction parser、submit、timer | operations-game.css/js、storage、timer。 |
| 9 | games/S1Ch2-1-DirectedNumber.html | LV selector、MC/calculator、keypad、print | 高 | 否，保留 submitMC／submitCalc | LV1–9 和 print 必須保留。 |
| 10 | S1Ch3Ex1.html | modes、多步 boxes、keypad、hint、score、print | 高 | 否，只包裝既有 algebra checker | MathJax、Tailwind、Font Awesome、QRCode.js。 |
| 11 | S1Ch3Ex2.html | modes、雙行 substitution、feedback、keypad、print | 高 | 否，只包裝既有 checker | line status 及 print container。 |
| 12 | S4Ch1NumberSets.html | 五 mode、large display、MC、scorecard、print | 高 | 否，保留五 generator 及機會制 | factorization mode 不可刪除。 |
| 13 | S4Ch1GraphicalMethod.html | step tabs、preview、table、canvas、roots、keypad、print | 高 | 否，保留 checkStep1/2/3、awardScore | MathJax、canvas、level、print。 |
| 14 | games/S1Ch1-1-PrimeFactor.html | game HUD、canvas、終局 score、restart | 高 | 否，保留 handlePlayerClick、endGame | canvas interaction 需獨立 adapter。 |
| 15 | s1/selfstudy/chapter-2-quiz.html | progress、answer input、feedback、result | 中 | 否，保留 normalizeAnswer、checkAnswer | 普通 input 是否改 keypad 需另批。 |
| 16 | games/S1Ch5-1-AreaVolume.html | canvas、題目、keypad、score、next | 中 | 否 | main 存在但需先確認入口 owner。 |
| 17 | games/S1Ch5-6-GeometryHunter.html | canvas、mission、fire、score | 中 | 否 | main 存在但需先確認入口 owner。 |
| 18 | games/S1Ch5-7-GeometryHunterTimed.html | timer、canvas、fire、endGame | 高 | 否 | timer 與 canvas 邊界。 |
| 19 | games/S1Ch5-10-Area.html | canvas、keypad、score、next | 中 | 否 | main 存在但需確認入口 owner。 |
| 20 | games/S1Ch5-11-ComplexArea.html | canvas、mission、fire、score | 中 | 否 | main 存在但需確認入口 owner。 |
| 21 | games/S1Ch5-12-AreaDetective.html | options、help、timer、score | 高 | 否 | level、help modal、timer。 |
| 22 | games/S1Ch5-13-AreaFormula.html | options、timer、next、score | 中 | 否 | main 存在但需確認入口 owner。 |
| 23 | games/S1Ch5-14-AreaPerimeterTimed.html | timer、canvas、fire、next | 高 | 否 | timer 與 canvas 邊界。 |
| 24 | games/S1Ch6-1-AlgebraLanguage.html | stage buttons、input、feedback、score | 高 | 否 | 多 stage state。 |
| 25 | games/S1Ch6-2-AlgebraAddSub.html | timer、calculation、submit、endGame | 高 | 否 | timed round。 |
| 26 | games/S1Ch6-3-Monomial.html | options/input、hint、completion | 中 | 否 | hint、completion state。 |
| 27 | games/S1Ch6-4-AlgebraChallenge.html | level、choice/input、score | 中 | 否 | choice/input 分流。 |
| 28 | games/S1Ch8-TallyGame.html | progress、question、answer、final | 中 | 否 | main 存在但需確認入口 owner。 |
| 29 | games/S1Ch8-StemLeaf.html | data input、chart output、error | 低 | 否 | 非計分工具，不能套用 quiz score。 |
| 30 | games/S1Ch8-BarChart-Exercise.html | chart question、answer、feedback | 中 | 否 | main 存在但需逐頁確認。 |
| 31 | games/S1Ch8-PieChart-Exercise.html | chart question、answer、feedback | 中 | 否 | main 存在但需逐頁確認。 |
| 32 | games/S1Ch8-BarPieChart.html | chart operation、answer、feedback | 中 | 否 | main 存在但需逐頁確認。 |
| 33 | games/S1Ch9-1-MixOpsPercent.html | question、answer、feedback、next | 中 | 否 | main 存在但需逐頁確認。 |
| 34 | games/S1Ch9-2-PercentChange.html | question、answer、feedback、next | 中 | 否 | main 存在但需逐頁確認。 |
| 35 | games/S1Ch9-3-ProfitLoss.html | question、answer、feedback、next | 中 | 否 | main 存在但需逐頁確認。 |
| 36 | games/S1Ch9-4-Discount.html | question、answer、feedback、next | 中 | 否 | main 存在但需逐頁確認。 |
| 37 | games/S1Ch9-5-CostMarkupSellingPrice.html | question、answer、feedback、next | 中 | 否 | main 存在但需逐頁確認。 |
| 38 | games/S1Ch10-1-CoordinateGeometry.html | question、answer、feedback、next | 中 | 否 | main 存在但需逐頁確認。 |
| 39 | games/S1Ch10-3-CoordinateAdventure.html | mission、answer、score、next | 高 | 否 | game state 需獨立 adapter。 |
| 40 | games/S1Ch11-1-Angles.html | question、hint、answer、score | 中 | 否 | main 存在但需逐頁確認。 |
| 41 | games/S1Ch13-1-PlaceValue.html | question、answer、feedback、next | 中 | 否 | main 存在但需逐頁確認。 |
| 42 | games/S1Ch13-2-SignificantFigures.html | question、answer、feedback、next | 中 | 否 | main 存在但需逐頁確認。 |

建議執行次序：先 S1Ch2，再 S4Ch1Quadratic，再 S1Ch1HcfLcm／Divisibility，然後 S1Ch3Ex1／Ex2、S4Ch1NumberSets、S4Ch1GraphicalMethod，最後才處理 canvas、timer、multi-stage 及未由根頁直接連出的頁面。

## E. 共用元件邊界與介面契約

### E1. 共用外殼

共用外殼只負責 header、題目容器、MathJax typeset slot、選項／input／keypad slot、提交／下一題／重設視覺狀態、feedback 容器、progress／score 排版、responsive layout 及 print slot。外殼不產生新題、不解析答案、不重新計分。

### E2. 各頁保留

各頁保留題目資料、題目生成器、random、normalize、parse、equivalent、check、submit、分數規則、補答規則、challenge timer、localStorage／session record schema、MathJax 字串、canvas draw／plot、QRCode.js 或 inline QR、LV、difficulty、hint、record、print data。

### E3. Adapter 契約

每頁若接入外殼，需提供不改判分器的 adapter：

1. getQuestionView：回傳題幹、題型、answer surface 及目前步驟。
2. renderAnswerSurface：由頁面保留選項、input、keypad、canvas 的實際 DOM。
3. submitAnswer：只呼叫既有判分函數，回傳 correct、feedback、scoreDelta、resolved、nextState。
4. getProgress：回傳 current、total、step、score、correct、wrong，不重算原計分。
5. resetQuestion：呼叫既有 reset／new question 流程。
6. renderSolution：只顯示既有 hint、解析、標準答案或 print data。
7. persistState：有 storage 的頁面沿用原 key、schema、寫入時機；無 storage 的頁面不因外殼自動新增。

### E4. 禁止事項

- 不得合併不同頁 parser 或 checker。
- 不得把選擇題、數式、逐步、canvas 強行共用同一答案資料。
- 不得用批次轉換破壞 MathJax 分隔符、正則反斜線及 template literal。
- 不得刪除 challenge、records、LV、QR、print、hint 或任何現有入口。

## 附錄：疑似判分或資料邊界問題

1. S1Ch1Operations.html 的 answer-input 是普通 input；若改成 readonly，會改變輸入途徑，必須另行批准。
2. S1Ch2-1-DirectedNumber.html 的 LV1–9 使用不同 answer surface；不能以單一 mode wrapper 取代 LV 分流。
3. S1Ch3Ex1.html、S1Ch3Ex2.html 使用 Tailwind、Font Awesome、QRCode.js CDN；抽取外殼前要確認資源及列印行為。
4. S4Ch1NumberSets.html 的 factorization 是 main 現行第五 mode；不得沿用舊四 mode 規劃而刪除。
5. S4Ch1QuadraticEquations.html 的 step-input-list 動態生成；外殼不能假定固定步數。
6. S4Ch1GraphicalMethod.html 的 score 在三步間累積；不能以一次提交的 scoreDelta 取代。
7. S1Ch1、S4Ch1 根頁 quiz 與外連遊戲是兩套判分資料；統一入口樣式不代表合併題庫。
8. A5 頁面不在 target main；未確認合併或部署來源前，不可修改或排入實作 sprint。

## 修改點清單

| 分節 | 交付內容 | 狀態 |
|---|---|---|
| A | 以 main HEAD 重核；逐頁列出 main 存在狀態、DOM／題型／流程、判分、CSS、storage、random；A5 列出不存在於 main 的路徑及本地 branch。 | 完成 |
| B | 以 main 現行頁面建立元件／行為差異矩陣，標示視覺、流程、判分／資料結構差異。 | 完成 |
| C | 保留三個互斥方案，按 main 實際頁數及新發現頁面更新方案範圍，建議方案 C。 | 完成 |
| D | 只把 main 已存在頁面列入遷移；不存在於 main 的頁面明確剔出並移至待確認；列出風險、checker 邊界及相依。 | 完成 |
| E | 劃分共用外殼、頁面判分／題目資料、storage／print／MathJax／canvas 邊界，列出 adapter 契約及禁止事項。 | 完成 |

本文件只涉及唯讀盤點與介面規劃，沒有修改任何 HTML、CSS 或 JavaScript。
