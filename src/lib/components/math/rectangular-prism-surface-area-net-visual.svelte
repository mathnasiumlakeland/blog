<script module lang="ts">
	import type { MathToolMeta } from './tool-meta';
	import { requireInteractiveToolMetaById } from './tool-registry';

	export const toolMeta: MathToolMeta = requireInteractiveToolMetaById('polyhedron-surface-area');
</script>

<script lang="ts">
	import MathExpression from '$lib/components/math/math-expression.svelte';
	import { TOOL_BG_GRADIENT_END, TOOL_BG_GRADIENT_START, TOOL_BG_SURFACE_WASH } from './tool-visual-theme';

	type ShapeId = 'rectangular-prism' | 'cube' | 'triangular-prism' | 'square-pyramid' | 'cylinder';
	type FaceId = string;

	type Vec3 = { x: number; y: number; z: number };

	type ShapeDimension = {
		id: string;
		label: string;
		symbol: string;
		min: number;
		max: number;
		step: number;
		value: number;
	};

	type FaceDefinition = {
		id: FaceId;
		label: string;
		shortLabel: string;
		color: string;
		vertexIndexes: number[];
	};

	type NetFaceRect = {
		id: FaceId;
		label: string;
		shortLabel: string;
		color: string;
		shape?: 'rect' | 'triangle' | 'circle';
		triangleDirection?: 'up' | 'down' | 'left' | 'right';
		x: number;
		y: number;
		width: number;
		height: number;
		centerX: number;
		centerY: number;
	};

	type FormulaRow = {
		id: FaceId;
		label: string;
		shortLabel: string;
		color: string;
		area: number;
		tex: string;
	};

	type FoldLine = {
		id: string;
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	};

	type RenderFace = {
		id: FaceId;
		canonicalId: FaceId;
		color: string;
		path: string;
		alpha: number;
		zOrder: number;
		viewDot: number;
	};

	type TotalExpression = {
		sum: string;
		simplified: string;
	};

	type ShapeDefinition = {
		id: ShapeId;
		title: string;
		dimensions: ShapeDimension[];
		buildVertices: (dimensionValues: Record<string, number>) => Vec3[];
		faces: FaceDefinition[];
		faceOrientationById: Record<FaceId, { yaw: number; pitch: number }>;
		buildNetRects: (dimensionValues: Record<string, number>) => NetFaceRect[];
		buildFoldLines: (netRects: NetFaceRect[]) => FoldLine[];
		buildFormulaRows: (dimensionValues: Record<string, number>) => FormulaRow[];
		buildTotalTeX: (dimensionValues: Record<string, number>) => TotalExpression;
	};

	const POLY_WIDTH = 360;
	const POLY_HEIGHT = 320;
	const NET_WIDTH = 360;
	const NET_HEIGHT = 320;
	const NET_PADDING = 20;
	const CAMERA_DISTANCE = 11;
	const MAX_PITCH = Math.PI / 2.05;
	const ROTATION_SENSITIVITY = 0.01;
	const WHEEL_ZOOM_SENSITIVITY = 0.0014;
	const MIN_ZOOM = 0.55;
	const MAX_ZOOM = 2.4;
	const FACE_ROTATION_DURATION_MS = 420;
	const INITIAL_SHAPE_ID: ShapeId = 'rectangular-prism';
	const DEFAULT_ANGLED_YAW = -0.7;
	const DEFAULT_ANGLED_PITCH = 0.35;

	const colors = {
		orange: '#fb923c',
		green: '#10b981',
		purple: '#a78bfa',
		blue: '#60a5fa',
		yellow: '#facc15',
		red: '#f87171',
		teal: '#2dd4bf',
		pink: '#f472b6'
	};

	const rectangularPrismShape: ShapeDefinition = {
		id: 'rectangular-prism',
		title: 'Rectangular Prism',
		dimensions: [
			{ id: 'length', label: 'Length', symbol: 'l', min: 2, max: 12, step: 0.5, value: 8 },
			{ id: 'width', label: 'Width', symbol: 'w', min: 2, max: 12, step: 0.5, value: 5 },
			{ id: 'height', label: 'Height', symbol: 'h', min: 2, max: 12, step: 0.5, value: 4 }
		],
		buildVertices: ({ length, width, height }) => {
			const halfLength = length / 2;
			const halfWidth = width / 2;
			const halfHeight = height / 2;
			return [
				{ x: -halfLength, y: -halfHeight, z: -halfWidth },
				{ x: halfLength, y: -halfHeight, z: -halfWidth },
				{ x: halfLength, y: halfHeight, z: -halfWidth },
				{ x: -halfLength, y: halfHeight, z: -halfWidth },
				{ x: -halfLength, y: -halfHeight, z: halfWidth },
				{ x: halfLength, y: -halfHeight, z: halfWidth },
				{ x: halfLength, y: halfHeight, z: halfWidth },
				{ x: -halfLength, y: halfHeight, z: halfWidth }
			];
		},
		faces: [
			{ id: 'front', label: 'Front', shortLabel: 'F', color: colors.orange, vertexIndexes: [4, 5, 6, 7] },
			{ id: 'back', label: 'Back', shortLabel: 'Bk', color: colors.green, vertexIndexes: [0, 3, 2, 1] },
			{ id: 'left', label: 'Left', shortLabel: 'L', color: colors.purple, vertexIndexes: [0, 4, 7, 3] },
			{ id: 'right', label: 'Right', shortLabel: 'R', color: colors.blue, vertexIndexes: [1, 2, 6, 5] },
			{ id: 'top', label: 'Top', shortLabel: 'T', color: colors.yellow, vertexIndexes: [3, 7, 6, 2] },
			{ id: 'bottom', label: 'Bottom', shortLabel: 'Bt', color: colors.red, vertexIndexes: [0, 1, 5, 4] }
		],
		faceOrientationById: {
			front: { yaw: 0, pitch: 0 },
			back: { yaw: Math.PI, pitch: 0 },
			left: { yaw: Math.PI / 2, pitch: 0 },
			right: { yaw: -Math.PI / 2, pitch: 0 },
			top: { yaw: 0, pitch: Math.PI / 2 },
			bottom: { yaw: 0, pitch: -Math.PI / 2 }
		},
		buildNetRects: ({ length, width, height }) => {
			const unit = fitNetUnit(length + 2 * width, 2 * width + 2 * height);
			const frontWidth = length * unit;
			const frontHeight = height * unit;
			const sideWidth = width * unit;
			const topHeight = width * unit;
			const gridWidth = sideWidth + frontWidth + sideWidth;
			const gridHeight = topHeight + frontHeight + topHeight + frontHeight;
			const offsetX = (NET_WIDTH - gridWidth) / 2;
			const offsetY = (NET_HEIGHT - gridHeight) / 2;
			const frontX = offsetX + sideWidth;
			const frontY = offsetY + topHeight;
			const bottomY = frontY + frontHeight;
			const backY = bottomY + topHeight;
			return withCenters([
				{ id: 'top', label: 'Top', shortLabel: 'T', color: colors.yellow, x: frontX, y: offsetY, width: frontWidth, height: topHeight },
				{ id: 'left', label: 'Left', shortLabel: 'L', color: colors.purple, x: offsetX, y: frontY, width: sideWidth, height: frontHeight },
				{ id: 'front', label: 'Front', shortLabel: 'F', color: colors.orange, x: frontX, y: frontY, width: frontWidth, height: frontHeight },
				{ id: 'right', label: 'Right', shortLabel: 'R', color: colors.blue, x: frontX + frontWidth, y: frontY, width: sideWidth, height: frontHeight },
				{ id: 'bottom', label: 'Bottom', shortLabel: 'Bt', color: colors.red, x: frontX, y: bottomY, width: frontWidth, height: topHeight },
				{ id: 'back', label: 'Back', shortLabel: 'Bk', color: colors.green, x: frontX, y: backY, width: frontWidth, height: frontHeight }
			]);
		},
		buildFoldLines: (rects) => {
			const front = findRect(rects, 'front');
			const left = findRect(rects, 'left');
			const right = findRect(rects, 'right');
			const top = findRect(rects, 'top');
			const bottom = findRect(rects, 'bottom');
			const back = findRect(rects, 'back');
			if (!front || !left || !right || !top || !bottom || !back) return [];
			return [
				{ id: 'lf', x1: left.x + left.width, y1: left.y, x2: left.x + left.width, y2: left.y + left.height },
				{ id: 'fr', x1: right.x, y1: right.y, x2: right.x, y2: right.y + right.height },
				{ id: 'tf', x1: top.x, y1: top.y + top.height, x2: top.x + top.width, y2: top.y + top.height },
				{ id: 'fb', x1: bottom.x, y1: bottom.y, x2: bottom.x + bottom.width, y2: bottom.y },
				{ id: 'bb', x1: back.x, y1: back.y, x2: back.x + back.width, y2: back.y }
			];
		},
		buildFormulaRows: ({ length, width, height }) => {
			const rows = [
				{ id: 'front', label: 'Front', shortLabel: 'F', color: colors.orange, area: length * height, tex: `A_{\\text{front}}=l\\cdot h=${fmt(length)}\\cdot${fmt(height)}=${fmt(length * height)}` },
				{ id: 'back', label: 'Back', shortLabel: 'Bk', color: colors.green, area: length * height, tex: `A_{\\text{back}}=l\\cdot h=${fmt(length)}\\cdot${fmt(height)}=${fmt(length * height)}` },
				{ id: 'left', label: 'Left', shortLabel: 'L', color: colors.purple, area: width * height, tex: `A_{\\text{left}}=w\\cdot h=${fmt(width)}\\cdot${fmt(height)}=${fmt(width * height)}` },
				{ id: 'right', label: 'Right', shortLabel: 'R', color: colors.blue, area: width * height, tex: `A_{\\text{right}}=w\\cdot h=${fmt(width)}\\cdot${fmt(height)}=${fmt(width * height)}` },
				{ id: 'top', label: 'Top', shortLabel: 'T', color: colors.yellow, area: length * width, tex: `A_{\\text{top}}=l\\cdot w=${fmt(length)}\\cdot${fmt(width)}=${fmt(length * width)}` },
				{ id: 'bottom', label: 'Bottom', shortLabel: 'Bt', color: colors.red, area: length * width, tex: `A_{\\text{bottom}}=l\\cdot w=${fmt(length)}\\cdot${fmt(width)}=${fmt(length * width)}` }
			];
			return rows;
		},
		buildTotalTeX: ({ length, width, height }) => {
			const lw = length * width;
			const lh = length * height;
			const wh = width * height;
			const total = 2 * (lw + lh + wh);
			return {
				sum: `SA=${fmt(lh)}+${fmt(lh)}+${fmt(wh)}+${fmt(wh)}+${fmt(lw)}+${fmt(lw)}=${fmt(total)}`,
				simplified: `SA=2lw+2lh+2wh=${fmt(total)}`
			};
		}
	};

	const cubeShape: ShapeDefinition = {
		id: 'cube',
		title: 'Cube',
		dimensions: [{ id: 'side', label: 'Side Length', symbol: 's', min: 2, max: 12, step: 0.5, value: 6 }],
		buildVertices: ({ side }) => rectangularPrismShape.buildVertices({ length: side, width: side, height: side }),
		faces: rectangularPrismShape.faces,
		faceOrientationById: rectangularPrismShape.faceOrientationById,
		buildNetRects: ({ side }) => rectangularPrismShape.buildNetRects({ length: side, width: side, height: side }),
		buildFoldLines: rectangularPrismShape.buildFoldLines,
		buildFormulaRows: ({ side }) => {
			const area = side * side;
			return [
				{ id: 'front', label: 'Front', shortLabel: 'F', color: colors.orange, area, tex: `A_{\\text{front}}=s^2=${fmt(side)}^2=${fmt(area)}` },
				{ id: 'back', label: 'Back', shortLabel: 'Bk', color: colors.green, area, tex: `A_{\\text{back}}=s^2=${fmt(side)}^2=${fmt(area)}` },
				{ id: 'left', label: 'Left', shortLabel: 'L', color: colors.purple, area, tex: `A_{\\text{left}}=s^2=${fmt(side)}^2=${fmt(area)}` },
				{ id: 'right', label: 'Right', shortLabel: 'R', color: colors.blue, area, tex: `A_{\\text{right}}=s^2=${fmt(side)}^2=${fmt(area)}` },
				{ id: 'top', label: 'Top', shortLabel: 'T', color: colors.yellow, area, tex: `A_{\\text{top}}=s^2=${fmt(side)}^2=${fmt(area)}` },
				{ id: 'bottom', label: 'Bottom', shortLabel: 'Bt', color: colors.red, area, tex: `A_{\\text{bottom}}=s^2=${fmt(side)}^2=${fmt(area)}` }
			];
		},
		buildTotalTeX: ({ side }) => {
			const area = side * side;
			const total = 6 * area;
			return {
				sum: `SA=${fmt(area)}+${fmt(area)}+${fmt(area)}+${fmt(area)}+${fmt(area)}+${fmt(area)}=${fmt(total)}`,
				simplified: `SA=6s^2=${fmt(total)}`
			};
		}
	};

	const triangularPrismShape: ShapeDefinition = {
		id: 'triangular-prism',
		title: 'Triangular Prism',
		dimensions: [
			{ id: 'length', label: 'Prism Length', symbol: 'L', min: 2, max: 12, step: 0.5, value: 7 },
			{ id: 'base', label: 'Triangle Base', symbol: 'b', min: 2, max: 10, step: 0.5, value: 5 },
			{ id: 'triangleHeight', label: 'Triangle Height', symbol: 'h_t', min: 2, max: 10, step: 0.5, value: 4 }
		],
		buildVertices: ({ length, base, triangleHeight }) => {
			const halfLength = length / 2;
			const triBottom = -triangleHeight / 2;
			const triTop = triangleHeight / 2;
			const leftX = -base / 2;
			const rightX = base / 2;
			return [
				{ x: leftX, y: triBottom, z: -halfLength },
				{ x: rightX, y: triBottom, z: -halfLength },
				{ x: 0, y: triTop, z: -halfLength },
				{ x: leftX, y: triBottom, z: halfLength },
				{ x: rightX, y: triBottom, z: halfLength },
				{ x: 0, y: triTop, z: halfLength }
			];
		},
		faces: [
			{ id: 'triangle-front', label: 'Triangle Front', shortLabel: 'TF', color: colors.orange, vertexIndexes: [3, 4, 5] },
			{ id: 'triangle-back', label: 'Triangle Back', shortLabel: 'TB', color: colors.green, vertexIndexes: [0, 2, 1] },
			{ id: 'rect-base', label: 'Rectangle Base', shortLabel: 'RB', color: colors.blue, vertexIndexes: [0, 1, 4, 3] },
			{ id: 'rect-left', label: 'Rectangle Left', shortLabel: 'RL', color: colors.purple, vertexIndexes: [0, 3, 5, 2] },
			{ id: 'rect-right', label: 'Rectangle Right', shortLabel: 'RR', color: colors.red, vertexIndexes: [1, 2, 5, 4] }
		],
		faceOrientationById: {
			'triangle-front': { yaw: 0, pitch: 0 },
			'triangle-back': { yaw: Math.PI, pitch: 0 },
			'rect-base': { yaw: 0, pitch: -Math.PI / 2 },
			'rect-left': { yaw: Math.PI / 2, pitch: 0 },
			'rect-right': { yaw: -Math.PI / 2, pitch: 0 }
		},
		buildNetRects: ({ length, base, triangleHeight }) => {
			const slant = Math.sqrt((base / 2) ** 2 + triangleHeight ** 2);
			const unit = fitNetUnit(base + slant + slant, length + triangleHeight + length);
			const rectBaseWidth = base * unit;
			const rectBaseHeight = length * unit;
			const rectLeftWidth = slant * unit;
			const rectRightWidth = slant * unit;
			const triHeight = triangleHeight * unit;
			const gridWidth = rectLeftWidth + rectBaseWidth + rectRightWidth;
			const gridHeight = triHeight + rectBaseHeight + triHeight;
			const offsetX = (NET_WIDTH - gridWidth) / 2;
			const offsetY = (NET_HEIGHT - gridHeight) / 2;
			const baseX = offsetX + rectLeftWidth;
			const baseY = offsetY + triHeight;
			return withCenters([
				{
					id: 'rect-left',
					label: 'Rectangle Left',
					shortLabel: 'RL',
					color: colors.purple,
					shape: 'rect',
					x: offsetX,
					y: baseY,
					width: rectLeftWidth,
					height: rectBaseHeight
				},
				{
					id: 'rect-base',
					label: 'Rectangle Base',
					shortLabel: 'RB',
					color: colors.blue,
					shape: 'rect',
					x: baseX,
					y: baseY,
					width: rectBaseWidth,
					height: rectBaseHeight
				},
				{
					id: 'rect-right',
					label: 'Rectangle Right',
					shortLabel: 'RR',
					color: colors.red,
					shape: 'rect',
					x: baseX + rectBaseWidth,
					y: baseY,
					width: rectRightWidth,
					height: rectBaseHeight
				},
				{
					id: 'triangle-front',
					label: 'Triangle Front',
					shortLabel: 'TF',
					color: colors.orange,
					shape: 'triangle',
					triangleDirection: 'up',
					x: baseX,
					y: offsetY,
					width: rectBaseWidth,
					height: triHeight
				},
				{
					id: 'triangle-back',
					label: 'Triangle Back',
					shortLabel: 'TB',
					color: colors.green,
					shape: 'triangle',
					triangleDirection: 'down',
					x: baseX,
					y: baseY + rectBaseHeight,
					width: rectBaseWidth,
					height: triHeight
				}
			]);
		},
		buildFoldLines: (rects) => {
			const base = findRect(rects, 'rect-base');
			const left = findRect(rects, 'rect-left');
			const right = findRect(rects, 'rect-right');
			const front = findRect(rects, 'triangle-front');
			const back = findRect(rects, 'triangle-back');
			if (!base || !left || !right || !front || !back) return [];
			return [
				{ id: 'lb', x1: left.x + left.width, y1: left.y, x2: left.x + left.width, y2: left.y + left.height },
				{ id: 'br', x1: right.x, y1: right.y, x2: right.x, y2: right.y + right.height },
				{ id: 'fb', x1: front.x, y1: front.y + front.height, x2: front.x + front.width, y2: front.y + front.height },
				{ id: 'bb', x1: back.x, y1: back.y, x2: back.x + back.width, y2: back.y }
			];
		},
		buildFormulaRows: ({ length, base, triangleHeight }) => {
			const slant = Math.sqrt((base / 2) ** 2 + triangleHeight ** 2);
			const triangleArea = (base * triangleHeight) / 2;
			const rectBaseArea = base * length;
			const rectSideArea = slant * length;
			return [
				{ id: 'triangle-front', label: 'Triangle Front', shortLabel: 'TF', color: colors.orange, area: triangleArea, tex: `A_{\\text{TF}}=\\frac12bh=${fmt(triangleArea)}` },
				{ id: 'triangle-back', label: 'Triangle Back', shortLabel: 'TB', color: colors.green, area: triangleArea, tex: `A_{\\text{TB}}=\\frac12bh=${fmt(triangleArea)}` },
				{ id: 'rect-base', label: 'Rectangle Base', shortLabel: 'RB', color: colors.blue, area: rectBaseArea, tex: `A_{\\text{RB}}=bL=${fmt(rectBaseArea)}` },
				{ id: 'rect-left', label: 'Rectangle Left', shortLabel: 'RL', color: colors.purple, area: rectSideArea, tex: `A_{\\text{RL}}=sL=${fmt(rectSideArea)}` },
				{ id: 'rect-right', label: 'Rectangle Right', shortLabel: 'RR', color: colors.red, area: rectSideArea, tex: `A_{\\text{RR}}=sL=${fmt(rectSideArea)}` }
			];
		},
		buildTotalTeX: ({ length, base, triangleHeight }) => {
			const slant = Math.sqrt((base / 2) ** 2 + triangleHeight ** 2);
			const triangleArea = (base * triangleHeight) / 2;
			const rectBaseArea = base * length;
			const rectSideArea = slant * length;
			const total = 2 * triangleArea + rectBaseArea + 2 * rectSideArea;
			return {
				sum: `SA=${fmt(triangleArea)}+${fmt(triangleArea)}+${fmt(rectBaseArea)}+${fmt(rectSideArea)}+${fmt(rectSideArea)}=${fmt(total)}`,
				simplified: `SA=2(\\frac12bh)+bL+2sL=${fmt(total)}`
			};
		}
	};

	const squarePyramidShape: ShapeDefinition = {
		id: 'square-pyramid',
		title: 'Square Pyramid',
		dimensions: [
			{ id: 'baseSide', label: 'Base Side', symbol: 'b', min: 2, max: 10, step: 0.5, value: 6 },
			{ id: 'slantHeight', label: 'Slant Height', symbol: 'l', min: 2, max: 12, step: 0.5, value: 7 }
		],
		buildVertices: ({ baseSide, slantHeight }) => {
			const half = baseSide / 2;
			const height = Math.sqrt(Math.max(0.5, slantHeight * slantHeight - half * half));
			return [
				{ x: -half, y: -half, z: -half },
				{ x: half, y: -half, z: -half },
				{ x: half, y: -half, z: half },
				{ x: -half, y: -half, z: half },
				{ x: 0, y: height, z: 0 }
			];
		},
		faces: [
			{ id: 'front-tri', label: 'Front Triangle', shortLabel: 'F', color: colors.orange, vertexIndexes: [3, 2, 4] },
			{ id: 'right-tri', label: 'Right Triangle', shortLabel: 'R', color: colors.red, vertexIndexes: [2, 1, 4] },
			{ id: 'back-tri', label: 'Back Triangle', shortLabel: 'Bk', color: colors.green, vertexIndexes: [1, 0, 4] },
			{ id: 'left-tri', label: 'Left Triangle', shortLabel: 'L', color: colors.purple, vertexIndexes: [0, 3, 4] },
			{ id: 'base', label: 'Base', shortLabel: 'B', color: colors.blue, vertexIndexes: [0, 1, 2, 3] }
		],
		faceOrientationById: {
			base: { yaw: 0, pitch: -Math.PI / 2 },
			'front-tri': { yaw: 0, pitch: 0.25 },
			'right-tri': { yaw: -Math.PI / 2, pitch: 0.25 },
			'back-tri': { yaw: Math.PI, pitch: 0.25 },
			'left-tri': { yaw: Math.PI / 2, pitch: 0.25 }
		},
		buildNetRects: ({ baseSide, slantHeight }) => {
			const unit = fitNetUnit(baseSide + 2 * slantHeight, baseSide + 2 * slantHeight);
			const square = baseSide * unit;
			const triHeight = slantHeight * unit;
			const gridWidth = square + triHeight * 2;
			const gridHeight = square + triHeight * 2;
			const offsetX = (NET_WIDTH - gridWidth) / 2;
			const offsetY = (NET_HEIGHT - gridHeight) / 2;
			const baseX = offsetX + triHeight;
			const baseY = offsetY + triHeight;
			return withCenters([
				{
					id: 'left-tri',
					label: 'Left Triangle',
					shortLabel: 'L',
					color: colors.purple,
					shape: 'triangle',
					triangleDirection: 'left',
					x: offsetX,
					y: baseY,
					width: triHeight,
					height: square
				},
				{
					id: 'base',
					label: 'Base',
					shortLabel: 'B',
					color: colors.blue,
					shape: 'rect',
					x: baseX,
					y: baseY,
					width: square,
					height: square
				},
				{
					id: 'right-tri',
					label: 'Right Triangle',
					shortLabel: 'R',
					color: colors.red,
					shape: 'triangle',
					triangleDirection: 'right',
					x: baseX + square,
					y: baseY,
					width: triHeight,
					height: square
				},
				{
					id: 'front-tri',
					label: 'Front Triangle',
					shortLabel: 'F',
					color: colors.orange,
					shape: 'triangle',
					triangleDirection: 'up',
					x: baseX,
					y: offsetY,
					width: square,
					height: triHeight
				},
				{
					id: 'back-tri',
					label: 'Back Triangle',
					shortLabel: 'Bk',
					color: colors.green,
					shape: 'triangle',
					triangleDirection: 'down',
					x: baseX,
					y: baseY + square,
					width: square,
					height: triHeight
				}
			]);
		},
		buildFoldLines: (rects) => {
			const base = findRect(rects, 'base');
			const left = findRect(rects, 'left-tri');
			const right = findRect(rects, 'right-tri');
			const front = findRect(rects, 'front-tri');
			const back = findRect(rects, 'back-tri');
			if (!base || !left || !right || !front || !back) return [];
			return [
				{ id: 'lb', x1: base.x, y1: base.y, x2: base.x, y2: base.y + base.height },
				{ id: 'br', x1: base.x + base.width, y1: base.y, x2: base.x + base.width, y2: base.y + base.height },
				{ id: 'fb', x1: base.x, y1: base.y, x2: base.x + base.width, y2: base.y },
				{ id: 'bb', x1: base.x, y1: base.y + base.height, x2: base.x + base.width, y2: base.y + base.height }
			];
		},
		buildFormulaRows: ({ baseSide, slantHeight }) => {
			const baseArea = baseSide * baseSide;
			const triArea = 0.5 * baseSide * slantHeight;
			return [
				{ id: 'base', label: 'Base', shortLabel: 'B', color: colors.blue, area: baseArea, tex: `A_{\\text{base}}=b^2=${fmt(baseArea)}` },
				{ id: 'front-tri', label: 'Front Triangle', shortLabel: 'F', color: colors.orange, area: triArea, tex: `A_{\\text{F}}=\\frac12bl=${fmt(triArea)}` },
				{ id: 'right-tri', label: 'Right Triangle', shortLabel: 'R', color: colors.red, area: triArea, tex: `A_{\\text{R}}=\\frac12bl=${fmt(triArea)}` },
				{ id: 'back-tri', label: 'Back Triangle', shortLabel: 'Bk', color: colors.green, area: triArea, tex: `A_{\\text{Bk}}=\\frac12bl=${fmt(triArea)}` },
				{ id: 'left-tri', label: 'Left Triangle', shortLabel: 'L', color: colors.purple, area: triArea, tex: `A_{\\text{L}}=\\frac12bl=${fmt(triArea)}` }
			];
		},
		buildTotalTeX: ({ baseSide, slantHeight }) => {
			const baseArea = baseSide * baseSide;
			const triArea = 0.5 * baseSide * slantHeight;
			const total = baseArea + 4 * triArea;
			return {
				sum: `SA=${fmt(baseArea)}+${fmt(triArea)}+${fmt(triArea)}+${fmt(triArea)}+${fmt(triArea)}=${fmt(total)}`,
				simplified: `SA=b^2+2bl=${fmt(total)}`
			};
		}
	};

	const cylinderShape: ShapeDefinition = {
		id: 'cylinder',
		title: 'Cylinder',
		dimensions: [
			{ id: 'radius', label: 'Radius', symbol: 'r', min: 1, max: 8, step: 0.5, value: 3 },
			{ id: 'height', label: 'Height', symbol: 'h', min: 2, max: 12, step: 0.5, value: 7 }
		],
		buildVertices: ({ radius, height }) => {
			const half = height / 2;
			const segments = 16;
			const topY = half;
			const bottomY = -half;
			const verts: Vec3[] = [];
			for (let i = 0; i < segments; i += 1) {
				const t = (i / segments) * Math.PI * 2;
				verts.push({ x: radius * Math.cos(t), y: topY, z: radius * Math.sin(t) });
			}
			for (let i = 0; i < segments; i += 1) {
				const t = (i / segments) * Math.PI * 2;
				verts.push({ x: radius * Math.cos(t), y: bottomY, z: radius * Math.sin(t) });
			}
			verts.push({ x: 0, y: topY, z: 0 });
			verts.push({ x: 0, y: bottomY, z: 0 });
			return verts;
		},
		faces: (() => {
			const segments = 16;
			const faces: FaceDefinition[] = [];
			for (let i = 0; i < segments; i += 1) {
				const next = (i + 1) % segments;
				faces.push({
					id: `side-${i}`,
					label: 'Curved Side',
					shortLabel: 'S',
					color: colors.teal,
					vertexIndexes: [i, next, segments + next, segments + i]
				});
			}
			faces.push({
				id: 'top-circle',
				label: 'Top Circle',
				shortLabel: 'T',
				color: colors.yellow,
				vertexIndexes: Array.from({ length: segments }, (_, i) => segments - 1 - i)
			});
			faces.push({
				id: 'bottom-circle',
				label: 'Bottom Circle',
				shortLabel: 'B',
				color: colors.blue,
				vertexIndexes: Array.from({ length: segments }, (_, i) => segments + i)
			});
			return faces;
		})(),
		faceOrientationById: {
			'curved-side': { yaw: 0, pitch: 0 },
			'top-circle': { yaw: 0, pitch: Math.PI / 2 },
			'bottom-circle': { yaw: 0, pitch: -Math.PI / 2 },
			'side-0': { yaw: 0, pitch: 0 }
		},
		buildNetRects: ({ radius, height }) => {
			const circumference = 2 * Math.PI * radius;
			const unit = fitNetUnit(circumference + 2 * radius, height + 2 * radius);
			const rectW = circumference * unit;
			const rectH = height * unit;
			const circleSize = 2 * radius * unit;
			const gridW = rectW + circleSize;
			const gridH = Math.max(rectH, circleSize * 2 + 10);
			const ox = (NET_WIDTH - gridW) / 2;
			const oy = (NET_HEIGHT - gridH) / 2;
			return withCenters([
				{
					id: 'curved-side',
					label: 'Curved Side',
					shortLabel: 'S',
					color: colors.teal,
					shape: 'rect',
					x: ox,
					y: oy + (gridH - rectH) / 2,
					width: rectW,
					height: rectH
				},
				{
					id: 'top-circle',
					label: 'Top Circle',
					shortLabel: 'T',
					color: colors.yellow,
					shape: 'circle',
					x: ox + rectW + 8,
					y: oy,
					width: circleSize,
					height: circleSize
				},
				{
					id: 'bottom-circle',
					label: 'Bottom Circle',
					shortLabel: 'B',
					color: colors.blue,
					shape: 'circle',
					x: ox + rectW + 8,
					y: oy + circleSize + 8,
					width: circleSize,
					height: circleSize
				}
			]);
		},
		buildFoldLines: (rects) => {
			const side = findRect(rects, 'curved-side');
			const top = findRect(rects, 'top-circle');
			const bottom = findRect(rects, 'bottom-circle');
			if (!side || !top || !bottom) return [];
			return [
				{ id: 'st', x1: side.x + side.width, y1: side.y + side.height / 2, x2: top.x, y2: top.y + top.height / 2 },
				{ id: 'sb', x1: side.x + side.width, y1: side.y + side.height / 2, x2: bottom.x, y2: bottom.y + bottom.height / 2 }
			];
		},
		buildFormulaRows: ({ radius, height }) => {
			const topBottom = Math.PI * radius * radius;
			const curved = 2 * Math.PI * radius * height;
			return [
				{ id: 'curved-side', label: 'Curved Side', shortLabel: 'S', color: colors.teal, area: curved, tex: `A_{\\text{side}}=2\\pi rh=${fmt(curved)}` },
				{ id: 'top-circle', label: 'Top Circle', shortLabel: 'T', color: colors.yellow, area: topBottom, tex: `A_{\\text{top}}=\\pi r^2=${fmt(topBottom)}` },
				{ id: 'bottom-circle', label: 'Bottom Circle', shortLabel: 'B', color: colors.blue, area: topBottom, tex: `A_{\\text{bottom}}=\\pi r^2=${fmt(topBottom)}` }
			];
		},
		buildTotalTeX: ({ radius, height }) => {
			const topBottom = Math.PI * radius * radius;
			const curved = 2 * Math.PI * radius * height;
			const total = curved + 2 * topBottom;
			return {
				sum: `SA=${fmt(curved)}+${fmt(topBottom)}+${fmt(topBottom)}=${fmt(total)}`,
				simplified: `SA=2\\pi rh+2\\pi r^2=${fmt(total)}`
			};
		}
	};

	const shapeDefinitions: Record<ShapeId, ShapeDefinition> = {
		'rectangular-prism': rectangularPrismShape,
		cube: cubeShape,
		'triangular-prism': triangularPrismShape,
		'square-pyramid': squarePyramidShape,
		cylinder: cylinderShape
	};

	let selectedShapeId = $state<ShapeId>(INITIAL_SHAPE_ID);
	let dimensionValues = $state<Record<string, number>>({
		length: 8,
		width: 5,
		height: 4,
		side: 6,
		base: 5,
		triangleHeight: 4,
		baseSide: 6,
		slantHeight: 7,
		radius: 3
	});

	let yaw = $state(DEFAULT_ANGLED_YAW);
	let pitch = $state(DEFAULT_ANGLED_PITCH);
	let zoom = $state(getDefaultZoom(INITIAL_SHAPE_ID));
	let activeFaceId = $state<FaceId>('front');

	let polySvg: SVGSVGElement | null = $state(null);
	let dragPointerId = $state<number | null>(null);
	let dragStartX = 0;
	let dragStartY = 0;
	let dragStartYaw = 0;
	let dragStartPitch = 0;
	let rotationAnimationFrame: number | null = null;

	const selectedShape = $derived(shapeDefinitions[selectedShapeId]);
	const currentDimensionValues = $derived.by(() => {
		const result: Record<string, number> = {};
		for (const dim of selectedShape.dimensions) {
			result[dim.id] = dimensionValues[dim.id] ?? dim.value;
		}
		return result;
	});

	const shapeFaces = $derived(selectedShape.faces);
	const prismVertices = $derived(selectedShape.buildVertices(currentDimensionValues));
	const projectionScale = $derived((164 / (maxAbsCoordinate(prismVertices) + 0.9)) * zoom);
	const rotatedVertices = $derived.by(() => prismVertices.map((point) => rotatePoint(point, yaw, pitch)));

	const renderedFaces = $derived.by<RenderFace[]>(() => {
		const lightDirection = normalizeVec({ x: -0.35, y: 0.7, z: 1 });
		return shapeFaces
			.map((face) => {
				const vertices = face.vertexIndexes.map((idx) => rotatedVertices[idx]);
				if (vertices.length < 3) return null;
				const normal = normalizeVec(crossVec(subtractVec(vertices[1], vertices[0]), subtractVec(vertices[2], vertices[0])));
				const centroid = averageVec(vertices);
				const viewVector = normalizeVec({ x: -centroid.x, y: -centroid.y, z: CAMERA_DISTANCE - centroid.z });
				const facing = dotVec(normal, viewVector);
				if (facing <= 0.03) return null;
				const path = vertices
					.map((vertex, index) => {
						const projected = projectPoint(vertex, projectionScale);
						return `${index === 0 ? 'M' : 'L'} ${projected.x} ${projected.y}`;
					})
					.join(' ');
				const light = clamp(dotVec(normal, lightDirection), 0, 1);
				return {
					id: face.id,
					canonicalId: toCanonicalFaceId(selectedShapeId, face.id),
					color: face.color,
					path: `${path} Z`,
					alpha: 0.62 + light * 0.24,
					zOrder: centroid.z,
					viewDot: facing
				};
			})
			.filter((face): face is RenderFace => Boolean(face))
			.sort((left, right) => left.zOrder - right.zOrder);
	});

	const frontFacingFaceId = $derived.by(() => {
		if (renderedFaces.length === 0) return toCanonicalFaceId(selectedShapeId, activeFaceId);
		const top = renderedFaces.reduce((winner, face) => (face.viewDot > winner.viewDot ? face : winner));
		return top.canonicalId;
	});

	const highlightedFaceId = $derived(dragPointerId !== null ? frontFacingFaceId : activeFaceId);
	const netFaceRects = $derived(selectedShape.buildNetRects(currentDimensionValues));
	const foldLines = $derived(selectedShape.buildFoldLines(netFaceRects));
	const formulaRows = $derived(selectedShape.buildFormulaRows(currentDimensionValues));
	const activeFormulaRow = $derived(
		formulaRows.find((row) => row.id === highlightedFaceId) ?? formulaRows[0]
	);
	const totalExpressions = $derived(selectedShape.buildTotalTeX(currentDimensionValues));

	function handleShapeChange(shapeId: ShapeId) {
		if (shapeId === selectedShapeId) return;
		stopRotationAnimation();
		selectedShapeId = shapeId;
		const first = shapeDefinitions[shapeId].faces[0]?.id;
		if (!first) return;
		const canonicalFirst = toCanonicalFaceId(shapeId, first);
		activeFaceId = canonicalFirst;
		zoom = getDefaultZoom(shapeId);
		const orientation = getDefaultOrientation(shapeId);
		yaw = orientation.yaw;
		pitch = orientation.pitch;
	}

	function updateDimension(id: string, value: number) {
		dimensionValues = {
			...dimensionValues,
			[id]: value
		};
	}

	function rotateToFace(faceId: FaceId) {
		const orientation = selectedShape.faceOrientationById[faceId];
		if (!orientation) return;
		activeFaceId = faceId;
		animateRotationToFace(orientation.yaw, orientation.pitch);
	}

	function handleNetFaceKeydown(event: KeyboardEvent, faceId: FaceId) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		rotateToFace(faceId);
	}

	function handlePolyPointerDown(event: PointerEvent) {
		stopRotationAnimation();
		dragPointerId = event.pointerId;
		dragStartX = event.clientX;
		dragStartY = event.clientY;
		dragStartYaw = yaw;
		dragStartPitch = pitch;
		polySvg?.setPointerCapture(event.pointerId);
	}

	function handlePolyPointerMove(event: PointerEvent) {
		if (dragPointerId !== event.pointerId) return;
		const deltaX = event.clientX - dragStartX;
		const deltaY = event.clientY - dragStartY;
		yaw = dragStartYaw + deltaX * ROTATION_SENSITIVITY;
		pitch = clamp(dragStartPitch + deltaY * ROTATION_SENSITIVITY, -MAX_PITCH, MAX_PITCH);
	}

	function handlePolyWheel(event: WheelEvent) {
		event.preventDefault();
		const factor = Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY);
		zoom = clamp(zoom * factor, MIN_ZOOM, MAX_ZOOM);
	}

	function stopPolyDrag(event: PointerEvent) {
		if (dragPointerId !== event.pointerId) return;
		if (polySvg?.hasPointerCapture(event.pointerId)) {
			polySvg.releasePointerCapture(event.pointerId);
		}
		dragPointerId = null;
		activeFaceId = frontFacingFaceId;
	}

	function animateRotationToFace(targetYaw: number, targetPitch: number) {
		stopRotationAnimation();
		const startYaw = yaw;
		const startPitch = pitch;
		const endYaw = startYaw + shortestAngleDelta(startYaw, targetYaw);
		const endPitch = clamp(targetPitch, -MAX_PITCH, MAX_PITCH);
		const startedAt = performance.now();

		const step = (now: number) => {
			const progress = clamp((now - startedAt) / FACE_ROTATION_DURATION_MS, 0, 1);
			const eased = easeInOutCubic(progress);
			yaw = startYaw + (endYaw - startYaw) * eased;
			pitch = startPitch + (endPitch - startPitch) * eased;
			if (progress >= 1) {
				yaw = normalizeAngle(endYaw);
				pitch = endPitch;
				rotationAnimationFrame = null;
				activeFaceId = frontFacingFaceId;
				return;
			}
			rotationAnimationFrame = requestAnimationFrame(step);
		};
		rotationAnimationFrame = requestAnimationFrame(step);
	}

	function stopRotationAnimation() {
		if (rotationAnimationFrame === null) return;
		cancelAnimationFrame(rotationAnimationFrame);
		rotationAnimationFrame = null;
	}

	function shortestAngleDelta(fromAngle: number, toAngle: number) {
		return normalizeAngle(toAngle - fromAngle);
	}

	function normalizeAngle(angle: number) {
		const fullTurn = Math.PI * 2;
		return ((angle + Math.PI) % fullTurn + fullTurn) % fullTurn - Math.PI;
	}

	function easeInOutCubic(t: number) {
		if (t < 0.5) return 4 * t * t * t;
		const k = -2 * t + 2;
		return 1 - (k * k * k) / 2;
	}

	function fitNetUnit(unitsAcross: number, unitsDown: number) {
		const availableWidth = NET_WIDTH - NET_PADDING * 2;
		const availableHeight = NET_HEIGHT - NET_PADDING * 2;
		return Math.min(availableWidth / Math.max(1, unitsAcross), availableHeight / Math.max(1, unitsDown));
	}

	function getDefaultZoom(shapeId: ShapeId) {
		switch (shapeId) {
			case 'rectangular-prism':
				return 0.94;
			case 'cube':
				return 0.74;
			case 'triangular-prism':
				return 0.93;
			case 'square-pyramid':
				return 0.92;
			default:
				return 1;
		}
	}

	function getDefaultOrientation(_shapeId: ShapeId) {
		return { yaw: DEFAULT_ANGLED_YAW, pitch: DEFAULT_ANGLED_PITCH };
	}

	function toCanonicalFaceId(shapeId: ShapeId, faceId: FaceId) {
		if (shapeId === 'cylinder' && faceId.startsWith('side-')) {
			return 'curved-side';
		}
		return faceId;
	}

	function trianglePathForNetFace(face: NetFaceRect) {
		const left = face.x;
		const right = face.x + face.width;
		const top = face.y;
		const bottom = face.y + face.height;
		const midX = face.centerX;
		const midY = face.centerY;

		switch (face.triangleDirection) {
			case 'down':
				return `M ${left} ${top} L ${right} ${top} L ${midX} ${bottom} Z`;
			case 'left':
				return `M ${right} ${top} L ${right} ${bottom} L ${left} ${midY} Z`;
			case 'right':
				return `M ${left} ${top} L ${right} ${midY} L ${left} ${bottom} Z`;
			case 'up':
			default:
				return `M ${left} ${bottom} L ${midX} ${top} L ${right} ${bottom} Z`;
		}
	}

	function withCenters(raw: Array<Omit<NetFaceRect, 'centerX' | 'centerY'>>) {
		return raw.map((rect) => ({
			...rect,
			centerX: rect.x + rect.width / 2,
			centerY: rect.y + rect.height / 2
		}));
	}

	function findRect(rects: NetFaceRect[], id: string) {
		return rects.find((rect) => rect.id === id);
	}

	function projectPoint(point: Vec3, scale: number) {
		const depth = Math.max(2.4, CAMERA_DISTANCE - point.z);
		const perspective = CAMERA_DISTANCE / depth;
		return {
			x: POLY_WIDTH / 2 + point.x * scale * perspective,
			y: POLY_HEIGHT / 2 - point.y * scale * perspective
		};
	}

	function rotatePoint(point: Vec3, yawAngle: number, pitchAngle: number): Vec3 {
		const cosYaw = Math.cos(yawAngle);
		const sinYaw = Math.sin(yawAngle);
		const xAfterYaw = point.x * cosYaw + point.z * sinYaw;
		const zAfterYaw = -point.x * sinYaw + point.z * cosYaw;
		const cosPitch = Math.cos(pitchAngle);
		const sinPitch = Math.sin(pitchAngle);
		return {
			x: xAfterYaw,
			y: point.y * cosPitch - zAfterYaw * sinPitch,
			z: point.y * sinPitch + zAfterYaw * cosPitch
		};
	}

	function subtractVec(left: Vec3, right: Vec3): Vec3 {
		return { x: left.x - right.x, y: left.y - right.y, z: left.z - right.z };
	}

	function crossVec(left: Vec3, right: Vec3): Vec3 {
		return {
			x: left.y * right.z - left.z * right.y,
			y: left.z * right.x - left.x * right.z,
			z: left.x * right.y - left.y * right.x
		};
	}

	function dotVec(left: Vec3, right: Vec3) {
		return left.x * right.x + left.y * right.y + left.z * right.z;
	}

	function normalizeVec(vector: Vec3): Vec3 {
		const magnitude = Math.hypot(vector.x, vector.y, vector.z) || 1;
		return { x: vector.x / magnitude, y: vector.y / magnitude, z: vector.z / magnitude };
	}

	function averageVec(points: Vec3[]): Vec3 {
		const total = points.reduce(
			(sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y, z: sum.z + point.z }),
			{ x: 0, y: 0, z: 0 }
		);
		const count = points.length || 1;
		return { x: total.x / count, y: total.y / count, z: total.z / count };
	}

	function maxAbsCoordinate(vertices: Vec3[]) {
		let maxValue = 1;
		for (const vertex of vertices) {
			maxValue = Math.max(maxValue, Math.abs(vertex.x), Math.abs(vertex.y), Math.abs(vertex.z));
		}
		return maxValue;
	}

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}

	function fmt(value: number) {
		if (Number.isInteger(value)) return value.toString();
		return value.toFixed(2).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
	}
