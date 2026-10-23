import { createContext, useContext, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type ThemeColors } from './theme';

type ThemeValue = { colors: ThemeColors; dark: boolean };

const ThemeContext = createContext<ThemeValue>({ colors: lightTheme, dark: false });

export function ThemeProvider({ children }: PropsWithChildren) {
  const dark = useColorScheme() === 'dark';
  return (
    <ThemeContext.Provider value={{ colors: dark ? darkTheme : lightTheme, dark }}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
