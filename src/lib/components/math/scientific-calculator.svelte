<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';

	export const toolMeta: MathToolMeta = {
		id: 'scientific-calculator',
		title: 'Scientific Calculator',
		description:
			'Enter algebraic and trigonometric expressions with live math rendering, instant evaluation, and history.',
		inputs:
			'Keyboard or keypad expressions with operators, parentheses, trig/log functions, roots, constants, and Ans.',
		outputs:
			'Live rendered math expression, right-aligned running result, and a short recent-results history.',
		useCase:
			'Use for arithmetic fluency, function practice, and quick verification during instruction or homework.',
		tags: ['algebra', 'trigonometry', 'calculator', 'functions', 'evaluation'],
		audience: ['students', 'instructors'],
		kind: 'interactive'
	};
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import { evaluate, parse } from 'mathjs';
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import { Undo2, Redo2, Settings, ChevronLeft, ChevronRight, AlertTriangle } from '@lucide/svelte';

	type AngleMode = 'deg' | 'rad';
	type ActiveTab = 'main' | 'abc' | 'func';

	type HistoryEntry = {
		id: number;
		expression: string;
		renderedTex: string;
		result: string;
	};

	let expressionInput = $state('');
	let angleMode = $state<AngleMode>('deg');
	let activeTab = $state<ActiveTab>('main');
	let errorMessage = $state<string | null>(null);
	let ansValue = $state(0);
	let lastAnswerText = $state('0');
	let history = $state<HistoryEntry[]>([]);
	let historyId = 0;
	let inputEl: HTMLInputElement | null = $state(null);
	let undoStack = $state<string[]>([]);
	let redoStack = $state<string[]>([]);
	let cursorPos = $state(0);

	const CURSOR_TEX = '\\textcolor{#3b82f6}{\\vert}';

	function normalizeExpression(value: string): string {
		return value
			.replace(/[×]/g, '*')
			.replace(/[÷]/g, '/')
			.replace(/π/g, 'pi')
			.replace(/\bANS\b/gi, 'ans')
			.replace(/\s+/g, ' ')
			.trim();
	}

	function toRadians(value: number, mode: AngleMode): number {
		return mode === 'deg' ? (value * Math.PI) / 180 : value;
	}

	function fromRadians(value: number, mode: AngleMode): number {
		return mode === 'deg' ? (value * 180) / Math.PI : value;
	}

	function toFiniteReal(value: unknown): number | null {
		if (typeof value === 'number') {
			return Number.isFinite(value) ? value : null;
		}
		if (typeof value === 'bigint') {
			const converted = Number(value);
			return Number.isFinite(converted) ? converted : null;
		}

		if (value && typeof value === 'object' && 're' in value && 'im' in value) {
			const maybeComplex = value as { re?: unknown; im?: unknown };
			if (typeof maybeComplex.re === 'number' && typeof maybeComplex.im === 'number') {
				if (Math.abs(maybeComplex.im) < 1e-12 && Number.isFinite(maybeComplex.re)) {
					return maybeComplex.re;
				}
			}
		}

		const numeric = Number(value);
		if (Number.isFinite(numeric)) {
			return numeric;
		}

		return null;
	}

	function evaluateExpression(expression: string, ans: number, mode: AngleMode): number | null {
		if (!expression.trim()) {
			return null;
		}

		const scope = {
			ans,
			e: Math.E,
			pi: Math.PI,
			mod: (a: number, b: number) => a % b,
			sin: (value: number) => Math.sin(toRadians(value, mode)),
			cos: (value: number) => Math.cos(toRadians(value, mode)),
			tan: (value: number) => Math.tan(toRadians(value, mode)),
			asin: (value: number) => fromRadians(Math.asin(value), mode),
			acos: (value: number) => fromRadians(Math.acos(value), mode),
			atan: (value: number) => fromRadians(Math.atan(value), mode),
			log: (value: number) => Math.log10(value),
			ln: (value: number) => Math.log(value),
			abs: (value: number) => Math.abs(value),
			nthRoot: (value: number, n: number) => Math.sign(value) * Math.pow(Math.abs(value), 1 / n),
			root: (n: number, value: number) => Math.sign(value) * Math.pow(Math.abs(value), 1 / n),
			exp: (value: number) => Math.exp(value)
		};

		try {
			const result = evaluate(expression, scope);
			return toFiniteReal(result);
		} catch {
			return null;
		}
	}

	function normalizeTex(tex: string): string {
		return tex
			.replace(/\\ln/g, '\\log')
			.replace(/\\mathrm\{ln\}/g, '\\ln')
			.replace(/\\mathrm\{ans\}/gi, '\\mathrm{Ans}');
	}

	function buildRenderedTex(expression: string): string {
		if (!expression.trim()) {
			return '';
		}

		try {
			return normalizeTex(parse(expression).toTex());
		} catch {
			return '';
		}
	}

	/**
	 * Build TeX with a visible cursor injected at `rawCursorPos`.
	 * Handles trailing operators by appending a placeholder so the
	 * expression never disappears mid-typing.
	 */
	function buildDisplayTex(rawExpr: string, rawCurPos: number): string {
		if (!rawExpr.trim()) return '';

		// Determine whether we can safely inject ZCUR at the cursor position.
		// Safe when the character immediately before the cursor is an operator,
		// open-paren, comma, or cursor is at position 0.
		const partBefore = rawExpr.slice(0, rawCurPos).trimEnd();
		const charBefore = partBefore.length > 0 ? partBefore[partBefore.length - 1] : '';
		const safeToInject = rawCurPos === 0 || /[+\-*/÷×^(,]/.test(charBefore);

		if (safeToInject) {
			const augmented = rawExpr.slice(0, rawCurPos) + 'ZCUR' + rawExpr.slice(rawCurPos);
			const normalized = normalizeExpression(augmented);
			const closers = ')'.repeat(getUnclosedParenthesisCount(normalized));
			try {
				const tex = normalizeTex(parse(normalized + closers).toTex());
				return tex.replace(/\s*ZCUR/g, CURSOR_TEX);
			} catch {
				// fall through
			}
		}

		// Fallback: render expression normally and append cursor at the end
		const normalized = normalizeExpression(rawExpr);
		const closers = ')'.repeat(getUnclosedParenthesisCount(normalized));

		try {
			const tex = normalizeTex(parse(normalized + closers).toTex());
			return tex + ' ' + CURSOR_TEX;
		} catch {
			// expression itself can't parse – try padding trailing operator
		}

		// Trailing-operator rescue: append dummy variable, replace in TeX
		const trimmed = normalized.trimEnd();
		if (/[+\-*/^]$/.test(trimmed)) {
			try {
				const padded = trimmed + 'ZARG';
				const closers2 = ')'.repeat(getUnclosedParenthesisCount(padded));
				const tex = normalizeTex(parse(padded + closers2).toTex());
				return tex.replace(/\s*ZARG/g, '\\square') + ' ' + CURSOR_TEX;
			} catch {
				// truly unparseable
			}
		}

		return CURSOR_TEX;
	}

	function syncCursor() {
		cursorPos = inputEl?.selectionStart ?? expressionInput.length;
	}

	function getUnclosedParenthesisCount(expression: string): number {
		let balance = 0;
		for (const character of expression) {
			if (character === '(') {
				balance += 1;
			} else if (character === ')' && balance > 0) {
				balance -= 1;
			}
		}
		return balance;
	}

	function formatNumber(value: number): string {
		if (Object.is(value, -0)) {
			return '0';
		}
		if (Number.isInteger(value) && Math.abs(value) < 1_000_000_000) {
			return value.toString();
		}
		if (Math.abs(value) >= 1_000_000 || (Math.abs(value) > 0 && Math.abs(value) < 0.000001)) {
			return value.toExponential(8).replace(/\.0+e/, 'e').replace(/(\.\d*?)0+e/, '$1e');
		}
		return Number(value.toFixed(10)).toString();
	}

	const normalizedInput = $derived(normalizeExpression(expressionInput));
	const unmatchedClosers = $derived(getUnclosedParenthesisCount(normalizedInput));
	const ghostClosers = $derived(unmatchedClosers > 0 ? ')'.repeat(unmatchedClosers) : '');
	const previewExpression = $derived(`${normalizedInput}${ghostClosers}`);
	const displayTex = $derived(buildDisplayTex(expressionInput, cursorPos));

	const liveResultText = $derived.by(() => {
		if (!previewExpression.trim()) {
			return null;
		}
		const value = evaluateExpression(previewExpression, ansValue, angleMode);
		if (value === null) {
			return null;
		}
		return formatNumber(value);
	});

	const displayResultText = $derived(liveResultText ?? lastAnswerText);
	const hasError = $derived(
		!!normalizedInput &&
			(liveResultText === null || unmatchedClosers > 0)
	);

	const previousEntry = $derived(history[0]);

	function pushUndo() {
		undoStack = [...undoStack, expressionInput];
		redoStack = [];
	}

	async function insertToken(token: string, cursorOffset = token.length) {
		errorMessage = null;
		pushUndo();
		if (!inputEl) {
			expressionInput += token;
			cursorPos = expressionInput.length;
			return;
		}

		const start = inputEl.selectionStart ?? expressionInput.length;
		const end = inputEl.selectionEnd ?? expressionInput.length;
		expressionInput = `${expressionInput.slice(0, start)}${token}${expressionInput.slice(end)}`;

		await tick();
		inputEl?.focus();
		const nextCursor = start + cursorOffset;
		inputEl?.setSelectionRange(nextCursor, nextCursor);
		cursorPos = nextCursor;
	}

	async function backspaceToken() {
		errorMessage = null;
		pushUndo();
		if (!inputEl) {
			expressionInput = expressionInput.slice(0, -1);
			cursorPos = expressionInput.length;
			return;
		}

		const start = inputEl.selectionStart ?? expressionInput.length;
		const end = inputEl.selectionEnd ?? expressionInput.length;

		if (start === end) {
			if (start === 0) {
				undoStack = undoStack.slice(0, -1);
				return;
			}
			expressionInput = `${expressionInput.slice(0, start - 1)}${expressionInput.slice(end)}`;
			await tick();
			inputEl?.focus();
			inputEl?.setSelectionRange(start - 1, start - 1);
			cursorPos = start - 1;
			return;
		}

		expressionInput = `${expressionInput.slice(0, start)}${expressionInput.slice(end)}`;
		await tick();
		inputEl?.focus();
		inputEl?.setSelectionRange(start, start);
		cursorPos = start;
	}

	function clearInput() {
		errorMessage = null;
		pushUndo();
		expressionInput = '';
		cursorPos = 0;
	}

	function undo() {
		if (undoStack.length === 0) return;
		redoStack = [...redoStack, expressionInput];
		expressionInput = undoStack[undoStack.length - 1];
		undoStack = undoStack.slice(0, -1);
		void tick().then(() => {
			inputEl?.focus();
			cursorPos = expressionInput.length;
		});
	}

	function redo() {
		if (redoStack.length === 0) return;
		undoStack = [...undoStack, expressionInput];
		expressionInput = redoStack[redoStack.length - 1];
		redoStack = redoStack.slice(0, -1);
		void tick().then(() => {
			inputEl?.focus();
			cursorPos = expressionInput.length;
		});
	}

	function moveCursorLeft() {
		if (!inputEl) return;
		const pos = (inputEl.selectionStart ?? expressionInput.length) - 1;
		if (pos >= 0) {
			inputEl.setSelectionRange(pos, pos);
			cursorPos = pos;
		}
	}

	function moveCursorRight() {
		if (!inputEl) return;
		const pos = (inputEl.selectionEnd ?? expressionInput.length) + 1;
		const max = expressionInput.length;
		if (pos <= max) {
			const clamped = Math.min(pos, max);
			inputEl.setSelectionRange(clamped, clamped);
			cursorPos = clamped;
		}
	}

	function useAns() {
		void insertToken('ans');
	}

	function addFractionTemplate() {
		void insertToken('()/()', 1);
	}

	function addNthRootTemplate() {
		void insertToken('nthRoot(, )', 8);
	}

	function addFunctionTemplate(name: string) {
		void insertToken(`${name}()`, name.length + 1);
	}

	function addSquare() {
		void insertToken('^2');
	}

	function addPower() {
		void insertToken('^');
	}

	function setMode(mode: AngleMode) {
		angleMode = mode;
	}

	function commitExpression() {
		errorMessage = null;

		const expression = normalizedInput;
		if (!expression) {
			return;
		}

		const unclosed = getUnclosedParenthesisCount(expression);
		if (unclosed > 0) {
			errorMessage = `Close ${unclosed} pending parenthesis before pressing Enter.`;
			return;
		}

		const evaluated = evaluateExpression(expression, ansValue, angleMode);
		if (evaluated === null) {
			errorMessage = 'Could not evaluate this expression. Check syntax or domain limits.';
			return;
		}

		const renderedTex = buildRenderedTex(expression);
		const resultText = formatNumber(evaluated);
		historyId += 1;
		history = [{ id: historyId, expression, renderedTex, result: resultText }, ...history].slice(0, 6);
		ansValue = evaluated;
		lastAnswerText = resultText;
		expressionInput = '';
		undoStack = [];
		redoStack = [];
		cursorPos = 0;
	}

	function submitExpression(event: SubmitEvent) {
		event.preventDefault();
		commitExpression();
	}
</script>

<div class="calc-shell">
	<!-- Display area -->
	<div class="calc-display">
		<!-- History window -->
		<div class="calc-history">
			{#if history.length > 1}
				<div class="space-y-1.5 overflow-y-auto">
					{#each history.slice(1, 5) as line (line.id)}
						<div class="flex items-center justify-between gap-2 text-xs text-muted-foreground">
							{#if line.renderedTex}
								<MathExpression math={line.renderedTex} class="min-w-0 truncate" />
							{:else}
								<span class="truncate font-mono">{line.expression}</span>
							{/if}
							<span class="shrink-0 font-mono">= {line.result}</span>
						</div>
					{/each}
				</div>
			{:else}
				<span class="text-muted-foreground/60">History</span>
			{/if}
		</div>

		<!-- Previous calculation -->
		{#if previousEntry}
			<div class="calc-prev">
				{#if previousEntry.renderedTex}
					<MathExpression math={previousEntry.renderedTex} class="min-w-0 truncate" />
				{:else}
					<span class="truncate font-mono">{previousEntry.expression}</span>
				{/if}
				<span class="shrink-0 font-mono font-semibold text-primary">= {previousEntry.result}</span>
			</div>
		{/if}

		<!-- Current input -->
		<div
			class="calc-input-wrap"
			class:calc-input-error={hasError}
			role="button"
			tabindex="0"
			onclick={() => inputEl?.focus()}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					inputEl?.focus();
				}
			}}
		>
			<div class="calc-input-inner">
				{#if displayTex}
					<span class="calc-cursor-wrap min-w-0 flex-1 overflow-x-auto text-left">
						<MathExpression math={displayTex} />
					</span>
				{:else}
					<span class="text-muted-foreground">Type an expression...</span>
				{/if}
				{#if !hasError || !normalizedInput}
					<span class="shrink-0 font-mono font-semibold text-primary">= {displayResultText}</span>
				{/if}
			</div>
			{#if hasError}
				<AlertTriangle class="shrink-0 size-5 text-orange-500" aria-label="Syntax or evaluation error" />
			{/if}
			<input
				bind:this={inputEl}
				type="text"
				bind:value={expressionInput}
				class="calc-input-hidden"
				autocomplete="off"
				spellcheck="false"
				aria-label="Calculator expression input"
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						commitExpression();
					}
				}}
				onfocus={syncCursor}
				oninput={syncCursor}
				onkeyup={syncCursor}
				onmouseup={syncCursor}
				onselect={syncCursor}
			/>
		</div>
	</div>

	<!-- Top row: tabs, angle mode, utilities -->
	<div class="calc-top-row">
		<div class="calc-tabs">
			<button
				type="button"
				class="calc-tab"
				class:active={activeTab === 'main'}
				onclick={() => (activeTab = 'main')}
			>
				main
			</button>
			<button
				type="button"
				class="calc-tab"
				class:active={activeTab === 'abc'}
				onclick={() => (activeTab = 'abc')}
			>
				abc
			</button>
			<button
				type="button"
				class="calc-tab"
				class:active={activeTab === 'func'}
				onclick={() => (activeTab = 'func')}
			>
				func
			</button>
		</div>
		<div class="calc-angle-mode">
			<button
				type="button"
				class="calc-mode-btn"
				class:active={angleMode === 'rad'}
				onclick={() => setMode('rad')}
			>
				RAD
			</button>
			<button
				type="button"
				class="calc-mode-btn"
				class:active={angleMode === 'deg'}
				onclick={() => setMode('deg')}
			>
				DEG
			</button>
		</div>
		<div class="calc-utils">
			<button type="button" class="calc-icon-btn" onclick={undo} aria-label="Undo" disabled={undoStack.length === 0}>
				<Undo2 class="size-4" />
			</button>
			<button type="button" class="calc-icon-btn" onclick={redo} aria-label="Redo" disabled={redoStack.length === 0}>
				<Redo2 class="size-4" />
			</button>
			<button type="button" class="calc-icon-btn calc-clear" onclick={clearInput}>
				clear
			</button>
			<button type="button" class="calc-icon-btn" aria-label="Settings">
				<Settings class="size-4" />
			</button>
		</div>
	</div>

	<!-- Keypad -->
	<form class="calc-keypad" onsubmit={submitExpression}>
		<div class="calc-grid">
			<!-- Left column: scientific functions -->
			<div class="calc-func-col">
				<button type="button" class="calc-key" onclick={addSquare}>a²</button>
				<button type="button" class="calc-key" onclick={addPower}>aᵇ</button>
				<button type="button" class="calc-key" onclick={() => addFunctionTemplate('abs')}>|a|</button>
				<button type="button" class="calc-key" onclick={() => addFunctionTemplate('sqrt')}>√</button>
				<button type="button" class="calc-key" onclick={addNthRootTemplate}>ⁿ√</button>
				<button type="button" class="calc-key" onclick={() => void insertToken('pi')}>π</button>
				<button type="button" class="calc-key" onclick={() => addFunctionTemplate('sin')}>sin</button>
				<button type="button" class="calc-key" onclick={() => addFunctionTemplate('cos')}>cos</button>
				<button type="button" class="calc-key" onclick={() => addFunctionTemplate('tan')}>tan</button>
				<button type="button" class="calc-key" onclick={() => void insertToken('(')}>(</button>
				<button type="button" class="calc-key" onclick={() => void insertToken(')')}>)</button>
				<button type="button" class="calc-key" onclick={() => void insertToken(',')}>,</button>
			</div>

			<!-- Center: number pad -->
			<div class="calc-num-pad">
				<button type="button" class="calc-key" onclick={() => void insertToken('7')}>7</button>
				<button type="button" class="calc-key" onclick={() => void insertToken('8')}>8</button>
				<button type="button" class="calc-key" onclick={() => void insertToken('9')}>9</button>
				<button type="button" class="calc-key" onclick={() => void insertToken('4')}>4</button>
				<button type="button" class="calc-key" onclick={() => void insertToken('5')}>5</button>
				<button type="button" class="calc-key" onclick={() => void insertToken('6')}>6</button>
				<button type="button" class="calc-key" onclick={() => void insertToken('1')}>1</button>
				<button type="button" class="calc-key" onclick={() => void insertToken('2')}>2</button>
				<button type="button" class="calc-key" onclick={() => void insertToken('3')}>3</button>
				<button type="button" class="calc-key" onclick={() => void insertToken('0')}>0</button>
				<button type="button" class="calc-key" onclick={() => void insertToken('.')}>.</button>
				<button type="button" class="calc-key" onclick={useAns}>ans</button>
			</div>

			<!-- Right: operators and actions -->
			<div class="calc-op-col">
				<button type="button" class="calc-key" onclick={() => void insertToken('/')}>÷</button>
				<button type="button" class="calc-key" onclick={() => void insertToken('%')}>%</button>
				<button type="button" class="calc-key" onclick={addFractionTemplate}>a/b</button>
				<button type="button" class="calc-key" onclick={() => void insertToken('*')}>×</button>
				<button type="button" class="calc-key" onclick={moveCursorLeft} aria-label="Cursor left">
					<ChevronLeft class="size-4" />
				</button>
				<button type="button" class="calc-key" onclick={moveCursorRight} aria-label="Cursor right">
					<ChevronRight class="size-4" />
				</button>
				<button type="button" class="calc-key" onclick={backspaceToken} aria-label="Backspace / delete">
					<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M9 10l4 4m0-4l-4 4" />
						<path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
					</svg>
				</button>
				<button type="button" class="calc-key" onclick={() => void insertToken('-')}>-</button>
				<button type="submit" class="calc-key calc-enter" aria-label="Enter / equals">
					<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M5 12h14M12 5l7 7-7 7" />
					</svg>
				</button>
				<button type="button" class="calc-key" onclick={() => void insertToken('+')}>+</button>
			</div>
		</div>
	</form>

	{#if errorMessage}
		<p class="calc-error">{errorMessage}</p>
	{/if}
</div>

<style>
	.calc-shell {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		border-radius: 0.75rem;
		border: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
		background: white;
		padding: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
	}

	.calc-display {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border-radius: 0.5rem;
		background: #f8fafc;
		border: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
		padding: 0.75rem;
	}

	.calc-history {
		min-height: 4rem;
		max-height: 6rem;
		border-radius: 0.375rem;
		background: white;
		padding: 0.5rem 0.75rem;
		border: 1px solid color-mix(in oklab, var(--border) 50%, transparent);
	}

	.calc-prev {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.25rem 0;
		font-size: 0.875rem;
	}

	.calc-input-wrap {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 2.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
		background: white;
		transition: border-color 0.2s, box-shadow 0.2s;
		cursor: text;
	}

	.calc-input-wrap:focus-within {
		border-color: hsl(var(--primary));
		box-shadow: 0 0 0 2px color-mix(in oklab, hsl(var(--primary)) 25%, transparent);
	}

	.calc-input-wrap.calc-input-error {
		border-color: #f97316;
	}

	.calc-input-inner {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		min-width: 0;
		font-size: 0.9375rem;
	}

	.calc-input-hidden {
		position: absolute;
		inset: 0;
		opacity: 0;
		width: 100%;
		height: 100%;
		cursor: text;
		font-size: 1rem;
	}

	.calc-top-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.calc-tabs {
		display: flex;
		gap: 0.5rem;
	}

	.calc-tab {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: 0;
		background: transparent;
		color: #64748b;
		border-bottom: 2px solid transparent;
		transition: color 0.15s, border-color 0.15s;
	}

	.calc-tab:hover {
		color: #334155;
	}

	.calc-tab.active {
		background: transparent;
		color: #1e293b;
		border-bottom-color: hsl(var(--primary));
	}

	.calc-angle-mode {
		display: flex;
		gap: 0.125rem;
	}

	.calc-mode-btn {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 0.25rem;
		background: #e2e8f0;
		color: #64748b;
		transition: background 0.15s, color 0.15s;
	}

	.calc-mode-btn:hover {
		background: #cbd5e1;
		color: #334155;
	}

	.calc-mode-btn.active {
		background: hsl(var(--primary));
		color: white;
	}

	.calc-utils {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.calc-icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.25rem;
		background: transparent;
		color: #64748b;
		transition: background 0.15s, color 0.15s;
	}

	.calc-icon-btn:hover:not(:disabled) {
		background: #e2e8f0;
		color: #334155;
	}

	.calc-icon-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.calc-icon-btn.calc-clear {
		width: auto;
		padding: 0 0.5rem;
		font-size: 0.75rem;
	}

	.calc-keypad {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.calc-grid {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.5rem;
		align-items: start;
	}

	.calc-func-col {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(4, 1fr);
		gap: 0.25rem;
	}

	.calc-num-pad {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(4, 1fr);
		gap: 0.25rem;
	}

	.calc-op-col {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(4, 1fr);
		gap: 0.25rem;
	}

	.calc-key {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2.25rem;
		height: 2.25rem;
		padding: 0 0.5rem;
		font-size: 0.8125rem;
		font-weight: 600;
		border-radius: 0.375rem;
		border: 1px solid color-mix(in oklab, var(--border) 75%, transparent);
		background: #f1f5f9;
		color: #334155;
		transition: border-color 0.15s, background 0.15s;
	}

	.calc-key:hover {
		background: #e2e8f0;
		border-color: #cbd5e1;
	}

	.calc-enter {
		grid-row: span 2;
		height: auto;
		min-height: 4.75rem;
		background: hsl(var(--primary));
		color: white;
		border-color: hsl(var(--primary));
	}

	.calc-enter:hover {
		background: color-mix(in oklab, hsl(var(--primary)) 90%, black);
		border-color: color-mix(in oklab, hsl(var(--primary)) 90%, black);
	}

	.calc-error {
		border-radius: 0.375rem;
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #b91c1c;
	}

	/* Blinking cursor inside KaTeX output */
	.calc-cursor-wrap :global([style*="3b82f6"]) {
		animation: calc-cursor-blink 1s steps(1, end) infinite;
	}

	@keyframes calc-cursor-blink {
		0%,
		49% {
			opacity: 1;
		}
		50%,
		100% {
			opacity: 0;
		}
	}
</style>
