"use client"

import * as React from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { useRouter } from "next/navigation"

export default function RAiDLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [tabIndex, setTabIndex] = React.useState(0);

  const tabClick = (event: React.SyntheticEvent<Element, Event>, value: number) => {
    setTabIndex(value);

    if(value === 1) {
      router.push("/purchases/history");
    }
    else {
      router.push("/purchases");
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: 'column', alignItems: 'center', mt: 4 }}>
      <Typography variant="h4">
        Purchases
      </Typography>
      <Tabs
        value={tabIndex}
        onChange={tabClick}
        textColor="inherit"
        variant="fullWidth"
        sx={{mt: 4}}>
        <Tab label="Ongoing" />
        <Tab label="History" />
      </Tabs>
        {children}
    </Box>
  );
}