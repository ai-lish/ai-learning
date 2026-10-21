(function () {
    'use strict';

    const subjectPool = ['x', 'y', 'z', 'u', 'A', 'P', 'Q', 'θ', 'λ'];
    const variablePool = ['a', 'b', 'k', 'm', 'n', 'R', 'S', 'H', 'α', 'β', 'ω', 'Δ'];

    function randomInteger(random, minimum, maximum) {
        return Math.floor(random() * (maximum - minimum + 1)) + minimum;
    }

    function toLatex(symbol) {
        const symbols = { 'θ': '\\theta', 'λ': '\\lambda', 'α': '\\alpha', 'β': '\\beta', 'ω': '\\omega', 'Δ': '\\Delta' };
        return symbols[symbol] || symbol;
    }

    function makeQuestion(parameters) {
        const sub = toLatex(parameters.sub);
        const variable = toLatex(parameters.variable);
        const topTerm = parameters.sign1 === 1 ? parameters.n1 + ' + ' + sub : parameters.n1 + ' - ' + sub;
        const otherTerm = parameters.sign2 === 1 ? sub + ' + ' + parameters.n2 : sub + ' - ' + parameters.n2;
        const term2 = parameters.n2 === 1 ? variable : parameters.n2 + variable;
        const questionLatex = parameters.layout === 0
            ? '\\displaystyle\\frac{' + topTerm + '}{' + variable + '} = ' + otherTerm
            : '\\displaystyle\\frac{' + topTerm + '}{' + otherTerm + '} = ' + variable;
        const numerator = parameters.sign1 === 1
            ? (parameters.sign2 === 1 ? term2 : '-' + term2) + ' - ' + parameters.n1
            : (parameters.sign2 === 1 ? parameters.n1 + ' - ' + term2 : parameters.n1 + ' + ' + term2);
        const denominator = parameters.sign1 === 1 ? '1 - ' + variable : '1 + ' + variable;
        const answerLatex = sub + ' = \\displaystyle\\frac{' + numerator + '}{' + denominator + '}';
        const difficulty = parameters.layout * 3 + (parameters.sign1 === -1 ? 1 : 0)
            + (parameters.sign2 === -1 ? 1 : 0) + Math.abs(parameters.n1 - parameters.n2) / 9;
        return { parameters: parameters, questionLatex: questionLatex, targetLatex: sub, answerLatex: answerLatex, difficulty: difficulty };
    }

    function generateWorksheet(seed) {
        const random = window.WorksheetTools.seededRandom(seed);
        const unique = new Set();
        const questions = [];
        let attempts = 0;

        while (questions.length < 10 && attempts < 5000) {
            attempts += 1;
            const n1 = randomInteger(random, 1, 9);
            const n2 = randomInteger(random, 1, 9);
            const sub = subjectPool[Math.floor(random() * subjectPool.length)];
            let variable = variablePool[Math.floor(random() * variablePool.length)];
            while (variable === sub || variable.toLowerCase() === sub.toLowerCase()) {
                variable = variablePool[Math.floor(random() * variablePool.length)];
            }
            const parameters = {
                n1: n1,
                n2: n2,
                sub: sub,
                variable: variable,
                sign1: random() < 0.5 ? 1 : -1,
                sign2: random() < 0.5 ? 1 : -1,
                layout: random() < 0.5 ? 0 : 1
            };

            // In layout 1, this rare combination makes the solved denominator identically zero.
            // Exclude it so the worksheet never asks students to divide by zero in the original formula.
            if (parameters.layout === 1 && parameters.sign1 === parameters.sign2 && parameters.n1 === parameters.n2) continue;

            const signature = JSON.stringify(parameters);
            if (unique.has(signature)) continue;
            unique.add(signature);
            questions.push(makeQuestion(parameters));
        }

        if (questions.length !== 10) throw new Error('未能生成 10 道不同的主項變換題目');
        questions.sort(function (left, right) { return left.difficulty - right.difficulty; });
        return questions;
    }

    window.WORKSHEET_LOGIC = { generateWorksheet: generateWorksheet };
}());
