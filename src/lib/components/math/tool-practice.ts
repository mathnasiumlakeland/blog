export type ToolPracticePrompt = {
	prompt: string;
	answer: number;
	tolerance: number;
	hint?: string;
};

type PracticeFactory = () => ToolPracticePrompt;

function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomStep(min: number, max: number, step: number) {
	const span = Math.round((max - min) / step);
	return min + randomInt(0, span) * step;
}

function gcd(a: number, b: number): number {
	let left = Math.abs(Math.round(a));
	let right = Math.abs(Math.round(b));
	while (right !== 0) {
		const tmp = right;
		right = left % right;
		left = tmp;
	}
	return left || 1;
}

function binomial(n: number, k: number): number {
	if (k < 0 || k > n) {
		return 0;
	}
	const c = Math.min(k, n - k);
	let value = 1;
	for (let i = 1; i <= c; i += 1) {
		value = (value * (n - c + i)) / i;
	}
	return Math.round(value);
}

const practiceFactories: Record<string, PracticeFactory> = {
	'hexagon-three-circles-visual': () => {
		const n = randomStep(1.2, 4, 0.1);
		const answer = ((3 * Math.sqrt(3)) / 2) * n * n - Math.PI;
		return {
			prompt: `For n = ${n.toFixed(1)}, compute the target area A = (3√3/2)n² − π.`,
			answer,
			tolerance: 0.05,
			hint: 'Round to 2 decimal places.'
		};
	},
	'hexagon-triangle-area-visual': () => {
		const n = randomStep(1.2, 3, 0.1);
		const answer = ((3 * Math.sqrt(3)) / 2) * n * n;
		return {
			prompt: `A regular hexagon has side length n = ${n.toFixed(1)}. What is its area?`,
			answer,
			tolerance: 0.05,
			hint: 'Use A = (3√3/2)n².'
		};
	},
	'lattice-paths-visual': () => {
		const m = randomInt(2, 8);
		const n = randomInt(2, 8);
		const answer = binomial(m + n, m);
		return {
			prompt: `How many shortest lattice paths go from (0,0) to (${m},${n})?`,
			answer,
			tolerance: 0,
			hint: 'Use C(m+n, m).'
		};
	},
	'lissajous-canvas': () => {
		const frequencyA = randomInt(2, 9);
		const frequencyB = randomInt(2, 9);
		const closureTurns = frequencyB / gcd(frequencyA, frequencyB);
		return {
			prompt: `For frequencies A = ${frequencyA} and B = ${frequencyB}, how many x-oscillation turns are needed before the pattern closes?`,
			answer: closureTurns,
			tolerance: 0,
			hint: 'Use B / gcd(A, B).'
		};
	},
	'pascal-modulo-canvas': () => {
		const n = randomInt(5, 12);
		const k = randomInt(2, n - 2);
		const mod = randomInt(2, 9);
		const answer = binomial(n, k) % mod;
		return {
			prompt: `Compute C(${n}, ${k}) mod ${mod}.`,
			answer,
			tolerance: 0,
			hint: 'Compute the binomial value first, then take remainder.'
		};
	},
	'polygon-triangulation-visual': () => {
		const sides = randomInt(3, 12);
		const answer = (sides - 2) * 180;
		return {
			prompt: `What is the sum of interior angles of a ${sides}-gon?`,
			answer,
			tolerance: 0,
			hint: 'Use (n − 2) × 180.'
		};
	},
	'regular-interior-angle-visual': () => {
		const sides = randomInt(3, 12);
		const answer = ((sides - 2) * 180) / sides;
		return {
			prompt: `What is one interior angle of a regular ${sides}-gon?`,
			answer,
			tolerance: 0.1,
			hint: 'Use ((n − 2) × 180) / n.'
		};
	},
	'sector-fraction-visual': () => {
		const theta = randomStep(15, 330, 15);
		const answer = (theta / 360) * Math.PI;
		return {
			prompt: `For a unit circle and central angle θ = ${theta}°, what is the sector area?`,
			answer,
			tolerance: 0.03,
			hint: 'Use (θ/360)πr² with r = 1.'
		};
	}
};

export function getPracticePromptByToolId(toolId: string): ToolPracticePrompt {
	const factory = practiceFactories[toolId];
	if (factory) {
		return factory();
	}

	return {
		prompt: 'Enter the value 0 to verify this fallback practice prompt.',
		answer: 0,
		tolerance: 0
	};
}
