type PluginPrefixes = 'n/' | '@typescript-eslint/';
type EslintOption = Record<string, boolean | string | Array<any>>;
type EslintModifiedRule = Record<string | `${PluginPrefixes}string`, [action: 'off' | 'error' | 'warn', ...Array<string | EslintOption>]>;

export class LintGolemError extends Error {
  public incomingRule: EslintModifiedRule;
  public matchSource: Array<string> = [];
  public cause: string;
  constructor(message: string, { cause, matchSource, incomingRule }: { cause: string; matchSource: Array<string>, incomingRule: EslintModifiedRule }) {
    super(message, { cause });
    this.cause = cause;
    this.matchSource = matchSource;
    this.incomingRule = incomingRule;
  }
}
