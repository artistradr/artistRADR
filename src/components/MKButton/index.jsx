import { forwardRef } from "react";
import Button from "@mui/material/Button";

const SX_PROPS = [
  "lineHeight", "textTransform", "borderRadius", "zIndex",
  "shadow", "opacity", "display",
];

const MKButton = forwardRef(({ sx, children, ...props }, ref) => {
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
    <Button ref={ref} sx={{ ...extractedSx, ...sx }} {...cleanProps}>
      {children}
    </Button>
  );
});

MKButton.displayName = "MKButton";

export default MKButton;