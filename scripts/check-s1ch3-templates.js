#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const htmlPath = path.resolve(__dirname, "..", "S1Ch3.html");
const html = fs.readFileSync(htmlPath, "utf8");
const startMarker = "/* PARAMETERIZED_TEMPLATE_ENGINE_START */";
const endMarker = "/* PARAMETERIZED_TEMPLATE_ENGINE_END */";
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker);
if (start < 0 || end < 0 || end <= start) throw new Error("找不到模版引擎區段");

const engineSource = html.slice(start, end + endMarker.length);
const bundle = new Function(
  engineSource + "\nreturn { templateFactories, templateCatalog, withRetries };"
)();
const { templateFactories, templateCatalog, withRetries } = bundle;

function makeRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function fixedRng(values) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

function raw(value) {
  return value.replace(/\\\(/g, "").replace(/\\\)/g, "");
}

function math(value) {
  return "\\(" + value + "\\)";
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x || 1;
}

function fractionLatex(numerator, denominator) {
  if (denominator === 0) throw new Error("分母不可為0");
  const sign = denominator < 0 ? -1 : 1;
  const divisor = gcd(numerator, denominator);
  const n = sign * numerator / divisor;
  const d = Math.abs(denominator) / divisor;
  if (d === 1) return String(n);
  if (n < 0) return "-\\frac{" + Math.abs(n) + "}{" + d + "}";
  return "\\frac{" + n + "}{" + d + "}";
}

function numberLatex(value) {
  if (Number.isInteger(value)) return String(value);
  const text = String(value);
  const decimals = text.includes(".") ? text.length - text.indexOf(".") - 1 : 0;
  const denominator = 10 ** decimals;
  return fractionLatex(Math.round(value * denominator), denominator);
}

function sequenceFromQuestion(item) {
  const question = raw(item.question);
  const startIndex = question.indexOf("數列 ") + 3;
  const endIndex = question.indexOf(",\\ldots", startIndex);
  if (startIndex < 3 || endIndex < 0) throw new Error("無法讀取數列：" + item.id);
  return question.slice(startIndex, endIndex).split(",").map(Number);
}

