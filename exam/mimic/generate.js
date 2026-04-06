/**
 * exam/mimic/generate.js
 * Client-side mimic question generator for school exam pages.
 *
 * Public API:
 *   generateMimicQuestion({ examKey, paper, qId, templateMode })
 *     → Promise<{ question_text, options, answer } | null>
 *
 *   loadExamTemplates(examKey, paper)
 *     → Promise<Array<template>>
 */

(function (global) {
    'use strict';

    // Resolve the template library URL relative to this script's location
    // so it works correctly regardless of which page includes the script.
    var _scriptSrc = (typeof document !== 'undefined' && document.currentScript)
        ? document.currentScript.src
        : '';
    var _scriptBase = _scriptSrc.replace(/[^/]*$/, '');
    var TEMPLATES_URL = _scriptBase + 'auto_templates_exam.json';

    let _cachedTemplates = null;

    /**
     * Load and cache all exam templates.
     */
    async function loadAllTemplates() {
        if (_cachedTemplates) return _cachedTemplates;
        try {
            const resp = await fetch(TEMPLATES_URL);
            if (!resp.ok) throw new Error('fetch failed');
            _cachedTemplates = await resp.json();
        } catch (e) {
            _cachedTemplates = {};
        }
        return _cachedTemplates;
    }

    /**
     * Return templates matching the given examKey and paper.
     * @param {string} examKey  e.g. 's1-term3'
     * @param {string} paper    e.g. 'p2'
     */
    async function loadExamTemplates(examKey, paper) {
        const all = await loadAllTemplates();
        const prefix = examKey + '-' + paper + '-';
        return Object.values(all).filter(t => t.id && t.id.startsWith(prefix));
    }

    /**
     * Find a template for a specific source question id.
     * @param {string} examKey
     * @param {string} paper
     * @param {string} qId  e.g. '2025S1Q05'
     */
    async function findTemplate(examKey, paper, qId) {
        const all = await loadAllTemplates();
        // Match by source_question_id first
        const bySource = Object.values(all).find(
            t => t.source_question_id === qId && t.examKey === examKey && t.paper === paper
        );
        if (bySource) return bySource;

        // Fallback: match by template id pattern (examKey-paper-qNN)
        const qMatch = qId.match(/Q(\d+)$/i);
        if (qMatch) {
            const num = parseInt(qMatch[1], 10);
            const idKey = examKey + '-' + paper + '-q' + String(num).padStart(2, '0');
            if (all[idKey]) return all[idKey];
        }
        return null;
    }

    /**
     * Substitute variables in a template string.
     * Replaces {varName} placeholders with randomly chosen values.
     * @param {string} text
     * @param {Object} varValues  { varName: value }
     */
    function substituteVars(text, varValues) {
        return text.replace(/\{([a-zA-Z_]\w*)\}/g, (match, name) => {
            return varValues.hasOwnProperty(name) ? varValues[name] : match;
        });
    }

    /**
     * Pick a random value for each variable in var_specs.
     * Supports min/max/step (integer or float).
     * @param {Object} varSpecs  { varName: { min, max, step } }
     */
    function pickVarValues(varSpecs) {
        const result = {};
        for (const [name, spec] of Object.entries(varSpecs)) {
            const { min, max, step = 1 } = spec;
            const steps = Math.round((max - min) / step);
            const chosen = min + Math.round(Math.random() * steps) * step;
            // Convert to string for safe template text substitution via regex replace
            result[name] = parseFloat(chosen.toFixed(10)).toString();
        }
        return result;
    }

    /**
     * Generate a question from a template.
     * @param {Object} template
     * @returns {{ question_text: string, options: null, answer: string|null }}
     */
    function generateFromTemplate(template) {
        const varValues = pickVarValues(template.var_specs || {});
        const question_text = substituteVars(template.template_text || '', varValues);
        const answer = template.answer_template
            ? substituteVars(template.answer_template, varValues)
            : null;
        const options = template.options_template
            ? generateOptionsFromTemplate(template.options_template, varValues)
            : null;
        return { question_text, options, answer };
    }

    /**
     * Generate MC options from options_template.
     * @param {Object} optTemplate  { A: '...{x}...', B: '...', ... }
     * @param {Object} varValues
     */
    function generateOptionsFromTemplate(optTemplate, varValues) {
        const result = {};
        for (const [key, text] of Object.entries(optTemplate)) {
            result[key] = substituteVars(text, varValues);
        }
        return result;
    }

    /**
     * Main public function.
     * @param {Object} params
     * @param {string} params.examKey       e.g. 's1-term3'
     * @param {string} params.paper         e.g. 'p2'
     * @param {string} params.qId           e.g. '2025S1Q05'
     * @param {string} [params.templateMode] 'auto' (default)
     * @returns {Promise<{question_text, options, answer}|null>}
     */
    async function generateMimicQuestion({ examKey, paper, qId, templateMode = 'auto' }) {
        const template = await findTemplate(examKey, paper, qId);
        if (!template) return null;
        return generateFromTemplate(template);
    }

    // Expose on global object (window in browsers)
    global.examMimic = {
        generateMimicQuestion,
        loadExamTemplates,
        loadAllTemplates,
        generateFromTemplate,
        // Utility for teacher page
        substituteVars,
        pickVarValues
    };

}(typeof window !== 'undefined' ? window : this));
