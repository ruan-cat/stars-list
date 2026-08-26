import type { TodoScanArtifact } from "./todo-artifact.ts";
import { isTodoScanArtifact } from "./todo-artifact.ts";

export const TODO_PERSISTENCE_STALE_TIME = 30 * 60 * 1000;
export const TODO_PERSISTENCE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export interface PersistedArtifact {
	artifact: TodoScanArtifact;
	savedAt: number;
	stale: boolean;
}

interface PersistedPayload {
	artifact: unknown;
	savedAt: number;
}

function storage(): Storage | null {
	try {
		return typeof localStorage === "undefined" ? null : localStorage;
	} catch {
		return null;
	}
}

export function readPersistedArtifact(key: string, now = Date.now()): PersistedArtifact | null {
	const target = storage();
	if (!target) return null;
	try {
		const raw = target.getItem(key);
		if (!raw) return null;
		const payload = JSON.parse(raw) as PersistedPayload;
		if (!payload || typeof payload.savedAt !== "number" || !isTodoScanArtifact(payload.artifact)) return null;
		const age = now - payload.savedAt;
		if (age < 0 || age >= TODO_PERSISTENCE_MAX_AGE) return null;
		return { artifact: payload.artifact, savedAt: payload.savedAt, stale: age >= TODO_PERSISTENCE_STALE_TIME };
	} catch {
		return null;
	}
}

export function writePersistedArtifact(key: string, artifact: TodoScanArtifact, now = Date.now()): void {
	if (!isTodoScanArtifact(artifact)) return;
	const target = storage();
	if (!target) return;
	try {
		target.setItem(key, JSON.stringify({ artifact, savedAt: now } satisfies PersistedPayload));
	} catch {
		// Storage can be disabled or full; persistence is deliberately best effort.
	}
}
