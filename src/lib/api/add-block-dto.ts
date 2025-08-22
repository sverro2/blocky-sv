export interface AddBlockDto {
	location: AddBlockLocationDto;
}

export enum AddBlockLocationDto {
	Before = 'before',
	After = 'after'
}
