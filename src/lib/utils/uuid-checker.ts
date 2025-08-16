import type { UUID } from 'crypto';
import z from 'zod';

export function uuidValid(input: unknown): input is UUID {
	return z.string().uuid().safeParse(input).success;
}
