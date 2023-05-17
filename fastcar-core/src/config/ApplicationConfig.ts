export type ApplicationConfig = {
	name: string;
	env: string;
	version: string;
	scan?: {
		include?: string[];
		exclude?: string[];
	};
};
