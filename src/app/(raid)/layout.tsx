"use client"

import * as React from "react";
import { AppBar, Box, Button, CssBaseline, Divider, Drawer, IconButton, List, ListItem, ListItemButton,
  ListItemText, Typography } from "@mui/material";
import Toolbar from "@mui/material/Toolbar";
import MenuIcon from "@mui/icons-material/Menu";
import { useRouter } from "next/navigation"
import { getCookie } from "cookies-next";
import * as HttpUtil from "../../utils/httpUtil"
import * as UserContract from "../../../backend/contract/admin/user"

const drawerWidth: number = 240;
let navItems = ["Shop!", "Cart", "Purchases", "Profile"];

export default function RAiDLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [user, setUser] = React.useState({} as UserContract.UserApiResponseBody);

  const loadUser = async () => {
    const [responseStatus, responseBody] = await HttpUtil.GetResponseBody<UserContract.UserApiResponseBody>(
      `/users/${getCookie("sessionId")?.toString()}/current`);

    if(responseStatus === 200) {
      setUser(responseBody);

      if(responseBody.storeId !== null) {
        navItems = ["Shop!", "Cart", "Purchases", "Store", "Profile"];
      }
    }
    else {
			router.push("/");
		}
  }

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  const menuItemClick = (event: React.MouseEvent<HTMLDivElement | HTMLButtonElement, MouseEvent>, buttonText: string) => {
    if(buttonText === "Shop!") {
      router.push("/home");
    }
    else if(buttonText === "Cart") {
      router.push("/cart");
    }
    else if(buttonText === "Purchases") {
      router.push("/purchases");
    }
    else if(buttonText === "Store") {
      router.push("/store");
    }
    else if(buttonText === "Profile") {
      router.push("/profile");
    }
  };

  React.useEffect(() => {
    loadUser();
  }, []);

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        RAiD
      </Typography>
      <Typography variant="body2" sx={{ my: 2 }}>
        Welcome {user.loginName}!
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item}>
            <ListItemButton sx={{ textAlign: 'center' }} onClick={(event) => menuItemClick(event, item)}>
              <ListItemText primary={item} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar component="nav">
        <Toolbar>
        <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
          >
            RAiD
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Box sx={{textAlign: 'center', pt: 2}}>
              <Typography variant="body2">
                Welcome {user.loginName}!
              </Typography>
            </Box>
            {navItems.map((item) => (
              <Button key={item} sx={{ color: '#fff' }} onClick={(event) => menuItemClick(event, item)}>
                {item}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      <nav>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </nav>
      <Box component="main" sx={{p: 3, width: "100%"}}>
        <Toolbar />
          {children}
      </Box>
    </Box>
  );
}