function recomputeAnswer(item) {
  const question = raw(item.question);
  switch (item.id) {
    case "3.1A-write-product": {
      const match = question.match(/某數的 (\d+) 倍(加|減) (\d+)/);
      if (!match) throw new Error("無法讀取 3.1A-write-product");
      return math(match[1] + "x" + (match[2] === "加" ? "+" : "-") + match[3]);
    }
    case "3.1A-translate-difference": {
      const match = question.match(/的 (\d+) 倍/);
      if (!match) throw new Error("無法讀取 3.1A-translate-difference");
      return math(match[1] + "(m-n)");
    }
    case "3.1A-identify-expression":
      return item.choices.find((choice) => /[a-zA-Z]/.test(raw(choice)) && !raw(choice).includes("="));
    case "3.1B-simplify-like-terms": {
      const match = question.match(/(\d+)x\+(\d+)x\+(\d+)/);
      if (!match) throw new Error("無法讀取 3.1B-simplify-like-terms");
      return math(Number(match[1]) + Number(match[2]) + "x+" + match[3]);
    }
    case "3.1B-order-of-operations": {
      const match = question.match(/(\d+)x\+(\d+)x\\times(\d+)\\div(\d+)/);
      if (!match) throw new Error("無法讀取 3.1B-order-of-operations");
      const value = Number(match[1]) + Number(match[2]) * Number(match[3]) / Number(match[4]);
      return math(String(value) + "x");
    }
    case "3.1B-simplify-two-variables": {
      const match = question.match(/(\d+)x-(\d+)y\+(\d+)x-(\d+)y/);
      if (!match) throw new Error("無法讀取 3.1B-simplify-two-variables");
      return math(
        (Number(match[1]) + Number(match[3])) + "x-" +
        (Number(match[2]) + Number(match[4])) + "y"
      );
    }
    case "3.1C-index-notation": {
      const expression = question.split(" 的指數")[0];
      const xCount = (expression.match(/x/g) || []).length;
      const yCount = (expression.match(/y/g) || []).length;
      return math("x" + (xCount === 1 ? "" : "^" + xCount) + "y" + (yCount === 1 ? "" : "^" + yCount));
    }
    case "3.1C-multiply-monomials": {
      const match = question.match(/(\d+)x\\times(\d+)x/);
      if (!match) throw new Error("無法讀取 3.1C-multiply-monomials");
      return math(Number(match[1]) * Number(match[2]) + "x^2");
    }
    case "3.2A-constant-term": {
      const match = question.match(/Q=(\d+)t\+(\d+)/);
      if (!match) throw new Error("無法讀取 3.2A-constant-term");
      return math(match[2]);
    }
    case "3.2A-formula-recognition":
      return item.choices.find((choice) => {
        const value = raw(choice);
        return value.includes("P=") && value.includes("(l+w)");
      });
    case "3.2A-variable-identification":
      return math("P") + "、" + math("l");
    case "3.2B-linear-substitution": {
      const match = question.match(/u=(-?\d+)\+(-?\d+)v.*v=(-?\d+)/);
      if (!match) throw new Error("無法讀取 3.2B-linear-substitution");
      return math(String(Number(match[1]) + Number(match[2]) * Number(match[3])));
    }
    case "3.2B-square-substitution": {
      const match = question.match(/k=m\^2-\\frac\{n\}\{(\d+)\}.*m=(-?\d+),n=(-?\d+)/);
      if (!match) throw new Error("無法讀取 3.2B-square-substitution");
      return math(String(Number(match[2]) * Number(match[2]) - Number(match[3]) / Number(match[1])));
    }
    case "3.2B-fraction-substitution": {
      const match = question.match(/r=a-\\frac\{b\}\{d\}.*a=(-?\d+),b=(-?\d+),d=(-?\d+)/);
      if (!match) throw new Error("無法讀取 3.2B-fraction-substitution");
      return math(fractionLatex(
        Number(match[1]) * Number(match[3]) - Number(match[2]),
        Number(match[3])
      ));
    }
    case "3.2C-fee-formula": {
      const match = question.match(/基本費為 \$(\d+)，每月加收 \$(\d+)，使用 .*?n=(\d+)/);
      if (!match) throw new Error("無法讀取 3.2C-fee-formula");
      return math("\\$" + (Number(match[1]) + Number(match[2]) * Number(match[3])));
    }
    case "3.2C-rectangle-perimeter": {
      const match = question.match(/l=(\d+)\\text\{ cm\},w=(\d+)\\text\{ cm\}/);
      if (!match) throw new Error("無法讀取 3.2C-rectangle-perimeter");
      return math(String(2 * (Number(match[1]) + Number(match[2]))) + "\\text{ cm}");
    }
    case "3.3A-arithmetic-next": {
      const terms = sequenceFromQuestion(item);
      return math(String(terms[terms.length - 1] + (terms[1] - terms[0])));
    }
    case "3.3A-geometric-next": {
      const terms = sequenceFromQuestion(item);
      return math(String(terms[terms.length - 1] * (terms[1] / terms[0])));
    }
    case "3.3B-division-next": {
      const terms = sequenceFromQuestion(item);
      return math(String(terms[terms.length - 1] * (terms[1] / terms[0])));
    }
    case "3.3B-negative-division": {
      const terms = sequenceFromQuestion(item);
      return math(numberLatex(terms[terms.length - 1] * (terms[1] / terms[0])));
    }
    case "3.3B-rule-identification": {
      const terms = sequenceFromQuestion(item);
      return math("\\times" + (terms[1] / terms[0]));
    }
    case "3.3C-term-evaluation": {
      const match = question.match(/T_n=(-?\d+)\+(-?\d+)n.*T_(\d+)/);
      if (!match) throw new Error("無法讀取 3.3C-term-evaluation");
      return math(String(Number(match[1]) + Number(match[2]) * Number(match[3])));
    }
    case "3.3C-general-term": {
      const terms = sequenceFromQuestion(item);
      const difference = terms[1] - terms[0];
      return math(String(terms[0] - difference) + "+" + difference + "n");
    }
    case "3.3C-solve-unknown-term": {
      const match = question.match(/T_n=(\d+)\+(\d+)n.*T_n=(\d+)/);
      if (!match) throw new Error("無法讀取 3.3C-solve-unknown-term");
      return math(String((Number(match[3]) - Number(match[1])) / Number(match[2])));
    }
    default:
      throw new Error("未有獨立 oracle：" + item.id);
  }
}

