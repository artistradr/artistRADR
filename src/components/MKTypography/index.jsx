import { forwardRef } from "react";
import Typography from "@mui/material/Typography";

// Props the original template passed directly but aren't valid MUI Typography props
const SX_PROPS = [
  "lineHeight", "textTransform", "alignItems", "justifyContent",
  "borderRadius", "zIndex", "opacity", "shadow", "display",
  "textGradient", "fontWeight",
];

const MKTypography = forwardRef(({ sx, children, ...props }, ref) => {
  const extractedSx = {};
  const cleanProps = {};

  Object.entries(props).forEach(([key, value]) => {
    if (SX_PROPS.includes(key)) {
      extractedSx[key] = value;
    } else {
      cleanProps[key] = value;
    }
  });

  return (
    <Typography ref={ref} sx={{ ...extractedSx, ...sx }} {...cleanProps}>
      {children}
    </Typography>
  );
});

MKTypography.displayName = "MKTypography";

export default MKTypography;