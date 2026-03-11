<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';

	type SoundStatus = 'idle' | 'loading' | 'cached' | 'streamed' | 'error';

	type SoundDefinition = {
		id: string;
		label: string;
		caption: string;
		sourceUrl: string;
		topColor: string;
		midColor: string;
		bottomColor: string;
		rimColor: string;
		shadowColor: string;
		surfaceGlow: string;
	};

	const SOUND_CACHE_NAME = 'mathnasium-pro-soundboard-v1';
	const PRESS_DURATION_MS = 170;

	const sounds: SoundDefinition[] = [
		{
			id: 'you-stupid',
			label: 'You Stupid',
			caption: 'Short, loud, and aggressively red.',
			sourceUrl: 'https://www.myinstants.com/media/sounds/ustoopid.mp3',
			topColor: '#ff847f',
			midColor: '#ff2a1f',
			bottomColor: '#850100',
			rimColor: '#610100',
			shadowColor: 'rgba(113, 10, 2, 0.42)',
			surfaceGlow: 'rgba(255, 176, 170, 0.88)'
		},
		{
			id: 'whats-9-plus-10',
			label: "What's 9 + 10?",
			caption: 'For moments that demand exactly one answer.',
			sourceUrl: 'https://www.myinstants.com/media/sounds/whats-9-plus-10_i5PRvD4.mp3',
			topColor: '#a1c8ff',
			midColor: '#5b84fb',
			bottomColor: '#1f3a92',
			rimColor: '#1f2b6c',
			shadowColor: 'rgba(21, 49, 142, 0.35)',
			surfaceGlow: 'rgba(220, 236, 255, 0.9)'
		}
	];

	const initialStatuses = Object.fromEntries(
		sounds.map((sound) => [sound.id, 'idle'])
	) as Record<string, SoundStatus>;

	let statusById = $state<Record<string, SoundStatus>>(initialStatuses);
	let pressedId = $state<string | null>(null);
	let playingId = $state<string | null>(null);
	let announcement = $state('Tap a button to play a sound. First use warms a local browser cache when allowed.');
	let audioElement: HTMLAudioElement | null = $state(null);

	const objectUrlById = new Map<string, string>();
	const warmupById = new Map<string, Promise<void>>();
	const pressTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

	function setStatus(id: string, status: SoundStatus) {
		statusById = {
			...statusById,
			[id]: status
		};
	}

	function getStatusText(status: SoundStatus) {
		switch (status) {
			case 'loading':
				return 'Caching...';
			case 'cached':
				return 'Cached locally';
			case 'streamed':
				return 'Streaming source';
			case 'error':
				return 'Playback error';
			default:
				return 'Ready';
		}
	}

	function pulseButton(id: string) {
		const existingTimeout = pressTimeouts.get(id);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
		}

		pressedId = id;

		const timeout = setTimeout(() => {
			if (pressedId === id) {
				pressedId = null;
			}
			pressTimeouts.delete(id);
		}, PRESS_DURATION_MS);

		pressTimeouts.set(id, timeout);
	}

	function rememberObjectUrl(id: string, objectUrl: string) {
		const existingObjectUrl = objectUrlById.get(id);
		if (existingObjectUrl) {
			URL.revokeObjectURL(existingObjectUrl);
		}

		objectUrlById.set(id, objectUrl);
	}

	async function restoreCachedSounds() {
		if (typeof caches === 'undefined') {
			return;
		}

		try {
			const cache = await caches.open(SOUND_CACHE_NAME);

			await Promise.all(
				sounds.map(async (sound) => {
					if (objectUrlById.has(sound.id)) {
						return;
					}

					const cachedResponse = await cache.match(sound.sourceUrl);
					if (!cachedResponse || cachedResponse.type === 'opaque') {
						return;
					}

					const blob = await cachedResponse.blob();
					if (!blob.size) {
						return;
					}

					rememberObjectUrl(sound.id, URL.createObjectURL(blob));
					setStatus(sound.id, 'cached');
				})
			);
		} catch {
			// Ignore cache hydration failures and keep direct-source playback available.
		}
	}

	async function warmSound(sound: SoundDefinition) {
		if (objectUrlById.has(sound.id)) {
			setStatus(sound.id, 'cached');
			return;
		}

		const inFlightWarmup = warmupById.get(sound.id);
		if (inFlightWarmup) {
			return inFlightWarmup;
		}

		const warmup = (async () => {
			try {
				if (typeof caches !== 'undefined') {
					const cache = await caches.open(SOUND_CACHE_NAME);
					const cachedResponse = await cache.match(sound.sourceUrl);

					if (cachedResponse && cachedResponse.type !== 'opaque') {
						const cachedBlob = await cachedResponse.blob();
						if (cachedBlob.size) {
							rememberObjectUrl(sound.id, URL.createObjectURL(cachedBlob));
							setStatus(sound.id, 'cached');
							return;
						}
					}
				}

				setStatus(sound.id, 'loading');

				const response = await fetch(sound.sourceUrl, { mode: 'cors' });
				if (!response.ok) {
					throw new Error(`Unexpected response ${response.status}`);
				}

				if (typeof caches !== 'undefined') {
					const cache = await caches.open(SOUND_CACHE_NAME);
					await cache.put(sound.sourceUrl, response.clone());
				}

				const blob = await response.blob();
				if (!blob.size) {
					throw new Error('Received an empty audio file.');
				}

				rememberObjectUrl(sound.id, URL.createObjectURL(blob));
				setStatus(sound.id, 'cached');
			} catch {
				if (!objectUrlById.has(sound.id)) {
					setStatus(sound.id, 'streamed');
				}
			} finally {
				warmupById.delete(sound.id);
			}
		})();

		warmupById.set(sound.id, warmup);
		return warmup;
	}

	function playSource(sourceUrl: string, sound: SoundDefinition) {
		if (!audioElement) {
			announcement = 'Audio is not ready yet. Try again in a moment.';
			setStatus(sound.id, 'error');
			return;
		}

		audioElement.pause();
		audioElement.src = sourceUrl;
		audioElement.currentTime = 0;
		playingId = sound.id;

		void audioElement.play().catch(() => {
			playingId = null;
			setStatus(sound.id, 'error');
			announcement = `Playback for ${sound.label} was blocked. Tap the button again.`;
		});
	}

	function handleSoundClick(sound: SoundDefinition) {
		pulseButton(sound.id);

		const cachedObjectUrl = objectUrlById.get(sound.id);
		playSource(cachedObjectUrl ?? sound.sourceUrl, sound);

		if (cachedObjectUrl) {
			setStatus(sound.id, 'cached');
			announcement = `Playing ${sound.label} from local cache.`;
			return;
		}

		announcement = `Playing ${sound.label}. Warming a browser cache in the background.`;
		void warmSound(sound).then(() => {
			if (objectUrlById.has(sound.id)) {
				announcement = `${sound.label} is cached locally for faster replays.`;
			}
		});
	}

	function buttonStyle(sound: SoundDefinition) {
		return [
			`--button-top: ${sound.topColor}`,
			`--button-mid: ${sound.midColor}`,
			`--button-bottom: ${sound.bottomColor}`,
			`--button-rim: ${sound.rimColor}`,
			`--button-shadow: ${sound.shadowColor}`,
			`--button-glow: ${sound.surfaceGlow}`
		].join('; ');
	}

	onMount(() => {
		void restoreCachedSounds();

		return () => {
			for (const timeout of pressTimeouts.values()) {
				clearTimeout(timeout);
			}

			for (const objectUrl of objectUrlById.values()) {
				URL.revokeObjectURL(objectUrl);
			}

			if (audioElement) {
				audioElement.pause();
				audioElement.removeAttribute('src');
				audioElement.load();
			}
		};
	});
