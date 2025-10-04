import {
  ProgrammingLanguageAlias,
  SupportedProgrammingLanguageKeys,
  ValuesOf,
} from "#utils/schema/schema.js";

type AliasValue = ValuesOf<typeof ProgrammingLanguageAlias>;
type AliasKey = keyof typeof ProgrammingLanguageAlias;

export const mapLanguageAliasToCanonicalKey = (
  inputLang: string,
): SupportedProgrammingLanguageKeys => {
  const lowerInput = inputLang.toLowerCase();

  if (
    Object.prototype.hasOwnProperty.call(ProgrammingLanguageAlias, lowerInput)
  ) {
    return ProgrammingLanguageAlias[
      lowerInput as AliasKey
    ] as SupportedProgrammingLanguageKeys;
  }

  const canonicalKeys = Object.values(ProgrammingLanguageAlias) as AliasValue[];

  if (canonicalKeys.includes(lowerInput as AliasValue)) {
    return lowerInput as SupportedProgrammingLanguageKeys;
  }

  return lowerInput as SupportedProgrammingLanguageKeys;
};
