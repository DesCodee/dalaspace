import { createContext, useContext, useMemo } from "react";
import { LIGHT, DARK } from "../constants/theme";
import { LANG } from "../constants/lang";
import { getRiskStyle } from "../utils/styleUtils";

export const ThemeContext = createContext({
  T: LIGHT,
  RISK_STYLE: getRiskStyle(LANG.ru, LIGHT),
  lang: "ru",
  theme: "light",
});

export function ThemeProvider({ theme = "light", lang = "ru", children }) {
  const value = useMemo(() => {
    const T = theme === "dark" ? DARK : LIGHT;
    const t = LANG[lang] || LANG.ru;
    const RISK_STYLE = getRiskStyle(t, T);
    return { T, RISK_STYLE, lang, theme };
  }, [theme, lang]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