</script>

<svelte:head>
	<title>Soundboard | Mathnasium Pro</title>
</svelte:head>

<section class="soundboard-shell">
	<div class="soundboard-ambient soundboard-ambient-left" aria-hidden="true"></div>
	<div class="soundboard-ambient soundboard-ambient-right" aria-hidden="true"></div>

	<div class="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
		<div class="flex flex-col gap-5">
			<a class="back-link" href={resolve('/')}>Back to Mathnasium Pro</a>

			<div class="hero-panel">
				<div class="hero-copy">
					<p class="eyebrow">Soundboard Prototype</p>
					<h1>Glossy arcade buttons with two deeply unserious sounds.</h1>
					<p class="hero-text">
						Each click plays immediately. In the background the page tries to stash the MP3
						locally so the next hit can reuse a cached copy instead of pulling it again.
					</p>
				</div>

				<div class="status-terminal" aria-live="polite">
					<span class="status-terminal-label">Status</span>
					<p>{announcement}</p>
				</div>
			</div>
		</div>

		<div class="grid gap-6 md:grid-cols-2">
			{#each sounds as sound (sound.id)}
				{@const status = statusById[sound.id]}
				<article class="sound-card">
					<button
						type="button"
						class:pressed={pressedId === sound.id}
						class:is-playing={playingId === sound.id}
						class="sound-button"
						style={buttonStyle(sound)}
						aria-describedby={`${sound.id}-status`}
						aria-label={`Play ${sound.label}`}
						onpointerdown={() => pulseButton(sound.id)}
						onclick={() => handleSoundClick(sound)}
					>
						<span class="sr-only">Play {sound.label}</span>
					</button>

					<div class="sound-copy">
						<h2>{sound.label}</h2>
						<p>{sound.caption}</p>
						<p class={`status-pill status-${status}`} id={`${sound.id}-status`}>
							{getStatusText(status)}
						</p>
					</div>
				</article>
			{/each}
		</div>

		<div class="source-note">
			<p>
				Audio files are being pulled from `myinstants.com`. If you want this to be reliable long-term,
				the next step is downloading the MP3s and serving them from this repo instead of hotlinking them.
			</p>
		</div>
	</div>

	<audio bind:this={audioElement} preload="none" onended={() => (playingId = null)}></audio>
</section>

<style>
	.soundboard-shell {
		position: relative;
		overflow: clip;
		background:
			radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), transparent 34%),
			linear-gradient(180deg, #eef2f8 0%, #d6dbe4 52%, #c7ccd7 100%);
	}

	.soundboard-ambient {
		position: absolute;
		width: 22rem;
		height: 22rem;
		border-radius: 999px;
		filter: blur(12px);
		opacity: 0.45;
		pointer-events: none;
	}

	.soundboard-ambient-left {
		top: -8rem;
		left: -5rem;
		background: radial-gradient(circle, rgba(255, 84, 68, 0.34), transparent 68%);
	}

	.soundboard-ambient-right {
		right: -4rem;
		bottom: -7rem;
		background: radial-gradient(circle, rgba(96, 145, 255, 0.28), transparent 68%);
	}

	.back-link {
		width: fit-content;
		border-radius: 999px;
		border: 1px solid rgba(51, 65, 85, 0.16);
		background: rgba(255, 255, 255, 0.72);
		padding: 0.55rem 0.9rem;
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #314155;
		backdrop-filter: blur(18px);
		transition:
			transform 150ms ease,
			background-color 150ms ease;
	}

	.back-link:hover {
		transform: translateY(-1px);
		background: rgba(255, 255, 255, 0.88);
	}

	.hero-panel {
		display: grid;
		gap: 1.5rem;
		border: 1px solid rgba(51, 65, 85, 0.1);
		border-radius: 2rem;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(248, 250, 252, 0.66)),
			radial-gradient(circle at top, rgba(255, 255, 255, 0.65), transparent 54%);
		padding: 1.4rem;
		box-shadow:
			0 24px 60px rgba(15, 23, 42, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.72);
		backdrop-filter: blur(20px);
	}

	.hero-copy h1 {
		max-width: 11ch;
		font-size: clamp(2.45rem, 6vw, 4.5rem);
		line-height: 0.98;
		font-weight: 900;
		letter-spacing: -0.06em;
		color: #182230;
	}

	.eyebrow {
		margin-bottom: 0.8rem;
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #526173;
	}

	.hero-text {
		margin-top: 1rem;
		max-width: 44rem;
		font-size: 1.02rem;
		line-height: 1.7;
		color: #465568;
	}

	.status-terminal {
		align-self: end;
		border-radius: 1.35rem;
		border: 1px solid rgba(15, 23, 42, 0.08);
		background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
		padding: 1rem 1.1rem;
		box-shadow:
			0 18px 34px rgba(15, 23, 42, 0.16),
			inset 0 1px 0 rgba(255, 255, 255, 0.04);
		color: #d9e7ff;
	}

	.status-terminal-label {
		display: inline-block;
		margin-bottom: 0.55rem;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #8db5ff;
	}

	.status-terminal p {
		max-width: 28rem;
		font-size: 0.96rem;
		line-height: 1.65;
		color: #d9e7ff;
	}

	.sound-card {
		display: grid;
		justify-items: center;
		gap: 1.35rem;
		border-radius: 2rem;
		border: 1px solid rgba(51, 65, 85, 0.11);
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(241, 245, 249, 0.74)),
			linear-gradient(180deg, rgba(255, 255, 255, 0.8), transparent);
		padding: 1.6rem 1.25rem 1.45rem;
		box-shadow:
			0 26px 48px rgba(15, 23, 42, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.72);
	}

	.sound-button {
		position: relative;
		width: min(13.5rem, 58vw);
		aspect-ratio: 1;
		border: none;
		border-radius: 999px;
		cursor: pointer;
		transform: translateY(0);
		background:
			radial-gradient(circle at 50% 28%, var(--button-glow) 0%, transparent 28%),
			radial-gradient(circle at 50% 40%, var(--button-top) 0%, var(--button-mid) 42%, var(--button-bottom) 88%);
		box-shadow:
			0 1.05rem 0 color-mix(in srgb, var(--button-rim) 82%, black),
			0 1.7rem 1.9rem var(--button-shadow),
			inset 0 -0.8rem 0 rgba(0, 0, 0, 0.2),
			inset 0 0.45rem 0 rgba(255, 255, 255, 0.28),
			inset 0 0 0 0.32rem rgba(255, 255, 255, 0.12);
		transition:
			transform 120ms cubic-bezier(0.2, 0.8, 0.2, 1),
			box-shadow 120ms cubic-bezier(0.2, 0.8, 0.2, 1),
			filter 120ms ease;
	}

	.sound-button::before,
	.sound-button::after {
		content: '';
		position: absolute;
		border-radius: 999px;
		pointer-events: none;
	}

	.sound-button::before {
		inset: 14% 17% 47%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.05));
		filter: blur(0.5px);
		opacity: 0.95;
	}

	.sound-button::after {
		inset: 7%;
		border: 0.28rem solid rgba(255, 255, 255, 0.14);
		box-shadow:
			inset 0 0.3rem 0 rgba(255, 255, 255, 0.18),
			inset 0 -0.55rem 0 rgba(0, 0, 0, 0.16);
	}

	.sound-button:hover {
		filter: saturate(1.04) brightness(1.03);
	}

	.sound-button.pressed {
		transform: translateY(0.78rem) scale(0.985);
		box-shadow:
			0 0.32rem 0 color-mix(in srgb, var(--button-rim) 82%, black),
			0 0.95rem 1.25rem var(--button-shadow),
			inset 0 -0.45rem 0 rgba(0, 0, 0, 0.24),
			inset 0 0.24rem 0 rgba(255, 255, 255, 0.2),
			inset 0 0 0 0.32rem rgba(255, 255, 255, 0.1);
	}

	.sound-button.is-playing {
		filter: saturate(1.08) brightness(1.06);
	}

	.sound-copy {
		display: grid;
		justify-items: center;
		gap: 0.6rem;
		text-align: center;
	}

	.sound-copy h2 {
		font-size: clamp(1.45rem, 3vw, 1.9rem);
		font-weight: 900;
		letter-spacing: -0.045em;
		color: #1c2736;
	}

	.sound-copy p {
		max-width: 24rem;
		font-size: 0.98rem;
		line-height: 1.55;
		color: #5a6778;
	}

	.status-pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 9.75rem;
		border-radius: 999px;
		padding: 0.5rem 0.8rem;
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.status-idle {
		background: rgba(71, 85, 105, 0.11);
		color: #475569;
	}

	.status-loading {
		background: rgba(245, 158, 11, 0.16);
		color: #b45309;
	}

	.status-cached {
		background: rgba(34, 197, 94, 0.15);
		color: #166534;
	}

	.status-streamed {
		background: rgba(59, 130, 246, 0.16);
		color: #1d4ed8;
	}

	.status-error {
		background: rgba(239, 68, 68, 0.14);
		color: #b91c1c;
	}

	.source-note {
		border-radius: 1.5rem;
		border: 1px solid rgba(51, 65, 85, 0.11);
		background: rgba(255, 255, 255, 0.62);
		padding: 1rem 1.1rem;
		color: #4a596b;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
	}

	.source-note p {
		font-size: 0.95rem;
		line-height: 1.65;
	}

	@media (min-width: 860px) {
		.hero-panel {
			grid-template-columns: minmax(0, 1fr) minmax(17rem, 23rem);
			align-items: end;
			padding: 1.8rem;
		}
	}

	@media (max-width: 640px) {
		.soundboard-shell {
			background:
				radial-gradient(circle at top left, rgba(255, 255, 255, 0.9), transparent 44%),
				linear-gradient(180deg, #eef2f8 0%, #d4dae4 100%);
		}

		.sound-card {
			padding-inline: 1rem;
		}

		.sound-button {
			width: min(15rem, 72vw);
		}
	}
</style>