function normalizeTex(value) {
  let source = raw(value);
  let previous;
  do {
    previous = source;
    source = source.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)");
  } while (source !== previous);
  return source
    .replace(/\\text\{[^{}]*\}/g, "")
    .replace(/\\(?:left|right|ldots|cdots)/g, "")
    .replace(/\\times/g, "*")
    .replace(/\\div/g, "/")
    .replace(/\\cdot/g, "*")
    .replace(/\\[,;:! ]/g, "")
    .replace(/\\\$/g, "")
    .replace(/\$/g, "")
    .replace(/−/g, "-")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, "");
}

function tokenize(source) {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (/[0-9.]/.test(char)) {
      let value = "";
      while (index < source.length && /[0-9.]/.test(source[index])) value += source[index++];
      if (!/^\d+(?:\.\d+)?$/.test(value)) throw new Error("數字格式不正確");
      tokens.push({ type: "number", value: Number(value) });
      continue;
    }
    if (/[A-Za-z]/.test(char)) {
      tokens.push({ type: "variable", value: char });
      index += 1;
      continue;
    }
    if ("+-*/^()".includes(char)) {
      tokens.push({ type: char, value: char });
      index += 1;
      continue;
    }
    throw new Error("無法解析字元：" + char);
  }
  return tokens;
}

function tokenStartsFactor(token) {
  return token && (token.type === "number" || token.type === "variable" || token.type === "(");
}

class ExpressionParser {
  constructor(source) {
    this.tokens = tokenize(source);
    this.position = 0;
  }

  peek() {
    return this.tokens[this.position];
  }

  consume(type) {
    if (this.peek() && this.peek().type === type) {
      this.position += 1;
      return true;
    }
    return false;
  }

  parse() {
    const node = this.parseExpression();
    if (this.position !== this.tokens.length) throw new Error("式子未完成");
    return node;
  }

  parseExpression() {
    let node = this.parseTerm();
    while (this.consume("+") || this.consume("-")) {
      const operator = this.tokens[this.position - 1].type;
      const right = this.parseTerm();
      const left = node;
      node = (env) => operator === "+" ? left(env) + right(env) : left(env) - right(env);
    }
    return node;
  }

  parseTerm() {
    let node = this.parseUnary();
    while (true) {
      if (this.consume("*") || this.consume("/")) {
        const operator = this.tokens[this.position - 1].type;
        const right = this.parseUnary();
        const left = node;
        node = (env) => {
          const divisor = right(env);
          if (operator === "/" && divisor === 0) throw new Error("除以0");
          return operator === "*" ? left(env) * divisor : left(env) / divisor;
        };
      } else if (tokenStartsFactor(this.peek())) {
        const right = this.parseUnary();
        const left = node;
        node = (env) => left(env) * right(env);
      } else {
        break;
      }
    }
    return node;
  }

  parseUnary() {
    if (this.consume("+")) return this.parseUnary();
    if (this.consume("-")) {
      const node = this.parseUnary();
      return (env) => -node(env);
    }
    return this.parsePower();
  }

  parsePower() {
    let node = this.parsePrimary();
    if (this.consume("^")) {
      const exponent = this.parseUnary();
      const base = node;
      node = (env) => Math.pow(base(env), exponent(env));
    }
    return node;
  }

  parsePrimary() {
    const token = this.peek();
    if (!token) throw new Error("缺少項目");
    this.position += 1;
    if (token.type === "number") return () => token.value;
    if (token.type === "variable") {
      return (env) => {
        if (!Object.prototype.hasOwnProperty.call(env, token.value)) throw new Error("缺少變數");
        return env[token.value];
      };
    }
    if (token.type === "(") {
      const node = this.parseExpression();
      if (!this.consume(")")) throw new Error("缺少右括號");
      return node;
    }
    throw new Error("不應出現的項目");
  }
}

function makeEvaluator(value, relation = false) {
  const source = normalizeTex(value);
  const equals = source.indexOf("=");
  if (relation && equals < 0) return () => NaN;
  try {
    if (equals >= 0) {
      const left = new ExpressionParser(source.slice(0, equals)).parse();
      const right = new ExpressionParser(source.slice(equals + 1)).parse();
      return (env) => left(env) - right(env);
    }
    const expression = new ExpressionParser(source).parse();
    return (env) => expression(env);
  } catch {
    return () => NaN;
  }
}

function closeEnough(left, right) {
  return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) < 1e-9;
}

