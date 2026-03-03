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
	'hexagon-minus-three-circles': () => {
		const n = randomStep(1.2, 4, 0.1);
		const answer = ((3 * Math.sqrt(3)) / 2) * n * n - Math.PI;
		return {
			prompt: `For n = ${n.toFixed(1)}, compute the target area A = (3√3/2)n² − π.`,
			answer,
			tolerance: 0.05,
			hint: 'Round to 2 decimal places.'
		};
	},
	'regular-polygon-triangle-decomposition': () => {
		const sides = randomInt(5, 8);
		const sideLength = randomStep(1.2, 3, 0.1);
		const apothem = sideLength / (2 * Math.tan(Math.PI / sides));
		const answer = (sides * sideLength * apothem) / 2;
		return {
			prompt: `A regular ${sides}-gon has side length s = ${sideLength.toFixed(1)}. What is its area?`,
			answer,
			tolerance: 0.05,
			hint: 'Use A = (ns²) / (4 tan(π/n)).'
		};
	},
	'lattice-paths-explorer': () => {
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
	'lissajous-pattern-lab': () => {
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
	'simple-interest-growth': () => {
		const principal = randomInt(500, 6000);
		const rate = randomStep(0.01, 0.12, 0.005);
		const years = randomInt(1, 12);
		const answer = principal * (1 + rate * years);
		return {
			prompt: `Using simple interest, find A when P = ${principal}, r = ${rate.toFixed(3)}, and t = ${years}.`,
			answer,
			tolerance: 0.1,
			hint: 'Use A = P(1 + rt).'
		};
	},
	'compound-interest-growth': () => {
		const principal = randomInt(500, 6000);
		const rate = randomStep(0.01, 0.12, 0.005);
		const compoundsPerYear = [1, 2, 4, 12, 52][randomInt(0, 4)];
		const years = randomInt(1, 12);
		const answer = principal * (1 + rate / compoundsPerYear) ** (compoundsPerYear * years);
		return {
			prompt: `Find A when P = ${principal}, r = ${rate.toFixed(3)}, n = ${compoundsPerYear}, and t = ${years}.`,
			answer,
			tolerance: 0.2,
			hint: 'Use A = P(1 + r/n)^(nt).'
		};
	},
	'continuous-compounding-growth': () => {
		const principal = randomInt(500, 6000);
		const rate = randomStep(0.01, 0.12, 0.005);
		const years = randomInt(1, 12);
		const answer = principal * Math.exp(rate * years);
		return {
			prompt: `With continuous compounding, find A when P = ${principal}, r = ${rate.toFixed(3)}, and t = ${years}.`,
			answer,
			tolerance: 0.2,
			hint: 'Use A = Pe^(rt).'
		};
	},
	'compound-interest-convergence-to-e': () => {
		const n = randomInt(12, 1500);
		const answer = Math.pow(1 + 1 / n, n);
		return {
			prompt: `For n = ${n}, approximate A_n = (1 + 1/n)^n.`,
			answer,
			tolerance: 0.002,
			hint: 'The value should be between 2 and e.'
		};
	},
	'pascal-triangle-modulo-explorer': () => {
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
	'polygon-sum-of-interior-angles': () => {
		const sides = randomInt(3, 12);
		const answer = (sides - 2) * 180;
		return {
			prompt: `What is the sum of interior angles of a ${sides}-gon?`,
			answer,
			tolerance: 0,
			hint: 'Use (n − 2) × 180.'
		};
	},
	'regular-interior-angle': () => {
		const sides = randomInt(3, 12);
		const answer = ((sides - 2) * 180) / sides;
		return {
			prompt: `What is one interior angle of a regular ${sides}-gon?`,
			answer,
			tolerance: 0.1,
			hint: 'Use ((n − 2) × 180) / n.'
		};
	},
	'unit-circle-sine-cosine-identity': () => {
		return {
			prompt: 'For any point (x, y) on the unit circle, what is x^2 + y^2?',
			answer: 1,
			tolerance: 0,
			hint: 'Use the unit-circle equation x^2 + y^2 = 1.'
		};
	},
	'reflection-over-a-horizontal-line': () => {
		const k = randomInt(-6, 6);
		const x = randomInt(-8, 8);
		const y = randomInt(k + 1, 10);
		const answer = 2 * k - y;
		return {
			prompt: `Reflect P = (${x}, ${y}) across y = ${k}. What is the reflected y-coordinate?`,
			answer,
			tolerance: 0,
			hint: "For reflection across y = k, use y' = 2k - y."
		};
	},
	'reflection-over-a-vertical-line': () => {
		const k = randomInt(-6, 6);
		const x = randomInt(k + 1, 10);
		const y = randomInt(-8, 8);
		const answer = 2 * k - x;
		return {
			prompt: `Reflect P = (${x}, ${y}) across x = ${k}. What is the reflected x-coordinate?`,
			answer,
			tolerance: 0,
			hint: "For reflection across x = k, use x' = 2k - x."
		};
	},
	'reflection-over-y-equals-x': () => {
		const x = randomInt(-8, 8);
		let y = randomInt(-8, 8);
		if (y === x) {
			y = y === 8 ? 7 : y + 1;
		}
		return {
			prompt: `Reflect P = (${x}, ${y}) across y = x. What is the reflected x-coordinate?`,
			answer: y,
			tolerance: 0,
			hint: "Reflection across y = x swaps coordinates, so (x, y) -> (y, x)."
		};
	},
	'reflection-over-y-equals-x-plus-b': () => {
		const b = randomInt(-5, 5);
		const x = randomInt(-8, 8);
		const y = randomInt(-8, 8);
		const answer = y - b;
		return {
			prompt: `Reflect P = (${x}, ${y}) across y = x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}. What is the reflected x-coordinate?`,
			answer,
			tolerance: 0,
			hint: "For reflection across y = x + b, use x' = y - b."
		};
	},
	'reflection-over-y-equals-x-plus-b-three-step-shift': () => {
		const b = randomInt(-5, 5);
		const x = randomInt(-8, 8);
		const answer = x + b;
		return {
			prompt: `Using the 3-step shift method for y = x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}, reflect P = (${x}, y). What is the reflected y-coordinate?`,
			answer,
			tolerance: 0,
			hint: "Subtract b, swap coordinates, then add b: y' = x + b."
		};
	},
	'reflection-over-y-equals-mx-plus-b-steps': () => {
		const m = randomInt(-3, 3);
		const b = randomInt(-5, 5);
		const x = randomInt(-6, 6);
		const y = randomInt(-6, 6);
		const answer = x - (2 * m * (m * x - y + b)) / (m * m + 1);
		const slopeText = m.toString();
		const lineText = b === 0 ? `${slopeText}x` : `${slopeText}x ${b > 0 ? '+' : '-'} ${Math.abs(b)}`;
		return {
			prompt: `Reflect P = (${x}, ${y}) across y = ${lineText}. What is the reflected x-coordinate?`,
			answer,
			tolerance: 0.02,
			hint: "Use x' = x - [2m(mx - y + b)] / (m² + 1)."
		};
	},
	'projectile-trajectory': () => {
		const v0 = randomStep(20, 100, 10);
		const angleDeg = randomStep(10, 80, 5);
		const theta = (angleDeg * Math.PI) / 180;
		const vy = v0 * Math.sin(theta);
		const answer = (2 * vy) / 9.8;
		return {
			prompt: `A projectile is launched at v₀ = ${v0} m/s and θ = ${angleDeg}°. What is the time of flight T in seconds? (Round to 2 decimal places.)`,
			answer,
			tolerance: 0.02,
			hint: 'Use T = 2v₀ sin θ / g with g = 9.8 m/s².'
		};
	},
	'velocity-components': () => {
		const v0 = randomInt(10, 50);
		const angleDeg = randomStep(10, 80, 5);
		const theta = (angleDeg * Math.PI) / 180;
		const answer = parseFloat((v0 * Math.cos(theta)).toFixed(2));
		return {
			prompt: `An object is launched at v₀ = ${v0} m/s at an angle of θ = ${angleDeg}°. What is the horizontal component vₓ (to 2 decimal places)?`,
			answer,
			tolerance: 0.05,
			hint: 'Use vₓ = v₀ cos θ.'
		};
	},
	'projectile-range-vs-angle': () => {
		const v0 = randomStep(20, 100, 10);
		const angleDeg = randomStep(10, 80, 5);
		const theta = (angleDeg * Math.PI) / 180;
		const answer = parseFloat(((v0 * v0 * Math.sin(2 * theta)) / 9.8).toFixed(1));
		return {
			prompt: `A projectile is launched at v₀ = ${v0} m/s and θ = ${angleDeg}°. What is the horizontal range R in meters? (Round to 1 decimal place.)`,
			answer,
			tolerance: 0.5,
			hint: 'Use R = v₀² sin(2θ) / g with g = 9.8 m/s².'
		};
	},
	'polyhedron-surface-area': () => {
		const prismLength = randomStep(2, 12, 0.5);
		const prismWidth = randomStep(2, 12, 0.5);
		const prismHeight = randomStep(2, 12, 0.5);
		const answer = 2 * (prismLength * prismWidth + prismLength * prismHeight + prismWidth * prismHeight);
		return {
			prompt: `A rectangular prism has l = ${prismLength}, w = ${prismWidth}, and h = ${prismHeight}. What is the total surface area?`,
			answer,
			tolerance: 0.05,
			hint: 'Use SA = 2lw + 2lh + 2wh.'
		};
	},
	'sector-fraction-area': () => {
		const theta = randomStep(15, 330, 15);
		const answer = (theta / 360) * Math.PI;
		return {
			prompt: `For a unit circle and central angle θ = ${theta}°, what is the sector area?`,
			answer,
			tolerance: 0.03,
			hint: 'Use (θ/360)πr² with r = 1.'
		};
	},
	'stick-figure-tree-shadow-proportion': () => {
		const personHeight = randomStep(4, 7, 0.1);
		const personShadow = randomStep(2.5, 6, 0.1);
		const treeShadow = randomStep(8, 30, 0.5);
		const answer = (personHeight / personShadow) * treeShadow;
		return {
			prompt: `Fill in the missing value: ${personHeight.toFixed(1)}/${personShadow.toFixed(1)} = x/${treeShadow.toFixed(1)}. What is x (in feet)?`,
			answer,
			tolerance: 0.05,
			hint: 'Cross-multiply: x = (person height × tree shadow) ÷ person shadow.'
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
