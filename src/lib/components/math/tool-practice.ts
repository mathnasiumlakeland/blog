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

function permutation(n: number, k: number): number {
	if (k < 0 || k > n) {
		return 0;
	}

	let value = 1;
	for (let i = 0; i < k; i += 1) {
		value *= n - i;
	}
	return value;
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
	'combinatorics-formula-lab': () => {
		const variant = randomInt(0, 3);

		if (variant === 0) {
			const n = randomInt(2, 8);
			const r = randomInt(2, 6);
			return {
				prompt: `Permutations with replacement: compute ${n}^${r}.`,
				answer: n ** r,
				tolerance: 0,
				hint: 'Multiply n by itself r times.'
			};
		}

		if (variant === 1) {
			const n = randomInt(5, 9);
			const r = randomInt(2, Math.min(5, n));
			return {
				prompt: `Permutations in slots: compute ${n}P${r}.`,
				answer: permutation(n, r),
				tolerance: 0,
				hint: 'Use nPr = n! / (n - r)!'
			};
		}

		if (variant === 2) {
			const n = randomInt(5, 10);
			const r = randomInt(2, Math.min(5, n - 1));
			return {
				prompt: `Combinations: compute ${n}C${r}.`,
				answer: binomial(n, r),
				tolerance: 0,
				hint: 'Use nCr = n! / (r!(n - r)!).'
			};
		}

		const n = randomInt(5, 9);
		const m = randomInt(2, Math.min(4, n));
		return {
			prompt: `Duplicate-items model: compute ${n}!/${m}!`,
			answer: permutation(n, n - m),
			tolerance: 0,
			hint: 'Divide n! by m! to remove duplicate reorderings.'
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
	'parent-function-identification': () => {
		const parentFamilies = [
			{ code: 1, type: 'quadratic' as const, label: 'y=x^2' },
			{ code: 2, type: 'cubic' as const, label: 'y=x^3' },
			{ code: 3, type: 'linear' as const, label: 'y=x' },
			{ code: 4, type: 'square-root' as const, label: 'y=sqrt(x)' },
			{ code: 5, type: 'cube-root' as const, label: 'y=cuberoot(x)' },
			{ code: 6, type: 'absolute-value' as const, label: 'y=|x|' },
			{ code: 7, type: 'reciprocal' as const, label: 'y=1/x' },
			{ code: 8, type: 'reciprocal-squared' as const, label: 'y=1/x^2' }
		];
		const selectedFamily = parentFamilies[randomInt(0, parentFamilies.length - 1)];
		const a = [-3, -2, -1, 1, 2, 3][randomInt(0, 5)];
		const h = randomInt(-4, 4);
		const k = randomInt(-4, 4);

		const shiftedX =
			h === 0 ? 'x' : h > 0 ? `(x-${Math.abs(h)})` : `(x+${Math.abs(h)})`;
		const scalePrefix = a === 1 ? '' : a === -1 ? '-' : `${a}`;
		const reciprocalPrefix = a === 1 ? '' : a === -1 ? '-' : `${a}*`;
		const verticalShift =
			k === 0 ? '' : k > 0 ? ` + ${k}` : ` - ${Math.abs(k)}`;

		let equationCore = '';
		if (selectedFamily.type === 'quadratic') {
			equationCore = `${scalePrefix}${shiftedX}^2`;
		} else if (selectedFamily.type === 'cubic') {
			equationCore = `${scalePrefix}${shiftedX}^3`;
		} else if (selectedFamily.type === 'linear') {
			equationCore = `${scalePrefix}${shiftedX}`;
		} else if (selectedFamily.type === 'square-root') {
			equationCore = `${scalePrefix}sqrt${shiftedX}`;
		} else if (selectedFamily.type === 'cube-root') {
			equationCore = `${scalePrefix}cuberoot${shiftedX}`;
		} else if (selectedFamily.type === 'absolute-value') {
			equationCore = `${scalePrefix}|${shiftedX}|`;
		} else if (selectedFamily.type === 'reciprocal') {
			equationCore = `${reciprocalPrefix}1/${shiftedX}`;
		} else {
			equationCore = `${reciprocalPrefix}1/${shiftedX}^2`;
		}

		const answerKey = parentFamilies.map((family) => `${family.code}=${family.label}`).join(', ');
		return {
			prompt: `Use this key: ${answerKey}. Which code matches y = ${equationCore}${verticalShift}?`,
			answer: selectedFamily.code,
			tolerance: 0,
			hint: 'Ignore shifts and scale; match the parent-function family.'
		};
	},
	'simplifying-radicals-walkthrough': () => {
		const insideCandidates = [2, 3, 5, 6, 7, 10, 11, 13];
		const outside = randomInt(2, 12);
		const inside = insideCandidates[randomInt(0, insideCandidates.length - 1)];
		const radicand = outside * outside * inside;

		return {
			prompt: `Simplify sqrt(${radicand}) to a*sqrt(b). What is the outside coefficient a?`,
			answer: outside,
			tolerance: 0,
			hint: 'Use prime factors and pull one factor outside for every matching pair.'
		};
	},
	'function-translation-drag-practice': () => {
		const horizontal = randomInt(0, 1) === 1;
		let b = randomInt(-6, 6);
		if (b === 0) {
			b = randomInt(1, 6) * (randomInt(0, 1) === 0 ? -1 : 1);
		}

		if (horizontal) {
			const answer = -b;
			const plusBText = b > 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
			return {
				prompt: `For y = f(x ${plusBText}), what horizontal translation should be applied to f(x)? Use right-positive and left-negative units.`,
				answer,
				tolerance: 0,
				hint: 'x + b shifts left by b, and x - b shifts right by b.'
			};
		}

		const signedBText = b > 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
		return {
			prompt: `For y = f(x) ${signedBText}, what vertical translation is applied? Use up-positive and down-negative units.`,
			answer: b,
			tolerance: 0,
			hint: 'Adding b outside the function shifts the graph up by b.'
		};
	},
	'mixture-balance-lab': () => {
		let initialAmount = 10;
		let initialPercent = 20;
		let addedPercent = 15;
		let targetPercent = 17;
		let answer = 15;
		let attempts = 0;

		while (attempts < 60) {
			attempts += 1;
			const candidateInitialAmount = randomStep(6, 20, 0.5);
			const candidateInitialPercent = randomStep(18, 45, 0.5);
			const candidateAddedPercent = randomStep(4, 30, 0.5);

			if (candidateInitialPercent <= candidateAddedPercent + 1) {
				continue;
			}

			const candidateTargetPercent = randomStep(
				candidateAddedPercent + 1,
				candidateInitialPercent - 1,
				0.5
			);
			const denominator = candidateTargetPercent - candidateAddedPercent;
			if (denominator <= 0) {
				continue;
			}

			const candidateAnswer =
				(candidateInitialAmount * (candidateInitialPercent - candidateTargetPercent)) / denominator;

			if (!Number.isFinite(candidateAnswer) || candidateAnswer < 0.5 || candidateAnswer > 60) {
				continue;
			}

			initialAmount = candidateInitialAmount;
			initialPercent = candidateInitialPercent;
			addedPercent = candidateAddedPercent;
			targetPercent = candidateTargetPercent;
			answer = candidateAnswer;
			break;
		}

		return {
			prompt: `You have ${initialAmount.toFixed(1)} cups at ${initialPercent.toFixed(1)}%. Add x cups at ${addedPercent.toFixed(1)}% to reach ${targetPercent.toFixed(1)}%. Find x.`,
			answer,
			tolerance: 0.05,
			hint: 'Set up a solute balance: a*p1 + x*p2 = (a + x)*pt with percents as decimals.'
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
	'unit-circle-pythagorean-identity': () => {
		return {
			prompt: 'For any point (x, y) on the unit circle, what is x^2 + y^2?',
			answer: 1,
			tolerance: 0,
			hint: 'Use the unit-circle equation x^2 + y^2 = 1.'
		};
	},
	'unit-circle-reference': () => {
		const prompts = [
			{ fn: 'cos', degree: 30, answer: Math.sqrt(3) / 2 },
			{ fn: 'sin', degree: 30, answer: 0.5 },
			{ fn: 'cos', degree: 45, answer: Math.sqrt(2) / 2 },
			{ fn: 'sin', degree: 45, answer: Math.sqrt(2) / 2 },
			{ fn: 'cos', degree: 60, answer: 0.5 },
			{ fn: 'sin', degree: 60, answer: Math.sqrt(3) / 2 },
			{ fn: 'cos', degree: 120, answer: -0.5 },
			{ fn: 'sin', degree: 120, answer: Math.sqrt(3) / 2 },
			{ fn: 'cos', degree: 150, answer: -Math.sqrt(3) / 2 },
			{ fn: 'sin', degree: 150, answer: 0.5 },
			{ fn: 'cos', degree: 210, answer: -Math.sqrt(3) / 2 },
			{ fn: 'sin', degree: 210, answer: -0.5 },
			{ fn: 'cos', degree: 225, answer: -Math.sqrt(2) / 2 },
			{ fn: 'sin', degree: 225, answer: -Math.sqrt(2) / 2 },
			{ fn: 'cos', degree: 300, answer: 0.5 },
			{ fn: 'sin', degree: 300, answer: -Math.sqrt(3) / 2 }
		];
		const prompt = prompts[randomInt(0, prompts.length - 1)];
		return {
			prompt: `Using the unit circle, what is ${prompt.fn}(${prompt.degree}°)? Give a decimal rounded to three places.`,
			answer: prompt.answer,
			tolerance: 0.005,
			hint: 'Use the special-angle coordinate values on the unit circle.'
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