function contextsFor(id) {
  switch (id) {
    case "3.1A-write-product":
      return [{ x: 1 }, { x: 2 }, { x: -3 }];
    case "3.1A-translate-difference":
      return [{ m: 2, n: 1, p: 3 }, { m: -4, n: 3, p: 5 }, { m: 5, n: -2, p: 2 }];
    case "3.1B-simplify-like-terms":
    case "3.1B-order-of-operations":
    case "3.1C-multiply-monomials":
      return [{ x: 1 }, { x: 2 }, { x: -3 }];
    case "3.1B-simplify-two-variables":
      return [{ x: 1, y: 2 }, { x: -2, y: 3 }, { x: 4, y: -1 }];
    case "3.1C-index-notation":
      return [{ x: 2, y: 3 }, { x: -2, y: 4 }, { x: 3, y: -1 }];
    case "3.3C-general-term":
      return [{ n: 1 }, { n: 2 }, { n: 4 }, { n: 7 }];
    default:
      return [{}];
  }
}

function checkNumericEquivalence(item, contexts) {
  const evaluators = item.choices.map((choice) => makeEvaluator(choice));
  const values = evaluators.map((evaluate) => contexts.map((context) => evaluate(context)));
  const answerIndex = item.choices.indexOf(item.answer);
  if (answerIndex < 0) return ["oracle找不到正確答案"];
  const equivalent = values.map((choiceValues) =>
    choiceValues.every((value, index) => closeEnough(value, values[answerIndex][index]))
  );
  const equivalentIndices = equivalent.map((isEquivalent, index) => isEquivalent ? index : -1).filter((index) => index >= 0);
  return equivalentIndices.length === 1 && equivalentIndices[0] === answerIndex
    ? []
    : ["存在與正確答案數學等價的選項：" + equivalentIndices.join(",")];
}

function checkExpressionIdentification(item) {
  const matches = item.choices.map((choice) => {
    const value = raw(choice);
    return /[A-Za-z]/.test(value) && !value.includes("=");
  });
  const answerIndex = item.choices.indexOf(item.answer);
  const matchedIndices = matches.map((match, index) => match ? index : -1).filter((index) => index >= 0);
  return matchedIndices.length === 1 && matchedIndices[0] === answerIndex ? [] : ["代數式辨認 oracle 不符"];
}

function checkConstantTerm(item) {
  const match = raw(item.question).match(/Q=(\d+)t\+(\d+)/);
  if (!match) return ["常數項 oracle 無法讀取題目"];
  const expected = Number(match[2]);
  const numericIndices = item.choices.map((choice, index) => {
    const value = raw(choice);
    return /^-?\d+(?:\.\d+)?$/.test(value) && Number(value) === expected ? index : -1;
  }).filter((index) => index >= 0);
  return numericIndices.length === 1 && item.choices[numericIndices[0]] === item.answer
    ? []
    : ["常數項 oracle 不符"];
}

function checkFormulaRecognition(item) {
  const match = raw(item.answer).match(/P=(\d+)\(l\+w\)/);
  if (!match) return ["公式辨認 oracle 無法讀取正確公式"];
  const coefficient = Number(match[1]);
  const contexts = [{ l: 1, w: 2, P: coefficient * 3 }, { l: 3, w: 1, P: coefficient * 4 }, { l: 2, w: 5, P: coefficient * 7 }];
  const evaluators = item.choices.map((choice) => makeEvaluator(choice, true));
  const values = evaluators.map((evaluate) => contexts.map((context) => evaluate(context)));
  const valid = values.map((choiceValues) => choiceValues.every((value) => closeEnough(value, 0)));
  const answerIndex = item.choices.indexOf(item.answer);
  const validIndices = valid.map((isValid, index) => isValid ? index : -1).filter((index) => index >= 0);
  return validIndices.length === 1 && validIndices[0] === answerIndex ? [] : ["公式辨認 oracle 不符"];
}

function checkVariableIdentification(item) {
  const matches = item.choices.map((choice) => raw(choice).replace(/\s+/g, "") === "P、l");
  const answerIndex = item.choices.indexOf(item.answer);
  const matchedIndices = matches.map((match, index) => match ? index : -1).filter((index) => index >= 0);
  return matchedIndices.length === 1 && matchedIndices[0] === answerIndex ? [] : ["變數辨認 oracle 不符"];
}

