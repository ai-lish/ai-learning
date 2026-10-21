(function () {
    'use strict';

    const coefficientPool = [-3, -2, 2, 3];
    const firstExponentPool = [-3, -2, -1, 1, 2];
    const secondExponentPool = [-2, -1, 1, 2, 3];
    const powerPool = [2, 3];
    const variablePool = ['a', 'b', 'x', 'y'];

    function pick(values, random) {
        return values[Math.floor(random() * values.length)];
    }

    function shuffle(values, random) {
        const result = values.slice();
        for (let index = result.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(random() * (index + 1));
            const current = result[index];
            result[index] = result[swapIndex];
            result[swapIndex] = current;
        }
        return result;
    }

    function formatPower(variable, exponent) {
        if (exponent === 1) return variable;
        return variable + '^{' + exponent + '}';
    }

    function formatVariablePair(firstVariable, firstExponent, secondVariable, secondExponent) {
        return [[firstVariable, firstExponent], [secondVariable, secondExponent]]
            .sort(function (left, right) { return left[0] < right[0] ? -1 : (left[0] > right[0] ? 1 : 0); })
            .map(function (item) { return item[1] === 1 ? item[0] : item[0] + '^{' + item[1] + '}'; });
    }

    function makeQuestion(parameters) {
        const c = parameters.c;
        const v1 = parameters.v1;
        const v2 = parameters.v2;
        const n1 = parameters.n1;
        const n2 = parameters.n2;
        const power = parameters.power;
        const n3 = parameters.n3;
        const n4 = parameters.n4;
        const finalExponent1 = n1 * power - n3;
        const finalExponent2 = n2 * power - n4;
        const questionNumerator = formatVariablePair(v1, n1, v2, n2).join('');
        const questionDenominator = formatVariablePair(v1, n3, v2, n4).join('');
        const questionLatex = '\\displaystyle\\frac{\\left(' + c + questionNumerator + '\\right)^{' + power + '}}{' + questionDenominator + '}';
        const numerator = [String(Math.pow(c, power))];
        const denominator = [];
        const answerVariables = [[v1, finalExponent1], [v2, finalExponent2]]
            .sort(function (left, right) { return left[0] < right[0] ? -1 : (left[0] > right[0] ? 1 : 0); });
        answerVariables.forEach(function (item) {
            if (item[1] > 0) numerator.push(formatPower(item[0], item[1]));
            else if (item[1] < 0) denominator.push(formatPower(item[0], -item[1]));
        });

        const answerLatex = denominator.length
            ? '\\displaystyle\\frac{' + numerator.join('') + '}{' + denominator.join('') + '}'
            : numerator.join('');
        const difficulty = Math.abs(finalExponent1) + Math.abs(finalExponent2)
            + (finalExponent1 < 0 || finalExponent2 < 0 ? 2 : 0) + (power === 3 ? 1 : 0);
        return {
            parameters: parameters,
            questionLatex: questionLatex,
            answerLatex: answerLatex,
            answerCoefficient: Math.pow(c, power),
            finalExponent1: finalExponent1,
            finalExponent2: finalExponent2,
            difficulty: difficulty
        };
    }

    function generateWorksheet(seed) {
        const random = window.WorksheetTools.seededRandom(seed);
        const unique = new Set();
        const questions = [];
        let attempts = 0;

        while (questions.length < 10 && attempts < 2000) {
            attempts += 1;
            const variables = shuffle(variablePool, random).slice(0, 2);
            const parameters = {
                c: pick(coefficientPool, random),
                n1: pick(firstExponentPool, random),
                n2: pick(secondExponentPool, random),
                power: pick(powerPool, random),
                n3: pick(secondExponentPool, random),
                n4: pick(secondExponentPool, random),
                v1: variables[0],
                v2: variables[1]
            };
            const finalExponent1 = parameters.n1 * parameters.power - parameters.n3;
            const finalExponent2 = parameters.n2 * parameters.power - parameters.n4;

            // The online exercise removes ^1 from typed answers but retains ^1 in its
            // final-step answer list. Skip exponents of magnitude 1 so every worksheet
            // answer remains accepted by the unchanged exercise grader.
            if (Math.abs(finalExponent1) === 1 || Math.abs(finalExponent2) === 1) continue;

            const signature = JSON.stringify(parameters);
            if (unique.has(signature)) continue;
            unique.add(signature);
            questions.push(makeQuestion(parameters));
        }

        if (questions.length !== 10) throw new Error('未能生成 10 道不同的指數化簡題目');
        questions.sort(function (left, right) { return left.difficulty - right.difficulty; });
        return questions;
    }

    window.WORKSHEET_LOGIC = { generateWorksheet: generateWorksheet };
}());
