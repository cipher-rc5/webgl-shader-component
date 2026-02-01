export interface Message {
	readonly role: "user" | "assistant";
	readonly content: string;
}