function checkRuleIdentification(item) {
  const answerIndex = item.choices.indexOf(item.answer);
  const normalized = item.choices.map((choice) => raw(choice).replace(/\s+/g, ""));
  const answer = raw(item.answer).replace(/\s+/g, "");
  const matching = normalized.map((value, index) => value === answer ? index : -1).filter((index) => index >= 0);
  return matching.length === 1 && matching[0] === answerIndex ? [] : ["數列規律 oracle 不符"];
}

function checkChoiceOracle(item) {
  switch (item.id) {
    case "3.1A-identify-expression":
      return checkExpressionIdentification(item);
    case "3.2A-constant-term":
      return checkConstantTerm(item);
    case "3.2A-formula-recognition":
      return checkFormulaRecognition(item);
    case "3.2A-variable-identification":
      return checkVariableIdentification(item);
    case "3.3B-rule-identification":
      return checkRuleIdentification(item);
    default:
      return checkNumericEquivalence(item, contextsFor(item.id));
  }
}

function validateFractions(item) {
  const values = [item.question, item.answer, item.explain].concat(item.choices).map(raw).join(" ");
  const errors = [];
  if (/\\frac\{-/.test(values)) errors.push("分數負號仍在分子內");
  const pattern = /\\frac\{(-?\d+)\}\{(-?\d+)\}/g;
  let match;
  while ((match = pattern.exec(values)) !== null) {
    const numerator = Number(match[1]);
    const denominator = Number(match[2]);
    if (denominator === 0) errors.push("分母為0");
    if (Math.abs(denominator) === 1) errors.push("分母為1");
    if (Math.abs(denominator) > 12) errors.push("分母超過12");
    if (gcd(numerator, denominator) !== 1) errors.push("分數未約簡");
  }
  if (/(?:^|[+\-])0(?:x|y|n|m|p|q)\b/.test(values)) errors.push("出現零係數項");
  return errors;
}

function validateItem(item, expected) {
  const errors = [];
  if (item.answer !== expected) errors.push("獨立重算答案不符");
  if (!item.choices.includes(item.answer)) errors.push("答案不在選項");
  if (item.choices.length !== 4) errors.push("選項數不是4");
  if (new Set(item.choices).size !== 4) errors.push("選項重複");
  for (const value of [item.question, item.answer, item.explain].concat(item.choices)) {
    if (value.split("\\(").length !== value.split("\\)").length) errors.push("MathJax 括號不成對");
  }
  errors.push(...validateFractions(item));
  errors.push(...checkChoiceOracle(item));
  return [...new Set(errors)];
}

function idCheck() {
  const factoryIds = new Set(templateFactories.map((entry) => entry.id));
  const catalogIds = new Set(templateCatalog.map((entry) => entry.id));
  if (factoryIds.size !== templateFactories.length || catalogIds.size !== templateCatalog.length) {
    throw new Error("factory 或 catalog 有重複 id");
  }
  if (factoryIds.size !== catalogIds.size || [...factoryIds].some((id) => !catalogIds.has(id))) {
    throw new Error("factory/catalog id 集合不一致");
  }
  return true;
}

if (!idCheck()) throw new Error("id 檢查失敗");
if (templateFactories.length !== 24 || templateCatalog.length !== 24) {
  throw new Error("模版數量不是24");
}

const sectionCounts = {};
const subCounts = {};
templateCatalog.forEach((entry) => {
  sectionCounts[entry.section] = (sectionCounts[entry.section] || 0) + 1;
  const key = entry.section + entry.sub;
  subCounts[key] = (subCounts[key] || 0) + 1;
});
for (const section of ["3.1", "3.2", "3.3"]) {
  if (sectionCounts[section] !== 8) throw new Error(section + " 模版數不是8");
  for (const sub of ["A", "B", "C"]) {
    if ((subCounts[section + sub] || 0) < 2) throw new Error(section + sub + " 少於2條模版");
  }
}

function validateEntry(entry, rng, mode, sample) {
  const item = entry.factory(rng);
  if (item.id !== entry.id) throw new Error("id 不符 factory entry");
  const expected = recomputeAnswer(item);
  const errors = validateItem(item, expected);
  if (errors.length) throw new Error(errors.join("、"));
  return { item, mode, sample };
}

const reports = [];
let failureCount = 0;
templateFactories.forEach((entry, index) => {
  let builderPassed = 0;
  const builderFailures = [];
  for (let sample = 0; sample < 200; sample += 1) {
    try {
      validateEntry(entry, makeRng(0x51c30000 + index * 1000 + sample), "builder", sample);
      builderPassed += 1;
    } catch (error) {
      builderFailures.push({ sample, message: error.message });
    }
  }
  let fallbackPassed = 0;
  const fallbackFailures = [];
  withRetries.forceFallbackForCheck = true;
  try {
    try {
      validateEntry(entry, makeRng(0x7a110000 + index), "fallback", 0);
      fallbackPassed = 1;
    } catch (error) {
      fallbackFailures.push({ sample: 0, message: error.message });
    }
  } finally {
    withRetries.forceFallbackForCheck = false;
  }
  const failures = builderFailures.concat(fallbackFailures);
  failureCount += failures.length;
  reports.push({ id: entry.id, builderSamples: 200, builderPassed, fallbackSamples: 1, fallbackPassed, failures });
});

const generalEntry = templateFactories.find((entry) => entry.id === "3.3C-general-term");
let exhaustivePassed = 0;
const exhaustiveFailures = [];
for (let base = 2; base <= 8; base += 1) {
  for (let difference = 2; difference <= 6; difference += 1) {
    const rng = fixedRng([(base - 2 + 0.25) / 7, (difference - 2 + 0.25) / 5]);
    try {
      validateEntry(generalEntry, rng, "exhaustive", base + "," + difference);
      exhaustivePassed += 1;
    } catch (error) {
      exhaustiveFailures.push({ parameters: { base, difference }, message: error.message });
    }
  }
}
failureCount += exhaustiveFailures.length;

const staticChecks = {
  hasFisherYates: /for \(let index = result\.length - 1; index > 0; index -= 1\)/.test(html),
  hasRawChoiceComparison: /itemButton\.dataset\.choice === item\.answer/.test(html),
  hasNoInnerHtmlAnswerComparison: !/itemButton\.innerHTML\s*===\s*item\.answer/.test(html),
  hasRangeButtons: /data-quiz-scope="3\.1"/.test(html) && /data-quiz-scope="3\.2"/.test(html) && /data-quiz-scope="3\.3"/.test(html),
  hasIdPairing: /templateCatalogById = new Map/.test(html) && /templateIdsMatch/.test(html),
  hasFallbackHook: /forceFallbackForCheck/.test(html),
  hasNegativeFractionFormatter: /if \(parts\[0\] < 0\) return "-\\\\frac/.test(html),
  hasNoGeneralIndexLaw: !/a\^m\\times a\^n=a\^\{m\+n\}/.test(html)
};
if (Object.values(staticChecks).some((value) => !value)) {
  throw new Error("靜態檢查失敗：" + JSON.stringify(staticChecks));
}

console.log("S1Ch3 template self-check");
console.log("templates=" + templateFactories.length + " builderSamplesPerTemplate=200 fallbackSamplesPerTemplate=1 totalBuilderSamples=" + (templateFactories.length * 200));
reports.forEach((report) => {
  console.log(report.id + " builderSamples=" + report.builderSamples + " builderPassed=" + report.builderPassed + " fallbackSamples=" + report.fallbackSamples + " fallbackPassed=" + report.fallbackPassed + " failures=" + report.failures.length);
  report.failures.slice(0, 3).forEach((failure) => {
    console.log("  failure sample=" + failure.sample + " " + failure.message);
  });
});
console.log("3.3C-general-term exhaustive combinations=35 passed=" + exhaustivePassed + " failures=" + exhaustiveFailures.length);
exhaustiveFailures.slice(0, 3).forEach((failure) => {
  console.log("  exhaustive failure parameters=" + JSON.stringify(failure.parameters) + " " + failure.message);
});
console.log("sectionCounts=" + JSON.stringify(sectionCounts));
console.log("subCounts=" + JSON.stringify(subCounts));
console.log("staticChecks=" + JSON.stringify(staticChecks));

const sampleIds = new Set([
  "3.2A-variable-identification",
  "3.2B-fraction-substitution",
  "3.3A-arithmetic-next",
  "3.3C-general-term",
  "3.3C-solve-unknown-term"
]);
templateFactories.filter((entry) => sampleIds.has(entry.id)).forEach((entry, index) => {
  const sample = entry.factory(makeRng(0x6a100000 + index));
  console.log("sample " + entry.id + "=" + JSON.stringify(sample));
});

if (failureCount > 0) process.exitCode = 1;
