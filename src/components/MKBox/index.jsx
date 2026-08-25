import { forwardRef } from "react";
import Box from "@mui/material/Box";

// These are non-standard props the template passes directly — we strip them
// so they don't reach the DOM and cause React warnings
const STRIP_PROPS = [
  "shadow", "borderRadius", "lineHeight", "textTransform", "alignItems",
  "justifyContent", "zIndex", "display", "flexDirection", "flexWrap",
  "opacity", "color", "bgColor", "coloredShadow",
];

const MKBox = forwardRef(({ children, ...props }, ref) => {
  // Strip non-MUI/non-HTML props that were custom in the original template
  const cleanProps = Object.fromEntries(
    Object.entries(props).filter(([key]) => !STRIP_PROPS.includes(key))
  );

  return (
    <Box ref={ref} {...cleanProps}>
      {children}
    </Box>
  );
});

MKBox.displayName = "MKBox";

export default MKBox;