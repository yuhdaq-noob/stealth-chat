const USER_ALIASES: Record<string, string> = {
  user_1: "Gen Z",
  user_2: "Boomers",
};

export function getUserAlias(userId: string, fallbackName: string) {
  return USER_ALIASES[userId] ?? fallbackName;
}