</script>

<div class="space-y-4">
	<div class="rounded-xl border border-primary/35 bg-primary/8 p-3">
		<p class="mb-2 text-xs font-semibold text-foreground">Choose a 3D solid</p>
		<div class="flex flex-wrap gap-2">
			{#each Object.values(shapeDefinitions) as shape (shape.id)}
				<button
					type="button"
					class={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
						shape.id === selectedShapeId
							? 'border-primary/45 bg-primary/15 text-foreground'
							: 'border-border/70 bg-background/75 text-muted-foreground hover:bg-background/90'
					}`}
					onclick={() => handleShapeChange(shape.id)}
				>
					{shape.title}
				</button>
			{/each}
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		<svg
			bind:this={polySvg}
			viewBox={`0 0 ${POLY_WIDTH} ${POLY_HEIGHT}`}
			class="h-auto w-full touch-none rounded-xl border border-border/70 bg-card/70"
			role="img"
			aria-label={`${selectedShape.title} 3D model for surface area`}
			onwheel={handlePolyWheel}
			onpointerdown={handlePolyPointerDown}
			onpointermove={handlePolyPointerMove}
			onpointerup={stopPolyDrag}
			onpointercancel={stopPolyDrag}
		>
			<defs>
				<linearGradient id="surface-prism-bg" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stop-color={TOOL_BG_GRADIENT_START}></stop>
					<stop offset="100%" stop-color={TOOL_BG_GRADIENT_END}></stop>
				</linearGradient>
			</defs>
			<rect width={POLY_WIDTH} height={POLY_HEIGHT} fill="url(#surface-prism-bg)"></rect>
			<rect width={POLY_WIDTH} height={POLY_HEIGHT} fill={TOOL_BG_SURFACE_WASH}></rect>

			{#each renderedFaces as renderedFace (renderedFace.id)}
				<path
					d={renderedFace.path}
					fill={renderedFace.color}
					fill-opacity={renderedFace.canonicalId === highlightedFaceId ? clamp(renderedFace.alpha + 0.14, 0.2, 1) : renderedFace.alpha}
					stroke={renderedFace.canonicalId === highlightedFaceId ? 'rgba(15,23,42,0.95)' : 'rgba(15,23,42,0.76)'}
					stroke-width={renderedFace.canonicalId === highlightedFaceId ? 2.7 : 1.8}
				></path>
			{/each}
		</svg>

		<svg
			viewBox={`0 0 ${NET_WIDTH} ${NET_HEIGHT}`}
			class="h-auto w-full rounded-xl border border-border/70 bg-card/70"
			role="img"
			aria-label={`${selectedShape.title} net with clickable faces`}
		>
			<defs>
				<linearGradient id="surface-net-bg" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stop-color={TOOL_BG_GRADIENT_START}></stop>
					<stop offset="100%" stop-color={TOOL_BG_GRADIENT_END}></stop>
				</linearGradient>
			</defs>
			<rect width={NET_WIDTH} height={NET_HEIGHT} fill="url(#surface-net-bg)"></rect>
			<rect width={NET_WIDTH} height={NET_HEIGHT} fill={TOOL_BG_SURFACE_WASH}></rect>

			{#each foldLines as foldLine (foldLine.id)}
				<line
					x1={foldLine.x1}
					y1={foldLine.y1}
					x2={foldLine.x2}
					y2={foldLine.y2}
					stroke="rgba(15,23,42,0.44)"
					stroke-width="1.2"
					stroke-dasharray="4 4"
				></line>
			{/each}

			{#each netFaceRects as netFace (netFace.id)}
				<g>
					{#if netFace.shape === 'triangle'}
						<path
							d={trianglePathForNetFace(netFace)}
							fill={netFace.color}
							fill-opacity={netFace.id === highlightedFaceId ? 0.88 : 0.68}
							stroke={netFace.id === highlightedFaceId ? 'rgba(15,23,42,0.96)' : 'rgba(15,23,42,0.72)'}
							stroke-width={netFace.id === highlightedFaceId ? 2.4 : 1.6}
							role="button"
							tabindex="0"
							aria-label={`Rotate to the ${netFace.label.toLowerCase()} face`}
							onclick={() => rotateToFace(netFace.id)}
							onkeydown={(event) => handleNetFaceKeydown(event, netFace.id)}
						></path>
					{:else if netFace.shape === 'circle'}
						<ellipse
							cx={netFace.centerX}
							cy={netFace.centerY}
							rx={netFace.width / 2}
							ry={netFace.height / 2}
							fill={netFace.color}
							fill-opacity={netFace.id === highlightedFaceId ? 0.88 : 0.68}
							stroke={netFace.id === highlightedFaceId ? 'rgba(15,23,42,0.96)' : 'rgba(15,23,42,0.72)'}
							stroke-width={netFace.id === highlightedFaceId ? 2.4 : 1.6}
							role="button"
							tabindex="0"
							aria-label={`Rotate to the ${netFace.label.toLowerCase()} face`}
							onclick={() => rotateToFace(netFace.id)}
							onkeydown={(event) => handleNetFaceKeydown(event, netFace.id)}
						></ellipse>
					{:else}
						<rect
							x={netFace.x}
							y={netFace.y}
							width={netFace.width}
							height={netFace.height}
							rx="6"
							fill={netFace.color}
							fill-opacity={netFace.id === highlightedFaceId ? 0.88 : 0.68}
							stroke={netFace.id === highlightedFaceId ? 'rgba(15,23,42,0.96)' : 'rgba(15,23,42,0.72)'}
							stroke-width={netFace.id === highlightedFaceId ? 2.4 : 1.6}
							role="button"
							tabindex="0"
							aria-label={`Rotate to the ${netFace.label.toLowerCase()} face`}
							onclick={() => rotateToFace(netFace.id)}
							onkeydown={(event) => handleNetFaceKeydown(event, netFace.id)}
						></rect>
					{/if}
					<text
						x={netFace.centerX}
						y={netFace.centerY - 6}
						text-anchor="middle"
						dominant-baseline="middle"
						font-size="12"
						font-weight="700"
						fill="rgba(15,23,42,0.9)"
					>
						{netFace.shortLabel}
					</text>
					<text
						x={netFace.centerX}
						y={netFace.centerY + 9}
						text-anchor="middle"
						dominant-baseline="middle"
						font-size="10"
						fill="rgba(15,23,42,0.82)"
					>
						{netFace.label}
					</text>
				</g>
			{/each}
		</svg>
	</div>

	<div class="grid gap-3 sm:grid-cols-3">
		{#each selectedShape.dimensions as dimension (dimension.id)}
			<label class="space-y-1 text-xs font-medium text-muted-foreground">
				{dimension.label} {dimension.symbol}
				<input
					class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-primary/25 accent-primary"
					type="range"
					min={dimension.min}
					max={dimension.max}
					step={dimension.step}
					value={currentDimensionValues[dimension.id]}
					oninput={(event) =>
						updateDimension(
							dimension.id,
							Number.parseFloat((event.currentTarget as HTMLInputElement).value)
						)}
				/>
				<span class="text-[11px] text-foreground">{fmt(currentDimensionValues[dimension.id])} units</span>
			</label>
		{/each}
	</div>

	<div class="space-y-3 rounded-xl border border-border/70 bg-card/70 p-3 sm:p-4">
		<p class="text-sm font-semibold text-foreground">Face-by-face formulas</p>
		<div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
			{#each formulaRows as formulaRow (formulaRow.id)}
				<button
					type="button"
					class={`rounded-lg border px-2.5 py-2 text-left transition-colors ${
						formulaRow.id === highlightedFaceId
							? 'border-primary/45 bg-primary/10'
							: 'border-border/70 bg-background/75 hover:bg-background/90'
					}`}
					onclick={() => rotateToFace(formulaRow.id)}
				>
					<div class="mb-1 flex items-center gap-2 text-xs font-semibold text-foreground">
						<span
							class="inline-block h-2.5 w-2.5 rounded-full border border-slate-900/20"
							style={`background:${formulaRow.color}`}
						></span>
						{formulaRow.label}
						<span class="ml-auto text-[11px] text-muted-foreground">{formulaRow.shortLabel}</span>
					</div>
					<MathExpression math={formulaRow.tex} class="text-xs text-foreground" />
				</button>
			{/each}
		</div>

		<div class="rounded-lg border border-primary/35 bg-primary/8 p-3">
			<p class="text-xs font-semibold text-foreground">Selected face</p>
			<MathExpression math={activeFormulaRow.tex} class="mt-1 text-sm text-foreground" />
			<div class="mt-2 space-y-1 text-xs text-muted-foreground">
				<MathExpression math={totalExpressions.sum} class="text-foreground" />
				<MathExpression math={totalExpressions.simplified} class="text-foreground" />
			</div>
		</div>
	</div>
</div>
