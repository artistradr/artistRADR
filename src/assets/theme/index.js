import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#1a1a1a" },
    secondary: { main: "#f5f5f5" },
    info: { main: "#0077b6" },
    success: { main: "#2d6a4f" },
    warning: { main: "#e9c46a" },
    error: { main: "#e63946" },
    gradients: {
      dark: { main: "#1a1a1a", state: "#333333" },
    },
  },
  typography: {
    fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  functions: {
    rgba: (color, opacity) => {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
    linearGradient: (...args) => `linear-gradient(${args.join(", ")})`,
  },
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
});

export default theme;
